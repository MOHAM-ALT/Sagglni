# 📊 DATA STRUCTURE SPECIFICATION - SAGGLNI PLUS

> **Version**: 1.0  
> **Last Updated**: 2025-11-28  
> **Purpose**: Complete data structure definitions and schemas for all data in the system

---

## 📋 TABLE OF CONTENTS

1. [Storage Overview](#storage-overview)
2. [Profile Data Structure](#profile-data-structure)
3. [Application History Structure](#application-history-structure)
4. [Settings Structure](#settings-structure)
5. [Form Analysis Result Structure](#form-analysis-result-structure)
6. [Data Transformation Request/Response](#data-transformation-requestresponse)
7. [Message Passing Structures](#message-passing-structures)
8. [Validation Rules](#validation-rules)
9. [Database Queries](#database-queries)
10. [Migration & Versioning](#migration--versioning)

---

## 💾 STORAGE OVERVIEW

### Storage Architecture

```
chrome.storage.local
│
├── profiles[]
│   └── Profile Object
│
├── applicationHistory[]
│   └── Application Record Object
│
├── settings
│   └── Settings Object
│
└── metadata
    └── Version & timestamps
```

### Storage Capacity

```
Total Quota: 10 MB (per extension)

Estimated Usage:
├── 50 profiles × 150KB each = 7.5 MB
├── 500 application records × 10KB each = 5 MB (with rotation)
├── Settings & metadata = 100 KB

Recommendation:
- Keep max 50 profiles
- Keep max 500 recent application records
- Auto-archive older records (optional)
```

### Storage API Usage

```javascript
// Get all data
const allData = await chrome.storage.local.get();

// Get specific items
const { profiles, settings } = await chrome.storage.local.get(['profiles', 'settings']);

// Set data
await chrome.storage.local.set({ profiles: profileArray });

// Clear all (dangerous!)
await chrome.storage.local.clear();

// Get storage info (not available in manifest v3, but useful for planning)
// chrome.storage.local.getBytesInUse() // Would tell us current usage
```

---

## 👤 PROFILE DATA STRUCTURE

### Root Profile Object

```typescript
interface Profile {
  // Metadata
  id: string;                          // UUID, generated on creation
  name: string;                        // Display name, e.g., "My Career Profile"
  createdAt: string;                   // ISO 8601 timestamp
  updatedAt: string;                   // ISO 8601 timestamp
  version: string;                     // Data version for migrations
  
  // Profile Data
  data: ProfileData;
}
```

### ProfileData Object (From AI Interview)

```typescript
interface ProfileData {
  // SECTION 1: PERSONAL INFORMATION
  personalInfo: {
    firstName: string;                 // "Mohammed"
    lastName: string;                  // "Al-Namlan"
    middleName?: string;               // "Abdullah" (optional)
    email: string;                     // "mohammed.alnamlan.q@gmail.com"
    phone: string;                     // "+966540601467"
    alternatePhone?: string;           // Secondary phone
    dateOfBirth: string;               // "1997-04-29" (YYYY-MM-DD)
    gender?: "Male" | "Female" | "Other" | "Prefer not to say";
    maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
    nationality: string;               // "Saudi Arabia"
    countryOfResidence: string;        // "Saudi Arabia"
    city: string;                      // "Riyadh"
    address?: string;                  // Full address
    postalCode?: string;               // "11223"
  };

  // SECTION 2: EDUCATION
  education: Array<{
    id: string;                        // UUID for this entry
    degree: string;                    // "Bachelor's", "Master's", "Diploma"
    field: string;                     // "Information Science"
    university: string;                // "King Saud University"
    country: string;                   // "Saudi Arabia"
    city?: string;                     // Optional
    graduationYear: number;            // 2023
    startYear?: number;                // 2019
    gpa?: string;                      // "3.21/5.0"
    stillAttending: boolean;           // false
    additionalInfo?: string;           // Free text notes
  }>;

  // SECTION 3: WORK EXPERIENCE
  experience: Array<{
    id: string;                        // UUID
    jobTitle: string;                  // "Operations Manager"
    company: string;                   // "Secu Company"
    industry?: string;                 // "Security & Events"
    startDate: string;                 // "2024-01" (YYYY-MM)
    endDate?: string;                  // "2025-05" or "Present"
    duration: string;                  // "1 year 5 months"
    currentlyWorking: boolean;         // true or false
    typeOfBusiness?: string;           // "Private Sector"
    description: string;               // Job description
    
    responsibilities: string[];        // Array of key responsibilities
    // [
    //   "Recruited and trained 1,900+ security personnel",
    //   "Managed large-scale international events"
    // ]
    
    achievements: string[];            // Array of achievements
    // [
    //   "Achieved 95% recruitment targets within deadlines",
    //   "Zero security incidents across all events"
    // ]
    
    reportingTo?: string;              // "Director of Operations"
    teamSize?: number;                 // 50 people managed
    locationCountry: string;           // "Saudi Arabia"
    locationCity?: string;             // "Riyadh"
  }>;

  // SECTION 4: SKILLS & COMPETENCIES
  skills: {
    technical: string[];               // ["SQL", "Python", "Power BI"]
    soft: string[];                    // ["Leadership", "Communication"]
    certifications: string[];          // Professional certifications
  };

  // SECTION 5: LANGUAGES
  languages: Array<{
    language: string;                  // "Arabic"
    level: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
    reading?: number;                  // 1-10 scale
    writing?: number;                  // 1-10 scale
    speaking?: number;                 // 1-10 scale
  }>;

  // SECTION 6: CERTIFICATIONS & LICENSES
  certifications: Array<{
    id: string;                        // UUID
    name: string;                      // "HR Management Diploma"
    issuer: string;                    // "Saudi Public Administration Institute"
    year: number;                      // 2023
    expirationYear?: number;           // null if doesn't expire
    credentialId?: string;             // Certificate ID
    credentialUrl?: string;            // Link to verify
  }>;

  // SECTION 7: WORK PREFERENCES
  workPreferences: {
    targetPositions: string[];         // ["HR Officer", "Operations Manager"]
    preferredIndustries: string[];     // ["Technology", "Finance"]
    willingToRelocate: boolean;        // true
    relocationCountries?: string[];    // ["Saudi Arabia", "UAE"]
    willingToTravel: boolean;          // true
    maxTravelPercentage: number;       // 80 (percent)
    employmentTypes: Array<
      "Full-time" | "Part-time" | "Contract" | "Temporary" | "Freelance"
    >;
    workEnvironments: Array<
      "Office" | "Remote" | "Hybrid"
    >;
    minimumSalary?: number;            // 5000
    expectedSalaryRange?: {
      min: number;                     // 5000
      max: number;                     // 8000
      currency: string;                // "SAR"
    };
    salaryFlexible: boolean;           // true
  };

  // SECTION 8: CAREER GOALS
  careerGoals: {
    fiveYearVision: string;            // Career aspirations
    strengths: string[];               // ["Leadership", "Problem-solving"]
    areasToImprove: string[];          // ["Advanced programming"]
    workMotivation: string[];          // ["Career growth", "Financial stability"]
  };

  // SECTION 9: ADDITIONAL INFORMATION
  additionalInfo: {
    hobbies?: string[];                // ["Swimming", "Reading"]
    volunteerWork?: string;            // Description or "None"
    awardsAndRecognition?: string[];   // ["Perfect safety record"]
    publications?: string[];           // Academic or professional papers
    additionalNotes?: string;          // Free text
  };
}
```

### Profile JSON Example

```json
{
  "id": "uuid-12345",
  "name": "My Career Profile",
  "createdAt": "2025-11-28T10:00:00Z",
  "updatedAt": "2025-11-28T10:00:00Z",
  "version": "1.0",
  "data": {
    "personalInfo": {
      "firstName": "Mohammed",
      "lastName": "Al-Namlan",
      "email": "mohammed.alnamlan.q@gmail.com",
      "phone": "+966540601467",
      "dateOfBirth": "1997-04-29",
      "gender": "Male",
      "maritalStatus": "Single",
      "nationality": "Saudi Arabia",
      "countryOfResidence": "Saudi Arabia",
      "city": "Riyadh"
    },
    "education": [
      {
        "id": "edu-001",
        "degree": "Bachelor's",
        "field": "Information Science",
        "university": "King Saud University",
        "country": "Saudi Arabia",
        "graduationYear": 2023,
        "gpa": "3.21/5.0"
      }
    ],
    "experience": [
      {
        "id": "exp-001",
        "jobTitle": "Operations Manager",
        "company": "Secu Company",
        "startDate": "2024-01",
        "endDate": "2025-05",
        "currentlyWorking": false,
        "description": "Managed security operations",
        "responsibilities": ["Recruit personnel", "Manage logistics"],
        "achievements": ["95% targets achieved"],
        "locationCountry": "Saudi Arabia"
      }
    ],
    "skills": {
      "technical": ["SQL", "Python", "Excel"],
      "soft": ["Leadership", "Communication"]
    },
    "languages": [
      {
        "language": "Arabic",
        "level": "Native"
      }
    ],
    "workPreferences": {
      "targetPositions": ["HR Officer", "Operations Manager"],
      "willingToRelocate": true,
      "willingToTravel": true,
      "maxTravelPercentage": 80
    }
  }
}
```

---

## 📋 APPLICATION HISTORY STRUCTURE

### Application Record Object

```typescript
interface ApplicationRecord {
  // Identifiers
  id: string;                          // UUID, unique per application
  profileId: string;                   // Reference to Profile.id
  
  // Timestamps
  dateApplied: string;                 // ISO 8601 timestamp
  dateModified?: string;               // Last update
  dateSubmitted?: string;              // When actually submitted
  
  // Form Information
  formInfo: {
    websiteUrl: string;                // "https://nakilat.com"
    jobTitle: string;                  // "Talent Acquisition Specialist"
    jobUrl: string;                    // Full job posting URL
    companyName: string;               // "Nakilat"
    industry?: string;                 // "Maritime"
    location?: string;                 // "Doha, Qatar"
  };
  
  // Fill Results
  fillResult: {
    totalFields: number;               // 25
    filledFields: number;              // 23 (auto-filled)
    skippedFields: number;             // 2 (left empty)
    manuallyFilledFields: string[];    // Field names filled by user
    failedFields: string[];            // Fields that couldn't be filled
    
    fieldDetails: Array<{
      fieldName: string;               // HTML field name
      detectedType: string;            // Detected field type
      userValue?: string;              // Original user data
      transformedValue?: string;       // After transformation
      status: "filled" | "skipped" | "failed" | "manual";
      confidence: number;              // 0-1 confidence score
      notes?: string;                  // Why it was skipped/failed
    }>;
  };
  
  // Status & Follow-up
  status: "draft" | "in_progress" | "submitted" | "rejected" | "accepted";
  followUpDate?: string;               // ISO 8601 date for reminder
  notes?: string;                      // User's notes about this application
  
  // AI Usage Stats
  aiUsed: boolean;                     // Whether AI was used
  aiModel?: string;                    // "neural-chat" or model name
  aiTransformationCount?: number;      // How many fields were AI-transformed
  
  // Form Analysis Info
  formAnalysis?: {
    totalFieldsDetected: number;
    detectionRate: number;             // 0-1
    analysisTime: number;              // milliseconds
  };
}
```

### Application Record JSON Example

```json
{
  "id": "app-001",
  "profileId": "uuid-12345",
  "dateApplied": "2025-11-28T14:30:00Z",
  "formInfo": {
    "websiteUrl": "https://nakilat.com",
    "jobTitle": "Talent Acquisition Specialist",
    "jobUrl": "https://nakilat.com/jobs/xyz123",
    "companyName": "Nakilat",
    "industry": "Maritime",
    "location": "Doha, Qatar"
  },
  "fillResult": {
    "totalFields": 25,
    "filledFields": 23,
    "skippedFields": 2,
    "manuallyFilledFields": [],
    "failedFields": [],
    "fieldDetails": [
      {
        "fieldName": "first_name",
        "detectedType": "firstName",
        "userValue": "Mohammed",
        "transformedValue": "Mohammed",
        "status": "filled",
        "confidence": 0.95
      }
    ]
  },
  "status": "submitted",
  "aiUsed": true,
  "aiModel": "neural-chat",
  "aiTransformationCount": 15,
  "formAnalysis": {
    "totalFieldsDetected": 25,
    "detectionRate": 1.0,
    "analysisTime": 450
  }
}
```

---

## ⚙️ SETTINGS STRUCTURE

### Settings Object

```typescript
interface Settings {
  // AI Configuration
  ai: {
    enabled: boolean;                  // true = use local AI
    autoDetect: boolean;               // true = try to find Ollama automatically
    port: number;                      // 11434 (default Ollama port)
    model: string;                     // "neural-chat"
    customUrl?: string;                // Custom AI endpoint
    timeout: number;                   // milliseconds, default 30000
    lastHealthCheck?: string;          // ISO timestamp
    healthCheckStatus?: "healthy" | "unhealthy" | "unknown";
  };
  
  // UI Preferences
  ui: {
    theme: "light" | "dark" | "auto";
    language: "en" | "ar";
    compactMode: boolean;
    showNotifications: boolean;
    notificationDuration: number;      // milliseconds
  };
  
  // Auto-Fill Preferences
  autofill: {
    confirmBeforeFill: boolean;        // Ask user to review before filling
    skipLowConfidence: boolean;        // Skip fields with < 0.6 confidence
    minConfidenceLevel: number;        // 0-1
    fillHiddenFields: boolean;         // Include hidden form fields
    fillDisabledFields: boolean;       // Include disabled fields
  };
  
  // Data Management
  data: {
    autoBackup: boolean;
    backupFrequency: "daily" | "weekly" | "monthly" | "never";
    lastBackup?: string;               // ISO timestamp
    autoDeleteOldRecords: boolean;
    recordRetentionDays: number;       // 90
    maxProfiles: number;               // 50
    maxApplicationRecords: number;     // 500
  };
  
  // Privacy & Security
  privacy: {
    encryptData: boolean;
    encryptionKey?: string;            // User's encryption password (hashed)
    shareAnalytics: boolean;           // Allow anonymized usage analytics
    clearOnClose: boolean;             // Clear temporary data on browser close
  };
  
  // Advanced
  advanced: {
    debugMode: boolean;
    logAllActions: boolean;
    cacheFormAnalysis: boolean;        // Cache analysis results
    enableOfflineMode: boolean;
  };
}
```

### Settings JSON Example

```json
{
  "ai": {
    "enabled": true,
    "autoDetect": true,
    "port": 11434,
    "model": "neural-chat",
    "timeout": 30000,
    "healthCheckStatus": "healthy"
  },
  "ui": {
    "theme": "light",
    "language": "en",
    "compactMode": false,
    "showNotifications": true,
    "notificationDuration": 3000
  },
  "autofill": {
    "confirmBeforeFill": false,
    "skipLowConfidence": true,
    "minConfidenceLevel": 0.70,
    "fillHiddenFields": false,
    "fillDisabledFields": false
  },
  "data": {
    "autoBackup": true,
    "backupFrequency": "weekly",
    "autoDeleteOldRecords": true,
    "recordRetentionDays": 90,
    "maxProfiles": 50,
    "maxApplicationRecords": 500
  },
  "privacy": {
    "encryptData": false,
    "shareAnalytics": false,
    "clearOnClose": false
  }
}
```

---

## 📊 FORM ANALYSIS RESULT STRUCTURE

### FormAnalysisResult Object

```typescript
interface FormAnalysisResult {
  // Metadata
  analysisId: string;                  // UUID
  timestamp: string;                   // ISO 8601
  pageUrl: string;                     // Current page URL
  pageTitle?: string;                  // Page title
  
  // Form Information
  form: {
    elementCount: number;              // Total form elements found
    formId?: string;                   // Form ID attribute
    formName?: string;                 // Form name attribute
    formAction?: string;               // Form submission URL
    formMethod?: string;               // GET or POST
    multipart: boolean;                // Multipart/form-data
  };
  
  // Field Analysis
  fields: Array<{
    // Position & Identification
    position: number;                  // Order in form
    htmlName: string;                  // HTML name attribute
    htmlId?: string;                   // HTML id attribute
    htmlType: string;                  // Input type
    tagName: string;                   // input|select|textarea
    
    // Detection Results
    detectedType: string;              // "firstName", "email", etc
    confidence: number;                // 0-1
    detectionMethod: string;           // "name_match", "pattern_match", etc
    
    // Format Information
    detectedFormat?: {
      type: string;                    // "text", "email", "date", etc
      format?: string;                 // "DD/MM/YYYY", "email", etc
      formatConfidence: number;        // 0-1
      source: string;                  // "input_type", "placeholder", "pattern"
    };
    
    // Alternatives (if confidence is low)
    alternatives?: Array<{
      type: string;
      confidence: number;
    }>;
    
    // Attributes
    label?: string;                    // Associated label text
    placeholder?: string;              // Placeholder text
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    pattern?: string;                  // Validation pattern
    
    // Options (for select fields)
    options?: Array<{
      value: string;
      text: string;
      selected: boolean;
    }>;
    
    // Visibility
    visible: boolean;                  // Not hidden/display:none
    displayValue?: string;             // Current displayed value
    
    // Suggestion
    suggestion?: {
      value: string;                   // Suggested value to fill
      source: string;                  // "profile_match"
      confidence: number;              // 0-1
    };
    
    // Notes
    notes?: string;                    // Issues or special notes
  }>;
  
  // Summary Statistics
  summary: {
    totalFields: number;
    detectedFields: number;            // Fields with detection
    undetectedFields: number;          // Can't determine type
    detectionRate: number;             // 0-1
    canAutofill: number;               // Fields that can be auto-filled
    needsConfirmation: number;         // Low confidence fields
    fieldTypeDistribution: {
      [fieldType: string]: number;
    };
  };
  
  // Warnings & Errors
  issues?: Array<{
    severity: "warning" | "error";
    field?: string;
    message: string;
  }>;
}
```

### FormAnalysisResult JSON Example

```json
{
  "analysisId": "analysis-001",
  "timestamp": "2025-11-28T14:30:00Z",
  "pageUrl": "https://nakilat.com/apply",
  "form": {
    "elementCount": 25,
    "formAction": "/api/applications",
    "formMethod": "POST"
  },
  "fields": [
    {
      "position": 1,
      "htmlName": "first_name",
      "htmlId": "firstName",
      "htmlType": "text",
      "detectedType": "firstName",
      "confidence": 0.95,
      "detectionMethod": "name_match",
      "label": "First Name",
      "required": true,
      "visible": true,
      "suggestion": {
        "value": "Mohammed",
        "source": "profile_match",
        "confidence": 1.0
      }
    }
  ],
  "summary": {
    "totalFields": 25,
    "detectedFields": 20,
    "undetectedFields": 5,
    "detectionRate": 0.8,
    "canAutofill": 18,
    "needsConfirmation": 2
  }
}
```

---

## 🔄 DATA TRANSFORMATION REQUEST/RESPONSE

### TransformationRequest Object

```typescript
interface TransformationRequest {
  requestId: string;                   // UUID
  timestamp: string;                   // ISO 8601
  
  data: {
    fieldName: string;                 // HTML field name
    detectedType: string;              // "firstName", "phone", etc
    userValue: string;                 // Original value from profile
    targetFormat?: string;             // "DD/MM/YYYY", "+XXX-XXX-XXXX"
    fieldContext?: string;             // Additional context
  };
  
  options?: {
    useAI: boolean;                    // true = use local LLM
    aiModel?: string;                  // "neural-chat"
    aiPort?: number;                   // 11434
    timeout?: number;                  // milliseconds
    fallbackToRules: boolean;          // true = use rules if AI fails
  };
}
```

### TransformationResponse Object

```typescript
interface TransformationResponse {
  requestId: string;                   // Matches request
  success: boolean;                    // Operation successful?
  
  result: {
    transformedValue: string;          // Final value to fill
    originalValue: string;             // Before transformation
    transformationMethod: "ai" | "rules" | "direct";
    confidence: number;                // 0-1 confidence in result
  };
  
  details?: {
    aiUsed: boolean;
    aiModel?: string;
    aiResponse?: string;               // Raw AI response
    rulesApplied?: string[];           // Rules that were applied
  };
  
  error?: {
    code: string;                      // Error code
    message: string;                   // Human-readable error
    fallbackUsed: boolean;             // Was fallback applied?
  };
}
```

### Transformation Request Example

```json
{
  "requestId": "trans-001",
  "timestamp": "2025-11-28T14:30:00Z",
  "data": {
    "fieldName": "dateOfBirth",
    "detectedType": "dateOfBirth",
    "userValue": "04/29/1997",
    "targetFormat": "DD/MM/YYYY"
  },
  "options": {
    "useAI": true,
    "aiModel": "neural-chat",
    "fallbackToRules": true
  }
}
```

### Transformation Response Example

```json
{
  "requestId": "trans-001",
  "success": true,
  "result": {
    "transformedValue": "29/04/1997",
    "originalValue": "04/29/1997",
    "transformationMethod": "rules",
    "confidence": 0.99
  },
  "details": {
    "aiUsed": false,
    "rulesApplied": ["date_format_conversion"]
  }
}
```

---

## 💬 MESSAGE PASSING STRUCTURES

### Message from Popup to Background

```typescript
interface PopupMessage {
  action: string;  // "autoFill" | "analyzeForm" | "saveProfile" | "getProfile"
  
  // Specific to action
  profileId?: string;
  profileData?: ProfileData;
  formData?: FormAnalysisResult;
  
  // Optional
  options?: any;
  timestamp?: string;
}
```

### Message from Background to Content

```typescript
interface BackgroundMessage {
  action: string;  // "analyzeForm" | "fillForm" | "getFormState"
  
  // Specific to action
  data?: any;
  profileId?: string;
  
  timestamp?: string;
}
```

### Response Structure

```typescript
interface MessageResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: string;
}
```

### Example: Auto-Fill Message Flow

```
STEP 1: Popup sends to Background
{
  action: "autoFill",
  profileId: "uuid-12345"
}

STEP 2: Background sends to Content
{
  action: "analyzeForm",
  profileId: "uuid-12345"
}

STEP 3: Content responds to Background
{
  success: true,
  data: {
    formAnalysis: {...}
  }
}

STEP 4: Background processes and sends to Content
{
  action: "fillForm",
  data: {
    fields: [...]
  }
}

STEP 5: Content responds to Background
{
  success: true,
  data: {
    filledCount: 23,
    skippedCount: 2
  }
}

STEP 6: Background responds to Popup
{
  success: true,
  data: {
    filledCount: 23,
    skippedCount: 2
  }
}
```

---

## ✅ VALIDATION RULES

### Profile Validation

```typescript
function validateProfile(data: ProfileData): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.personalInfo.firstName?.trim())
    errors.push("First name is required");
  
  if (!data.personalInfo.lastName?.trim())
    errors.push("Last name is required");
  
  if (!data.personalInfo.email?.trim())
    errors.push("Email is required");
  
  // Email validation
  if (!isValidEmail(data.personalInfo.email))
    errors.push("Invalid email format");
  
  // Phone validation
  if (!isValidPhone(data.personalInfo.phone))
    errors.push("Invalid phone format");
  
  // Date of birth validation
  if (!isValidDate(data.personalInfo.dateOfBirth))
    errors.push("Invalid date of birth format");
  
  // Education must have at least one entry
  if (!data.education || data.education.length === 0)
    errors.push("At least one education entry required");
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Application Record Validation

```typescript
function validateApplicationRecord(record: ApplicationRecord): ValidationResult {
  const errors: string[] = [];
  
  if (!record.formInfo.websiteUrl?.trim())
    errors.push("Website URL required");
  
  if (record.fillResult.totalFields === 0)
    errors.push("Total fields must be > 0");
  
  if (record.fillResult.filledFields > record.fillResult.totalFields)
    errors.push("Filled fields cannot exceed total fields");
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 🔍 DATABASE QUERIES

### Common Query Patterns

```javascript
// Get all profiles
async function getAllProfiles() {
  const { profiles } = await chrome.storage.local.get('profiles');
  return profiles || [];
}

// Get profile by ID
async function getProfileById(id) {
  const { profiles } = await chrome.storage.local.get('profiles');
  return (profiles || []).find(p => p.id === id);
}

// Save profile
async function saveProfile(profile) {
  const { profiles } = await chrome.storage.local.get('profiles');
  const existing = (profiles || []).filter(p => p.id !== profile.id);
  await chrome.storage.local.set({
    profiles: [...existing, profile]
  });
}

// Delete profile
async function deleteProfile(id) {
  const { profiles } = await chrome.storage.local.get('profiles');
  await chrome.storage.local.set({
    profiles: (profiles || []).filter(p => p.id !== id)
  });
}

// Get application history for profile
async function getApplicationHistory(profileId) {
  const { applicationHistory } = await chrome.storage.local.get('applicationHistory');
  return (applicationHistory || []).filter(a => a.profileId === profileId);
}

// Get recent applications
async function getRecentApplications(limit = 10) {
  const { applicationHistory } = await chrome.storage.local.get('applicationHistory');
  return (applicationHistory || [])
    .sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied))
    .slice(0, limit);
}

// Search applications
async function searchApplications(query) {
  const { applicationHistory } = await chrome.storage.local.get('applicationHistory');
  return (applicationHistory || []).filter(app =>
    app.formInfo.companyName.toLowerCase().includes(query.toLowerCase()) ||
    app.formInfo.jobTitle.toLowerCase().includes(query.toLowerCase())
  );
}
```

---

## 📦 MIGRATION & VERSIONING

### Data Version History

```
Version 1.0 (2025-11-28):
  - Initial schema
  - PersonalInfo, Education, Experience, Skills, Languages, Certifications
  - WorkPreferences, CareerGoals, AdditionalInfo
```

### Migration Strategy

```typescript
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (oldData: any) => any;
}

const migrations: Migration[] = [
  {
    fromVersion: "1.0",
    toVersion: "1.1",
    migrate: (data) => {
      // Example: Add new field to profile
      if (!data.additionalInfo) {
        data.additionalInfo = {
          hobbies: [],
          volunteerWork: null,
          awardsAndRecognition: [],
          publications: [],
          additionalNotes: ""
        };
      }
      return data;
    }
  }
];

async function migrateData() {
  const { metadata } = await chrome.storage.local.get('metadata');
  const currentVersion = metadata?.version || "1.0";
  
  for (const migration of migrations) {
    if (migration.fromVersion === currentVersion) {
      // Apply migration
      const { profiles } = await chrome.storage.local.get('profiles');
      const migratedProfiles = profiles.map(p => ({
        ...p,
        data: migration.migrate(p.data)
      }));
      
      await chrome.storage.local.set({
        profiles: migratedProfiles,
        metadata: { version: migration.toVersion }
      });
      
      currentVersion = migration.toVersion;
    }
  }
}
```

---

## 🔒 Data Export Format

### Export Schema

```json
{
  "exportDate": "2025-11-28T14:30:00Z",
  "exportVersion": "1.0",
  "dataType": "sagglni_plus_backup",
  
  "data": {
    "profiles": [...],
    "applicationHistory": [...],
    "settings": {...}
  },
  
  "checksum": "sha256_hash",
  "encrypted": false
}
```

---

## 📝 Summary of All Data Structures

| Structure | Type | Size | Count |
|-----------|------|------|-------|
| **Profile** | Object | ~150KB | Max 50 |
| **Application Record** | Object | ~10KB | Max 500 |
| **Settings** | Object | ~5KB | 1 |
| **Form Analysis** | Object | ~50KB | Temporary |
| **Transformation Request** | Object | ~1KB | Temporary |

---

**Version History**:
- v1.0 (2025-11-28): Complete data structure specification

**Next Document**: `IMPLEMENTATION_CHECKLIST.md`

---

**This document provides complete data structure definitions for SAGGLNI PLUS developers.**
