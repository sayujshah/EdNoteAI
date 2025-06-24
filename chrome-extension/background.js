// EdNoteAI Chrome Extension - Background Service Worker
// Phase 2: Real Audio Capture & Recording

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

// Validate APIs are available with detailed debugging
function validateAPIs() {
  console.log('=== Detailed API Validation ===');
  console.log('Chrome object:', typeof chrome);
  console.log('Chrome version:', chrome.runtime?.getManifest()?.version);
  console.log('Runtime ID:', chrome.runtime?.id);
  
  const apis = {
    tabCapture: !!chrome.tabCapture,
    tabs: !!chrome.tabs,
    storage: !!chrome.storage,
    runtime: !!chrome.runtime
  };
  
  console.log('Basic API availability:', apis);
  
  // More detailed TabCapture inspection
  console.log('chrome.tabCapture object:', chrome.tabCapture);
  console.log('chrome.tabCapture type:', typeof chrome.tabCapture);
  
  if (chrome.tabCapture) {
    // Check for available API methods
    const hasGetMediaStreamId = chrome.tabCapture.getMediaStreamId && typeof chrome.tabCapture.getMediaStreamId === 'function';
    const hasLegacyCapture = chrome.tabCapture.capture && typeof chrome.tabCapture.capture === 'function';
    const hasAnyMethod = hasGetMediaStreamId || hasLegacyCapture;
    
    console.log('chrome.tabCapture.getMediaStreamId (modern):', !!hasGetMediaStreamId);
    console.log('chrome.tabCapture.capture (legacy):', !!hasLegacyCapture);
    console.log('TabCapture methods:', Object.getOwnPropertyNames(chrome.tabCapture));
    
    console.log('TabCapture API detailed check:', {
      tabCaptureExists: !!chrome.tabCapture,
      captureMethodExists: hasAnyMethod,
      tabCaptureType: typeof chrome.tabCapture,
      captureMethodType: hasGetMediaStreamId ? 'getMediaStreamId' : (hasLegacyCapture ? 'capture' : 'undefined'),
      apiValidationResult: hasAnyMethod,
      modernAPI: hasGetMediaStreamId,
      legacyAPI: hasLegacyCapture
    });
  }
  
  // Check specific browser
  const userAgent = navigator.userAgent;
  console.log('User Agent:', userAgent);
  
  const isChrome = userAgent.includes('Chrome/');
  const isEdge = userAgent.includes('Edg/');
  const isBrave = userAgent.includes('Brave');
  
  console.log('Browser detection:', { isChrome, isEdge, isBrave });
  
  if (!apis.tabCapture) {
    console.error('❌ chrome.tabCapture API is not available!');
    console.error('This might be due to:');
    console.error('1. Using an unsupported browser');
    console.error('2. Extension manifest issues');
    console.error('3. Permissions not granted');
    return false;
  }
  
  // Check for available TabCapture methods
  const hasGetMediaStreamId = chrome.tabCapture.getMediaStreamId && typeof chrome.tabCapture.getMediaStreamId === 'function';
  const hasLegacyCapture = chrome.tabCapture.capture && typeof chrome.tabCapture.capture === 'function';
  
  if (!hasGetMediaStreamId && !hasLegacyCapture) {
    console.error('❌ chrome.tabCapture methods are not available!');
    console.error('Neither chrome.tabCapture.getMediaStreamId nor chrome.tabCapture.capture found');
    console.error('Available TabCapture methods:', Object.getOwnPropertyNames(chrome.tabCapture));
    return false;
  }
  
  console.log('✅ All required APIs are available and functional');
  return true;
}

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log('EdNoteAI Extension installed:', details);
  
  // Validate APIs on install
  validateAPIs();
  
  // Start keep-alive
  keepServiceWorkerAlive();
  
  // Set default options
  chrome.storage.sync.set({
    audioQuality: 'medium',
    autoSave: true,
    showOverlay: true,
    chunkSize: 4096, // Audio chunk size in bytes
    sampleRate: 16000 // Default sample rate
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup detected');
  validateAPIs();
  keepServiceWorkerAlive();
});

// Validate APIs on service worker start
validateAPIs();
keepServiceWorkerAlive();

