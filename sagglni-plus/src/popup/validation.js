/**
 * Validation utilities for profile import
 * These helpers strip AI-markers, parse JSON, and validate profile structure
 */

/**
 * Strip START/END markers if present and return JSON string
 * @param {string} raw
 * @returns {string}
 */
function stripMarkers(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  const start = '===== START PROFILE DATA =====';
  const end = '===== END PROFILE DATA =====';
  let s = raw.trim();
  if (s.includes(start) && s.includes(end)) {
    const i = s.indexOf(start) + start.length;
    const j = s.indexOf(end);
    return s.substring(i, j).trim();
  }
  return s;
}

/**
 * Parse a JSON string; throws an Error on invalid JSON
 * @param {string} raw
 * @returns {Object}
 */
function parseProfileJSON(raw) {
  const cleaned = stripMarkers(raw);
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    // try to guess if user pasted invalid JSON (like single quotes), provide more info
    throw new Error('Invalid JSON format. Please ensure the data is valid JSON and includes the required fields.');
  }
}

/**
 * Validates a profile JSON and returns { isValid, errors }
 * Minimal validation checks personalInfo firstName, lastName, email, phone
 * @param {Object} profile
 * @returns {{isValid:boolean, errors:Array<string>}}
 */
function validateProfile(profile) {
  const errors = [];
  if (!profile) return { isValid: false, errors: ['Profile is empty'] };
  const personalInfo = profile.personalInfo || profile.data?.personalInfo;
  if (!personalInfo) {
    errors.push('Missing personalInfo section');
    return { isValid: false, errors };
  }
  if (!personalInfo.firstName || personalInfo.firstName.trim().length === 0) errors.push('First name is required');
  if (!personalInfo.lastName || personalInfo.lastName.trim().length === 0) errors.push('Last name is required');
  if (!personalInfo.email || personalInfo.email.trim().length === 0) errors.push('Email is required');
  else {
    const email = personalInfo.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) errors.push('Invalid email format');
  }
  if (!personalInfo.phone || personalInfo.phone.trim().length === 0) errors.push('Phone is required');
  // phone basic check
  if (personalInfo.phone && !/^[+\d\s-()]+$/.test(personalInfo.phone)) errors.push('Invalid phone format');

  return { isValid: errors.length === 0, errors };
}

// Expose functions for popup usage and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { stripMarkers, parseProfileJSON, validateProfile };
}

// Make global for browser popup scripts
if (typeof window !== 'undefined') {
  window.validateProfile = validateProfile;
  window.parseProfileJSON = parseProfileJSON;
  window.stripMarkers = stripMarkers;
}
