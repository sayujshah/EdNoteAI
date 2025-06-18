// EdNoteAI Chrome Extension - Options Script
// Phase 2: Enhanced Settings Management

console.log('EdNoteAI options script loaded');

// EdNoteAI Production Configuration
const EDNOTEAI_CONFIG = {
  baseUrl: 'https://ednoteai.com',
  wsUrl: 'wss://ednoteai.com',
  apiVersion: 'v1'
};

// Default settings
const DEFAULT_SETTINGS = {
  audioQuality: 'medium',
  autoSave: true,
  showOverlay: true,
  showNotifications: true,
  localProcessing: false,
  chunkDuration: 1,
  bufferSize: 4096,
  dataRetention: 30,
  sampleRate: 16000,
  bitRate: 128,
  channels: 1
};

// Audio quality presets
const AUDIO_PRESETS = {
  low: { sampleRate: 8000, bitRate: 64, channels: 1 },
  medium: { sampleRate: 16000, bitRate: 128, channels: 1 },
  high: { sampleRate: 44100, bitRate: 256, channels: 2 }
};

// Global state
let currentSettings = { ...DEFAULT_SETTINGS };
let isDirty = false;

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('EdNoteAI options page initializing');
  
  try {
    await loadSettings();
    populateForm();
    setupEventListeners();
    checkConnectionStatus();
    console.log('EdNoteAI options page initialized successfully');
  } catch (error) {
    console.error('Error initializing options page:', error);
    showStatus('Failed to initialize settings', 'error');
  }
});

