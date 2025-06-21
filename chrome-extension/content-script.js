// EdNoteAI Chrome Extension - Content Script
// Phase 2: Enhanced with Real-time Features

console.log('EdNoteAI content script loaded');

// Global state
let isRecording = false;
let recordingStartTime = null;
let overlayElement = null;
let currentTranscript = '';
let audioConfig = null;

// Initialize content script
function initialize() {
  console.log('Initializing EdNoteAI content script');
  
  // Check if we're on a supported video platform
  if (isSupportedVideoSite()) {
    createOverlay();
    checkRecordingStatus();
    setupVideoDetection();
  }
}

// Check if current site is a supported video platform
function isSupportedVideoSite() {
  const hostname = window.location.hostname.toLowerCase();
  const supportedSites = [
    'youtube.com',
    'www.youtube.com',
    'vimeo.com',
    'www.vimeo.com',
    'coursera.org',
    'www.coursera.org',
    'udemy.com',
    'www.udemy.com',
    'edx.org',
    'www.edx.org',
    'khanacademy.org',
    'www.khanacademy.org',
    'localhost'
  ];
  
  return supportedSites.some(site => hostname.includes(site)) || detectVideoElements();
}

// Detect if page has video elements
function detectVideoElements() {
  const videos = document.querySelectorAll('video');
  return videos.length > 0;
}

