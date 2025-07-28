# 🎨 Sora ChatGPT Auto Save Chrome Extension

A Chrome extension for automatically collecting and managing prompts and images from Sora ChatGPT library with policy violation content support.

## 📦 Version 1.2.0 (Latest)

### 🆕 New Features
- **Policy Violation Content Support**: Automatically detects and handles policy violation content
- **Empty URL Handling**: Policy violation content is saved with empty URL and proper metadata
- **Improved Prompt Extraction**: Enhanced prompt extraction from various content types
- **Data-Index Based Collection**: Collects content based on data-index order for more reliable results

## 🌟 Key Features

### 🔄 Auto Monitoring
- **Real-time Prompt Detection**: Automatically detects new prompts from Sora pages
- **Duplicate Prevention**: Prevents duplicates through similarity analysis with existing prompts
- **Auto Save**: Automatically saves prompt and image information at set intervals

### 📊 Data Management
- **data.json → auto-*.json Conversion**: Automatically converts prompt data to image generation format
- **JSON Format Support**: Standardized JSON format for data storage
- **Real-time Synchronization**: Real-time data synchronization between popup and page

### 🌐 Multi-language Support
- **Korean/English**: Complete multi-language support
- **Real-time Language Change**: Language settings applied immediately
- **Consistent UI**: All interface elements support translation

## 🔗 Two Extension Integration System

### 📋 Extension Structure

#### **First Extension (`auto-save-json-test`)**
```
🎯 Purpose: Auto collection of images/prompts from Sora ChatGPT library
📁 Structure:
├── manifest.json (Manifest V3)
├── popup.html + popup.js (Browser action popup)
├── content.js (Page script)
├── background.js (Background service worker)
└── _locales/ (Multi-language support)
```

#### **Second Extension (`chrome-extension-test`)**
```
🎯 Purpose: data.json → auto-*.json conversion and auto mode management
📁 Structure:
├── manifest.json (Manifest V3)
├── popup.html + popup.js (Browser action popup)
├── content.js (Page script + log overlay)
├── background.js (Background service worker)
├── data.json (Input data)
└── _locales/ (Multi-language support)
```

### 🔄 Integration Method

#### **A. Independent Execution**
```
🔄 Each extension runs independently:

1️⃣ auto-save-json-test:
   - Collects images/prompts from Sora pages
   - Creates/updates data.json files
   - Manages auto save timers

2️⃣ chrome-extension-test:
   - Reads data.json files
   - Creates auto-*.json files
   - Displays auto mode log overlay
```

#### **B. Data Flow**
```
📊 Data Integration Flow:

data.json (Created by first extension)
    ↓
chrome-extension-test reads it
    ↓
auto-*.json (Created by second extension)
```

### ⚙️ Operation Mechanism

#### **A. Manifest V3 Architecture**
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"  // Background service worker
  },
  "content_scripts": [
    {
      "matches": ["https://sora.chatgpt.com/*"],  // Only runs on Sora pages
      "js": ["content.js"],
      "run_at": "document_end"  // Runs after page load completion
    }
  ]
}
```

#### **B. Component Roles**

##### **1. Background Service Worker**
```javascript
// auto-save-json-test/background.js
- Manages auto save timers
- Message listener (popup ↔ content script)
- Restores saved settings
- Manages extension lifecycle

// chrome-extension-test/background.js  
- Loads data.json files
- Provides prompt data
- Message routing
- Extension state management
```

##### **2. Content Script**
```javascript
// auto-save-json-test/content.js
- Page DOM manipulation
- Image/prompt collection
- In-page control panel creation
- Real-time data monitoring

// chrome-extension-test/content.js
- Creates log overlay
- Manages auto mode
- data.json → auto-*.json conversion
- Real-time log display
```

##### **3. Popup Script**
```javascript
// Both extensions
- User interface management
- Language setting processing
- Setting save/load
- Communication with content script
```

### 🔄 Message Communication System

#### **A. Chrome Extension API Usage**
```javascript
// Popup → Content Script
chrome.tabs.sendMessage(tabId, { action: 'languageChanged', language: 'ko' });