// Load settings from storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
    currentSettings = { ...DEFAULT_SETTINGS, ...stored };
    console.log('Loaded settings:', currentSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

// Populate form with current settings
function populateForm() {
  // Audio quality presets
  populateQualityPresets();
  
  // Advanced audio settings
  const sampleRateSlider = document.getElementById('sample-rate');
  const bitRateSlider = document.getElementById('bit-rate');
  const channelsSelect = document.getElementById('channels');
  
  if (sampleRateSlider) {
    sampleRateSlider.value = currentSettings.sampleRate;
    updateRangeDisplay('sample-rate', currentSettings.sampleRate);
  }
  
  if (bitRateSlider) {
    bitRateSlider.value = currentSettings.bitRate;
    updateRangeDisplay('bit-rate', currentSettings.bitRate);
  }
  
  if (channelsSelect) {
    channelsSelect.value = currentSettings.channels;
  }
  
  // UI settings
  setCheckboxValue('show-overlay', currentSettings.showOverlay);
  setCheckboxValue('auto-save', currentSettings.autoSave);
  setCheckboxValue('show-notifications', currentSettings.showNotifications);
  
  // Processing settings
  const chunkDurationSlider = document.getElementById('chunk-duration');
  const bufferSizeSelect = document.getElementById('buffer-size');
  
  if (chunkDurationSlider) {
    chunkDurationSlider.value = currentSettings.chunkDuration;
    updateRangeDisplay('chunk-duration', currentSettings.chunkDuration);
  }
  
  if (bufferSizeSelect) {
    bufferSizeSelect.value = currentSettings.bufferSize;
  }
  
  // Privacy settings
  setCheckboxValue('local-processing', currentSettings.localProcessing);
  
  const dataRetentionSelect = document.getElementById('data-retention');
  if (dataRetentionSelect) {
    dataRetentionSelect.value = currentSettings.dataRetention;
  }
}

// Populate audio quality presets
function populateQualityPresets() {
  const presetCards = document.querySelectorAll('.preset-card');
  
  presetCards.forEach(card => {
    const quality = card.dataset.quality;
    
    if (quality === currentSettings.audioQuality) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
    
    card.addEventListener('click', () => {
      selectQualityPreset(quality);
    });
  });
}

// Select audio quality preset
function selectQualityPreset(quality) {
  const preset = AUDIO_PRESETS[quality];
  if (!preset) return;
  
  // Update UI
  document.querySelectorAll('.preset-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const selectedCard = document.querySelector(`[data-quality="${quality}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  // Update settings
  currentSettings.audioQuality = quality;
  currentSettings.sampleRate = preset.sampleRate;
  currentSettings.bitRate = preset.bitRate;
  currentSettings.channels = preset.channels;
  
  // Update advanced settings display
  const sampleRateSlider = document.getElementById('sample-rate');
  const bitRateSlider = document.getElementById('bit-rate');
  const channelsSelect = document.getElementById('channels');
  
  if (sampleRateSlider) {
    sampleRateSlider.value = preset.sampleRate;
    updateRangeDisplay('sample-rate', preset.sampleRate);
  }
  
  if (bitRateSlider) {
    bitRateSlider.value = preset.bitRate;
    updateRangeDisplay('bit-rate', preset.bitRate);
  }
  
  if (channelsSelect) {
    channelsSelect.value = preset.channels;
  }
  
  markDirty();
}

// Setup event listeners
function setupEventListeners() {
  // Advanced settings toggle
  const advancedToggle = document.getElementById('show-advanced-audio');
  const advancedSettings = document.getElementById('advanced-audio-settings');
  
  if (advancedToggle && advancedSettings) {
    advancedToggle.addEventListener('change', (e) => {
      advancedSettings.style.display = e.target.checked ? 'block' : 'none';
    });
  }
  
  // Range sliders
  setupRangeListener('sample-rate', (value) => {
    currentSettings.sampleRate = parseInt(value);
    updateQualityFromCustom();
  });
  
  setupRangeListener('bit-rate', (value) => {
    currentSettings.bitRate = parseInt(value);
    updateQualityFromCustom();
  });
  
  setupRangeListener('chunk-duration', (value) => {
    currentSettings.chunkDuration = parseFloat(value);
  });
  
  // Select elements
  setupSelectListener('channels', (value) => {
    currentSettings.channels = parseInt(value);
    updateQualityFromCustom();
  });
  
  setupSelectListener('buffer-size', (value) => {
    currentSettings.bufferSize = parseInt(value);
  });
  
  setupSelectListener('data-retention', (value) => {
    currentSettings.dataRetention = parseInt(value);
  });
  
  // Checkbox elements
  setupCheckboxListener('show-overlay', (value) => {
    currentSettings.showOverlay = value;
  });
  
  setupCheckboxListener('auto-save', (value) => {
    currentSettings.autoSave = value;
  });
  
  setupCheckboxListener('show-notifications', (value) => {
    currentSettings.showNotifications = value;
  });
  
  setupCheckboxListener('local-processing', (value) => {
    currentSettings.localProcessing = value;
  });
  
  // Action buttons
  const saveBtn = document.getElementById('save-settings');
  const resetBtn = document.getElementById('reset-defaults');
  const exportBtn = document.getElementById('export-settings');
  const importBtn = document.getElementById('import-settings');
  const testBtn = document.getElementById('test-connection');
  
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);
  if (resetBtn) resetBtn.addEventListener('click', resetToDefaults);
  if (exportBtn) exportBtn.addEventListener('click', exportSettings);
  if (importBtn) importBtn.addEventListener('click', importSettings);
  if (testBtn) testBtn.addEventListener('click', testConnection);
}

// Update quality selection when custom values change
function updateQualityFromCustom() {
  const currentAudio = {
    sampleRate: currentSettings.sampleRate,
    bitRate: currentSettings.bitRate,
    channels: currentSettings.channels
  };
  
  // Check if current settings match a preset
  let matchingPreset = null;
  for (const [quality, preset] of Object.entries(AUDIO_PRESETS)) {
    if (preset.sampleRate === currentAudio.sampleRate &&
        preset.bitRate === currentAudio.bitRate &&
        preset.channels === currentAudio.channels) {
      matchingPreset = quality;
      break;
    }
  }
  
  if (matchingPreset) {
    currentSettings.audioQuality = matchingPreset;
    populateQualityPresets();
  } else {
    currentSettings.audioQuality = 'custom';
    document.querySelectorAll('.preset-card').forEach(card => {
      card.classList.remove('selected');
    });
  }
  
  markDirty();
}

// Utility functions for form handling
function setupRangeListener(id, callback) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('input', (e) => {
      updateRangeDisplay(id, e.target.value);
      callback(e.target.value);
      markDirty();
    });
  }
}

function setupSelectListener(id, callback) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('change', (e) => {
      callback(e.target.value);
      markDirty();
    });
  }
}

function setupCheckboxListener(id, callback) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('change', (e) => {
      callback(e.target.checked);
      markDirty();
    });
  }
}

function updateRangeDisplay(id, value) {
  const display = document.getElementById(id + '-value');
  if (display) {
    display.textContent = value;
  }
}

function setCheckboxValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.checked = value;
  }
}

function markDirty() {
  isDirty = true;
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    saveBtn.textContent = 'Save Settings *';
    saveBtn.classList.add('highlight');
  }
}

// Save settings
async function saveSettings() {
  try {
    showStatus('Saving settings...', 'info');
    
    // Validate settings
    const validationResult = validateSettings(currentSettings);
    if (!validationResult.valid) {
      throw new Error(validationResult.error);
    }
    
    // Save to storage
    await chrome.storage.sync.set(currentSettings);
    
    isDirty = false;
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
      saveBtn.textContent = 'Save Settings';
      saveBtn.classList.remove('highlight');
    }
    
    showStatus('Settings saved successfully!', 'success');
    console.log('Settings saved:', currentSettings);
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus(`Failed to save settings: ${error.message}`, 'error');
  }
}

