// Sagglni Plus - Content Script
// Sagglni Plus - Content Script
// Runs on every webpage

let FormAnalyzer;
let DataTransformer;
try {
  FormAnalyzer = typeof window !== 'undefined' && window.FormAnalyzer ? window.FormAnalyzer : require('../analyzer/analyzer.js');
  DataTransformer = typeof window !== 'undefined' && window.DataTransformer ? window.DataTransformer : require('../transformer/transformer.js');
} catch (e) {
  // In test environments, require may not be available; we'll fallback later
}

console.log('Sagglni Plus Content Script Loaded');
function mergeAIWithPattern(analysis, aiSuggestions = []) {
  const fields = (analysis && analysis.fields) ? analysis.fields : [];
  return fields.map((f, idx) => {
    const aiSuggestion = (aiSuggestions || []).find(s => s.index === idx || s.name === f.name);
    if (!aiSuggestion) return f;
    // preserve original detection so we can revert if user rejects AI
    const originalDetectedType = f.detectedType;
    const originalDetectionConfidence = f.detectionConfidence || 0;
    const aiConf = aiSuggestion.confidence || 0;
    const currentConf = f.detectionConfidence || 0;
    const chosenConf = Math.max(currentConf, aiConf);
    const chosenType = aiSuggestion.suggestedType || f.detectedType;
    return Object.assign({}, f, { originalDetectedType, originalDetectionConfidence, aiSuggested: aiSuggestion.suggestedType, aiConfidence: aiConf, detectedType: chosenType, detectionConfidence: Math.min(1.0, chosenConf + (currentConf + aiConf) / 4 ) });
  });
}

// Listen for messages from popup/background
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  if (request.action === 'autoFill') {
    handleAutoFill(request.profileId)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep connection open
  }

  if (request.action === 'analyzeForm') {
    try {
      const result = analyzeCurrentForm();
      // send a lightweight payload
      sendResponse({ success: true, fieldCount: result.fields.length, summary: result.summary, fields: result.fields });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
  if (request.action === 'analyzeFormWithAI') {
    try {
      const analyzer = new FormAnalyzer();
      const analysis = analyzer.analyzeForm();
      const fields = analysis.fields;
      // If any field has low confidence, call background AI process
      const needAI = fields.some(f => (f.detectionConfidence || 0) < 0.7);
      if (!needAI) return sendResponse({ success: true, data: analysis, aiUsed: false });
      // Build form HTML (compile outer HTML of forms)
      const form = document.querySelector('form');
      const formHtml = form ? form.outerHTML : document.documentElement.outerHTML;
      // Send to background for AI analysis
      chrome.runtime.sendMessage({ action: 'analyzeFormWithAI', formHtml, fields }, (resp) => {
        if (!resp || !resp.success) return sendResponse({ success: true, data: analysis, aiUsed: false });
        const aiResult = resp.data || { suggestions: [] };
        // Merge suggestions
        const mergedFields = fields.map((f, idx) => {
          const aiSuggestion = (aiResult.suggestions || []).find(s => s.index === idx || s.name === f.name);
          if (!aiSuggestion) return f;
          // increase confidence if AI suggests same type, otherwise compare
          const aiConf = aiSuggestion.confidence || 0;
          const currentConf = f.detectionConfidence || 0;
          if (aiConf > currentConf) {
            return Object.assign({}, f, { aiSuggested: aiSuggestion.suggestedType, aiConfidence: aiConf, detectedType: aiSuggestion.suggestedType, detectionConfidence: Math.min(1.0, aiConf + currentConf / 2) });
          }
          return f;
        });
        const merged = { fields: mergedFields, summary: { totalFields: mergedFields.length, detections: mergedFields.reduce((acc, f) => { acc[f.detectedType] = (acc[f.detectedType] || 0) + 1; return acc; }, {}) }, aiUsed: true };
        return sendResponse({ success: true, data: merged });
      });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
  });
}

/**
 * Fill the active page's form with profile data
 * @param {string} profileId
 */
async function handleAutoFill(profileId) {
  // Get profile via background to ensure correct centralization
  const profileResp = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getProfile', profileId }, (r) => resolve(r));
  });
  if (!profileResp || !profileResp.success) throw new Error('Profile not found');
  const profile = profileResp.data;
  // Analyze current form
  const analysis = analyzeCurrentForm();
  const fields = analysis.fields;
  // Respect AI per-field preferences saved in settings (chrome.storage.local)
  const settings = await new Promise((resolve) => {
    try {
      chrome.storage.local.get(['settings'], (r) => resolve(r?.settings || {}));
    } catch (e) { resolve({}); }
  });
  const prefs = (settings && settings.aiFieldPreferences) ? settings.aiFieldPreferences : {};

  let filledCount = 0;
  const results = [];
  let skippedCount = 0;
  let failedCount = 0;

  const startTime = Date.now();
  for (const field of fields) {
    // If AI suggestion is present but user explicitly rejected, revert to original detection
    if (field.aiSuggested && Object.prototype.hasOwnProperty.call(prefs, field.name) && prefs[field.name] === false) {
      if (field.originalDetectedType) {
        field.detectedType = field.originalDetectedType;
        field.detectionConfidence = field.originalDetectionConfidence || field.detectionConfidence || 0;
      }
    }
    try {
      const detectedType = field.detectedType;
      if ((field.detectionConfidence || 0) < 0.5) {
        results.push({ fieldName: field.name, status: 'skipped', reason: 'low-confidence' });
        skippedCount++;
        continue;
      }
      let value = mapProfileToField(profile, detectedType);
      if (!value) {
        results.push({ fieldName: field.name, status: 'skipped', reason: 'no mapping' });
        skippedCount++;
        continue;
      }
      // Transform value based on detected type and format
      let transformed = value;
      try {
        transformed = await new DataTransformer().transformData(value, detectedType, field.detectedFormat);
      } catch (tErr) {
        console.warn('Transformer error, falling back to original value', tErr);
      }

      const ok = fillFieldAdvanced(field, transformed);
      if (ok) {
        filledCount++;
        results.push({ fieldName: field.name, status: 'filled', value: transformed });
      } else {
        results.push({ fieldName: field.name, status: 'skipped', reason: 'fill failed' });
        skippedCount++;
      }
    } catch (err) {
      console.warn('Failed field fill: ', err);
      results.push({ fieldName: field.name, status: 'failed', error: err.message });
      failedCount++;
    }
  }

  const fillDurationMs = Date.now() - startTime;
  return { filledCount, totalFields: fields.length, skippedCount, failedCount, details: results, formInfo: analysis.formInfo, fillDurationMs };
}