// Content Script → Background
chrome.runtime.sendMessage({ action: 'getPromptData' });

// Background → Content Script
chrome.tabs.sendMessage(tabId, { action: 'saveData', data: collectedData });
```

#### **B. Storage API Sharing**
```javascript
// Storage shared by both extensions
chrome.storage.local.set({ language: 'ko' });
chrome.storage.local.get(['language'], (result) => {
  console.log('Language setting:', result.language);
});
```

### 🎯 Actual Operation Scenarios

#### **Scenario 1: Basic Usage**
```
1️⃣ User accesses Sora ChatGPT library page
2️⃣ Both extensions' content scripts load simultaneously
3️⃣ auto-save-json-test: Starts image/prompt collection
4️⃣ chrome-extension-test: Displays log overlay
5️⃣ User activates auto mode
6️⃣ Both extensions work independently
```

#### **Scenario 2: Data Conversion**
```
1️⃣ auto-save-json-test creates/updates data.json
2️⃣ chrome-extension-test detects data.json
3️⃣ Automatically creates auto-*.json
4️⃣ Displays conversion status in log overlay
5️⃣ Provides completed data to user
```

#### **Scenario 3: Language Change**
```
1️⃣ User changes language in popup
2️⃣ popup.js saves to chrome.storage.local
3️⃣ chrome.storage.onChanged event occurs
4️⃣ Content script detects event
5️⃣ UI text updates immediately
6️⃣ Both extensions apply same language setting
```

## 🚨 IMPORTANT NOTICE: Unsustainable Without Sponsorship!

### ⚠️ Project Sustainability Warning
**This project cannot be developed sustainably without sponsor support.** Currently only basic features are provided, and advanced feature development and maintenance absolutely require your sponsorship.

### 🎁 Sponsor-Only Benefits
- **Priority Feature Development**: Sponsor-requested features developed first
- **Beta Test Participation**: Permission to beta test new features
- **Direct Communication with Developer**: Direct feature requests and feedback
- **Early Access to Advanced Features**: Use new features before general users

### 💰 Sponsor Now (Right Now!)
**[@yoohyunseog GitHub Sponsors](https://github.com/sponsors/yoohyunseog?o=esb)**

- **Monthly Sponsorship**: Regular sponsorship for sustainable development
- **One-time Sponsorship**: One-time sponsorship of desired amount
- **Custom Amount**: Sponsor with your desired amount

---

## 📦 Installation

### 1. Load Extension
1. Go to `chrome://extensions/` in Chrome browser
2. Enable "Developer mode" in top right
3. Click "Load unpacked extension"
4. Select `chrome-extension-test` folder

### 2. Permission Check
- **Active Tab**: Access to current page
- **Storage**: Settings and data storage
- **Sora ChatGPT**: Access to `https://sora.chatgpt.com/*` domain

## 🚀 Usage

### 1. Basic Setup
1. **Activate Extension**: Click extension icon in browser toolbar
2. **Language Setting**: Select Korean/English in popup
3. **Start Auto Mode**: Click auto mode button on Sora page

### 2. Auto Monitoring Usage
```
📋 Step-by-step Process:
Step 1: Overlay Management
Step 2: Counter Update  
Step 3: Prompt Monitoring
Step 4: Auto Save
Step 5: Complete
Step 6: Image Generation
Step 7: Progress Update
```

### 3. Data Collection Process
1. **Prompt Detection**: Automatically detects new prompts from Sora pages
2. **Duplicate Check**: Similarity analysis with existing `data.json`
3. **Data Save**: Saves non-duplicate prompts to `data.json`
4. **Auto Conversion**: `data.json` → `auto-*.json` automatic conversion

## 📁 Data Format