// Reset to defaults
async function resetToDefaults() {
  if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    currentSettings = { ...DEFAULT_SETTINGS };
    populateForm();
    markDirty();
    showStatus('Settings reset to defaults', 'info');
  }
}

// Export settings
function exportSettings() {
  try {
    const dataStr = JSON.stringify(currentSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'ednoteai-extension-settings.json';
    link.click();
    
    showStatus('Settings exported successfully', 'success');
    
  } catch (error) {
    console.error('Error exporting settings:', error);
    showStatus('Failed to export settings', 'error');
  }
}

// Import settings
function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // Validate imported settings
        const validationResult = validateSettings(imported);
        if (!validationResult.valid) {
          throw new Error(validationResult.error);
        }
        
        currentSettings = { ...DEFAULT_SETTINGS, ...imported };
        populateForm();
        markDirty();
        showStatus('Settings imported successfully', 'success');
        
      } catch (error) {
        console.error('Error importing settings:', error);
        showStatus(`Failed to import settings: ${error.message}`, 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// Validate settings
function validateSettings(settings) {
  // Sample rate validation
  if (settings.sampleRate < 8000 || settings.sampleRate > 48000) {
    return { valid: false, error: 'Sample rate must be between 8000 and 48000 Hz' };
  }
  
  // Bit rate validation
  if (settings.bitRate < 32 || settings.bitRate > 320) {
    return { valid: false, error: 'Bit rate must be between 32 and 320 kbps' };
  }
  
  // Channels validation
  if (![1, 2].includes(settings.channels)) {
    return { valid: false, error: 'Channels must be 1 or 2' };
  }
  
  // Chunk duration validation
  if (settings.chunkDuration < 0.5 || settings.chunkDuration > 5) {
    return { valid: false, error: 'Chunk duration must be between 0.5 and 5 seconds' };
  }
  
  // Buffer size validation
  const validBufferSizes = [1024, 2048, 4096, 8192];
  if (!validBufferSizes.includes(settings.bufferSize)) {
    return { valid: false, error: 'Invalid buffer size' };
  }
  
  return { valid: true };
}

// Connection testing
async function testConnection() {
  try {
    updateConnectionStatus('service', 'checking', 'Testing...');
    updateConnectionStatus('websocket', 'checking', 'Testing...');
    
    // Test EdNoteAI service availability
    const serviceTest = await testServiceConnection();
    updateConnectionStatus('service', serviceTest.status, serviceTest.message);
    
    // Test WebSocket connection
    const wsTest = await testWebSocketConnection();
    updateConnectionStatus('websocket', wsTest.status, wsTest.message);
    
    if (serviceTest.status === 'connected' && wsTest.status === 'connected') {
      showStatus('Connection test successful!', 'success');
    } else {
      showStatus('Connection test completed with issues', 'warning');
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
    updateConnectionStatus('service', 'error', 'Test failed');
    updateConnectionStatus('websocket', 'error', 'Test failed');
    showStatus('Connection test failed', 'error');
  }
}

async function testServiceConnection() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ status: 'error', message: 'Timeout' });
    }, 5000);
    
    fetch(`${EDNOTEAI_CONFIG.baseUrl}/api/${EDNOTEAI_CONFIG.apiVersion}/health`)
      .then(response => {
        clearTimeout(timeout);
        if (response.ok) {
          resolve({ status: 'connected', message: 'Service available' });
        } else {
          resolve({ status: 'error', message: `HTTP ${response.status}` });
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve({ status: 'error', message: 'Service unavailable' });
      });
  });
}

async function testWebSocketConnection() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ status: 'error', message: 'Connection timeout' });
    }, 5000);
    
    try {
      const wsUrl = `${EDNOTEAI_CONFIG.wsUrl}/api/${EDNOTEAI_CONFIG.apiVersion}/transcribe/stream`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ status: 'connected', message: 'WebSocket available' });
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        resolve({ status: 'error', message: 'Connection failed' });
      };
      
    } catch (error) {
      clearTimeout(timeout);
      resolve({ status: 'error', message: 'WebSocket unavailable' });
    }
  });
}

// Check connection status on page load
async function checkConnectionStatus() {
  await testConnection();
}

// Update connection status display
function updateConnectionStatus(type, status, message) {
  const statusDot = document.getElementById(`${type}-status`);
  const statusText = document.getElementById(`${type}-status-text`);
  
  if (statusDot) {
    statusDot.className = `status-dot ${status}`;
  }
  
  if (statusText) {
    statusText.textContent = message;
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('settings-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `settings-status ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  } else {
    console.log(`Status [${type}]: ${message}`);
  }
}

// Handle beforeunload to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
});

console.log('EdNoteAI options script setup complete - Phase 2 Enhanced'); 