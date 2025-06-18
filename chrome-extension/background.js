// EdNoteAI Chrome Extension - Background Service Worker
// Phase 2: Real Audio Capture & Recording

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log('EdNoteAI Extension installed:', details);
  
  // Set default options
  chrome.storage.sync.set({
    audioQuality: 'medium',
    autoSave: true,
    showOverlay: true,
    chunkSize: 4096, // Audio chunk size in bytes
    sampleRate: 16000 // Default sample rate
  });
});

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

// Enhanced tab audio capture
async function startTabCapture(tabId) {
  try {
    console.log('Starting enhanced tab capture for tab:', tabId);
    
    // Check if we already have an active session for this tab
    if (activeRecordingSessions.has(tabId)) {
      throw new Error('Recording already active for this tab');
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
    
    // Capture tab audio with enhanced options
    const stream = await new Promise((resolve, reject) => {
      chrome.tabCapture.capture(
        {
          audio: true,
          video: false,
          audioConstraints: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: tabId.toString()
            },
            optional: [
              { sampleRate: audioConfig.sampleRate },
              { channelCount: audioConfig.channels },
              { echoCancellation: false },
              { noiseSuppression: false },
              { autoGainControl: false }
            ]
          }
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (stream) {
            resolve(stream);
          } else {
            reject(new Error('Failed to capture audio stream'));
          }
        }
      );
    });
    
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
    return { success: false, error: error.message };
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
    
    // Stop the media stream
    if (session.stream) {
      session.stream.getTracks().forEach(track => track.stop());
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