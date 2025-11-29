# Sagglni Plus - Smart Chrome Extension for Auto Form Filling

## 📋 Project Overview

**Sagglni Plus** is an intelligent Chrome Extension that automatically fills out online forms with your saved information. It features local AI integration for smart data transformation and field detection.

### 🎯 Key Features

- **Auto-Fill Forms**: One-click form filling with saved profiles
- **Smart Field Detection**: Automatically identifies form field types
- **Local AI Integration**: Uses Ollama/LM Studio for intelligent data transformation
- **Multiple Profiles**: Save and manage different user profiles
- **Data Privacy**: All data stored locally, never sent to external servers
- **Easy Setup**: Simple popup interface for quick access

## 🏗️ Project Structure

```
sagglni-plus/
├── src/
│   ├── popup/           # Popup UI
│   ├── content/         # Content script (runs on webpages)
│   ├── background/      # Service worker
│   ├── analyzer/        # Form analysis
│   ├── transformer/     # Data transformation + AI
│   ├── storage/         # Data persistence
│   └── utils/           # Utility functions
├── assets/
│   ├── icons/          # Extension icons
│   └── css/            # Stylesheets
├── tests/              # Test files
├── docs/               # Documentation
├── manifest.json       # Chrome extension config
├── package.json        # NPM config
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Chrome/Chromium browser
- Node.js (for development)
- Local LLM (optional, for AI features)
  - Ollama: https://ollama.ai
  - LM Studio: https://lmstudio.ai

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm build
```

## 📖 Usage

1. **Create a Profile**:
   - Click the extension icon
   - Click "New Profile"
   - Enter your information

2. **Auto-Fill a Form**:
   - Select your profile
   - Click "Auto Fill Form"
   - Watch as the form fills automatically!

3. **Enable AI (Optional)**:
   - Enable "Enable AI" in settings
   - Enter your local LLM port (default: 11434)
   - The extension will use AI to intelligently transform data

## 🤖 Local AI Integration

The extension can connect to your local LLM for intelligent data transformation:

### Setting Up Ollama

```bash
# Install Ollama
# From: https://ollama.ai

# Pull a model
ollama pull neural-chat

# Run Ollama (default port 11434)
ollama serve
```

### Setting Up LM Studio

- Download from: https://lmstudio.ai
- Load a model
- Start the local server (default port 8000)

### Batching & Performance

- The extension supports batching of low-confidence fields when calling the local LLM to reduce the number of network requests and token usage.
- Settings available in the popup/settings UI:
   - `aiBatchSize` - number of fields per LLM request (default 10)
   - `aiOnlyLowConfidence` - only analyze low-confidence fields (default true)
   - `aiLowConfidenceThreshold` - threshold for what is considered low-confidence (default 0.7)
   - `aiConcise` - request concise prompts for token-efficient responses

See `tests/benchmark.test.js` and `BENCHMARK_RESULTS.md` for example benchmark results comparing different batch sizes.

## 🔐 Privacy & Security

- ✅ All data stored locally in Chrome storage
- ✅ No external API calls for user data
- ✅ Optional local LLM connection (stays on your machine)
- ✅ No tracking or analytics
- ✅ No server-side processing

## 🧪 Testing

```bash
npm test
```

### Useful NPM scripts

```bash
# Run the benchmark test (batch vs non-batch)
npm run benchmark

# Run LM Studio E2E tests using local LM Studio on default port
npm run test:lm

# Run the whole test suite with coverage
npm run test:all

# Run Jest watch mode
npm run test:watch
```

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Mohammed Al-Qahtani

---

**Made with ❤️ for productivity and privacy**
