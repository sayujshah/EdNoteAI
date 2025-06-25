// EdNoteAI Chrome Extension - Background Service Worker
// Updated for Modern Chrome Tab Capture API

console.log('EdNoteAI Background Service Worker starting...');

// Service worker keep-alive mechanism for Manifest V3
let keepAliveInterval;

function keepServiceWorkerAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  keepAliveInterval = setInterval(() => {
    // Simple ping to keep service worker alive
    if (chrome.runtime?.id) {
      chrome.storage.local.set({ lastPing: Date.now() });
    }
  }, 25000); // Ping every 25 seconds (before 30s timeout)
}

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log('EdNoteAI Extension installed:', details);
  keepServiceWorkerAlive();
  
  // Set default options
  chrome.storage.sync.set({
    audioQuality: 'medium',
    autoSave: true,
    showOverlay: true,
    chunkSize: 4096,
    sampleRate: 16000
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup detected');
  keepServiceWorkerAlive();
});

// Start keep-alive immediately
keepServiceWorkerAlive();

// Configuration
const EDNOTEAI_CONFIG = {
  baseUrl: 'https://ednoteai.com',
  wsUrl: 'wss://ednoteai.com',
  apiVersion: 'v1'
};

// Global state management
let activeRecordingSessions = new Map();
let authToken = null;
let websocketConnections = new Map();

// Audio configuration
const AUDIO_CONFIGS = {
  low: { sampleRate: 8000, bitRate: 64000, channels: 1 },
  medium: { sampleRate: 16000, bitRate: 128000, channels: 1 },
  high: { sampleRate: 44100, bitRate: 256000, channels: 2 }
};

// Authentication management
async function getAuthToken() {
  try {
    const result = await chrome.storage.sync.get(['authToken']);
    authToken = result.authToken || null;
    return authToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function setAuthToken(token) {
  try {
    authToken = token;
    await chrome.storage.sync.set({ authToken: token });
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
}

// Modern Chrome Action Button Handler - Critical for tab capture permissions
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension action button clicked for tab:', tab.id);
  
  try {
    // Ensure we have authentication
    const token = await getAuthToken();
    if (!token) {
      // Open popup for authentication instead of trying to capture
      chrome.action.openPopup();
      return;
    }

    // Check if already recording this tab
    if (activeRecordingSessions.has(tab.id)) {
      console.log('Tab already recording, stopping...');
      await stopTabCapture(tab.id);
      return;
    }

    // Start recording with user gesture
    await startTabCaptureWithGesture(tab);
    
  } catch (error) {
    console.error('Error handling action click:', error);
    
    // Notify user of the error
    chrome.runtime.sendMessage({
      type: 'CAPTURE_ERROR',
      error: error.message,
      tabId: tab.id
    }).catch(() => {
      // Popup might not be open, that's ok
    });
  }
});

// Modern tab capture approach following Chrome documentation
async function startTabCaptureWithGesture(tab) {
  console.log('Starting tab capture with user gesture for tab:', tab.id);
  
  try {
    // Step 1: Check for existing offscreen documents
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });

    // Step 2: Create offscreen document if needed
    if (existingContexts.length === 0) {
      console.log('Creating offscreen document...');
      await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL('offscreen.html'),
        reasons: ['USER_MEDIA'], // For getUserMedia calls
        justification: 'Recording from chrome.tabCapture API for EdNoteAI note generation'
      });
      console.log('Offscreen document created');
    }

    // Step 3: Get MediaStream ID using modern API
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });

    if (!streamId) {
      throw new Error('Failed to get stream ID from getMediaStreamId');
    }

    console.log('Got stream ID:', streamId);

    // Step 4: Send stream ID to offscreen document to start recording
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: streamId,
      tabId: tab.id
    });

    // Wait for response from offscreen document
    const response = await new Promise((resolve, reject) => {
      const messageListener = (message) => {
        if (message.type === 'start-recording-response' && message.tabId === tab.id) {
          chrome.runtime.onMessage.removeListener(messageListener);
          resolve(message);
        }
      };
      chrome.runtime.onMessage.addListener(messageListener);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(messageListener);
        reject(new Error('Timeout waiting for offscreen document response'));
      }, 10000);
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to start recording in offscreen document');
    }

    // Step 5: Create recording session
    const session = {
      tabId: tab.id,
      streamId: streamId,
      startTime: Date.now(),
      status: 'recording',
      transcript: '',
      audioChunks: []
    };

    activeRecordingSessions.set(tab.id, session);

    // Step 6: Notify UI components
    broadcastRecordingUpdate(tab.id, {
      type: 'RECORDING_STARTED',
      sessionId: tab.id,
      startTime: session.startTime
    });

    console.log('Tab capture started successfully for tab:', tab.id);
    return { success: true, sessionId: tab.id };

  } catch (error) {
    console.error('Failed to start tab capture:', error);
    throw error;
  }
}