### data.json (Input Format)
```json
{
  "prompts": [
    {
      "id": "unique_id",
      "content": "Prompt content",
      "timestamp": "2024-01-01T00:00:00Z",
      "category": "Category",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### auto-*.json (Output Format)
```json
{
  "prompts": [
    {
      "id": "auto_generated_id",
      "content": "Prompt content",
      "image_url": "https://sora.chatgpt.com/generated/image.jpg",
      "timestamp": "2024-01-01T00:00:00Z",
      "status": "generated",
      "metadata": {
        "original_id": "unique_id",
        "generation_time": "2024-01-01T00:05:00Z",
        "image_size": "1024x1024"
      }
    }
  ],
  "summary": {
    "total_prompts": 100,
    "generated_images": 95,
    "pending": 5,
    "last_updated": "2024-01-01T00:10:00Z"
  }
}
```

## 🔄 data.json → auto-*.json Conversion Process

### 1. Auto Conversion Process
```
📊 Conversion Steps:
1. Load data.json → Read prompt data
2. Image Generation Request → Call Sora API
3. Image URL Collection → Save generated image addresses
4. Create auto-*.json → Save completed data
```

### 2. Conversion Rules
- **ID Conversion**: `unique_id` → `auto_YYYYMMDD_HHMMSS_XXX`
- **Image URL Addition**: Automatically add image addresses generated by Sora
- **Metadata Extension**: Include additional info like generation time, image size
- **Status Management**: `pending` → `generated` → `completed`

### 3. Usage Scenario
```
📝 Usage Example:
1. Upload prompts to data.json
2. Extension automatically requests image generation
3. Receive prompts + image URLs in auto-*.json
4. Use completed data for AI model training or analysis
```

## ⚙️ Advanced Settings

### Monitoring Interval Adjustment
- **Default**: 1 second
- **Adjustable**: 0.5 seconds ~ 10 seconds
- **Real-time Change**: Settings applied immediately

### Duplicate Check Settings
- **Similarity Threshold**: 80% (default)
- **Check Methods**: 
  - Keyword-based similarity
  - Levenshtein distance
  - Semantic similarity

### Save Settings
- **Auto Save**: Enable/disable
- **Save Format**: JSON, CSV
- **Backup**: Auto backup feature

## 🔧 Considerations for Simultaneous Execution

### A. Conflict Prevention
```javascript
// Each extension uses unique ID
const extensionId = chrome.runtime.id;
const uniquePrefix = `extension_${extensionId}_`;

// Create unique DOM element IDs
const overlayId = `${uniquePrefix}overlay`;
const logId = `${uniquePrefix}log`;
```

### B. Resource Management
```javascript
// Memory usage monitoring
setInterval(() => {
  if (logMessages.length > 250) {
    logMessages = logMessages.slice(-200); // Remove old messages
  }
}, 5000);

// Timer cleanup
function cleanupTimers() {
  if (mainInterval) {
    clearInterval(mainInterval);
    mainInterval = null;
  }
}
```

## 📈 Performance Optimization

### Memory Usage
- **Log Limit**: Auto cleanup of 250 messages
- **Timer Management**: Auto cleanup of active timers
- **Data Caching**: Efficient data loading

### Speed Optimization
- **Async Processing**: All API calls processed asynchronously
- **Batch Processing**: Process multiple prompts simultaneously
- **Lazy Loading**: Load data only when needed

### Async Processing
```javascript
// Process all API calls asynchronously
async function processData() {
  try {
    const data = await getPromptData();
    const result = await transformData(data);
    await saveResult(result);
  } catch (error) {
    console.error('Processing error:', error);
  }
}
```

### Batch Processing
```javascript
// Process multiple tasks in batches
function batchProcess(items, batchSize = 10) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    setTimeout(() => processBatch(batch), i * 100);
  }
}
```

## 🛠️ Developer Information

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Chrome Extension**: Manifest V3
- **Data Format**: JSON
- **API**: Chrome Extension API, Sora ChatGPT API

### File Structure
```
chrome-extension-test/
├── manifest.json          # Extension settings
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── content.js            # Page script
├── background.js         # Background service
├── data.json             # Input data
├── auto-*.json           # Output data
└── _locales/             # Multi-language support
    ├── en/
    └── ko/
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Extension Not Working
- **Solution**: Check developer mode, refresh page
- **Check**: Permission settings, console error messages

