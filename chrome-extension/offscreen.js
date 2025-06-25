// Offscreen document for modern Chrome tab capture
console.log('EdNoteAI Offscreen document loaded');

// Global state for active captures
let activeCaptureStreams = new Map();
let activeAudioProcessors = new Map();

// Listen for messages from the service worker following Chrome documentation pattern
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== 'offscreen') return;
  
  console.log('Offscreen received message:', message.type);
  
  if (message.type === 'start-recording') {
    try {
      const result = await startTabCapture(message.data, message.tabId);
      // Send response back to service worker
      chrome.runtime.sendMessage({
        type: 'start-recording-response',
        target: 'background',
        tabId: message.tabId,
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Tab capture failed in offscreen:', error);
      chrome.runtime.sendMessage({
        type: 'start-recording-response',
        target: 'background',
        tabId: message.tabId,
        success: false,
        error: error.message
      });
    }
  }
  
  if (message.type === 'stop-recording') {
    stopTabCapture(message.tabId);
    chrome.runtime.sendMessage({
      type: 'stop-recording-response',
      target: 'background',
      tabId: message.tabId,
      success: true
    });
  }
});

// Modern tab capture implementation following Chrome documentation
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
    // Use getUserMedia with the stream ID following Chrome documentation pattern
    const constraints = {
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false // Audio only for EdNoteAI
    };
    
    console.log('Calling getUserMedia with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Successfully got media stream in offscreen:', stream);
    
    // Store the stream
    activeCaptureStreams.set(tabId, stream);
    
    // Continue to play the captured audio to the user (as per Chrome docs)
    const output = new AudioContext();
    const source = output.createMediaStreamSource(stream);
    source.connect(output.destination);
    
    // Set up audio processing for transcription
    const processor = output.createScriptProcessor(4096, 1, 1);
    
    let lastSentTime = 0;
    const SEND_INTERVAL = 100; // Send audio data every 100ms
    
    processor.onaudioprocess = (event) => {
      const now = Date.now();
      
      // Throttle audio data sending
      if (now - lastSentTime < SEND_INTERVAL) {
        return;
      }
      
      lastSentTime = now;
      
      // Process audio data and send to service worker
      const inputBuffer = event.inputBuffer;
      const channelData = inputBuffer.getChannelData(0);
      
      // Convert to array for transfer
      const audioData = new Float32Array(channelData);
      
      // Send audio data to service worker (non-blocking)
      chrome.runtime.sendMessage({
        type: 'AUDIO_DATA',
        tabId: tabId,
        audioData: Array.from(audioData),
        sampleRate: output.sampleRate,
        timestamp: now
      }).catch(() => {
        // Service worker might not be listening, that's ok
      });
    };
    
    source.connect(processor);
    processor.connect(output.destination);
    
    // Store the processor for cleanup
    activeAudioProcessors.set(tabId, { audioContext: output, source, processor });
    
    console.log('Tab capture and audio processing started successfully');
    
    return { 
      message: 'Tab capture stream created and audio processing started',
      streamActive: true
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