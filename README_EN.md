# 🎨 Sora ChatGPT Auto Save Extension

Chrome extension collection for automatically collecting images and prompts from Sora ChatGPT library.

## 📦 Project Structure

### 🔄 **chrome-extension-test** - Basic Auto Save Extension
- Automatic collection of images and prompts from Sora ChatGPT library
- Auto save every 30 seconds (configurable)
- Real-time countdown display
- JSON format data download
- Simple and intuitive interface

### 🗂️ **auto-save-json-test** - Advanced Auto Save Extension
- Basic features + advanced configuration options
- More detailed data collection
- Enhanced UI/UX
- Advanced logging and error handling
- Extended settings functionality

## 🚀 Quick Start

### 1. Install Basic Extension (chrome-extension-test)
```bash
# In Chrome browser
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select chrome-extension-test folder
```

### 2. Install Advanced Extension (auto-save-json-test)
```bash
# In Chrome browser
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select auto-save-json-test folder
```

## ✨ Key Features

### 🔄 Auto Save System
- **Auto save every 30 seconds**: Configurable interval (10-3600 seconds)
- **Real-time countdown**: Display time remaining until next save
- **Duplicate prevention**: Skip already saved data
- **Real-time detection**: Automatically collect new data when page changes

### 📸 Data Collection
- **Image collection**: URL, size, alt text, metadata
- **Prompt collection**: Text, timestamp, page information
- **JSON format**: Structured data storage

### 🎯 User Interface
- **Intuitive popup**: Easy settings and control
- **Real-time status display**: Check current operation status
- **One-click download**: Instant download of collected data

## 📁 Folder Structure

```
sora-auto-image/
├── chrome-extension-test/          # Basic auto save extension
│   ├── manifest.json              # Extension configuration
│   ├── popup.html                 # Popup interface
│   ├── popup.js                   # Popup logic
│   ├── content.js                 # Page content script
│   ├── background.js              # Background script
│   └── data.json                  # Sample data
├── auto-save-json-test/            # Advanced auto save extension
│   ├── manifest.json              # Extension configuration
│   ├── popup.html                 # Advanced popup interface
│   ├── popup.js                   # Advanced popup logic
│   ├── content.js                 # Advanced content script
│   ├── background.js              # Background script
│   ├── icon_16.png               # 16x16 icon
│   ├── icon_48.png               # 48x48 icon
│   ├── icon_128.png              # 128x128 icon
│   └── README.md                 # Detailed usage guide
├── .gitignore                     # Git ignore file settings
└── README.md                      # This file (Korean)
```

## 🎯 Usage Scenarios

### Scenario 1: Simple Auto Save
1. Install **chrome-extension-test**
2. Access Sora ChatGPT library page
3. Turn on auto save
4. Automatically collect data every 30 seconds

### Scenario 2: Advanced Data Collection
1. Install **auto-save-json-test**
2. Adjust auto save interval with advanced settings
3. Detailed logging and monitoring
4. Utilize enhanced data collection features

### Scenario 3: Bulk Data Collection
1. Install advanced extension
2. Set auto save interval to 10 seconds
3. Run long-term collection
4. Download data as JSON file

## 📊 Data Format

### Image Data
```json
{
  "id": "img_1234567890_0",
  "url": "https://example.com/image.jpg",
  "alt": "Image description",
  "width": 1024,
  "height": 768,
  "timestamp": "2025-01-27T12:00:00.000Z",
  "pageUrl": "https://sora.chatgpt.com/library"
}
```

### Prompt Data
```json
{
  "id": "prompt_1234567890_0",
  "text": "Prompt text content",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "pageUrl": "https://sora.chatgpt.com/library",
  "selector": "[data-testid=\"prompt-text\"]"
}
```

## ⚙️ Configuration Options

### Auto Save Interval
- **Minimum**: 10 seconds (fast collection)
- **Default**: 30 seconds (recommended)
- **Maximum**: 3600 seconds (1 hour, slow collection)

### Extension Features

#### chrome-extension-test (Basic)
- Simple settings
- Intuitive interface
- Quick start

#### auto-save-json-test (Advanced)
- Detailed configuration options
- Advanced UI/UX
- Enhanced logging
- More customization options

## 🔧 Advanced Features

### Real-time Monitoring
- **DOM change detection**: Using MutationObserver
- **Page change detection**: Automatic response to URL changes
- **Error handling**: Automatic network error recovery

### Smart Data Collection
- **Duplicate prevention**: Automatic filtering of identical data
- **Metadata collection**: Including detailed information
- **Structured storage**: Organized in JSON format

### User Experience
- **Real-time feedback**: Immediate confirmation of operation status
- **One-click download**: Easy data export
- **Responsive design**: Support for various screen sizes

## 🐛 Troubleshooting

### Auto Save Not Working
1. **Check page URL**: `https://sora.chatgpt.com/library`
2. **Verify permissions**: Allow extension permissions
3. **Refresh page**: Press F5 to reload
4. **Reload extension**: Reload in chrome://extensions/

### Data Not Being Collected
1. **Check console logs**: F12 → Console tab
2. **Network connection**: Check internet connection status
3. **Wait for page loading**: Wait until page is fully loaded

### Countdown Not Displaying
1. **Check auto save ON**: Verify toggle switch is ON
2. **Refresh page**: Refresh page to reload content script
3. **Reload extension**: Reload the extension

## 📞 Support and Contributions

### Bug Reports
If you encounter issues, please create an issue with the following information:
- **Browser version**: Chrome version
- **Extension version**: Installed extension
- **Error message**: Console log content
- **Reproduction steps**: Problem occurrence process

### Feature Suggestions
For new features or improvements:
- **Use case**: When it's needed
- **Expected behavior**: How it should work
- **Priority**: How important it is

## 📄 License

This project is distributed under the MIT License.

## 🔄 Update History

### v2.4.0 (2025-01-27)
- ✅ Final folder structure cleanup
- ✅ Keep only extension-related files
- ✅ Clean structure by removing Python tools
- ✅ Chrome Web Store registration ready
- ✅ Main README file cleanup

### v2.3.0 (2025-01-27)
- ✅ Folder structure cleanup
- ✅ Separation of two extensions
- ✅ Remove executable files
- ✅ Add .gitignore file

### v2.2.0 (2025-01-26)
- ✅ Real-time countdown feature
- ✅ Duplicate prevention system
- ✅ JSON file validation
- ✅ Error handling improvements

### v2.1.0 (2025-01-25)
- ✅ Auto save functionality
- ✅ Image/prompt collection
- ✅ JSON download
- ✅ Basic UI implementation

---

**Developer**: yoohyunseog  
**GitHub**: https://github.com/yoohyunseog/sora-chatgpt-downloader  
**Supported Browsers**: Chrome 88+  
**Last Updated**: 2025-01-27 