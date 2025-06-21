// EdNoteAI Chrome Extension - Popup Script
// Phase 2: Enhanced with Real-time Features

console.log('EdNoteAI popup script loaded');

// Global state
let currentTab = null;
let recordingSession = null;
let isRecording = false;
let recordingTimer = null;
let authToken = null;
let currentTranscript = '';
let audioConfig = null;
let connectionStatus = 'disconnected';

// DOM elements
const authSection = document.getElementById('auth-section');
const authLoading = document.getElementById('auth-loading');
const authRequired = document.getElementById('auth-required');
const authSuccess = document.getElementById('auth-success');
const recordingSection = document.getElementById('recording-section');
const signInBtn = document.getElementById('sign-in-btn');
const startRecordingBtn = document.getElementById('start-recording-btn');
const stopRecordingBtn = document.getElementById('stop-recording-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const recordingTime = document.getElementById('recording-time');
const pageTitle = document.getElementById('page-title');
const pageUrl = document.getElementById('page-url');
const userName = document.getElementById('user-name');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const dismissError = document.getElementById('dismiss-error');
const transcriptSection = document.getElementById('transcript-section');
const transcriptPreview = document.getElementById('transcript-preview');

// Footer links
const settingsLink = document.getElementById('settings-link');
const libraryLink = document.getElementById('library-link');
const helpLink = document.getElementById('help-link');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('EdNoteAI popup initializing');
  
  try {
    await loadCurrentTab();
    await checkAuthStatus();
    await checkRecordingStatus();
    await loadSettings();
    setupEventListeners();
    setupPeriodicUpdates();
    console.log('EdNoteAI popup initialized successfully');
  } catch (error) {
    console.error('Error initializing popup:', error);
    updateUI({ error: 'Failed to initialize extension' });
  }
});

// Load current tab information
async function loadCurrentTab() {
  try {
    const response = await sendMessageToBackground({ type: 'GET_ACTIVE_TAB' });
    if (response && response.tab) {
      currentTab = response.tab;
      updatePageInfo();
      return true;
    } else {
      throw new Error('Could not get current tab information');
    }
  } catch (error) {
    console.error('Error loading current tab:', error);
    return false;
  }
}

// Update page information display
function updatePageInfo(tab) {
  if (pageTitle) {
    pageTitle.textContent = tab.title || 'Unknown Page';
  }
  
  if (pageUrl) {
    try {
      const url = new URL(tab.url);
      pageUrl.textContent = url.hostname;
    } catch {
      pageUrl.textContent = tab.url;
    }
  }
}

// Check authentication status
async function checkAuthStatus() {
  try {
    const response = await sendMessageToBackground({ type: 'GET_AUTH_STATUS' });
    authToken = response.token;
    updateAuthUI(response.authenticated);
  } catch (error) {
    console.error('Error checking auth status:', error);
    updateAuthUI(false);
  }
}

// Show authenticated state
function showAuthenticatedState() {
  authLoading.style.display = 'none';
  authRequired.style.display = 'none';
  authSuccess.style.display = 'block';
  
  if (userName) {
    userName.textContent = 'User';
  }
}

// Show authentication required
function showAuthenticationRequired() {
  authLoading.style.display = 'none';
  authSuccess.style.display = 'none';
  authRequired.style.display = 'block';
}

// Show recording section
function showRecordingSection() {
  recordingSection.style.display = 'block';
}

// Check recording status
async function checkRecordingStatus() {
  if (!currentTab) return;
  
  try {
    const response = await sendMessageToBackground({
      type: 'GET_RECORDING_STATUS',
      tabId: currentTab.id
    });
    
    if (response.isRecording && response.session) {
      isRecording = true;
      recordingSession = response.session;
      audioConfig = response.session.audioConfig;
      currentTranscript = response.session.transcriptBuffer || '';
      
      updateRecordingUI();
      startRecordingTimer();
      updateTranscriptPreview();
      updateAudioQualityDisplay();
    } else {
      isRecording = false;
      recordingSession = null;
      updateRecordingUI();
    }
  } catch (error) {
    console.error('Error checking recording status:', error);
  }
}

