chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCapture') {
    console.log('Received start capture request');
    chrome.tabCapture.capture({ video: true, audio: true }, (stream) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing tab:', chrome.runtime.lastError);
        sendResponse({ status: 'captureFailed', error: chrome.runtime.lastError.message });
        return;
      }
      if (!stream) {
        console.error('Tab capture returned null stream.');
        sendResponse({ status: 'captureFailed', error: 'Null stream returned' });
        return;
      }
      console.log('Tab captured:', stream);
      // TODO: Send stream data to backend for transcription
      sendResponse({ status: 'captureStarted', streamId: stream.id });
    });
  } else if (request.action === 'stopCapture') {
    console.log('Received stop capture request');
    // Placeholder for stop capture logic
    sendResponse({ status: 'captureStopped' });
  }
});

console.log('Chrome extension background script loaded.');
