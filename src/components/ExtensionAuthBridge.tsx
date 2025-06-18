'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * ExtensionAuthBridge - Handles communication between EdNoteAI website and Chrome extension
 * This component automatically detects when users are authenticated and notifies the extension
 */
export default function ExtensionAuthBridge() {
  const { user, session, loading } = useAuth();

  // Check if this page was opened from the extension
  const isExtensionLogin = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('extension') === 'true';

  useEffect(() => {
    // Only proceed if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Function to notify extension of successful authentication
    const notifyExtensionAuth = async (accessToken: string, userData: any) => {
      try {
        // Send authentication data to extension via postMessage
        window.postMessage({
          type: 'EDNOTEAI_AUTH_SUCCESS',
          token: accessToken,
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.user_metadata?.full_name || userData.email?.split('@')[0]
          }
        }, window.location.origin);

        console.log('✅ Notified extension of successful authentication');

        // Show success notification if this was an extension login
        if (isExtensionLogin) {
          showExtensionNotification('Successfully connected to EdNoteAI Extension! 🎉', 'success');
        }
      } catch (error) {
        console.error('❌ Error notifying extension:', error);
        if (isExtensionLogin) {
          showExtensionNotification('Error connecting to extension', 'error');
        }
      }
    };

    // Function to notify extension of logout
    const notifyExtensionLogout = () => {
      try {
        window.postMessage({
          type: 'EDNOTEAI_AUTH_LOGOUT'
        }, window.location.origin);

        console.log('✅ Notified extension of logout');
      } catch (error) {
        console.error('❌ Error notifying extension of logout:', error);
      }
    };

    // Handle authentication state changes
    const handleAuthStateChange = async () => {
      if (loading) return; // Don't process while loading

      if (user && session?.access_token) {
        // User is authenticated - notify extension
        await notifyExtensionAuth(session.access_token, user);
      } else {
        // User is not authenticated - notify extension of logout
        notifyExtensionLogout();
      }
    };

    // Listen for extension requests for auth token
    const handleExtensionMessage = async (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'EXTENSION_REQUEST_AUTH' && 
          event.data.source === 'ednoteai-extension') {
        
        console.log('🔄 Extension requested auth token');
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.access_token && currentSession.user) {
          await notifyExtensionAuth(currentSession.access_token, currentSession.user);
        } else {
          console.log('ℹ️ No active session to share with extension');
        }
      }
    };

    // Set up message listener
    window.addEventListener('message', handleExtensionMessage);

    // Handle current auth state
    handleAuthStateChange();

    // Cleanup
    return () => {
      window.removeEventListener('message', handleExtensionMessage);
    };
  }, [user, session, loading, isExtensionLogin]);

  // Show extension indicator if this is an extension login
  useEffect(() => {
    if (isExtensionLogin && !loading) {
      showExtensionIndicator();
    }
  }, [isExtensionLogin, loading]);

  return null; // This component doesn't render anything
}

/**
 * Show a visual indicator that this login is for the Chrome extension
 */
function showExtensionIndicator() {
  // Check if indicator already exists
  if (document.getElementById('extension-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'extension-indicator';
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 320px;
      animation: slideInFromRight 0.4s ease-out;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 10px; 
          height: 10px; 
          background: #4ade80; 
          border-radius: 50%; 
          animation: pulse 2s infinite;
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
        "></div>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">
            🧩 EdNoteAI Extension
          </div>
          <div style="opacity: 0.9; font-size: 12px;">
            Sign in to connect your browser extension
          </div>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideInFromRight {
        from { 
          transform: translateX(100%); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0); 
          opacity: 1; 
        }
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
        }
      }
    </style>
  `;

  document.body.appendChild(indicator);

  // Remove after 12 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.style.animation = 'slideInFromRight 0.4s ease-out reverse';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 400);
    }
  }, 12000);
}

/**
 * Show notification for extension-related events
 */
function showExtensionNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const notification = document.createElement('div');
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 320px;
      animation: slideInFromRight 0.4s ease-out;
      display: flex;
      align-items: center;
      gap: 12px;
    ">
      <span style="font-size: 16px;">${icons[type]}</span>
      <span style="font-weight: 500;">${message}</span>
    </div>
    <style>
      @keyframes slideInFromRight {
        from { 
          transform: translateX(100%); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0); 
          opacity: 1; 
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideInFromRight 0.4s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    }
  }, 4000);
} 