// Load user settings
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'audioQuality',
      'autoSave',
      'showOverlay'
    ]);
    
    // Update quality selector
    const qualitySelector = document.getElementById('audio-quality');
    if (qualitySelector && settings.audioQuality) {
      qualitySelector.value = settings.audioQuality;
    }
    
    // Update other settings
    updateSettingsDisplay(settings);
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Recording controls
  const startBtn = document.getElementById('start-recording');
  const stopBtn = document.getElementById('stop-recording');
  
  if (startBtn) startBtn.addEventListener('click', startRecording);
  if (stopBtn) stopBtn.addEventListener('click', stopRecording);
  
  // Authentication
  const signInBtn = document.getElementById('sign-in-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  
  if (signInBtn) signInBtn.addEventListener('click', handleSignIn);
  if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
  
  // Settings
  const qualitySelector = document.getElementById('audio-quality');
  if (qualitySelector) {
    qualitySelector.addEventListener('change', updateAudioQuality);
  }
  
  // Transcript actions
  const copyTranscriptBtn = document.getElementById('copy-transcript');
  const clearTranscriptBtn = document.getElementById('clear-transcript');
  
  if (copyTranscriptBtn) copyTranscriptBtn.addEventListener('click', copyTranscript);
  if (clearTranscriptBtn) clearTranscriptBtn.addEventListener('click', clearTranscript);
  
  // Navigation links
  const dashboardLink = document.getElementById('dashboard-link');
  const settingsLink = document.getElementById('settings-link');
  
  if (dashboardLink) dashboardLink.addEventListener('click', openDashboard);
  if (settingsLink) settingsLink.addEventListener('click', openSettings);
  
  // Debug button (temporary)
  const debugBtn = document.getElementById('debug-tabcapture');
  if (debugBtn) debugBtn.addEventListener('click', debugTabCapture);
  
  if (dismissError) {
    dismissError.addEventListener('click', hideError);
  }
  
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExtensionOptions();
    });
  }
  
  if (libraryLink) {
    libraryLink.addEventListener('click', (e) => {
      e.preventDefault();
      openLibrary();
    });
  }
  
  if (helpLink) {
    helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      openHelp();
    });
  }
}

// Setup periodic updates
function setupPeriodicUpdates() {
  // Listen for background messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    
    switch (message.type) {
      case 'RECORDING_STARTED':
        isRecording = true;
        audioConfig = message.audioConfig;
        updateRecordingUI();
        startRecordingTimer();
        updateAudioQualityDisplay();
        break;
        
      case 'RECORDING_STOPPED':
        isRecording = false;
        recordingSession = null;
        updateRecordingUI();
        stopRecordingTimer();
        
        if (message.transcript) {
          currentTranscript = message.transcript;
          updateTranscriptPreview();
        }
        break;
        
      case 'TRANSCRIPT_UPDATE':
        if (message.transcript) {
          currentTranscript = message.transcript;
          updateTranscriptPreview();
        }
        break;
        
      case 'NOTES_READY':
        showNotification('AI notes generated and saved to your library!', 'success');
        updateConnectionStatus('connected');
        
        // Show link to view notes
        if (message.url) {
          const viewNotesBtn = document.getElementById('view-notes-btn');
          if (viewNotesBtn) {
            viewNotesBtn.style.display = 'inline-flex';
            viewNotesBtn.onclick = () => chrome.tabs.create({ url: message.url });
          }
        }
        break;
        
      case 'TRANSCRIPTION_ERROR':
        showNotification(`Transcription error: ${message.error}`, 'error');
        updateConnectionStatus('error');
        break;
        
      case 'AUTH_ERROR':
        showNotification(message.error, 'error');
        updateAuthUI(false);
        break;
        
      case 'CONNECTION_ESTABLISHED':
        updateConnectionStatus('connected');
        break;
      
      case 'AUTH_STATUS_CHANGED':
        // Handle authentication status changes from background
        authToken = message.authenticated ? 'authenticated' : null;
        updateAuthUI(message.authenticated);
        updateRecordingUI();
        
        if (message.authenticated) {
          showNotification('Successfully signed in to EdNoteAI!', 'success');
        } else {
          showNotification('Signed out from EdNoteAI', 'info');
        }
        break;
        authToken = message.authenticated ? 'authenticated' : null;
        updateAuthUI(message.authenticated);
        updateRecordingUI();
        
        if (message.authenticated) {
          showNotification('Successfully signed in to EdNoteAI!', 'success');
        } else {
          showNotification('Signed out from EdNoteAI', 'info');
        }
        break;
    }
    
    sendResponse({ received: true });
  });
  
  // Periodic status checks
  setInterval(async () => {
    if (isRecording && currentTab) {
      await checkRecordingStatus();
    }
  }, 5000); // Check every 5 seconds
}

