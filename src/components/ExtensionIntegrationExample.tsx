'use client';

/**
 * ExtensionIntegrationExample - Example implementation for EdNoteAI Extension Integration
 * 
 * This file demonstrates how to integrate the EdNoteAI Chrome extension authentication
 * with your React components. Copy and adapt these patterns for your use case.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export function ExtensionIntegrationExample() {
  const { user, session } = useAuth();
  const [extensionConnected, setExtensionConnected] = useState(false);

  useEffect(() => {
    // Function to notify extension of successful authentication
    const notifyExtension = () => {
      if (user && session?.access_token) {
        // This is the key integration - send auth data to extension
        window.postMessage({
          type: 'EDNOTEAI_AUTH_SUCCESS',
          token: session.access_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0]
          }
        }, window.location.origin);

        setExtensionConnected(true);
        console.log('✅ Extension notified of authentication');
      }
    };

    // Notify extension when user becomes authenticated
    if (user && session) {
      notifyExtension();
    }

    // Handle logout
    if (!user) {
      window.postMessage({
        type: 'EDNOTEAI_AUTH_LOGOUT'
      }, window.location.origin);
      
      setExtensionConnected(false);
      console.log('✅ Extension notified of logout');
    }
  }, [user, session]);

  // Example: Listen for extension requests (optional)
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'EXTENSION_REQUEST_AUTH') {
        console.log('🔄 Extension requested authentication data');
        
        if (user && session?.access_token) {
          window.postMessage({
            type: 'EDNOTEAI_AUTH_SUCCESS',
            token: session.access_token,
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0]
            }
          }, window.location.origin);
        }
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [user, session]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
      <h3 className="font-medium mb-2">🧩 Extension Integration Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span>User Authenticated:</span>
          <span className={user ? "text-green-600" : "text-red-600"}>
            {user ? "✅ Yes" : "❌ No"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Extension Notified:</span>
          <span className={extensionConnected ? "text-green-600" : "text-gray-500"}>
            {extensionConnected ? "✅ Yes" : "⏳ Waiting"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple helper functions for extension integration
 * Use these in any component that needs to interact with the extension
 */

export const extensionUtils = {
  // Notify extension of successful authentication
  notifyLogin: (token: string, userData: any) => {
    window.postMessage({
      type: 'EDNOTEAI_AUTH_SUCCESS',
      token,
      user: userData
    }, window.location.origin);
  },

  // Notify extension of logout
  notifyLogout: () => {
    window.postMessage({
      type: 'EDNOTEAI_AUTH_LOGOUT'
    }, window.location.origin);
  },

  // Check if this page was opened from extension
  isExtensionLogin: () => {
    return typeof window !== 'undefined' && 
           new URLSearchParams(window.location.search).get('extension') === 'true';
  },

  // Show notification for extension users
  showExtensionNotification: (message: string, type: 'success' | 'error' = 'success') => {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
};

export default ExtensionIntegrationExample; 