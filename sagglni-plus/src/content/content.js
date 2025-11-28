/* global FormAnalyzer, DataTransformer */
// Sagglni Plus - Content Script
// Runs on every webpage

import FormAnalyzer from '../analyzer/analyzer.js';
import DataTransformer from '../transformer/transformer.js';

console.log('Sagglni Plus Content Script Loaded');

// Listen for messages from popup/background
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
      const analyzer = new FormAnalyzer();
      const result = analyzer.analyzeForm();
      sendResponse({ success: true, ...result });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
});

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
  const analyzer = new FormAnalyzer();
  const analysis = analyzer.analyzeForm();
  const fields = analysis.fields;

  let filledCount = 0;
  const results = [];

  for (const field of fields) {
    try {
      const detectedType = field.detectedType;
      let value = mapProfileToField(profile, detectedType);
      if (!value) {
        results.push({ fieldName: field.name, status: 'skipped' });
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
        results.push({ fieldName: field.name, status: 'skipped' });
      }
    } catch (err) {
      console.warn('Failed field fill: ', err);
      results.push({ fieldName: field.name, status: 'failed', error: err.message });
    }
  }

  return { filledCount, totalFields: fields.length, details: results };
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
  ['input', 'change', 'blur'].forEach(ev => element.dispatchEvent(new Event(ev, { bubbles: true })));
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