// Start recording
async function startRecording() {
  if (!currentTab) {
    showNotification('Could not get current tab information', 'error');
    return;
  }
  
  if (!authToken) {
    showNotification('Please sign in first', 'error');
    document.getElementById('auth-section')?.scrollIntoView();
    return;
  }
  
  try {
    updateRecordingUI({ loading: true });
    
    // Check extension capabilities first
    const capabilities = await sendMessageToBackground({ type: 'CHECK_CAPABILITIES' });
    
    if (!capabilities.tabCapture) {
      throw new Error('Tab capture API is not available in this browser. Please ensure you\'re using Chrome or another Chromium-based browser.');
    }
    
    if (!capabilities.permissions) {
      throw new Error('Missing required permissions. Please reload the extension or reinstall it.');
    }
    
    if (capabilities.error) {
      throw new Error(`Extension error: ${capabilities.error}`);
    }
    
    const result = await sendMessageToBackground({
      type: 'START_RECORDING',
      tabId: currentTab.id
    });
    
    if (result.success) {
      isRecording = true;
      audioConfig = result.audioConfig;
      recordingSession = {
        tabId: currentTab.id,
        startTime: Date.now(),
        audioConfig: result.audioConfig
      };
      
      updateRecordingUI();
      startRecordingTimer();
      updateAudioQualityDisplay();
      updateConnectionStatus('connected');
      
      showNotification('Recording started successfully!', 'success');
    } else {
      // Handle specific error scenarios with actions
      if (result.action === 'reload_extension') {
        showErrorWithAction(
          result.error,
          'Reload Extension',
          () => {
            chrome.runtime.reload();
          },
          result.guidance || 'The extension needs to be reloaded to function properly.'
        );
      } else if (result.action === 'check_browser') {
        showErrorWithAction(
          result.error,
          'Open Chrome Extensions',
          () => {
            chrome.tabs.create({ url: 'chrome://extensions/' });
          },
          result.guidance || 'Please check your browser compatibility and extension permissions.'
        );
      } else {
        throw new Error(result.error || 'Failed to start recording');
      }
    }
    
  } catch (error) {
    console.error('Error starting recording:', error);
    showNotification(`Error: ${error.message}`, 'error');
    updateRecordingUI();
  }
}

// Stop recording
async function stopRecording() {
  if (!currentTab) {
    showNotification('Could not get current tab information', 'error');
    return;
  }
  
  try {
    updateRecordingUI({ loading: true });
    
    const result = await sendMessageToBackground({
      type: 'STOP_RECORDING',
      tabId: currentTab.id
    });
    
    if (result.success) {
      isRecording = false;
      recordingSession = null;
      
      updateRecordingUI();
      stopRecordingTimer();
      
      if (result.session) {
        const duration = Math.round((result.session.endTime - result.session.startTime) / 1000);
        showNotification(`Recording completed! Duration: ${duration}s`, 'success');
      }
      
    } else {
      throw new Error(result.error || 'Failed to stop recording');
    }
    
  } catch (error) {
    console.error('Error stopping recording:', error);
    showNotification(`Error: ${error.message}`, 'error');
    updateRecordingUI();
  }
}

