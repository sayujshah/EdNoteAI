// EdNoteAI Chrome Extension - Authentication Bridge
// Handles communication between EdNoteAI website and extension after login

console.log('EdNoteAI Auth Bridge loaded on:', window.location.href);

// Listen for authentication events from the website
function initAuthBridge() {
  // Listen for postMessage events from the website
  window.addEventListener('message', (event) => {
    // Only accept messages from EdNoteAI domains
    const allowedOrigins = [
      'https://ednoteai.com',
      'https://www.ednoteai.com',
      'http://localhost:3000'
    ];
    
    if (!allowedOrigins.includes(event.origin)) {
      return;
    }
    
    console.log('Auth bridge received message:', event.data);
    
    if (event.data.type === 'EDNOTEAI_AUTH_SUCCESS' && event.data.token) {
      handleAuthSuccess(event.data);
    } else if (event.data.type === 'EDNOTEAI_AUTH_LOGOUT') {
      handleAuthLogout();
    }
  });
  
  // Check if we're on a page with extension=true parameter (login callback)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('extension') === 'true') {
    handleExtensionCallback();
  }
  
  // Check for existing authentication on EdNoteAI pages
  checkExistingAuth();
}

// Handle successful authentication
async function handleAuthSuccess(authData) {
  try {
    console.log('Handling auth success:', authData);
    
    // Send auth token to extension background script
    chrome.runtime.sendMessage({
      type: 'SET_AUTH_TOKEN',
      token: authData.token,
      user: authData.user || null
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending auth to extension:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Auth token sent to extension:', response);
      
      // Show success notification
      showAuthNotification('Successfully connected to EdNoteAI Extension!', 'success');
      
      // If this is a login callback, close the tab after a delay
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('extension') === 'true') {
        setTimeout(() => {
          // Send message to background to close this tab and refresh popup
          chrome.runtime.sendMessage({
            type: 'AUTH_COMPLETE',
            closeTab: true
          });
        }, 2000);
      }
    });
    
  } catch (error) {
    console.error('Error handling auth success:', error);
    showAuthNotification('Error connecting to extension', 'error');
  }
}

// Handle logout
async function handleAuthLogout() {
  try {
    console.log('Handling auth logout');
    
    chrome.runtime.sendMessage({
      type: 'SET_AUTH_TOKEN',
      token: null
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing auth from extension:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Auth cleared from extension');
      showAuthNotification('Disconnected from EdNoteAI Extension', 'info');
    });
    
  } catch (error) {
    console.error('Error handling auth logout:', error);
  }
}

// Handle extension callback (when redirected from extension login)
function handleExtensionCallback() {
  console.log('Handling extension callback');
  
  // Add visual indicator that this is for the extension
  addExtensionIndicator();
  
  // Check for existing session/token
  setTimeout(() => {
    checkExistingAuth();
  }, 1000);
}

// Check for existing authentication on the page
function checkExistingAuth() {
  // Look for authentication indicators in the page
  // This will depend on how your EdNoteAI website exposes auth state
  
  // Method 1: Check for user data in window object
  if (window.user || window.authToken) {
    const authData = {
      token: window.authToken || window.user?.token,
      user: window.user
    };
    
    if (authData.token) {
      handleAuthSuccess(authData);
      return;
    }
  }
  
  // Method 2: Check for authentication cookies/localStorage
  const token = localStorage.getItem('authToken') || 
                localStorage.getItem('token') || 
                localStorage.getItem('accessToken');
  
  if (token) {
    handleAuthSuccess({ token });
    return;
  }
  
  // Method 3: Look for user data in DOM
  const userDataElement = document.querySelector('[data-user-token]');
  if (userDataElement) {
    const token = userDataElement.getAttribute('data-user-token');
    if (token) {
      handleAuthSuccess({ token });
      return;
    }
  }
  
  // Method 4: Check if user is logged in by looking for logout button or user menu
  const logoutButton = document.querySelector('[href*="logout"], [onclick*="logout"], .logout-btn');
  const userMenu = document.querySelector('.user-menu, .user-dropdown, [data-user-menu]');
  
  if (logoutButton || userMenu) {
    // User appears to be logged in, but we need the token
    console.log('User appears to be logged in, requesting token from page');
    requestTokenFromPage();
  }
}

// Request token from the page (if your website can provide it)
function requestTokenFromPage() {
  // Send a request to the parent window/page to provide the auth token
  window.postMessage({
    type: 'EXTENSION_REQUEST_AUTH',
    source: 'ednoteai-extension'
  }, window.location.origin);
}

// Add visual indicator for extension users
function addExtensionIndicator() {
  // Create a subtle notification that this login is for the extension
  const indicator = document.createElement('div');
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      max-width: 300px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; animation: pulse 2s infinite;"></div>
        <span><strong>EdNoteAI Extension</strong></span>
      </div>
      <div style="margin-top: 4px; opacity: 0.9; font-size: 12px;">
        Sign in to connect your extension
      </div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;
  
  document.body.appendChild(indicator);
  
  // Remove after 10 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }, 10000);
}

// Show authentication notification
function showAuthNotification(message, type = 'success') {
  const notification = document.createElement('div');
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };
  
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    ">
      ${message}
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthBridge);
} else {
  initAuthBridge();
}

console.log('EdNoteAI Auth Bridge initialized'); 