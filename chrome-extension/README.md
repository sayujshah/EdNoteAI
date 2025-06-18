# 🎵 EdNoteAI Chrome Extension

**Phase 2: Real-time Audio Capture & Processing**

Transform any web content into intelligent, organized notes with live transcription and AI-powered summarization.

## 🌟 Features

- **Real-time Audio Capture**: Record audio from any tab with videos or audio content
- **Live Transcription**: See transcription happening in real-time as you record
- **AI Note Generation**: Convert transcripts into structured, formatted notes
- **Seamless Integration**: Works with YouTube, Vimeo, Coursera, and other video platforms
- **Library Sync**: Auto-save notes to your EdNoteAI library
- **Beautiful UI**: Modern, responsive interface with dark mode support

## 🚀 **New in Phase 2**

### ✨ **Real-time Features**
- **Live Audio Capture**: High-quality tab audio recording with configurable quality settings
- **Real-time Transcription**: Instant speech-to-text with live preview
- **WebSocket Streaming**: Efficient real-time communication with EdNoteAI backend
- **Audio Processing**: Advanced audio chunking and compression for optimal streaming

### 🎵 **Enhanced Audio Quality**
- **Quality Presets**: Low, Medium, High quality options with automatic configuration
- **Advanced Settings**: Custom sample rates (8kHz - 48kHz), bit rates, and chunk sizes
- **Audio Controls**: Noise suppression, echo cancellation, and channel configuration
- **Format Support**: WebM/Opus encoding for optimal compression and quality

### 📝 **Live Transcript Experience**
- **Expandable Transcript Panel**: Collapsible real-time transcript view with copy functionality
- **Auto-scrolling Display**: Smooth transcript updates with automatic scroll-to-bottom
- **Partial/Final Updates**: Instant partial results with final transcript corrections
- **Multi-language Support**: Auto-detection and manual language selection

### ⚙️ **Advanced Configuration**
- **Enhanced Settings Page**: Comprehensive options with real-time validation
- **Connection Testing**: WebSocket connection health checks and diagnostics
- **Privacy Controls**: Local processing preferences and data retention settings
- **Export/Import**: Settings backup and restoration capabilities

## 📋 **Features Overview**

### 🎯 **Core Functionality**
- **Smart Site Detection**: Automatically detects video platforms and audio content
- **One-click Recording**: Simple start/stop controls with visual feedback
- **Live Processing**: Real-time audio streaming to EdNoteAI servers
- **Intelligent Notes**: AI-powered note generation and summarization
- **Seamless Integration**: Direct save to EdNoteAI library

### 🌐 **Supported Platforms**
- **Video Platforms**: YouTube, Vimeo, Coursera, Udemy, edX, Khan Academy
- **General Audio**: Any webpage with audio/video content
- **Local Development**: localhost support for testing

### 📱 **User Interface**
- **Modern Design**: Glassmorphism effects with responsive layout
- **Dark Mode Support**: Automatic system theme detection
- **Mobile Responsive**: Optimized for all screen sizes
- **Accessibility**: ARIA compliance and keyboard navigation
- **Animations**: Smooth transitions and visual feedback

## 🚀 Installation

### Development Installation

1. **Clone/Download** this extension code
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right)
4. **Click "Load unpacked"** and select the `chrome-extension` folder
5. **Configure settings** by clicking the extension icon and going to Settings

### Production Installation
*Coming soon to Chrome Web Store*

## ⚙️ Setup

1. **Authentication**: Click the extension icon and sign in to your EdNoteAI account
2. **Permissions**: Grant tab capture permissions when prompted
3. **Ready to Go**: Visit any video site and start recording!

## 🎯 Usage

### Quick Start
1. **Visit a video site** (YouTube, Vimeo, etc.)
2. **Click the extension icon** in the toolbar
3. **Hit "Start Recording"** to begin capturing audio
4. **Watch the live transcript** appear in real-time
5. **Stop recording** when done - notes auto-save to your library

### Advanced Features
- **Overlay Controls**: Use the floating overlay on video pages for quick control
- **Quality Settings**: Adjust audio quality based on your needs
- **Auto-Save**: Toggle automatic saving to library
- **Live Preview**: View transcription as it happens

## 📁 File Structure

```
chrome-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (core logic)
├── content-script.js       # Page overlay functionality
├── content-script.css      # Overlay styling
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup logic
├── options/
│   └── options.html       # Settings page
├── icons/
│   └── README.md          # Icon requirements
└── README.md              # This file
```

## 🛠️ Technical Architecture

### Infrastructure
- **Backend**: Production EdNoteAI infrastructure at https://ednoteai.com
- **WebSocket**: Real-time audio streaming to wss://ednoteai.com
- **Authentication**: Standard EdNoteAI user authentication flow
- **Storage**: Chrome Extension Storage API for user preferences

### Audio Processing Pipeline
1. **Capture**: Chrome Tab Capture API with enhanced audio constraints
2. **Processing**: Real-time audio chunks with MediaRecorder
3. **Streaming**: WebSocket connection to EdNoteAI transcription service
4. **Display**: Live transcript updates in popup and content overlay

### Core Components

- **Background Service Worker**: Manages tab capture, authentication, and communication
- **Content Script**: Injects overlay interface into video pages
- **Popup Interface**: Main control panel accessible from toolbar
- **Options Page**: Settings and configuration management

### Key Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Tab Capture API**: Real-time audio recording from browser tabs
- **Chrome Storage**: Sync settings across devices
- **WebSockets**: Real-time communication with EdNoteAI backend
- **Modern CSS**: Responsive design with dark mode support

### Communication Flow

```
Video Page → Content Script → Background Worker → EdNoteAI API
     ↓              ↓              ↓               ↓
  Overlay UI → Popup Interface → Service Worker → WebSocket
```

## 🔧 Development

### Prerequisites
- Chrome browser
- EdNoteAI backend running (localhost:3000 or deployed)
- Basic understanding of Chrome extension development

### Local Development
1. Make changes to the extension files
2. Go to `chrome://extensions/` and click the refresh icon on your extension
3. Test functionality on video sites
4. Check console logs in the extension's inspect panel

**Note**: The extension connects to the production EdNoteAI service at https://ednoteai.com. For local backend development, you'll need to modify the `EDNOTEAI_CONFIG` in the background script.

### Debugging
- **Background Script**: Right-click extension → "Inspect popup" → Console
- **Content Script**: F12 on video page → Console
- **Popup**: Right-click extension icon → "Inspect popup"

## 🎛️ Configuration

### Settings Available
- **Audio Quality**: Low/Medium/High (affects transcription accuracy)
- **Auto-Save**: Automatically save notes to library
- **Show Overlay**: Display recording controls on video pages
- **Live Transcript**: Show real-time transcription preview
- **Privacy Controls**: Local processing and data retention preferences

### Supported Sites
- YouTube (youtube.com)
- Vimeo (vimeo.com)
- Coursera (coursera.org)
- Udemy (udemy.com)
- edX (edx.org)
- Khan Academy (khanacademy.org)
- Any site with `<video>` elements
- Local development servers

## 🔒 Permissions

The extension requires these permissions:

- **`activeTab`**: Access current tab information
- **`tabs`**: Query tab details
- **`tabCapture`**: Record audio from browser tabs
- **`