// Update recording UI
function updateRecordingUI(options = {}) {
  const startBtn = document.getElementById('start-recording');
  const stopBtn = document.getElementById('stop-recording');
  const statusText = document.getElementById('recording-status');
  const statusDot = document.getElementById('recording-dot');
  const timerDisplay = document.getElementById('recording-timer');
  
  if (options.loading) {
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = 'Starting...';
    }
    if (stopBtn) {
      stopBtn.disabled = true;
      stopBtn.textContent = 'Stopping...';
    }
    return;
  }
  
  if (isRecording) {
    // Recording state
    if (startBtn) {
      startBtn.style.display = 'none';
      startBtn.disabled = false;
      startBtn.textContent = 'Start Recording';
    }
    if (stopBtn) {
      stopBtn.style.display = 'inline-flex';
      stopBtn.disabled = false;
      stopBtn.textContent = 'Stop Recording';
    }
    if (statusText) statusText.textContent = 'Recording in progress...';
    if (statusDot) statusDot.className = 'status-dot recording';
    if (timerDisplay) timerDisplay.style.display = 'block';
    
    // Enable transcript section
    const transcriptSection = document.getElementById('transcript-section');
    if (transcriptSection) transcriptSection.style.display = 'block';
    
  } else {
    // Not recording state
    if (startBtn) {
      startBtn.style.display = 'inline-flex';
      startBtn.disabled = !authToken;
      startBtn.textContent = authToken ? 'Start Recording' : 'Sign in to Record';
    }
    if (stopBtn) {
      stopBtn.style.display = 'none';
      stopBtn.disabled = false;
      stopBtn.textContent = 'Stop Recording';
    }
    if (statusText) statusText.textContent = authToken ? 'Ready to record' : 'Sign in required';
    if (statusDot) statusDot.className = 'status-dot ready';
    if (timerDisplay) timerDisplay.style.display = 'none';
    
    // Hide transcript section if no content
    if (!currentTranscript) {
      const transcriptSection = document.getElementById('transcript-section');
      if (transcriptSection) transcriptSection.style.display = 'none';
    }
    
    // Hide view notes button
    const viewNotesBtn = document.getElementById('view-notes-btn');
    if (viewNotesBtn) viewNotesBtn.style.display = 'none';
  }
}

// Update authentication UI
function updateAuthUI(isAuthenticated) {
  const authSection = document.getElementById('auth-section');
  const signInBtn = document.getElementById('sign-in-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const userInfo = document.getElementById('user-info');
  
  if (isAuthenticated) {
    if (authSection) authSection.classList.add('authenticated');
    if (signInBtn) signInBtn.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'inline-flex';
    if (userInfo) {
      userInfo.style.display = 'block';
      userInfo.textContent = 'Connected to EdNoteAI';
    }
  } else {
    if (authSection) authSection.classList.remove('authenticated');
    if (signInBtn) signInBtn.style.display = 'inline-flex';
    if (signOutBtn) signOutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
  }
  
  // Update recording UI based on auth status
  updateRecordingUI();
}

// Update page information
function updatePageInfo() {
  if (!currentTab) return;
  
  const titleEl = document.getElementById('page-title');
  const urlEl = document.getElementById('page-url');
  const faviconEl = document.getElementById('page-favicon');
  const supportedEl = document.getElementById('supported-indicator');
  
  if (titleEl) titleEl.textContent = currentTab.title || 'Unknown Page';
  if (urlEl) urlEl.textContent = new URL(currentTab.url).hostname;
  
  if (faviconEl && currentTab.favIconUrl) {
    faviconEl.src = currentTab.favIconUrl;
    faviconEl.style.display = 'block';
  }
  
  // Check if supported site
  const isSupported = isSupportedSite(currentTab.url);
  if (supportedEl) {
    supportedEl.textContent = isSupported ? '✓ Supported' : '⚠ Limited Support';
    supportedEl.className = isSupported ? 'supported' : 'limited';
  }
}

// Check if site is supported
function isSupportedSite(url) {
  const supportedDomains = [
    'youtube.com',
    'vimeo.com',
    'coursera.org',
    'udemy.com',
    'edx.org',
    'khanacademy.org',
    'localhost'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

// Recording timer
function startRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  
  const startTime = recordingSession?.startTime || Date.now();
  
  recordingTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('recording-timer');
    if (timerDisplay) {
      timerDisplay.textContent = timeString;
    }
  }, 1000);
}

function stopRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
}

// Audio quality management
async function updateAudioQuality(event) {
  const quality = event.target.value;
  
  try {
    await chrome.storage.sync.set({ audioQuality: quality });
    
    // If recording, inform user that change will take effect on next recording
    if (isRecording) {
      showNotification('Audio quality will change on next recording', 'info');
    } else {
      showNotification(`Audio quality set to ${quality}`, 'success');
    }
    
    // Update display
    updateAudioQualityDisplay();
    
  } catch (error) {
    console.error('Error updating audio quality:', error);
    showNotification('Failed to update audio quality', 'error');
  }
}

function updateAudioQualityDisplay() {
  const displayEl = document.getElementById('current-quality');
  
  if (displayEl && audioConfig) {
    const qualityText = `${audioConfig.sampleRate/1000}kHz, ${audioConfig.channels}ch, ${audioConfig.bitRate/1000}kbps`;
    displayEl.textContent = qualityText;
  }
}

// Transcript management
function updateTranscriptPreview() {
  const previewEl = document.getElementById('transcript-preview');
  const transcriptSection = document.getElementById('transcript-section');
  
  if (currentTranscript) {
    if (previewEl) {
      previewEl.textContent = currentTranscript;
      previewEl.scrollTop = previewEl.scrollHeight; // Auto-scroll to bottom
    }
    if (transcriptSection) transcriptSection.style.display = 'block';
  } else {
    if (previewEl) previewEl.textContent = 'Transcript will appear here...';
    if (!isRecording && transcriptSection) transcriptSection.style.display = 'none';
  }
}

async function copyTranscript() {
  if (!currentTranscript) {
    showNotification('No transcript to copy', 'info');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentTranscript);
    showNotification('Transcript copied to clipboard!', 'success');
  } catch (error) {
    console.error('Error copying transcript:', error);
    showNotification('Failed to copy transcript', 'error');
  }
}

function clearTranscript() {
  currentTranscript = '';
  updateTranscriptPreview();
  showNotification('Transcript cleared', 'info');
}

// Connection management
function updateConnectionStatus(status) {
  connectionStatus = status;
  const statusEl = document.getElementById('connection-status');
  const statusDot = document.getElementById('connection-dot');
  
  if (statusEl && statusDot) {
    switch (status) {
      case 'connected':
        statusEl.textContent = 'Connected';
        statusDot.className = 'status-dot connected';
        break;
      case 'checking':
        statusEl.textContent = 'Connecting...';
        statusDot.className = 'status-dot checking';
        break;
      case 'error':
        statusEl.textContent = 'Connection Error';
        statusDot.className = 'status-dot error';
        break;
      default:
        statusEl.textContent = 'Ready';
        statusDot.className = 'status-dot disconnected';
    }
  }
}

// Authentication handlers
async function handleSignIn() {
  try {
    await sendMessageToBackground({ type: 'OPEN_LOGIN' });
    showNotification('Opening sign-in page...', 'info');
    
  } catch (error) {
    console.error('Error starting sign-in:', error);
    showNotification('Failed to open sign-in page', 'error');
  }
}

async function handleSignOut() {
  try {
    await sendMessageToBackground({ type: 'SET_AUTH_TOKEN', token: null });
    authToken = null;
    updateAuthUI(false);
    showNotification('Signed out successfully', 'success');
  } catch (error) {
    console.error('Error signing out:', error);
    showNotification('Failed to sign out', 'error');
  }
}

