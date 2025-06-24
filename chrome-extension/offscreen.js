// Offscreen document for handling getUserMedia calls
console.log('EdNoteAI Offscreen document loaded');

// Global state for active captures
let activeCaptureStreams = new Map();
let activeAudioProcessors = new Map();

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Offscreen received message:', message);
  
  if (message.type === 'START_TAB_CAPTURE') {
    startTabCapture(message.streamId, message.tabId)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Tab capture failed in offscreen:', error);
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'STOP_TAB_CAPTURE') {
    stopTabCapture(message.tabId);
    sendResponse({ success: true });
    return false;
  }
});

async function startTabCapture(streamId, tabId) {
  console.log('Starting tab capture in offscreen:', { streamId, tabId });
  
  // Check if we already have an active capture for this tab
  if (activeCaptureStreams.has(tabId) || activeAudioProcessors.has(tabId)) {
    console.log('Tab already has active capture, stopping it first');
    stopTabCapture(tabId);
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  try {
    // Use getUserMedia with the stream ID to get the actual stream
    const constraints = {
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false // We only want audio
    };
    
    console.log('Calling getUserMedia with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Successfully got media stream in offscreen:', stream);
    
    // Store the stream
    activeCaptureStreams.set(tabId, stream);
    
    // Set up audio processing with throttling
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    let lastSentTime = 0;
    const SEND_INTERVAL = 100; // Send audio data every 100ms instead of continuously
    
    processor.onaudioprocess = (event) => {
      const now = Date.now();
      
      // Throttle audio data sending to prevent overwhelming the service worker
      if (now - lastSentTime < SEND_INTERVAL) {
        return;
      }
      
      lastSentTime = now;
      
      // Process audio data and send to service worker
      const inputBuffer = event.inputBuffer;
      const channelData = inputBuffer.getChannelData(0);
      
      // Convert to array buffer for transfer
      const audioData = new Float32Array(channelData);
      
      // Send audio data to service worker (non-blocking)
      chrome.runtime.sendMessage({
        type: 'AUDIO_DATA',
        tabId: tabId,
        audioData: Array.from(audioData),
        sampleRate: audioContext.sampleRate,
        timestamp: now
      }).catch(() => {
        // Service worker might not be listening, that's ok
      });
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    // Store the processor for cleanup
    activeAudioProcessors.set(tabId, { audioContext, source, processor });
    
    console.log('Tab capture and audio processing started successfully');
    
    return { 
      success: true, 
      message: 'Tab capture stream created and audio processing started',
    };
    
  } catch (error) {
    console.error('Error starting tab capture in offscreen:', error);
    throw error;
  }
}

function stopTabCapture(tabId) {
  console.log('Stopping tab capture for tab:', tabId);
  
  // Stop and cleanup stream
  const stream = activeCaptureStreams.get(tabId);
  if (stream) {
    console.log('Stopping media stream tracks');
    stream.getTracks().forEach(track => {
      console.log('Stopping track:', track.id, track.kind);
      track.stop();
    });
    activeCaptureStreams.delete(tabId);
  }
  
  // Stop and cleanup audio processing
  const processor = activeAudioProcessors.get(tabId);
  if (processor) {
    console.log('Disconnecting audio processing');
    try {
      processor.source.disconnect();
      processor.processor.disconnect();
      processor.audioContext.close().then(() => {
        console.log('Audio context closed successfully');
      }).catch(error => {
        console.log('Error closing audio context:', error);
      });
    } catch (error) {
      console.log('Error during audio cleanup:', error);
    }
    activeAudioProcessors.delete(tabId);
  }
  
  console.log('Tab capture stopped and cleaned up');
} 