// Create the enhanced overlay interface
function createOverlay() {
  if (overlayElement) return;
  
  overlayElement = document.createElement('div');
  overlayElement.id = 'ednoteai-overlay';
  overlayElement.className = 'ednoteai-overlay';
  overlayElement.innerHTML = `
    <div class="ednoteai-indicator">
      <div class="ednoteai-indicator-dot"></div>
      <span class="ednoteai-indicator-text">Ready to Record</span>
      <div class="ednoteai-controls">
        <button id="ednoteai-start-btn" class="ednoteai-btn ednoteai-btn-start">Start</button>
        <button id="ednoteai-stop-btn" class="ednoteai-btn ednoteai-btn-stop" style="display: none;">Stop</button>
        <button id="ednoteai-expand-btn" class="ednoteai-btn ednoteai-btn-expand" style="display: none;">📝</button>
      </div>
    </div>
    <div id="ednoteai-transcript-panel" class="ednoteai-transcript-panel" style="display: none;">
      <div class="ednoteai-transcript-header">
        <span class="ednoteai-transcript-title">Live Transcript</span>
        <div class="ednoteai-audio-quality" id="ednoteai-audio-quality"></div>
        <button id="ednoteai-collapse-btn" class="ednoteai-btn ednoteai-btn-small">×</button>
      </div>
      <div class="ednoteai-transcript-content" id="ednoteai-transcript-content">
        <div class="ednoteai-transcript-placeholder">Transcript will appear here as you record...</div>
      </div>
      <div class="ednoteai-transcript-footer">
        <div class="ednoteai-status-info" id="ednoteai-status-info">Ready</div>
        <button id="ednoteai-copy-transcript" class="ednoteai-btn ednoteai-btn-small">Copy</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlayElement);
  setupOverlayEventListeners();
  console.log('EdNoteAI enhanced overlay created');
}

// Setup event listeners
function setupOverlayEventListeners() {
  const startBtn = document.getElementById('ednoteai-start-btn');
  const stopBtn = document.getElementById('ednoteai-stop-btn');
  const expandBtn = document.getElementById('ednoteai-expand-btn');
  const collapseBtn = document.getElementById('ednoteai-collapse-btn');
  const copyBtn = document.getElementById('ednoteai-copy-transcript');
  
  if (startBtn) startBtn.addEventListener('click', startRecording);
  if (stopBtn) stopBtn.addEventListener('click', stopRecording);
  if (expandBtn) expandBtn.addEventListener('click', expandTranscriptPanel);
  if (collapseBtn) collapseBtn.addEventListener('click', collapseTranscriptPanel);
  if (copyBtn) copyBtn.addEventListener('click', copyTranscript);
  
  // Make overlay draggable
  makeOverlayDraggable();
}

// Make overlay draggable (enhanced)
function makeOverlayDraggable() {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  const indicator = document.querySelector('.ednoteai-indicator');
  
  indicator.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    if (e.target.classList.contains('ednoteai-btn')) {
      return; // Don't drag when clicking buttons
    }
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    indicator.style.cursor = 'grabbing';
  }
  
  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      xOffset = currentX;
      yOffset = currentY;
      
      overlayElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }
  
  function dragEnd() {
    isDragging = false;
    if (indicator) {
      indicator.style.cursor = 'move';
    }
  }
}

// Start recording with enhanced feedback
async function startRecording() {
  try {
    console.log('Starting enhanced recording from content script');
    
    const response = await sendMessageToBackground({ type: 'GET_ACTIVE_TAB' });
    if (!response.tab) {
      throw new Error('Could not get current tab information');
    }
    
    const result = await sendMessageToBackground({
      type: 'START_RECORDING',
      tabId: response.tab.id
    });
    
    if (result.success) {
      isRecording = true;
      recordingStartTime = Date.now();
      audioConfig = result.audioConfig;
      
      updateOverlayUI();
      startRecordingTimer();
      showAudioQuality();
      updateStatusInfo('Initializing recording...');
      
      showNotification('Recording started! 🎤', 'success');
    } else {
      throw new Error(result.error || 'Failed to start recording');
    }
    
  } catch (error) {
    console.error('Error starting recording:', error);
    
    // Handle specific context invalidation errors
    if (error.message.includes('Extension context invalidated') || 
        error.message.includes('Extension was reloaded') ||
        error.message.includes('refresh this page')) {
      showExtensionReloadNotification();
    } else {
      showNotification(`Error: ${error.message}`, 'error');
    }
    
    updateStatusInfo('Error starting recording');
  }
}

// Stop recording with enhanced feedback
async function stopRecording() {
  try {
    console.log('Stopping enhanced recording from content script');
    
    const response = await sendMessageToBackground({ type: 'GET_ACTIVE_TAB' });
    if (!response.tab) {
      throw new Error('Could not get current tab information');
    }
    
    const result = await sendMessageToBackground({
      type: 'STOP_RECORDING',
      tabId: response.tab.id
    });
    
    if (result.success) {
      isRecording = false;
      recordingStartTime = null;
      
      updateOverlayUI();
      stopRecordingTimer();
      updateStatusInfo('Recording completed');
      
      const duration = Math.round((result.session.endTime - result.session.startTime) / 1000);
      showNotification(`Recording stopped! Duration: ${duration}s 📝`, 'success');
      
      // Show final transcript
      if (currentTranscript) {
        expandTranscriptPanel();
      }
    } else {
      throw new Error(result.error || 'Failed to stop recording');
    }
    
  } catch (error) {
    console.error('Error stopping recording:', error);
    
    // Handle specific context invalidation errors
    if (error.message.includes('Extension context invalidated') || 
        error.message.includes('Extension was reloaded') ||
        error.message.includes('refresh this page')) {
      showExtensionReloadNotification();
    } else {
      showNotification(`Error: ${error.message}`, 'error');
    }
    
    updateStatusInfo('Error stopping recording');
  }
}

// Check recording status
async function checkRecordingStatus() {
  try {
    const response = await sendMessageToBackground({ type: 'GET_ACTIVE_TAB' });
    if (response.tab) {
      const statusResponse = await sendMessageToBackground({
        type: 'GET_RECORDING_STATUS',
        tabId: response.tab.id
      });
      
      if (statusResponse.isRecording) {
        isRecording = true;
        recordingStartTime = statusResponse.session.startTime;
        audioConfig = statusResponse.session.audioConfig;
        currentTranscript = statusResponse.session.transcriptBuffer || '';
        
        updateOverlayUI();
        startRecordingTimer();
        showAudioQuality();
        updateTranscriptDisplay();
      }
    }
  } catch (error) {
    console.error('Error checking recording status:', error);
  }
}

// Update overlay UI with enhanced states
function updateOverlayUI() {
  const startBtn = document.getElementById('ednoteai-start-btn');
  const stopBtn = document.getElementById('ednoteai-stop-btn');
  const expandBtn = document.getElementById('ednoteai-expand-btn');
  const indicatorText = document.querySelector('.ednoteai-indicator-text');
  const indicatorDot = document.querySelector('.ednoteai-indicator-dot');
  
  if (isRecording) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    expandBtn.style.display = 'inline-block';
    indicatorText.textContent = 'Recording...';
    indicatorDot.classList.add('recording');
    overlayElement.classList.add('recording');
  } else {
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    expandBtn.style.display = 'none';
    indicatorText.textContent = 'Ready to Record';
    indicatorDot.classList.remove('recording');
    overlayElement.classList.remove('recording');
    collapseTranscriptPanel();
  }
}

// Recording timer with enhanced display
let recordingTimer = null;

function startRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  
  recordingTimer = setInterval(() => {
    if (recordingStartTime) {
      const elapsed = Math.round((Date.now() - recordingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const indicatorText = document.querySelector('.ednoteai-indicator-text');
      if (indicatorText) {
        indicatorText.textContent = `Recording ${timeString}`;
      }
      
      updateStatusInfo(`Recording ${timeString}`);
    }
  }, 1000);
}

function stopRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
}

// Transcript panel management
function expandTranscriptPanel() {
  const panel = document.getElementById('ednoteai-transcript-panel');
  if (panel) {
    panel.style.display = 'block';
    updateTranscriptDisplay();
  }
}

function collapseTranscriptPanel() {
  const panel = document.getElementById('ednoteai-transcript-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

// Update transcript display
function updateTranscriptDisplay() {
  const content = document.getElementById('ednoteai-transcript-content');
  if (content) {
    if (currentTranscript) {
      content.innerHTML = `<div class="ednoteai-transcript-text">${currentTranscript}</div>`;
      // Auto-scroll to bottom
      content.scrollTop = content.scrollHeight;
    } else {
      content.innerHTML = '<div class="ednoteai-transcript-placeholder">Listening for audio...</div>';
    }
  }
}

// Copy transcript to clipboard
async function copyTranscript() {
  if (!currentTranscript) {
    showNotification('No transcript to copy', 'info');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentTranscript);
    showNotification('Transcript copied to clipboard! 📋', 'success');
  } catch (error) {
    console.error('Error copying transcript:', error);
    showNotification('Failed to copy transcript', 'error');
  }
}

// Show audio quality info
function showAudioQuality() {
  const qualityElement = document.getElementById('ednoteai-audio-quality');
  if (qualityElement && audioConfig) {
    const qualityText = `${audioConfig.sampleRate/1000}kHz ${audioConfig.channels}ch`;
    qualityElement.textContent = qualityText;
  }
}

// Update status info
function updateStatusInfo(message) {
  const statusElement = document.getElementById('ednoteai-status-info');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ednoteai-notification ednoteai-notification-${type} ednoteai-notification-enhanced`;
  notification.innerHTML = `
    <div class="ednoteai-notification-content">
      <span class="ednoteai-notification-text">${message}</span>
      <button class="ednoteai-notification-close">×</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Close button
  const closeBtn = notification.querySelector('.ednoteai-notification-close');
  closeBtn.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

// Special notification for extension reload scenarios
function showExtensionReloadNotification() {
  const notification = document.createElement('div');
  notification.className = 'ednoteai-notification ednoteai-notification-warning ednoteai-notification-enhanced ednoteai-notification-persistent';
  notification.innerHTML = `
    <div class="ednoteai-notification-content">
      <div class="ednoteai-notification-header">
        <span class="ednoteai-notification-icon">🔄</span>
        <span class="ednoteai-notification-title">Extension Needs Reload</span>
      </div>
      <div class="ednoteai-notification-text">
        The EdNoteAI extension was updated. Please refresh this page to continue recording.
      </div>
      <div class="ednoteai-notification-actions">
        <button class="ednoteai-reload-page-btn">Refresh Page</button>
        <button class="ednoteai-notification-close">Dismiss</button>
      </div>
    </div>
  `;
  
  // Style the notification to be more prominent
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 10000 !important;
    max-width: 350px !important;
    background: #fff3cd !important;
    border: 2px solid #ffc107 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  `;
  
  document.body.appendChild(notification);
  
  // Add event listeners
  const reloadBtn = notification.querySelector('.ednoteai-reload-page-btn');
  const closeBtn = notification.querySelector('.ednoteai-notification-close');
  
  if (reloadBtn) {
    reloadBtn.style.cssText = `
      background: #007cba !important;
      color: white !important;
      border: none !important;
      padding: 8px 16px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      margin-right: 8px !important;
    `;
    
    reloadBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  if (closeBtn) {
    closeBtn.style.cssText = `
      background: #6c757d !important;
      color: white !important;
      border: none !important;
      padding: 8px 16px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
    `;
    
    closeBtn.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }
  
  // Don't auto-remove this notification since it requires user action
}

// Setup video detection for enhanced hints
function setupVideoDetection() {
  const videos = document.querySelectorAll('video');
  
  videos.forEach(video => {
    video.addEventListener('play', () => {
      if (!isRecording) {
        showNotification('🎬 Video started! Click Start to record notes', 'info');
      }
    });
    
    video.addEventListener('pause', () => {
      if (isRecording) {
        updateStatusInfo('Video paused - still recording audio');
      }
    });
    
    video.addEventListener('ended', () => {
      if (isRecording) {
        showNotification('Video ended. Stop recording to save notes', 'info');
      }
    });
  });
}

// Send messages to background with context validation
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    // Check if extension context is valid
    if (!chrome.runtime || !chrome.runtime.id) {
      reject(new Error('Extension context invalidated. Please reload the page and extension.'));
      return;
    }
    
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          
          // Handle specific context invalidation errors
          if (error.includes('Extension context invalidated') || 
              error.includes('Receiving end does not exist') ||
              error.includes('The message port closed before a response was received')) {
            reject(new Error('Extension was reloaded. Please refresh this page to continue.'));
          } else {
            reject(new Error(error));
          }
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(new Error(`Failed to send message: ${error.message}`));
    }
  });
}