// Navigation handlers
function openDashboard() {
  sendMessageToBackground({ type: 'OPEN_DASHBOARD' });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Settings display
function updateSettingsDisplay(settings) {
  const autoSaveEl = document.getElementById('auto-save-status');
  const overlayEl = document.getElementById('overlay-status');
  
  if (autoSaveEl) {
    autoSaveEl.textContent = settings.autoSave ? 'Enabled' : 'Disabled';
  }
  
  if (overlayEl) {
    overlayEl.textContent = settings.showOverlay ? 'Enabled' : 'Disabled';
  }
}

// Footer link handlers
function openExtensionOptions() {
  chrome.runtime.openOptionsPage();
}

async function openLibrary() {
  try {
    const settings = await chrome.storage.sync.get(['apiEndpoint']);
    const baseUrl = settings.apiEndpoint || 'https://localhost:3000';
    
    await chrome.tabs.create({
      url: `${baseUrl}/dashboard/library`,
      active: true
    });
    
    window.close();
  } catch (error) {
    console.error('Error opening library:', error);
    showError('Failed to open library. Please try again.');
  }
}

async function openHelp() {
  try {
    await chrome.tabs.create({
      url: 'https://ednoteai.com/help/chrome-extension',
      active: true
    });
    
    window.close();
  } catch (error) {
    console.error('Error opening help:', error);
    showError('Failed to open help page. Please try again.');
  }
}

// Send messages to background script
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Error handling
function showError(message) {
  if (errorText) {
    errorText.textContent = message;
  }
  if (errorMessage) {
    errorMessage.style.display = 'flex';
  }
}

function hideError() {
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

function showErrorWithAction(message, actionText, actionCallback, guidance = null) {
  // Create error modal or use enhanced error display
  const errorHTML = `
    <div style="background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 16px; margin: 8px 0; color: #c33;">
      <div style="font-weight: bold; margin-bottom: 8px;">⚠️ ${message}</div>
      ${guidance ? `<div style="font-size: 0.9em; margin-bottom: 12px; color: #666;">${guidance}</div>` : ''}
      <div style="display: flex; gap: 8px;">
        <button id="error-action-btn" style="background: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          ${actionText}
        </button>
        <button id="error-dismiss-btn" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Dismiss
        </button>
      </div>
    </div>
  `;
  
  // Find or create error container
  let container = document.getElementById('error-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'error-container';
    container.style.position = 'relative';
    container.style.margin = '8px 0';
    document.querySelector('.popup-container')?.prepend(container) || document.body.prepend(container);
  }
  
  container.innerHTML = errorHTML;
  container.style.display = 'block';
  
  // Add event listeners
  const actionBtn = document.getElementById('error-action-btn');
  const dismissBtn = document.getElementById('error-dismiss-btn');
  
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      try {
        actionCallback();
      } catch (error) {
        console.error('Error executing action:', error);
      }
      container.style.display = 'none';
    });
  }
  
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }
  
  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (container.style.display !== 'none') {
      container.style.display = 'none';
    }
  }, 30000);
}

function showNotification(message, type = 'info') {
  const notificationEl = document.getElementById('notification');
  if (notificationEl) {
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'block';
    
    setTimeout(() => {
      notificationEl.style.display = 'none';
    }, 3000);
  } else {
    console.log(`Notification [${type}]: ${message}`);
  }
}

// Debug function (temporary)
async function debugTabCapture() {
  const debugResult = document.getElementById('debug-result');
  
  try {
    debugResult.textContent = 'Testing...';
    
    const result = await sendMessageToBackground({ type: 'DEBUG_TABCAPTURE' });
    
    if (result.success) {
      debugResult.textContent = `✅ ${result.message}`;
      debugResult.style.color = 'green';
    } else {
      debugResult.textContent = `❌ ${result.message}`;
      debugResult.style.color = 'red';
      console.log('Debug details:', result);
    }
    
  } catch (error) {
    debugResult.textContent = `❌ Error: ${error.message}`;
    debugResult.style.color = 'red';
    console.error('Debug error:', error);
  }
}

console.log('EdNoteAI popup script setup complete - Phase 2 Enhanced'); 