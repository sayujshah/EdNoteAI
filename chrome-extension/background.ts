let activeMediaRecorder: MediaRecorder | null = null;
let activeStream: MediaStream | null = null;

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
      // Send stream data to backend for transcription
      const audioTrack = stream.getAudioTracks()[0];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' }); // Specify MIME type
      activeMediaRecorder = mediaRecorder;
      activeStream = stream;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Send audio chunk to the Next.js API route
          // Use videoId and userId from the message request
          const apiBaseUrl = 'http://localhost:3000'; // TODO: Make this dynamic based on environment (local/production)
          const apiUrl = `${apiBaseUrl}/api/transcribe?videoId=${request.videoId}&userId=${request.userId}`;

          fetch(apiUrl, {
            method: 'POST',
            body: event.data,
          })
          .then(response => {
            if (!response.ok) {
              console.error('Error sending audio chunk:', response.statusText);
            } else {
              console.log('Audio chunk sent successfully.');
            }
          })
          .catch(error => {
            console.error('Error sending audio chunk:', error);
          });
        }
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped.');
        // Clean up the stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(5000); // Start recording in 5-second chunks (adjust as needed)
      console.log('MediaRecorder started.');

      // Store the MediaRecorder and stream to stop them later
      // TODO: Need a way to store and access mediaRecorder and stream to stop them on 'stopCapture'
      // Maybe store in a global variable or use chrome.storage

      sendResponse({ status: 'captureStarted', streamId: stream.id });
    });
  } else if (request.action === 'stopCapture') {
    console.log('Received stop capture request');
    if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
      activeMediaRecorder.stop();
    }
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
    }
    sendResponse({ status: 'captureStopped' });
  }
});

console.log('Chrome extension background script loaded.');