// Stop tab capture
async function stopTabCapture(tabId) {
  console.log('Stopping tab capture for tab:', tabId);
  
  try {
    const session = activeRecordingSessions.get(tabId);
    if (!session) {
      console.log('No active session found for tab:', tabId);
      return { success: true, message: 'No active session' };
    }

    // Stop recording in offscreen document
    await chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
      tabId: tabId
    });

    // Close session
    session.endTime = Date.now();
    session.status = 'completed';
    
    // Remove from active sessions
    activeRecordingSessions.delete(tabId);

    // Notify UI components
    broadcastRecordingUpdate(tabId, {
      type: 'RECORDING_STOPPED',
      sessionId: tabId,
      endTime: session.endTime,
      duration: session.endTime - session.startTime
    });

    console.log('Tab capture stopped successfully for tab:', tabId);
    return { success: true, session };

  } catch (error) {
    console.error('Error stopping tab capture:', error);
    return { success: false, error: error.message };
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  switch (message.type) {
    case 'GET_ACTIVE_TAB':
      handleGetActiveTab(sendResponse);
      return true;

    case 'GET_AUTH_STATUS':
      handleGetAuthStatus(sendResponse);
      return true;

    case 'START_RECORDING':
      handleStartRecording(message.tabId, sendResponse);
      return true;

    case 'STOP_RECORDING':
      handleStopRecording(message.tabId, sendResponse);
      return true;

    case 'GET_RECORDING_STATUS':
      handleGetRecordingStatus(message.tabId, sendResponse);
      return true;

    case 'CHECK_CAPABILITIES':
      handleCheckCapabilities(sendResponse);
      return true;

    case 'AUDIO_DATA':
      handleAudioData(message.tabId, message.audioData, message.sampleRate, message.timestamp);
      return false;

    case 'SET_AUTH_TOKEN':
      setAuthToken(message.token).then(success => {
        sendResponse({ success });
      });
      return true;

    case 'OPEN_LOGIN':
      handleOpenLogin(sendResponse);
      return true;

    case 'OPEN_DASHBOARD':
      handleOpenDashboard(sendResponse);
      return true;

    case 'AUTH_COMPLETE':
      handleAuthComplete(message, sender, sendResponse);
      return true;

    default:
      console.log('Unknown message type:', message.type);
      return false;
  }
});

// Message handlers
async function handleGetActiveTab(sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetAuthStatus(sendResponse) {
  try {
    const token = await getAuthToken();
    sendResponse({ authenticated: !!token, token });
  } catch (error) {
    sendResponse({ authenticated: false, error: error.message });
  }
}

async function handleStartRecording(tabId, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab || tab.id !== tabId) {
      throw new Error('Tab not found or not active');
    }

    const result = await startTabCaptureWithGesture(tab);
    sendResponse(result);
  } catch (error) {
    console.error('Error in handleStartRecording:', error);
    sendResponse({ 
      success: false, 
      error: error.message,
      action: error.message.includes('context') ? 'reload_extension' : 'check_browser'
    });
  }
}

