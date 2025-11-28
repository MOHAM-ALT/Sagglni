# 🔧 TECHNICAL SPECIFICATION - SAGGLNI PLUS

> **Version**: 1.0  
> **Last Updated**: 2025-11-28  
> **Scope**: Complete technical architecture and implementation details

---

## 📋 TABLE OF CONTENTS

1. [System Architecture](#system-architecture)
2. [Component Overview](#component-overview)
3. [Data Structures](#data-structures)
4. [Extension Flow](#extension-flow)
5. [Form Analysis Algorithm](#form-analysis-algorithm)
6. [Data Transformation Logic](#data-transformation-logic)
7. [Storage & Database](#storage--database)
8. [API & Communication](#api--communication)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  SAGGLNI PLUS EXTENSION                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              POPUP UI (popup.html/js)               │   │
│  │  - Profile Selection                               │   │
│  │  - Auto-Fill Buttons                               │   │
│  │  - Settings & Configuration                        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         BACKGROUND SERVICE WORKER (bg.js)           │   │
│  │  - Message Routing                                 │   │
│  │  - Profile Management                              │   │
│  │  - Settings Management                             │   │
│  │  - Storage Orchestration                           │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│         ┌─────────────┼─────────────┐                        │
│         ↓             ↓             ↓                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ CONTENT    │ │ ANALYZER   │ │ TRANSFORMER│              │
│  │ SCRIPT     │ │ (analyzer) │ │ (AI Layer) │              │
│  │(content.js)│ │            │ │            │              │
│  │            │ │ - Detect   │ │ - Format   │              │
│  │ - Inject   │ │   Fields   │ │   Conversion
│  │   Data     │ │ - Classify │ │ - AI Call  │              │
│  │ - Trigger  │ │   Types    │ │ - Rules    │              │
│  │   Analysis │ │ - Extract  │ │ - Fallback │              │
│  │            │ │   Format   │ │            │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│         │             │             │                       │
│         └─────────────┼─────────────┘                       │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      STORAGE MANAGER (storage-manager.js)            │   │
│  │  - chrome.storage.local                             │   │
│  │  - Profile CRUD                                     │   │
│  │  - History Tracking                                 │   │
│  │  - Settings Persistence                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              LOCAL AI CONNECTOR                      │   │
│  │  - Ollama: http://localhost:11434                   │   │
│  │  - LM Studio: http://localhost:8000                 │   │
│  │  - Auto-detect + Manual config                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 COMPONENT OVERVIEW

### 1. POPUP UI (`src/popup/popup.html` + `src/popup/popup.js`)

**Responsibility**: User interface for quick access and control

**Features**:
```javascript
┌─────────────────────────────────────┐
│     SAGGLNI PLUS DASHBOARD          │
├─────────────────────────────────────┤
│                                     │
│  👤 Profile Selection               │
│  ┌──────────────────────────────┐  │
│  │ Select Profile...     ▼      │  │
│  │ • My Career Profile          │  │
│  │ • Job Applications           │  │
│  └──────────────────────────────┘  │
│                                     │
│  🚀 Quick Actions                   │
│  ┌────────────┬──────────────────┐  │
│  │ Auto-Fill  │ Analyze Form     │  │
│  │ This Form  │ Fields           │  │
│  └────────────┴──────────────────┘  │
│                                     │
│  📄 New Profile                     │
│  [+ Create New Profile]             │
│                                     │
│  ⚙️ Settings                        │
│  [Settings]  [Help]                 │
│                                     │
│  Status: Ready ✅                   │
│                                     │
└─────────────────────────────────────┘
```

**Key Functions**:
- `loadProfiles()` - Load all stored profiles
- `handleAutoFill()` - Trigger auto-fill process
- `handleAnalyzeForm()` - Analyze current form
- `handleCreateProfile()` - Open profile wizard
- `updateStatus()` - Show messages to user

---

### 2. BACKGROUND SERVICE WORKER (`src/background/background.js`)

**Responsibility**: Central message router and state manager

**Functions**:
```javascript
// Initialize Extension
chrome.runtime.onInstalled()
  → Create default storage
  → Initialize settings
  → Check for updates

// Message Routing
chrome.runtime.onMessage()
  → "analyzeForm" → Forward to content script
  → "autoFill" → Trigger content script
  → "saveProfile" → Save to storage
  → "getProfile" → Retrieve from storage
  → "transformData" → Send to transformer
  → "testAI" → Health check local AI

// Storage Events
chrome.storage.onChanged()
  → Sync across tabs
  → Update UI if needed
```

**Message Flow Example**:
```
Popup (user clicks "Auto-Fill")
  → Sends message to background.js
    → background.js sends to content.js
      → content.js analyzes form
      → content.js requests transformation
        → transformer.js calls Local AI
        → Returns transformed data
      → content.js fills form fields
      → Returns success status
    → background.js reports to popup
  → Popup shows "Form filled! ✅"
```

---

### 3. CONTENT SCRIPT (`src/content/content.js`)

**Responsibility**: Direct interaction with webpage DOM

**Functions**:

#### A. Form Detection
```javascript
getAllFormElements() {
  Returns: Array of {
    type: 'input|select|textarea',
    element: DOM element,
    name: field name,
    id: field id,
    value: current value,
    placeholder: placeholder text,
    required: boolean,
    type: input type (text|email|date|number|tel|etc)
  }
}
```

#### B. Form Analysis
```javascript
analyzeFormStructure() {
  Detects:
  1. All input fields (text, email, date, phone, number, etc)
  2. Dropdown selects
  3. Radio buttons
  4. Checkboxes
  5. Textareas
  
  Returns: {
    fieldCount: number,
    fields: Array<Field>,
    fieldTypes: {text: 5, email: 2, date: 1, ...},
    requiredFields: Array<string>,
    optionalFields: Array<string>
  }
}
```

#### C. Field Classification
```javascript
classifyField(field) {
  Uses: Regex pattern matching on:
  - Field name (id attribute)
  - Field name (name attribute)
  - Placeholder text
  - Associated label text
  
  Returns: {
    fieldType: 'firstName|lastName|email|phone|date|etc',
    confidence: 0.95,
    suggestedData: 'Mohammed'
  }
}
```

#### D. Format Detection
```javascript
detectFieldFormat(field) {
  For date fields:
    - Check HTML5 input[type=date] format
    - Look for placeholder hints
    - Infer from form context
    
  Returns: {
    fieldType: 'date',
    expectedFormat: 'DD/MM/YYYY|MM/DD/YYYY|YYYY-MM-DD',
    confidence: 0.8
  }
}
```

#### E. Data Injection
```javascript
fillField(field, value) {
  1. Transform value to correct format
  2. Handle different field types:
     - text → element.value = value
     - email → element.value = value
     - date → element.value = formatted date
     - select → Find & select matching option
     - radio → Find & click matching radio
     - checkbox → Check if applicable
  3. Trigger change events
  4. Return: success boolean
}
```

---

### 4. ANALYZER (`src/analyzer/analyzer.js`)

**Responsibility**: Intelligent form field detection and classification

**Class**: `FormAnalyzer`

**Field Detection Patterns**:
```javascript
PATTERNS = {
  firstName: /first.?name|fname|given.?name|first/i,
  lastName: /last.?name|lname|family.?name|surname|last/i,
  middleName: /middle.?name|mname|middle/i,
  email: /email|mail|e-mail|electronic.?mail/i,
  phone: /phone|mobile|tel|telephone|cell|mobile.?number/i,
  alternatePhone: /alternate|secondary|other.?phone|phone.?2/i,
  dateOfBirth: /date.?of.?birth|dob|birth.?date|born|date/i,
  gender: /gender|sex|male|female/i,
  maritalStatus: /marital|marriage|status|single|married/i,
  nationality: /nationality|national|country.?of.?origin/i,
  country: /country|nation|residence|living/i,
  city: /city|town|location|address.?line|municipality/i,
  address: /address|street|location|postal/i,
  postalCode: /postal|zip|code|postcode/i,
  relocation: /relocate|willing.?move|willing.?relocate/i,
  travel: /travel|travel.?willing|willing.?travel|travel.?percentage/i,
  jobTitle: /job.?title|position|role|title/i,
  company: /company|employer|organization|firm/i,
  salary: /salary|wage|compensation|remuneration/i,
  degree: /degree|qualification|diploma|certificate/i,
  university: /university|institute|college|school/i,
  skill: /skill|expertise|competency|ability/i,
  language: /language|speak|proficiency|fluency/i
}
```

**Methods**:
```javascript
new FormAnalyzer()
  .analyzeForm()
  .classifyFields()
  .detectFormats()
  .getFieldMappings()
  
Returns: {
  fields: [
    {
      htmlName: "firstName",
      detectedType: "firstName",
      expectedFormat: "text",
      confidence: 0.95,
      element: DOMElement
    },
    ...
  ],
  summary: {
    totalFields: 25,
    detectedFields: 20,
    undetectedFields: 5
  }
}
```

---

### 5. TRANSFORMER (`src/transformer/transformer.js`)

**Responsibility**: Data transformation with AI or rule-based fallback

**Class**: `DataTransformer`

**Initialization**:
```javascript
new DataTransformer({
  aiEnabled: true,
  aiPort: 11434,
  aiModel: 'neural-chat'
})
```

#### A. Transformation Flow
```javascript
async transformData(userValue, fieldType, fieldFormat) {
  1. Try AI transformation (if enabled)
     → Send to local LLM
     → Get formatted result
     → Return
  
  2. Fall back to rules (if AI fails)
     → Apply regex transformations
     → Format conversions
     → Return
  
  3. Return original (if all fails)
     → Log warning
     → Return unmodified value
}
```

#### B. Rule-Based Transformations

**Phone Number Transformation**:
```javascript
transformPhone(phone) {
  Input: "+966540601467"
  
  Rules:
  1. Remove all special chars except +
  2. If starts with +: keep as is
  3. If starts with 00: replace with +
  4. If 9 digits starting with 5: add +966
  
  Returns: "+966540601467"
}
```

**Date Transformation**:
```javascript
transformDate(date, targetFormat) {
  Input: "04/29/1997", targetFormat: "DD/MM/YYYY"
  
  Process:
  1. Parse any date format
  2. Extract day, month, year
  3. Reformat to target format
  
  Returns: "29/04/1997"
}
```

**Name Transformation**:
```javascript
transformName(name) {
  Input: "MOHAMMED ABDULLAH AL-QAHTANI"
  
  Process:
  1. Proper case each word
  2. Handle hyphens correctly
  
  Returns: "Mohammed Abdullah Al-Qahtani"
}
```

**Email Transformation**:
```javascript
transformEmail(email) {
  Input: "  Mohammed.Alnamlan@Gmail.COM  "
  
  Process:
  1. Trim whitespace
  2. Convert to lowercase
  
  Returns: "mohammed.alnamlan@gmail.com"
}
```

#### C. AI-Based Transformation

**Prompt to Local LLM**:
```
You are a data transformation assistant.
Convert the following data to match form requirements:

User Data: "+966540601467"
Field Type: Phone Number
Field Format: (###) ###-#### with country code
Field Context: Saudi Arabia

Provide ONLY the formatted value, nothing else.
Response:
```

**Local AI Call**:
```javascript
POST http://localhost:11434/api/generate
{
  "model": "neural-chat",
  "prompt": "...",
  "stream": false
}

Response: {
  "response": "(966) 540-601-467"
}
```

---

### 6. STORAGE MANAGER (`src/storage/storage-manager.js`)

**Responsibility**: Data persistence with chrome.storage.local

**Data Structure**:
```javascript
chrome.storage.local.get() returns: {
  profiles: [
    {
      id: "uuid-1",
      name: "My Career Profile",
      createdAt: "2025-11-28T10:00:00Z",
      updatedAt: "2025-11-28T10:00:00Z",
      data: { /* Full profile JSON from AI */ }
    }
  ],
  
  applicationHistory: [
    {
      id: "app-001",
      profileId: "uuid-1",
      dateApplied: "2025-11-28T14:30:00Z",
      website: "nakilat.com",
      jobTitle: "Talent Acquisition Specialist",
      formUrl: "https://nakilat.com/apply/xyz",
      status: "submitted|draft|in_progress",
      fieldsAnalyzed: 25,
      fieldsFilled: 23,
      fieldsSkipped: 2,
      notes: "2 fields filled manually"
    }
  ],
  
  settings: {
    aiEnabled: true,
    aiPort: 11434,
    aiModel: "neural-chat",
    autoDetectAI: true,
    theme: "light|dark",
    language: "en|ar",
    notificationEnabled: true
  }
}
```

**Methods**:
```javascript
// Profile Management
await storageManager.saveProfile(profile)
await storageManager.getProfile(profileId)
await storageManager.getAllProfiles()
await storageManager.deleteProfile(profileId)

// History Management
await storageManager.saveApplicationRecord(record)
await storageManager.getApplicationHistory(profileId)
await storageManager.clearHistory()

// Settings Management
await storageManager.saveSettings(settings)
await storageManager.getSettings()

// Data Export/Import
await storageManager.exportProfileData(profileId)
await storageManager.importProfileData(jsonData)
```

---

## 📊 DATA STRUCTURES

### Profile Data Structure
```javascript
{
  id: "uuid",
  name: "Profile Name",
  createdAt: "ISO 8601 timestamp",
  updatedAt: "ISO 8601 timestamp",
  
  data: {
    // From PROMPT_TEMPLATE.md JSON output
    personalInfo: {...},
    education: [{...}, {...}],
    experience: [{...}, {...}],
    skills: {...},
    languages: [...],
    certifications: [...],
    workPreferences: {...},
    careerGoals: {...},
    additionalInfo: {...}
  }
}
```

### Form Analysis Result Structure
```javascript
{
  formId: "auto-generated",
  timestamp: "ISO 8601",
  pageUrl: "https://example.com/apply",
  
  fields: [
    {
      htmlId: "firstName",
      htmlName: "first_name",
      htmlType: "text",
      detectedType: "firstName",
      detectedFormat: "text",
      detectionConfidence: 0.95,
      required: true,
      placeholder: "First Name",
      label: "First Name",
      element: "<reference to DOM element>"
    },
    // ... more fields
  ],
  
  summary: {
    totalFields: 25,
    detectedCount: 20,
    undetectedCount: 5,
    detectionRate: 0.80,
    fieldTypes: {
      firstName: 1,
      lastName: 1,
      email: 1,
      phone: 1,
      // ... etc
    }
  }
}
```

### Application Record Structure
```javascript
{
  id: "uuid",
  profileId: "uuid",
  dateApplied: "ISO 8601 timestamp",
  
  formInfo: {
    websiteUrl: "https://nakilat.com",
    jobTitle: "Talent Acquisition Specialist",
    jobUrl: "https://nakilat.com/jobs/xyz",
    companyName: "Nakilat"
  },
  
  fillResult: {
    totalFields: 25,
    filledFields: 23,
    skippedFields: 2,
    manuallyFilledFields: ["field1", "field2"],
    failedFields: [],
    
    details: [
      {
        fieldName: "firstName",
        userValue: "Mohammed",
        transformedValue: "Mohammed",
        status: "filled|skipped|failed",
        notes: ""
      },
      // ... more fields
    ]
  },
  
  status: "submitted|draft|in_progress",
  notes: "User notes about this application",
  followUpDate: "ISO 8601 timestamp or null"
}
```

---

## 🔄 EXTENSION FLOW

### Flow 1: Create Profile (Onboarding)

```
Step 1: User Enters Basic Info
  Input:
  - First Name: "Mohammed"
  - Last Name: "Al-Namlan"
  - Email: "mohammed.alnamlan.q@gmail.com"
  - Phone: "+966540601467"
  ↓

Step 2: Generate Interview Prompt
  Extension generates prompt from PROMPT_TEMPLATE.md
  Inserts basic info into template
  ↓

Step 3: User Gets Prompt
  [Copy Prompt] button → Copies to clipboard
  ↓

Step 4: User Runs Prompt in AI
  User pastes in ChatGPT/Claude/Ollama
  AI asks questions and returns JSON
  ↓

Step 5: User Pastes Result Back
  User pastes JSON result in Extension
  ↓

Step 6: Extension Validates
  - Check for ===== START PROFILE DATA =====
  - Check for ===== END PROFILE DATA =====
  - Validate JSON syntax
  - Check required fields
  - Show validation errors if any
  ↓

Step 7: Save Profile
  - Generate UUID for profile
  - Store in chrome.storage.local
  - Show success message
  ↓

Result: ✅ Profile saved and ready to use
```

### Flow 2: Auto-Fill Form (Application)

```
Step 1: User Visits Job Form
  Extension detects page load
  ↓

Step 2: User Clicks Extension Icon
  Popup appears
  ↓

Step 3: User Selects Profile
  Dropdown shows all profiles
  User chooses one
  ↓

Step 4: User Clicks "Auto-Fill This Form"
  Popup sends message to background
  Background forwards to content script
  ↓

Step 5: Content Script Analyzes Form
  - Get all form elements
  - Classify field types
  - Detect field formats
  - Returns analysis to background
  ↓

Step 6: Background Requests Data Transformation
  - Sends to transformer.js
  - Passes: user data + field requirements
  ↓

Step 7: Transformer Prepares Data
  If AI enabled:
    - Connect to local LLM
    - For each field: send transform request
    - Get formatted responses
  Else:
    - Apply rule-based transformations
  ↓

Step 8: Content Script Fills Form
  For each field:
    - Get transformed value
    - Fill the field
    - Trigger change events
  ↓

Step 9: Content Script Reports Result
  Returns:
  - fieldsTotal: 25
  - fieldsFilled: 23
  - fieldsSkipped: 2
  ↓

Step 10: Background Saves Application Record
  Stores history with:
  - Profile used
  - Website URL
  - Job title
  - Fields filled count
  - Timestamp
  ↓

Step 11: Popup Shows Success
  "Form filled! 23/25 fields ✅
   Review & submit the form"
  ↓

Result: ✅ Form is filled, user reviews and submits
```

---

## 🔍 FORM ANALYSIS ALGORITHM

### Phase 1: Element Collection

```javascript
collectElements() {
  1. Query all input[*]
  2. Query all select
  3. Query all textarea
  
  For each element, extract:
  - DOM element reference
  - Tag name (input|select|textarea)
  - Type attribute (text|email|date|etc)
  - Name attribute
  - ID attribute
  - Placeholder attribute
  - Value attribute
  - Required attribute
  - Pattern attribute (if any)
}
```

### Phase 2: Label Association

```javascript
findLabel(element) {
  1. If element.id exists:
     → Find label[for="element.id"]
  
  2. If no label found:
     → Look for parent .form-group/wrapper
     → Find label inside parent
  
  3. If still not found:
     → Return empty string
  
  Returns: label text or empty
}
```

### Phase 3: Field Classification

```javascript
classifyField(field) {
  scores = {}
  
  For each PATTERN in PATTERNS:
    score = matchScore(
      fieldName,
      fieldPlaceholder,
      fieldLabel,
      pattern
    )
    scores[fieldType] = score
  
  Return: fieldType with highest score
}
```

### Phase 4: Format Detection

```javascript
detectFormat(field) {
  If field.type === "date":
    If field.placeholder:
      → Extract format from placeholder
    Else if HTML5 date:
      → Format is "YYYY-MM-DD"
    Else:
      → Infer from form context or default "DD/MM/YYYY"
  
  If field.type === "tel" or "phone":
    → Check for pattern attribute
    → Default to "+countrycode" format
  
  Return: detected format
}
```

---

## 🔄 DATA TRANSFORMATION LOGIC

### Transformation Priority

```
1. Try AI-Based Transformation (if enabled)
   └─ Call local LLM
   └─ If success → return transformed value
   └─ If fail → try rules

2. Apply Rule-Based Transformations
   └─ Phone: regex formatting
   └─ Date: format conversion
   └─ Name: case normalization
   └─ Email: lowercase + trim
   └─ If success → return transformed value
   └─ If fail → return original

3. Return Original Value (as last resort)
   └─ Log warning
   └─ Let user fix manually
```

### Transformation Rules by Field Type

| Field Type | Transformation Logic |
|-----------|----------------------|
| **firstName** | Trim + Title Case |
| **lastName** | Trim + Title Case |
| **email** | Trim + Lowercase |
| **phone** | Remove special chars + Add format |
| **date** | Parse + Convert to target format |
| **gender** | Match: Male/Female/Other |
| **country** | Lookup: ISO codes or full names |
| **city** | Match: Free text or dropdown |
| **salary** | Convert currency if needed |

---

## 💾 STORAGE & DATABASE

### Storage Method: chrome.storage.local

**Why not IndexedDB or LocalStorage?**
- ✅ Specific for Chrome Extensions
- ✅ 10MB quota per extension
- ✅ Cross-window sync
- ✅ Supports complex objects
- ✅ Persistent across sessions

**Storage Limits**:
- Each profile: ~100-200KB (with full history)
- Max profiles: ~50 profiles (with 10MB limit)
- Application history: ~10KB per record

**Access Pattern**:
```javascript
// Get all data
const data = await chrome.storage.local.get();

// Get specific keys
const { profiles, settings } = await chrome.storage.local.get(['profiles', 'settings']);

// Set data
await chrome.storage.local.set({ profiles: [...] });

// Clear all
await chrome.storage.local.clear();

// Listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    console.log('Storage changed:', changes);
  }
});
```

---

## 🔌 API & COMMUNICATION

### Message Passing Architecture

**From Popup to Background**:
```javascript
chrome.runtime.sendMessage({
  action: 'autoFill|analyzeForm|saveProfile|getProfile',
  profileId: 'uuid',
  formData: {...}
}, (response) => {
  console.log(response.success);
  console.log(response.data);
  console.log(response.error);
});
```

**From Background to Content**:
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'analyzeForm|fillForm',
  data: {...}
}, (response) => {
  // Handle response
});
```

**Content Script Responses**:
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeForm') {
    const analysis = analyzeForm();
    sendResponse({
      success: true,
      data: analysis,
      error: null
    });
  }
});
```

### Local AI API Integration

**Ollama API**:
```javascript
POST http://localhost:11434/api/generate
Content-Type: application/json

{
  "model": "neural-chat",
  "prompt": "Transform this phone: +966540601467",
  "stream": false
}

Response:
{
  "response": "(966) 540-601-467",
  "model": "neural-chat",
  "created_at": "2025-11-28T10:00:00Z",
  "done": true
}
```

**LM Studio API**:
```javascript
POST http://localhost:8000/v1/completions
Content-Type: application/json

{
  "prompt": "Transform this phone: +966540601467",
  "max_tokens": 50
}

Response:
{
  "choices": [{
    "text": "(966) 540-601-467"
  }]
}
```

**Health Check**:
```javascript
async checkAIHealth() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET'
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

---

## ❌ ERROR HANDLING

### Error Categories

#### 1. Profile Validation Errors

```javascript
validateProfile(jsonData) {
  errors = [];
  
  if (!jsonData.personalInfo.firstName)
    errors.push("First name required");
  
  if (!jsonData.education || jsonData.education.length === 0)
    errors.push("At least one education entry required");
  
  // ... more validations
  
  return { isValid: errors.length === 0, errors };
}
```

#### 2. Form Analysis Errors

```
Error: No form fields detected on page
→ Show: "No form found. Try on a different page."
→ Action: Allow manual entry

Error: Field type unknown
→ Show: "Detected field: [name]. Confirm field type?"
→ Action: Let user choose from dropdown

Error: Format detection failed
→ Show: "Date format: DD/MM/YYYY or MM/DD/YYYY?"
→ Action: Let user choose format
```

#### 3. AI Connection Errors

```
Error: AI not available
→ Check: Is Ollama running?
→ Show: "AI disabled. Using fallback rules."
→ Action: Continue with rules, no AI

Error: AI timeout
→ Show: "AI took too long. Using basic fill."
→ Action: Use simple fill without AI

Error: Invalid AI response
→ Show: "AI response invalid. Using original data."
→ Action: Use original unmodified data
```

#### 4. Storage Errors

```
Error: Storage quota exceeded
→ Show: "Storage full. Delete old applications?"
→ Action: Offer cleanup wizard

Error: Corrupted profile data
→ Show: "Profile corrupted. Recover from backup?"
→ Action: Restore from last good state
```

### Error Recovery Strategy

```
Priority 1: Graceful Degradation
  - Try AI → Fallback to rules → Use original data
  - Try smart analysis → Fallback to manual

Priority 2: User Control
  - Always show what will be filled
  - Allow user to correct before filling
  - Offer skip option for unclear fields

Priority 3: Data Safety
  - Never delete user data automatically
  - Always ask before overwriting
  - Keep history for recovery
```

---

## 🔐 SECURITY CONSIDERATIONS

### Data Protection

```
1. LOCAL STORAGE ONLY
   ✅ All data in chrome.storage.local
   ✅ No external API calls for user data
   ✅ No cloud storage
   ✅ No analytics
   ✅ No tracking

2. OPTIONAL ENCRYPTION
   ✅ Profiles stored unencrypted by default (for speed)
   ✅ User can enable encryption in settings
   ✅ Uses SubtleCrypto API for encryption

3. NO API KEYS
   ✅ Local AI only (user's machine)
   ✅ No external LLM calls
   ✅ No credentials stored
```

### Privacy Best Practices

```
1. USER CONTROL
   - Users own their data
   - Users can delete anytime
   - Users can export data
   - Users can disable features

2. TRANSPARENT OPERATIONS
   - Show what Extension will do
   - Show what data will be sent
   - Show AI transformation steps
   - Log all actions

3. NO COLLECTION
   ✅ No user behavior tracking
   ✅ No usage statistics
   ✅ No event logging
   ✅ No performance metrics
```

### Extension Permissions

```javascript
// manifest.json permissions
"permissions": [
  "storage",           // Access chrome.storage.local
  "activeTab",         // Access current tab
  "scripting",         // Inject content script
  "tabs",              // Tab info
  "webNavigation"      // Page navigation events
]

"host_permissions": [
  "<all_urls>"         // Access all websites
]
```

**Why these permissions?**
- `storage`: Store profiles locally
- `activeTab`: Know what page user is on
- `scripting`: Analyze & fill forms on pages
- `tabs`: Switch between tabs
- `webNavigation`: Monitor page changes
- `<all_urls>`: Work on any website

---

## 📞 DEPENDENCIES

### External Libraries
```json
{
  "dependencies": {
    "axios": "^1.4.0"     // Optional: HTTP requests
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "webpack": "^5.0.0"
  }
}
```

### Browser APIs Used
- ✅ chrome.runtime
- ✅ chrome.tabs
- ✅ chrome.storage.local
- ✅ chrome.scripting
- ✅ Fetch API
- ✅ DOM API
- ✅ Regular Expressions

---

## 🧪 Testing Strategy

### Unit Tests
- FormAnalyzer pattern matching
- DataTransformer rules
- StorageManager CRUD operations

### Integration Tests
- End-to-end form filling
- Profile save & retrieve
- AI connection & fallback

### Manual Tests
- Test on 10+ popular job sites
- Test on various form types
- Test AI enable/disable
- Test edge cases

---

## 📈 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Form Analysis | < 1 second | TBD |
| Data Transformation | < 2 seconds | TBD |
| Form Fill | < 3 seconds | TBD |
| Popup Load | < 500ms | TBD |
| Profile Save | < 1 second | TBD |
| Memory Usage | < 50MB | TBD |
| Storage Used | < 50MB | TBD |

---

**Version History**:
- v1.0 (2025-11-28): Initial technical specification

**Next Document**: `FORM_ANALYZER_SPEC.md`

---

**This document is reference material for developers implementing SAGGLNI PLUS.**