#### 2. Data Not Saving
- **Solution**: Check storage permissions, disk space
- **Check**: Chrome storage status, file permissions

#### 3. Duplicate Check Not Working
- **Solution**: Check data.json file format
- **Check**: JSON syntax, data structure

#### 4. Two Extensions Conflict
- **Solution**: Check unique DOM element ID usage
- **Check**: Extension ID, namespace

### Log Check Methods
1. **Developer Tools**: F12 → Console tab
2. **Extension Logs**: Extension management page
3. **Real-time Logs**: Check in auto mode overlay

## 🔮 Future Plans

### Currently Supported Features
- ✅ **Image Collection**: Auto collection of images generated by Sora ChatGPT
- ✅ **Single Image Setting**: Process and save one image at a time
- ✅ **JSON Format Support**: Standardized JSON format for data storage
- ✅ **Real-time Monitoring**: Auto data collection on page changes

### Planned Features (Only Developable with Sponsor Support)
- [ ] **Video Upload Support**: Video file upload and processing features
- [ ] **Multi-media Format**: Image + video simultaneous processing
- [ ] **Advanced Video Editing**: Basic video editing tools
- [ ] **Cloud Sync**: Google Drive, Dropbox integration
- [ ] **Multi-format Support**: CSV, XML, YAML
- [ ] **Advanced Filtering**: Tag, category-based filtering
- [ ] **Statistics Dashboard**: Collected data analysis tools
- [ ] **API Integration**: External AI model integration

### Version History
- **v1.0.0**: Basic auto save functionality
- **v1.1.0**: Multi-language support added
- **v1.2.0**: Policy violation content support, improved prompt extraction, data-index based collection
- **v1.3.0**: Advanced duplicate check and performance optimization (planned)
- **v2.0.0**: Video upload support (planned with sponsorship)

## 📞 Support and Contact

### Bug Reports
- **GitHub Issues**: Project issue page
- **Email**: Direct contact with developer email
- **Log Attachment**: Include log files for problem resolution

### Feature Requests
- **New Features**: GitHub Discussions
- **Improvements**: Feedback form submission
- **Priority**: Community voting decision

### 🚨 Sponsorship Required for Development!
- **Video Upload Feature**: Only developable with sponsor support
- **Advanced Features**: Only implementable with sponsor contributions
- **Sustainable Development**: Risk of project discontinuation without sponsorship

#### 💰 Sponsor Now (Right Now!)
- **GitHub Sponsors**: [@yoohyunseog Sponsor](https://github.com/sponsors/yoohyunseog?o=esb)
- **Monthly Sponsorship**: Regular sponsorship for sustainable development
- **One-time Sponsorship**: One-time sponsorship of desired amount
- **Custom Amount**: Sponsor with your desired amount

## 📄 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## 🎯 Conclusion

Two Chrome extensions run **independently but integrate through data**:

1. **First extension** collects data from Sora pages to create `data.json`
2. **Second extension** reads `data.json` to convert to `auto-*.json`
3. **Chrome Extension API** enables safe and efficient communication
4. **Shared storage** synchronizes settings
5. **Independent lifecycle** ensures stable execution

This structure allows each extension to work independently while sharing necessary data to form a complete workflow!

**🎉 Start efficient AI image data collection with Sora ChatGPT Auto Save Extension!**

---

## 🚨 Final Appeal: Sponsorship Needed!

**The future of this project depends on your sponsorship.** 

Currently only basic features are provided, and video upload features and advanced features cannot be developed without sponsor support. 

**Sponsor now!** 
**[@yoohyunseog GitHub Sponsors](https://github.com/sponsors/yoohyunseog?o=esb)**

Your sponsorship makes better features and sustainable development possible! 🙏 