async function handleStopRecording(tabId, sendResponse) {
  try {
    const result = await stopTabCapture(tabId);
    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function handleGetRecordingStatus(tabId, sendResponse) {
  const session = activeRecordingSessions.get(tabId);
  sendResponse({
    isRecording: !!session,
    session: session || null
  });
}

function handleCheckCapabilities(sendResponse) {
  const capabilities = {
    tabCapture: !!chrome.tabCapture,
    offscreen: !!chrome.offscreen,
    permissions: !!chrome.permissions,
    modernAPI: !!(chrome.tabCapture && chrome.tabCapture.getMediaStreamId)
  };
  
  sendResponse(capabilities);
}

// Authentication-related handlers
async function handleOpenLogin(sendResponse) {
  try {
    // Open login page for EdNoteAI
    const loginUrl = `${EDNOTEAI_CONFIG.baseUrl}/auth/login?source=chrome_extension`;
    
    await chrome.tabs.create({
      url: loginUrl,
      active: true
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error opening login page:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleOpenDashboard(sendResponse) {
  try {
    const token = await getAuthToken();
    if (!token) {
      // If not authenticated, redirect to login first
      await handleOpenLogin(sendResponse);
      return;
    }

    // Open dashboard for authenticated users
    const dashboardUrl = `${EDNOTEAI_CONFIG.baseUrl}/dashboard`;
    
    await chrome.tabs.create({
      url: dashboardUrl,
      active: true
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error opening dashboard:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAuthComplete(message, sender, sendResponse) {
  try {
    console.log('Authentication completed from tab:', sender.tab?.id);
    
    // Close the auth tab if requested
    if (message.closeTab && sender.tab?.id) {
      setTimeout(() => {
        chrome.tabs.remove(sender.tab.id).catch(() => {
          // Tab might already be closed, that's ok
        });
      }, 1000);
    }
    
    // Broadcast auth update to popup and other components
    const token = await getAuthToken();
    broadcastAuthUpdate(!!token);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error handling auth completion:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle audio data from offscreen document
function handleAudioData(tabId, audioData, sampleRate, timestamp) {
  const session = activeRecordingSessions.get(tabId);
  if (!session) {
    return;
  }

  // Store audio chunk
  session.audioChunks.push({
    data: audioData,
    sampleRate,
    timestamp
  });

  // Broadcast to UI (if popup is open)
  broadcastRecordingUpdate(tabId, {
    type: 'AUDIO_DATA_RECEIVED',
    timestamp,
    dataSize: audioData.length
  });
}

// Broadcast updates to UI components
function broadcastRecordingUpdate(tabId, message) {
  // Send to popup if open
  chrome.runtime.sendMessage({
    ...message,
    tabId: tabId
  }).catch(() => {
    // Popup might not be open, that's ok
  });

  // Send to content script on the tab
  chrome.tabs.sendMessage(tabId, {
    ...message,
    tabId: tabId
  }).catch(() => {
    // Content script might not be present, that's ok
  });
}

// WebSocket connection for real-time transcription (if needed)
async function createWebSocketConnection(sessionId) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  return new Promise((resolve, reject) => {
    try {
      const wsUrl = `${EDNOTEAI_CONFIG.wsUrl}/api/${EDNOTEAI_CONFIG.apiVersion}/transcribe/stream`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for session:', sessionId);
        
        ws.send(JSON.stringify({
          type: 'auth',
          token: token,
          sessionId: sessionId,
          action: 'start_transcription',
          source: 'chrome_extension'
        }));
        
        websocketConnections.set(sessionId, ws);
        resolve(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(sessionId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed for session:', sessionId);
        websocketConnections.delete(sessionId);
      };
      
    } catch (error) {
      reject(error);
    }
  });
}

function handleWebSocketMessage(sessionId, data) {
  const session = activeRecordingSessions.get(sessionId);
  if (!session) {
    return;
  }

  switch (data.type) {
    case 'transcript_partial':
      session.transcript = data.text;
      broadcastRecordingUpdate(sessionId, {
        type: 'TRANSCRIPT_UPDATE',
        transcript: data.text,
        isPartial: true
      });
      break;

    case 'transcript_final':
      session.transcript = data.text;
      broadcastRecordingUpdate(sessionId, {
        type: 'TRANSCRIPT_UPDATE',
        transcript: data.text,
        isPartial: false
      });
      break;

    case 'error':
      console.error('WebSocket error from server:', data.error);
      break;
  }
}

// Authentication helpers
function broadcastAuthUpdate(isAuthenticated, user = null) {
  const message = {
    type: 'AUTH_STATUS_CHANGED',
    authenticated: isAuthenticated,
    user: user
  };

  // Broadcast to all extension contexts
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners, that's ok
  });
}

// Check extension permissions and capabilities with enhanced debugging
async function checkExtensionCapabilities() {
  console.log('=== Checking Extension Capabilities ===');
  
  const capabilities = {
    tabCapture: !!chrome.tabCapture,
    offscreen: !!chrome.offscreen,
    permissions: !!chrome.permissions,
    modernAPI: !!(chrome.tabCapture && chrome.tabCapture.getMediaStreamId)
  };
  
  console.log('Capabilities:', capabilities);
  return capabilities;
}

// Enhanced stop recording
async function stopTabCapture(tabId) {
  console.log('Stopping tab capture for tab:', tabId);
  
  try {
    const session = activeRecordingSessions.get(tabId);
    if (!session) {
      console.log('No active session found for tab:', tabId);
      return { success: true, message: 'No active session' };
    }

    // Stop recording in offscreen document
    await chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
      tabId: tabId
    });

    // Close session
    session.endTime = Date.now();
    session.status = 'completed';
    
    // Remove from active sessions
    activeRecordingSessions.delete(tabId);

    // Notify UI components
    broadcastRecordingUpdate(tabId, {
      type: 'RECORDING_STOPPED',
      sessionId: tabId,
      endTime: session.endTime,
      duration: session.endTime - session.startTime
    });

    console.log('Tab capture stopped successfully for tab:', tabId);
    return { success: true, session };

  } catch (error) {
    console.error('Error stopping tab capture:', error);
    return { success: false, error: error.message };
  }
}

// Authentication helpers
function broadcastAuthUpdate(isAuthenticated, user = null) {
  const message = {
    type: 'AUTH_STATUS_CHANGED',
    authenticated: isAuthenticated,
    user: user
  };

  // Broadcast to all extension contexts
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners, that's ok
  });
}