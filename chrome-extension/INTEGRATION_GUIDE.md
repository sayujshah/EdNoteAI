# EdNoteAI Chrome Extension - Website Integration Guide

This guide explains how the EdNoteAI Chrome extension integrates with the EdNoteAI website for seamless authentication and user experience.

## Overview

The integration consists of several components that work together to provide automatic authentication between the website and the Chrome extension:

1. **ExtensionAuthBridge** (React component) - Handles communication from website to extension
2. **auth-bridge.js** (Content script) - Listens for auth events on EdNoteAI pages
3. **Updated auth callbacks** - Handle extension login flows
4. **Background script** - Manages extension state and communication

## How It Works

### 1. Extension Login Flow

When a user clicks "Sign In" in the extension popup:

1. Extension opens `https://ednoteai.com/login?extension=true`
2. User signs in normally on the website
3. `ExtensionAuthBridge` component detects the authentication
4. Website sends auth token to extension via `postMessage`
5. Extension stores the token and updates UI
6. Login tab closes automatically

### 2. Authentication Detection

The integration supports multiple ways to detect authentication:

- **Real-time detection**: `ExtensionAuthBridge` monitors auth state changes
- **URL parameters**: Extension login includes `?extension=true` parameter
- **PostMessage events**: Website actively notifies extension of auth changes
- **Automatic token sharing**: Authenticated users automatically share tokens with extension

### 3. Visual Indicators

When users access the website from the extension:

- Extension indicator shows during login process
- Success notifications appear when authentication is complete
- Error handling with user-friendly messages

## Implementation Details

### Website Components

#### ExtensionAuthBridge Component

Located: `src/components/ExtensionAuthBridge.tsx`

This React component:
- Monitors authentication state using `useAuth()` hook
- Automatically sends auth tokens to extension when user is authenticated
- Handles extension login indicators and notifications
- Listens for extension requests for authentication data

Key features:
- Detects `?extension=true` parameter for extension-initiated logins
- Sends `EDNOTEAI_AUTH_SUCCESS` messages with Supabase access tokens
- Handles logout events with `EDNOTEAI_AUTH_LOGOUT` messages
- Shows visual indicators for extension users

#### Updated Auth Callbacks

**Files Modified:**
- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/app/login/callback/route.ts` - Login callback handler
- `src/app/login/page.tsx` - Login page with extension support

**Changes:**
- Preserve `extension=true` parameter through auth flows
- Redirect to appropriate pages based on auth source
- Show success messages for extension authentications

### Extension Components

#### auth-bridge.js Content Script

This content script runs on all EdNoteAI pages and:
- Listens for `postMessage` events from the website
- Handles `EDNOTEAI_AUTH_SUCCESS` and `EDNOTEAI_AUTH_LOGOUT` events
- Shows extension indicators on login pages
- Automatically closes tabs after successful extension authentication

#### Background Script Integration

The background script (`background.js`):
- Manages authentication tokens received from website
- Broadcasts auth state changes to popup and content scripts
- Handles tab management for extension login flows

## Testing the Integration

### 1. Manual Testing

1. Install the Chrome extension
2. Open extension popup and click "Sign In"
3. Complete login on the website
4. Verify extension shows authenticated state
5. Test recording functionality

### 2. Using the Test Page

Visit `/extension-test` on your EdNoteAI website to:
- Check current authentication status
- Test extension communication manually
- Debug integration issues
- View console logs for troubleshooting

### 3. Console Debugging

Open browser DevTools and look for these console messages:

```
✅ Notified extension of successful authentication
🔄 Extension requested auth token
✅ Notified extension of logout
EdNoteAI Auth Bridge loaded on: [URL]
```

## Configuration

### Environment Variables

Ensure these are properly set in your environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Manifest Configuration

The extension's `manifest.json` includes:

```json
{
  "content_scripts": [
    {
      "matches": ["*://*.ednoteai.com/*", "http://localhost:3000/*"],
      "js": ["auth-bridge.js"],
      "run_at": "document_start"
    }
  ],
  "host_permissions": [
    "https://*.ednoteai.com/*",
    "http://localhost:3000/*"
  ]
}
```

## Security Considerations

### Token Handling

- Only Supabase access tokens are shared (not refresh tokens)
- Tokens are transmitted via secure `postMessage` with origin validation
- Extension validates message origins before processing
- Tokens are stored securely in Chrome's extension storage

### Origin Validation

All communication uses origin validation:

```javascript
const allowedOrigins = [
  'https://ednoteai.com',
  'https://www.ednoteai.com',
  'http://localhost:3000'
];

