# Sora Auto Save Extension

**Version 1.2.0** - Enhanced Policy Violation Content Support

A powerful Chrome extension that automatically saves images and prompts from Sora ChatGPT library, including support for policy violation content.

## 🆕 What's New in v1.2.0

- ✅ **Policy Violation Content Support**: Now collects prompts from policy-restricted content
- ✅ **Improved Prompt Extraction**: Enhanced algorithm for accurate prompt collection
- ✅ **Better Error Handling**: More robust error handling and logging
- ✅ **Enhanced UI**: Improved control panel with better visual feedback
- ✅ **Multi-language Support**: Korean and English interface

## 🌟 Key Features

### 📸 Comprehensive Content Collection
- **Normal Images**: Full image and prompt data collection
- **Policy Violation Content**: Prompt extraction with empty URL placeholder
- **First Content Priority**: Always collects the first available content (data-index order)

### 🔄 Smart Auto-Save System
- **15-second intervals**: Configurable auto-save timing
- **Duplicate detection**: Prevents saving identical content
- **Real-time monitoring**: Live DOM change detection

### 💾 Advanced Download Options
- **Auto-download**: Automatic file download after saving
- **JSON export**: Structured data with metadata
- **Policy content handling**: Special processing for restricted content

### 🌐 Multi-language Interface
- **Korean/English**: Full UI translation support
- **Real-time switching**: Language changes apply immediately
- **Localized logging**: Translated status messages

## 📋 Data Structure

### Normal Content
```json
{
  "id": "img_1753676353754_3",
  "url": "https://videos.openai.com/vg-assets/...",
  "alt": "Generated image",
  "width": 1536,
  "height": 1024,
  "pageUrl": "https://sora.chatgpt.com/library",
  "prompt": "Detailed prompt content here...",
  "title": "Content Title",
  "dataIndex": "3",
  "timestamp": "2025-07-28T04:19:13.754Z",
  "type": "normal"
}
```

### Policy Violation Content
```json
{
  "id": "policy_1753676353754_1",
  "url": "",
  "taskId": "task_01k1755k9nfmev5rscbmaq5wmn",
  "taskUrl": "https://sora.chatgpt.com/t/task_01k1755k9nfmev5rscbmaq5wmn",
  "alt": "Policy violation content",
  "width": 0,
  "height": 0,
  "pageUrl": "https://sora.chatgpt.com/library",
  "prompt": "Full prompt text extracted successfully...",
  "title": "Content Title",
  "dataIndex": "1",
  "timestamp": "2025-07-28T04:19:13.754Z",
  "type": "policy_violation",
  "note": "Content blocked due to policy violation"
}
```

## 🚀 Installation

1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. Navigate to `https://sora.chatgpt.com/library`
6. The control panel will appear automatically

## 💡 Usage Guide

### Control Panel Features
- **Language Selector**: Switch between Korean/English
- **Auto Save Toggle**: Enable/disable automatic saving
- **Auto Download Toggle**: Enable/disable automatic downloads
- **Manual Save Button**: Save current content immediately
- **Download Button**: Export saved data as JSON
- **Live Statistics**: Real-time count of saved content

### Automatic Operation
1. Enable "Auto Save" toggle
2. The system will check for new content every 15 seconds
3. New content is automatically saved and optionally downloaded
4. Policy violation content prompts are extracted and saved with empty URLs

### Manual Operation
1. Click "Manual Save" to save current content
2. Click "Download" to export all saved data
3. Files are saved with timestamps for easy organization

## 🔧 Technical Details

### Content Detection Algorithm
1. **Data-index Sorting**: Processes content in chronological order
2. **Multi-method Extraction**: Uses 3 different prompt extraction methods
3. **Smart Filtering**: Distinguishes between normal and policy violation content
4. **Fallback Systems**: Multiple backup methods for reliable data collection

### Error Handling
- Extension context validation
- Safe Chrome API usage
- Graceful degradation on failures
- Comprehensive error logging

### Performance Optimization
- Efficient DOM querying
- Minimal memory footprint
- Optimized storage operations
- Smart caching mechanisms

## 🎯 Use Cases

### Content Creators
- Archive generated content for future reference
- Maintain prompt libraries for consistent style
- Track content creation history

### Researchers
- Collect data for AI model analysis
- Study prompt-to-image relationships
- Archive policy violation patterns

### Developers
- Integrate with content management systems
- Build automated workflows
- Analyze generation patterns

## ⚠️ Important Notes

- **Policy Violation Content**: Images are not accessible, but prompts are fully extracted
- **Rate Limiting**: Built-in delays prevent server overload
- **Privacy**: All data is stored locally in your browser
- **Permissions**: Only accesses Sora ChatGPT domains

## 🛠️ Development

### File Structure 