/** Exposed helper that runs analyzer and returns detailed analysis */
function analyzeCurrentForm() {
  const analyzer = new FormAnalyzer();
  const start = Date.now();
  const analysis = analyzer.analyzeForm();
  const durationMs = Date.now() - start;
  // Attach form info heuristics: attempt to find job title/company on page
  const pageTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title || '';
  const company = document.querySelector('meta[name="company"]')?.getAttribute('content') || '';
  return { ...analysis, formInfo: { pageTitle, company }, durationMs };
}

// Removed unused getAllFormFields; analyzer handles collection

// legacy mapping function removed - replaced by mapProfileToField

/**
 * Advanced fill logic that handles select, radio, checkboxes and input
 * @param {Object} field
 * @param {string|any} value
 * @returns {boolean} success
 */
function fillFieldAdvanced(field, value) {
  const el = field.element;
  try {
    if (el.tagName.toLowerCase() === 'select') {
      // Try to match by value or label
      const options = Array.from(el.options);
      let matched = options.find(o => o.value === value || o.text === value || o.textContent === value);
      if (!matched) {
        // try case-insensitive text match
        const valLower = String(value).toLowerCase();
        matched = options.find(o => (o.text || o.textContent || '').toLowerCase() === valLower);
      }
      if (matched) {
        el.value = matched.value;
        dispatchInputEvents(el);
        return true;
      }
      return false;
    }
    if (el.type === 'radio') {
      // find radio options with same name and matching value
      const group = document.querySelectorAll(`input[type=radio][name="${el.name}"]`);
      const match = Array.from(group).find(r => r.value === value || r.value === String(value));
      if (match) {
        match.checked = true;
        dispatchInputEvents(match);
        return true;
      }
      return false;
    }
    if (el.type === 'checkbox') {
      el.checked = !!value;
      dispatchInputEvents(el);
      return true;
    }
    // Default text/textarea/email/phone/date type
    el.value = value;
    dispatchInputEvents(el);
    return true;
  } catch (err) {
    console.error('fillFieldAdvanced error', err);
    return false;
  }
}

function dispatchInputEvents(element) {
  ['input', 'change', 'blur'].forEach(ev => {
    try {
      // create cross-platform event for browser and jsdom
      let eventObj;
      if (typeof Event === 'function') {
        eventObj = new Event(ev, { bubbles: true });
      } else {
        eventObj = document.createEvent('Event');
        eventObj.initEvent(ev, true, true);
      }
      element.dispatchEvent(eventObj);
    } catch (e) { /* ignore event errors */ }
  });
}

// analyzeCurrentForm removed - analyzer used directly where required

/** Map a profile object to a detected type to obtain a value */
function mapProfileToField(profile, detectedType) {
  if (!profile || !profile.data || !profile.data.personalInfo) return null;
  const pi = profile.data.personalInfo;
  switch (detectedType) {
    case 'firstName': return pi.firstName || '';
    case 'lastName': return pi.lastName || '';
    case 'email': return pi.email || '';
    case 'phone': return pi.phone || '';
    case 'date':
    case 'dateOfBirth': return pi.dateOfBirth || '';
    default: return null;
  }
}

// For tests and debugging in content script, attach helpers to window
if (typeof window !== 'undefined') {
  window.analyzeCurrentForm = analyzeCurrentForm;
  // For tests, attach helpers
  window.fillFieldAdvanced = fillFieldAdvanced;
  window.mapProfileToField = mapProfileToField;
  window.mergeAIWithPattern = mergeAIWithPattern;
}

// CommonJS export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeCurrentForm, handleAutoFill, fillFieldAdvanced, mapProfileToField, mergeAIWithPattern };
}