// EdNoteAI Production Configuration
const EDNOTEAI_CONFIG = {
  baseUrl: 'https://ednoteai.com',
  wsUrl: 'wss://ednoteai.com',
  apiVersion: 'v1'
};

// Global state management
let activeRecordingSessions = new Map();
let authToken = null;
let websocketConnections = new Map();

// Audio configuration based on quality settings
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

// WebSocket connection management
async function createWebSocketConnection(sessionId) {
  return new Promise((resolve, reject) => {
    try {
      const wsUrl = `${EDNOTEAI_CONFIG.wsUrl}/api/${EDNOTEAI_CONFIG.apiVersion}/transcribe/stream`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for session:', sessionId);
        
        // Send authentication and session setup
        ws.send(JSON.stringify({
          type: 'auth',
          token: authToken,
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
        console.error('WebSocket error for session', sessionId, error);
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

// Handle WebSocket messages
function handleWebSocketMessage(sessionId, data) {
  console.log('WebSocket message for session', sessionId, data);
  
  switch (data.type) {
    case 'auth_success':
      broadcastToSession(sessionId, {
        type: 'CONNECTION_ESTABLISHED',
        sessionId: sessionId
      });
      break;
      
    case 'transcript_partial':
      // Broadcast partial transcript to popup and content script
      broadcastToSession(sessionId, {
        type: 'TRANSCRIPT_UPDATE',
        transcript: data.text,
        isPartial: true,
        timestamp: data.timestamp
      });
      break;
      
    case 'transcript_final':
      broadcastToSession(sessionId, {
        type: 'TRANSCRIPT_UPDATE', 
        transcript: data.text,
        isPartial: false,
        timestamp: data.timestamp
      });
      break;
      
    case 'notes_generated':
      broadcastToSession(sessionId, {
        type: 'NOTES_READY',
        notes: data.notes,
        noteId: data.noteId,
        url: `${EDNOTEAI_CONFIG.baseUrl}/dashboard/analysis/${data.noteId}`
      });
      break;
      
    case 'error':
      broadcastToSession(sessionId, {
        type: 'TRANSCRIPTION_ERROR',
        error: data.message,
        code: data.code
      });
      break;
      
    case 'auth_failed':
      broadcastToSession(sessionId, {
        type: 'AUTH_ERROR',
        error: 'Authentication failed. Please sign in again.'
      });
      break;
  }
}

// Broadcast message to all components for a session
function broadcastToSession(sessionId, message) {
  const session = activeRecordingSessions.get(sessionId);
  if (!session) return;
  
  // Send to content script
  chrome.tabs.sendMessage(session.tabId, message).catch(() => {
    // Content script might not be available
  });
  
  // Send to popup if open
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open
  });
}

// Audio processing class
class AudioProcessor {
  constructor(sessionId, audioConfig) {
    this.sessionId = sessionId;
    this.audioConfig = audioConfig;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isProcessing = false;
  }
  
  async initialize(stream) {
    try {
      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.audioConfig.sampleRate
      });

      // Continue audio playback for the user
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.audioContext.destination);
      
      // Create media recorder
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: this.audioConfig.bitRate
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.processAudioChunk(event.data);
        }
      };
      
      // Start recording with small time slices for real-time processing
      this.mediaRecorder.start(1000); // 1 second chunks
      this.isProcessing = true;
      
      console.log('AudioProcessor initialized for session:', this.sessionId);
      return true;
      
    } catch (error) {
      console.error('Error initializing AudioProcessor:', error);
      return false;
    }
  }
  
  async processAudioChunk(blob) {
    try {
      const ws = websocketConnections.get(this.sessionId);
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not ready for audio chunk');
        return;
      }
      
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // Send audio chunk via WebSocket (EdNoteAI format)
      ws.send(JSON.stringify({
        type: 'audio_chunk',
        sessionId: this.sessionId,
        timestamp: Date.now(),
        size: arrayBuffer.byteLength,
        format: 'webm/opus',
        sampleRate: this.audioConfig.sampleRate,
        channels: this.audioConfig.channels
      }));
      
      // Send the actual audio data
      ws.send(arrayBuffer);
      
      console.log('Sent audio chunk:', arrayBuffer.byteLength, 'bytes');
      
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }
  
  stop() {
    this.isProcessing = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    console.log('AudioProcessor stopped for session:', this.sessionId);
  }
}