if (!allowedOrigins.includes(event.origin)) {
  return; // Reject message
}
```

## Troubleshooting

### Common Issues

1. **Extension doesn't detect login**
   - Check browser console for auth bridge messages
   - Verify extension is properly installed
   - Ensure `?extension=true` parameter is present

2. **Authentication fails**
   - Check Supabase configuration
   - Verify auth callbacks are working
   - Test normal website login first

3. **Token not received**
   - Check content script permissions
   - Verify message origin validation
   - Look for JavaScript errors in console

### Debug Steps

1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter for "EdNoteAI" or "Extension" messages
4. Check for error messages in red
5. Verify network requests are successful

### Extension Debug

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Inspect views: background page" for background script debugging
4. Check "Errors" tab for extension-specific issues

## Message Protocol

### Website → Extension

#### Authentication Success
```javascript
window.postMessage({
  type: 'EDNOTEAI_AUTH_SUCCESS',
  token: 'supabase_access_token',
  user: {
    id: 'user_id',
    email: 'user@example.com',
    name: 'User Name'
  }
}, window.location.origin);
```

#### Logout
```javascript
window.postMessage({
  type: 'EDNOTEAI_AUTH_LOGOUT'
}, window.location.origin);
```

### Extension → Website

#### Request Authentication
```javascript
window.postMessage({
  type: 'EXTENSION_REQUEST_AUTH',
  source: 'ednoteai-extension'
}, window.location.origin);
```

## File Structure

```
EdNoteAI/
├── src/
│   ├── components/
│   │   └── ExtensionAuthBridge.tsx     # Main integration component
│   ├── app/
│   │   ├── auth/callback/route.ts      # OAuth callback with extension support
│   │   ├── login/
│   │   │   ├── callback/route.ts       # Login callback with extension support
│   │   │   └── page.tsx                # Login page with extension indicators
│   │   ├── extension-test/page.tsx     # Integration testing page
│   │   └── layout.tsx                  # Root layout with ExtensionAuthBridge
│   └── contexts/
│       └── AuthContext.tsx             # Authentication context
├── chrome-extension/
│   ├── auth-bridge.js                  # Content script for auth handling
│   ├── background.js                   # Service worker with auth management
│   ├── popup/                          # Extension popup interface
│   └── manifest.json                   # Extension configuration
└── INTEGRATION_GUIDE.md               # This file
```

## Maintenance

### Updating Authentication

When updating the auth system:
1. Update `ExtensionAuthBridge.tsx` for any token format changes
2. Test extension integration with new auth flows
3. Update message protocol if token structure changes
4. Verify origin validation lists include new domains

### Adding New Domains

To support new domains:
1. Update `allowedOrigins` in `auth-bridge.js`
2. Add domains to extension `host_permissions`
3. Update content script `matches` patterns
4. Test on new domains

### Version Compatibility

Ensure backward compatibility:
- Extension should handle missing website integration gracefully
- Website should work normally without extension
- Use feature detection rather than version checks

## Support

For issues with the integration:
1. Check console logs on both website and extension
2. Verify all components are up to date
3. Test with a fresh browser profile
4. Review error logs in extension background page

The integration is designed to be robust and fail gracefully - the website and extension should work independently even if integration fails. 