// Enhanced message handling from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate extension context before processing messages
  if (!chrome.runtime || !chrome.runtime.id) {
    console.warn('Extension context invalidated, ignoring message:', message);
    return false;
  }
  
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'RECORDING_STARTED':
      isRecording = true;
      recordingStartTime = Date.now();
      audioConfig = message.audioConfig;
      updateOverlayUI();
      startRecordingTimer();
      showAudioQuality();
      updateStatusInfo('Recording started');
      showNotification('Recording started successfully! 🎤', 'success');
      break;
      
    case 'RECORDING_STOPPED':
      isRecording = false;
      recordingStartTime = null;
      updateOverlayUI();
      stopRecordingTimer();
      updateStatusInfo('Recording completed');
      const duration = Math.round(message.duration / 1000);
      showNotification(`Recording completed! Duration: ${duration}s 📝`, 'success');
      
      // Show final transcript if available
      if (message.transcript) {
        currentTranscript = message.transcript;
        expandTranscriptPanel();
        updateTranscriptDisplay();
      }
      break;
      
    case 'TRANSCRIPT_UPDATE':
      if (message.transcript) {
        if (message.isPartial) {
          // For partial transcripts, append or update
          currentTranscript = message.transcript;
          updateStatusInfo('Transcribing...');
        } else {
          // For final transcripts, replace
          currentTranscript = message.transcript;
          updateStatusInfo('Transcript updated');
        }
        updateTranscriptDisplay();
        
        // Auto-expand panel if not already shown
        const panel = document.getElementById('ednoteai-transcript-panel');
        if (panel && panel.style.display === 'none') {
          expandTranscriptPanel();
        }
      }
      break;
      
    case 'NOTES_READY':
      updateStatusInfo('AI notes generated!');
      showNotification('🧠 AI notes are ready in your library!', 'success');
      
      // Could show a link to view notes
      if (message.noteId) {
        console.log('Notes generated with ID:', message.noteId);
      }
      break;
      
    case 'TRANSCRIPTION_ERROR':
      updateStatusInfo('Transcription error');
      showNotification(`Transcription error: ${message.error}`, 'error');
      break;
      
    default:
      console.warn('Unknown message type received:', message.type);
  }
  
  sendResponse({ received: true });
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Periodic extension context check
let contextCheckInterval = null;

function startContextCheck() {
  if (contextCheckInterval) {
    clearInterval(contextCheckInterval);
  }
  
  contextCheckInterval = setInterval(() => {
    if (!chrome.runtime || !chrome.runtime.id) {
      console.warn('Extension context lost, showing reload notification');
      showExtensionReloadNotification();
      clearInterval(contextCheckInterval);
    }
  }, 5000); // Check every 5 seconds
}

// Start context monitoring
startContextCheck();

// Handle page navigation
window.addEventListener('beforeunload', () => {
  if (isRecording) {
    console.log('Page unloading with active recording');
  }
});

console.log('EdNoteAI content script setup complete - Phase 2 Enhanced');
