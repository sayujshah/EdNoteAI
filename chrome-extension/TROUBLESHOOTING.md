# EdNoteAI Chrome Extension - Troubleshooting Guide

## Common Issues and Solutions

### 1. "TabCapture API is not available" Error

**Problem:** The extension cannot access the `chrome.tabCapture` API.

**Possible Causes & Solutions:**

#### Browser Compatibility
- **Issue:** Using an unsupported browser
- **Solution:** EdNoteAI requires Chrome, Chromium, or another Chromium-based browser (like Edge, Brave, Opera)
- **Action:** Switch to a supported browser

#### Extension Permissions
- **Issue:** Missing or revoked permissions
- **Solution:** 
  1. Go to `chrome://extensions/`
  2. Find "EdNoteAI - Live Note Generator"
  3. Ensure it's enabled
  4. Click "Details" and verify permissions are granted
  5. If needed, remove and reinstall the extension

#### Browser Version
- **Issue:** Using an outdated browser version
- **Solution:** Update your browser to the latest version
- **Action:** Go to browser settings and check for updates

---

### 2. "Extension context invalidated" Error

**Problem:** The extension's background service worker has been terminated.

**Common Causes & Solutions:**

#### Service Worker Termination
- **Issue:** Chrome automatically terminates inactive service workers
- **Solution:** Reload the extension
- **Steps:**
  1. Go to `chrome://extensions/`
  2. Find "EdNoteAI - Live Note Generator"
  3. Click the refresh/reload button (🔄)
  4. Try recording again

#### Browser Resource Management
- **Issue:** Browser terminated the extension due to memory constraints
- **Solution:** 
  1. Close unnecessary tabs and extensions
  2. Restart Chrome
  3. Reload the extension

#### Extension Update Required
- **Issue:** Extension files may be corrupted or outdated
- **Solution:** Reinstall the extension
- **Steps:**
  1. Remove the current extension
  2. Download and install the latest version
  3. Re-authenticate with EdNoteAI

---

### 3. Quick Diagnostic Steps

If you're experiencing issues, try these steps in order:

1. **Check API Availability**
   - Click the "Test API" button in the extension popup
   - This will show if TabCapture is working

2. **Reload Extension**
   ```
   chrome://extensions/ → Find EdNoteAI → Click reload button
   ```

3. **Check Browser Console**
   - Press F12 to open Developer Tools
   - Look for error messages in the Console tab

4. **Verify Permissions**
   ```
   chrome://extensions/ → EdNoteAI Details → Check permissions
   ```

5. **Restart Browser**
   - Close all Chrome windows
   - Restart Chrome
   - Try the extension again

---

### 4. Browser-Specific Solutions

#### Google Chrome
- Ensure you're using Chrome version 88 or later
- Check if Chrome is managed by your organization (may restrict extensions)

#### Microsoft Edge
- Ensure you're using the Chromium-based Edge (not Legacy Edge)
- Enable "Developer mode" in edge://extensions/ if needed

#### Brave Browser
- Disable Brave's shields for the recording site
- Ensure WebRTC is enabled in Brave settings

#### Other Chromium Browsers
- Verify the browser supports Manifest V3 extensions
- Check if tab capture permissions are available

---

### 5. Advanced Troubleshooting

#### Check Extension Logs
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "background page" or "service worker" for EdNoteAI
4. Check the console for detailed error messages

#### Reset Extension Settings
```javascript
// Run in the extension's background console:
chrome.storage.sync.clear();
chrome.storage.local.clear();
```

#### Clear Extension Data
1. Go to `chrome://settings/content/all`
2. Search for "ednoteai.com"
3. Clear all associated data
4. Re-authenticate

---

### 6. When to Contact Support

Contact EdNoteAI support if:
- Issues persist after trying all solutions
- You receive errors not covered in this guide
- The extension works on some sites but not others
- You're using a supported browser but still get API errors

**Include this information:**
- Browser name and version
- Operating system
- Exact error message
- Steps to reproduce the issue
- Screenshot of the error (if applicable)

---

### 7. Known Limitations

- **Corporate Networks:** Some organizations block tab capture functionality
- **Incognito Mode:** Extension may not work in private browsing unless explicitly enabled
- **Protected Content:** DRM-protected content cannot be captured
- **Browser Extensions:** Ad blockers or security extensions may interfere

---

## Emergency Reset

If nothing else works, perform a complete reset:

1. **Remove Extension**
   - Go to `chrome://extensions/`
   - Remove EdNoteAI extension

2. **Clear Browser Data**
   - `chrome://settings/clearBrowserData`
   - Select "Advanced" → "All time"
   - Check "Cookies", "Cached images", "Site settings"

3. **Restart Browser**
   - Close all Chrome windows
   - Restart Chrome

4. **Reinstall Extension**
   - Install EdNoteAI extension fresh
   - Re-authenticate with your account

5. **Test Basic Functionality**
   - Visit a simple video page (like YouTube)
   - Test recording a short clip

This should resolve any persistent issues with the extension. 