// Check extension permissions and capabilities with enhanced debugging
async function checkExtensionCapabilities() {
  console.log('=== Checking Extension Capabilities ===');
  
  const capabilities = {
    tabCapture: false,
    permissions: false,
    activeTab: false,
    serviceWorkerActive: false,
    browser: 'unknown',
    manifestVersion: null,
    error: null,
    debug: {}
  };

  try {
    // Check if service worker context is valid
    capabilities.serviceWorkerActive = !!(chrome.runtime && chrome.runtime.id);
    console.log('Service worker active:', capabilities.serviceWorkerActive);
    
    if (!capabilities.serviceWorkerActive) {
      capabilities.error = 'Service worker context invalidated. Extension needs to be reloaded.';
      return capabilities;
    }
    
    // Get manifest info
    try {
      const manifest = chrome.runtime.getManifest();
      capabilities.manifestVersion = manifest.manifest_version;
      console.log('Manifest version:', capabilities.manifestVersion);
      console.log('Extension permissions in manifest:', manifest.permissions);
    } catch (manifestError) {
      console.warn('Could not read manifest:', manifestError);
    }
    
    // Enhanced browser detection
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome/')) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      capabilities.browser = `Chrome ${chromeMatch ? chromeMatch[1] : 'unknown'}`;
    } else if (userAgent.includes('Edg/')) {
      capabilities.browser = 'Edge Chromium';
    } else if (userAgent.includes('Brave')) {
      capabilities.browser = 'Brave';
    } else {
      capabilities.browser = 'Unknown/Unsupported';
    }
    console.log('Detected browser:', capabilities.browser);
    
    // Detailed API validation
    console.log('Performing detailed API validation...');
    const apiValid = validateAPIs();
    
    // Check if tabCapture API exists with more detailed checking
    const tabCaptureExists = !!(chrome.tabCapture);
    const captureMethodExists = !!(chrome.tabCapture && chrome.tabCapture.capture);
    
    capabilities.tabCapture = tabCaptureExists && captureMethodExists;
    
    capabilities.debug = {
      tabCaptureExists,
      captureMethodExists,
      tabCaptureType: typeof chrome.tabCapture,
      captureMethodType: chrome.tabCapture ? typeof chrome.tabCapture.capture : 'undefined',
      apiValidationResult: apiValid
    };
    
    console.log('TabCapture API detailed check:', capabilities.debug);
    
    if (!apiValid) {
      capabilities.error = 'Required APIs are not available in this context.';
      return capabilities;
    }
    
    // Check permissions with enhanced error handling
    console.log('Checking permissions...');
    try {
      if (chrome.permissions && chrome.permissions.contains) {
        console.log('Using chrome.permissions.contains API');
        
        const hasTabCapture = await new Promise((resolve, reject) => {
          chrome.permissions.contains({ permissions: ['tabCapture'] }, (result) => {
            if (chrome.runtime.lastError) {
              console.error('TabCapture permission check error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              console.log('TabCapture permission result:', result);
              resolve(result);
            }
          });
        });
        
        const hasActiveTab = await new Promise((resolve, reject) => {
          chrome.permissions.contains({ permissions: ['activeTab'] }, (result) => {
            if (chrome.runtime.lastError) {
              console.error('ActiveTab permission check error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              console.log('ActiveTab permission result:', result);
              resolve(result);
            }
          });
        });
        
        capabilities.permissions = hasTabCapture;
        capabilities.activeTab = hasActiveTab;
        
        console.log('Permission check results:', {
          tabCapture: hasTabCapture,
          activeTab: hasActiveTab
        });
        
      } else {
        console.log('chrome.permissions API not available, assuming permissions granted');
        // Fallback: assume permissions are granted if API exists
        capabilities.permissions = capabilities.tabCapture;
        capabilities.activeTab = true;
      }
    } catch (permError) {
      console.warn('Permission check failed:', permError);
      // If we can't check permissions but API exists, assume they're granted
      // This handles cases where permissions API is buggy but extension works
      if (capabilities.tabCapture) {
        console.log('TabCapture API exists, assuming permissions are granted despite check failure');
        capabilities.permissions = true;
        capabilities.activeTab = true;
      } else {
        capabilities.permissions = false;
        capabilities.activeTab = false;
        capabilities.error = `Permission check failed and TabCapture API unavailable: ${permError.message}`;
      }
    }
    
    console.log('Final capabilities:', capabilities);
    
  } catch (error) {
    capabilities.error = error.message;
    console.error('Capability check error:', error);
  }
  
  return capabilities;
}

// Modern TabCapture implementation using getMediaStreamId and offscreen document
async function getModernTabCaptureStream(tabId) {
  console.log('=== Modern TabCapture Approach ===');
  console.log('Available TabCapture methods:', Object.getOwnPropertyNames(chrome.tabCapture));
  
  // Check if we have the modern API
  if (!chrome.tabCapture.getMediaStreamId) {
    throw new Error('chrome.tabCapture.getMediaStreamId is not available');
  }
  
  try {
    // Step 0: Clean up any existing captures
    await cleanupExistingCaptures();
    
    // Step 1: Get a stream ID
    console.log('Getting stream ID for tab:', tabId);
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });
    
    if (!streamId) {
      throw new Error('Failed to get stream ID from getMediaStreamId');
    }
    
    console.log('Got stream ID:', streamId);
    
    // Step 2: Create offscreen document if needed
    await ensureOffscreenDocument();
    
    // Step 3: Start audio capture in offscreen document
    const captureResult = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'START_TAB_CAPTURE',
        streamId: streamId,
        tabId: tabId
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Message failed: ${chrome.runtime.lastError.message}`));
        } else if (!response) {
          reject(new Error('No response from offscreen document'));
        } else if (!response.success) {
          reject(new Error(`Failed to start capture: ${response.error}`));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('Tab capture started in offscreen document');
    
    // Step 4: Create a mock stream object for compatibility with existing code
    // Since we can't transfer the actual MediaStream, we'll create a proxy object
    const mockStream = {
      id: `tab-capture-${tabId}`,
      active: true,
      getTracks: () => [{
        id: `audio-track-${tabId}`,
        kind: 'audio',
        enabled: true,
        readyState: 'live',
        stop: () => {
          console.log('Stopping tab capture stream');
          chrome.runtime.sendMessage({
            type: 'STOP_TAB_CAPTURE',
            tabId: tabId
          });
        }
      }],
      getAudioTracks: function() { return this.getTracks().filter(t => t.kind === 'audio'); },
      getVideoTracks: () => [],
      addTrack: () => {},
      removeTrack: () => {},
      clone: () => mockStream
    };
    
    console.log('Created mock stream for tab capture');
    return mockStream;
    
  } catch (error) {
    console.error('Modern TabCapture failed:', error);
    throw new Error(`Modern TabCapture failed: ${error.message}`);
  }
}

// Clean up any existing tab captures
async function cleanupExistingCaptures() {
  try {
    console.log('Cleaning up any existing tab captures...');
    
    // Get all currently captured tabs
    const capturedTabs = await chrome.tabCapture.getCapturedTabs();
    console.log('Found captured tabs:', capturedTabs);
    
    // Stop all active captures
    for (const capture of capturedTabs) {
      console.log('Stopping capture for tab:', capture.tabId);
      try {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'STOP_TAB_CAPTURE',
            tabId: capture.tabId
          }, (response) => {
            // Don't worry about the response, just resolve
            resolve();
          });
        });
      } catch (error) {
        console.log('Could not stop capture for tab', capture.tabId, ':', error.message);
      }
    }
    
    // Wait for cleanup
    if (capturedTabs.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.log('Error during cleanup:', error);
  }
}

async function ensureOffscreenDocument() {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });
  
  if (existingContexts.length > 0) {
    console.log('Offscreen document already exists');
    return;
  }
  
  // Create offscreen document
  console.log('Creating offscreen document...');
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('offscreen.html'),
    reasons: ['USER_MEDIA'],
    justification: 'Required for tab audio capture using getUserMedia'
  });
  
  console.log('Offscreen document created');
}

// Enhanced tab audio capture
async function startTabCapture(tabId) {
  try {
    console.log('Starting enhanced tab capture for tab:', tabId);
    
    // Ensure service worker is alive
    keepServiceWorkerAlive();
    
    // Check if context is still valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated. Please reload the extension.');
    }
    
    // Re-validate APIs
    const apiValid = validateAPIs();
    if (!apiValid) {
      throw new Error('Required APIs are not available. Extension may need to be reloaded.');
    }
    
    // Check if we already have an active session for this tab
    if (activeRecordingSessions.has(tabId)) {
      console.log('Recording already active for this tab, stopping existing session first...');
      await stopTabCapture(tabId);
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Get audio quality settings
    const settings = await chrome.storage.sync.get(['audioQuality']);
    const audioQuality = settings.audioQuality || 'medium';
    const audioConfig = AUDIO_CONFIGS[audioQuality];
    
    // Verify authentication
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in first.');
    }
    
    // Check if tabCapture API is available with detailed validation
    if (!chrome.tabCapture) {
      throw new Error('chrome.tabCapture API is not available. This browser may not support tab capture.');
    }
    
    // Check for the modern getMediaStreamId method or legacy capture method
    const hasModernAPI = chrome.tabCapture.getMediaStreamId && typeof chrome.tabCapture.getMediaStreamId === 'function';
    const hasLegacyAPI = chrome.tabCapture.capture && typeof chrome.tabCapture.capture === 'function';
    
    if (!hasModernAPI && !hasLegacyAPI) {
      throw new Error('No chrome.tabCapture methods are available. Available methods: ' + Object.getOwnPropertyNames(chrome.tabCapture).join(', '));
    }

    // Verify tab exists and is audible
    const tab = await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Tab not found: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(tab);
        }
      });
    });

    if (!tab) {
      throw new Error('Target tab not found');
    }

    // Check if tab has audio (optional, but good UX)
    if (!tab.audible && !tab.mutedInfo?.muted) {
      console.warn('Tab may not have audio content');
    }

    // Use modern TabCapture approach with getMediaStreamId and offscreen document
    console.log('Using modern TabCapture approach...');
    const stream = await getModernTabCaptureStream(tabId);
    
    // Create WebSocket connection
    const websocket = await createWebSocketConnection(tabId);
    
    // Create and initialize audio processor
    const audioProcessor = new AudioProcessor(tabId, audioConfig);
    const processorInitialized = await audioProcessor.initialize(stream);
    
    if (!processorInitialized) {
      throw new Error('Failed to initialize audio processor');
    }
    
    // Create recording session
    const session = {
      tabId,
      stream,
      audioProcessor,
      websocket,
      startTime: Date.now(),
      status: 'recording',
      audioConfig,
      transcriptBuffer: '',
      audioChunks: []
    };
    
    activeRecordingSessions.set(tabId, session);
    
    // Notify components
    broadcastToSession(tabId, {
      type: 'RECORDING_STARTED',
      sessionId: tabId,
      audioConfig
    });
    
    console.log('Enhanced recording started for tab:', tabId);
    return { success: true, sessionId: tabId, audioConfig };
    
  } catch (error) {
    console.error('Error starting enhanced tab capture:', error);
    
    // Provide specific guidance based on error type
    let errorResponse = { success: false, error: error.message };
    
    if (error.message.includes('context invalidated') || error.message.includes('Extension context')) {
      errorResponse.action = 'reload_extension';
      errorResponse.guidance = 'The extension service worker was terminated. Please reload the extension from chrome://extensions/';
    } else if (error.message.includes('TabCapture API') || error.message.includes('chrome.tabCapture')) {
      errorResponse.action = 'check_browser';
      errorResponse.guidance = 'Tab capture is not available. Please ensure you are using Chrome/Chromium browser and the extension has proper permissions.';
    } else if (error.message.includes('not available') || error.message.includes('reloaded')) {
      errorResponse.action = 'reload_extension';
      errorResponse.guidance = 'Extension APIs are not available. Please reload the extension.';
    }
    
    return errorResponse;
  }
}

// Handle audio data from offscreen document
function handleAudioData(tabId, audioData, sampleRate, timestamp) {
  const session = activeRecordingSessions.get(tabId);
  if (!session) {
    return; // No active session for this tab
  }
  
  // Simple logging instead of processing (for now)
  console.log(`Audio data received for tab ${tabId}: ${audioData.length} samples`);
  
  // Update session with latest data
  session.lastAudioTimestamp = timestamp;
  
  // For now, just accumulate the transcript buffer with a placeholder
  // In a full implementation, this would be sent to the transcription service
  if (!session.transcriptBuffer) {
    session.transcriptBuffer = '';
  }
  
  // Simulate transcript update every few seconds
  if (timestamp - (session.lastTranscriptUpdate || session.startTime) > 5000) {
    session.transcriptBuffer += `[Audio captured at ${new Date(timestamp).toLocaleTimeString()}] `;
    session.lastTranscriptUpdate = timestamp;
    
    // Broadcast transcript update
    broadcastToSession(tabId, {
      type: 'TRANSCRIPT_UPDATE',
      transcript: session.transcriptBuffer,
      isPartial: false,
      timestamp: timestamp
    });
  }
}

// Enhanced stop recording
async function stopTabCapture(tabId) {
  try {
    const session = activeRecordingSessions.get(tabId);
    if (!session) {
      throw new Error('No active recording session for this tab');
    }
    
    console.log('Stopping enhanced recording for tab:', tabId);
    
    // Stop audio processor
    if (session.audioProcessor) {
      session.audioProcessor.stop();
    }
    
    // Stop the media stream (this will also stop offscreen capture for modern approach)
    if (session.stream) {
      session.stream.getTracks().forEach(track => track.stop());
    }
    
    // If using modern TabCapture, also stop the offscreen capture
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'STOP_TAB_CAPTURE',
          tabId: tabId
        }, (response) => {
          // Don't worry about the response, just resolve
          resolve();
        });
        // Also resolve after a timeout in case offscreen document doesn't respond
        setTimeout(resolve, 1000);
      });
    } catch (error) {
      // Offscreen document might not be available, that's ok
      console.log('Could not stop offscreen capture (document may not exist):', error.message);
    }
    
    // Close WebSocket connection
    if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
      session.websocket.send(JSON.stringify({
        type: 'end_session',
        sessionId: tabId
      }));
      session.websocket.close();
    }
    
    // Update session status
    session.status = 'stopped';
    session.endTime = Date.now();
    
    // Notify components
    broadcastToSession(tabId, {
      type: 'RECORDING_STOPPED',
      sessionId: tabId,
      duration: session.endTime - session.startTime,
      transcript: session.transcriptBuffer
    });
    
    // Clean up session
    activeRecordingSessions.delete(tabId);
    
    console.log('Enhanced recording stopped for tab:', tabId);
    return { success: true, session };
    
  } catch (error) {
    console.error('Error stopping enhanced tab capture:', error);
    return { success: false, error: error.message };
  }
}

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_AUTH_STATUS':
      getAuthToken().then(token => {
        sendResponse({ authenticated: !!token, token });
      });
      return true;
    
    case 'SET_AUTH_TOKEN':
      setAuthToken(message.token).then(success => {
        // If auth token was set, broadcast to all extension components
        if (success && message.token) {
          broadcastAuthUpdate(true, message.user);
        } else if (success && !message.token) {
          broadcastAuthUpdate(false);
        }
        sendResponse({ success });
      });
      return true;
    
    case 'CHECK_CAPABILITIES':
      checkExtensionCapabilities().then(capabilities => {
        sendResponse(capabilities);
      });
      return true;

    case 'DEBUG_TABCAPTURE':
      // Enhanced direct test of tabCapture API
      (async () => {
        try {
          console.log('=== Enhanced TabCapture Debug Test ===');
          
          // Re-run full validation
          const apiValid = validateAPIs();
          const capabilities = await checkExtensionCapabilities();
          
          const hasGetMediaStreamId = chrome.tabCapture ? (chrome.tabCapture.getMediaStreamId && typeof chrome.tabCapture.getMediaStreamId === 'function') : false;
          const hasLegacyCapture = chrome.tabCapture ? (chrome.tabCapture.capture && typeof chrome.tabCapture.capture === 'function') : false;
          const hasAnyMethod = hasGetMediaStreamId || hasLegacyCapture;
          
          const debugInfo = {
            apiValidation: apiValid,
            capabilities: capabilities,
            chromeTabCapture: !!chrome.tabCapture,
            captureMethod: hasAnyMethod,
            tabCaptureObject: chrome.tabCapture ? 'exists' : 'missing',
            captureMethodType: hasGetMediaStreamId ? 'getMediaStreamId' : (hasLegacyCapture ? 'capture' : 'undefined'),
            availableMethods: chrome.tabCapture ? Object.getOwnPropertyNames(chrome.tabCapture) : [],
            modernAPI: hasGetMediaStreamId,
            legacyCapture: hasLegacyCapture,
            browser: capabilities.browser,
            manifestVersion: capabilities.manifestVersion,
            userAgent: navigator.userAgent
          };
          
          console.log('Complete debug info:', debugInfo);
          
          if (chrome.tabCapture && hasAnyMethod) {
            const method = hasGetMediaStreamId ? 'getMediaStreamId (modern)' : 'capture (legacy)';
            sendResponse({ 
              success: true, 
              message: `TabCapture API is available (using ${method})`,
              debugInfo
            });
          } else {
            sendResponse({ 
              success: false, 
              message: 'TabCapture API is not available',
              reason: !chrome.tabCapture ? 'chrome.tabCapture object missing' : 'No capture methods available',
              debugInfo
            });
          }
        } catch (error) {
          console.error('Debug test error:', error);
          sendResponse({ 
            success: false, 
            message: `Error during debug test: ${error.message}`,
            error: error.toString(),
            stack: error.stack
          });
        }
      })();
      return true; // Keep message channel open for async response

    case 'START_RECORDING':
      startTabCapture(message.tabId).then(result => {
        sendResponse(result);
      });
      return true;
    
    case 'STOP_RECORDING':
      stopTabCapture(message.tabId).then(result => {
        sendResponse(result);
      });
      return true;
    
    case 'AUDIO_DATA':
      // Handle audio data from offscreen document
      handleAudioData(message.tabId, message.audioData, message.sampleRate, message.timestamp);
      return false;
    
    case 'GET_RECORDING_STATUS':
      const session = activeRecordingSessions.get(message.tabId);
      sendResponse({
        isRecording: !!session,
        session: session ? {
          tabId: session.tabId,
          startTime: session.startTime,
          status: session.status,
          audioConfig: session.audioConfig,
          transcriptBuffer: session.transcriptBuffer
        } : null
      });
      return false;
    
    case 'GET_ACTIVE_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        sendResponse({ tab: tabs[0] });
      });
      return true;
    
    case 'OPEN_DASHBOARD':
      chrome.tabs.create({ url: `${EDNOTEAI_CONFIG.baseUrl}/dashboard` });
      sendResponse({ success: true });
      return false;
      
    case 'OPEN_LOGIN':
      chrome.tabs.create({ url: `${EDNOTEAI_CONFIG.baseUrl}/login?extension=true` });
      sendResponse({ success: true });
      return false;
    
    case 'AUTH_COMPLETE':
      // Handle authentication completion from auth bridge
      if (message.closeTab && sender.tab) {
        // Close the login tab
        chrome.tabs.remove(sender.tab.id);
      }
      
      // Broadcast auth update to all components
      broadcastAuthUpdate(true);
      sendResponse({ success: true });
      return false;
    
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

// Broadcast authentication updates to all extension components
function broadcastAuthUpdate(isAuthenticated, user = null) {
  const message = {
    type: 'AUTH_STATUS_CHANGED',
    authenticated: isAuthenticated,
    user: user
  };
  
  // Send to all tabs with content scripts
  chrome.tabs.query({}).then(tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Content script might not be available on this tab
      });
    });
  });
  
  // Send to popup if open
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open
  });
}

// Tab management - enhanced cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeRecordingSessions.has(tabId)) {
    console.log('Tab closed, cleaning up enhanced recording session:', tabId);
    stopTabCapture(tabId);
  }
});

// Tab updates - handle page navigation with session preservation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && activeRecordingSessions.has(tabId)) {
    console.log('Tab navigating, preserving recording session:', tabId);
    // Could implement session pause/resume here
  }
});

// Periodic cleanup of stale sessions
setInterval(() => {
  const currentTime = Date.now();
  for (const [tabId, session] of activeRecordingSessions.entries()) {
    // Clean up sessions older than 2 hours
    if (currentTime - session.startTime > 2 * 60 * 60 * 1000) {
      console.log('Cleaning up stale session:', tabId);
      stopTabCapture(tabId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Error handling
self.addEventListener('error', (event) => {
  console.error('Background script error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('EdNoteAI Background Service Worker loaded - Phase 2 Enhanced'); 