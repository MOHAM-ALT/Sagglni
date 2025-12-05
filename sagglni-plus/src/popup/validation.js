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
 * Handles markers and error cases gracefully
 * @param {string} raw
 * @returns {Object}
 */
function parseProfileJSON(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Invalid input: expected a JSON string');
  }

  const cleaned = stripMarkers(raw);
  
  // Check if cleaned string is empty
  if (!cleaned || cleaned.trim().length === 0) {
    throw new Error('JSON input is empty. Please paste valid JSON data.');
  }

  try {
    const parsed = JSON.parse(cleaned);
    
    // Validate that parsed result is an object (not an array)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('JSON must be an object, not ' + (Array.isArray(parsed) ? 'array' : typeof parsed));
    }
    
    return parsed;
  } catch (err) {
    // Provide helpful error messages based on the error
    if (err instanceof SyntaxError) {
      const match = err.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const preview = cleaned.substring(Math.max(0, pos - 20), Math.min(cleaned.length, pos + 20));
        throw new Error(`JSON syntax error near: "${preview}". Please check JSON format and use double quotes for keys and strings.`);
      }
      throw new Error('Invalid JSON format. Please ensure all strings use double quotes, not single quotes. ' + err.message);
    }
    // Fallback error message
    throw new Error('Invalid JSON format. Please ensure the data is valid JSON and includes the required fields. ' + (err.message || ''));
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

// AJV-based Schema validation
let Ajv;
try {
  Ajv = typeof window !== 'undefined' && window.Ajv ? window.Ajv : require('ajv');
} catch (e) {
  Ajv = undefined; // not available in this environment
}

const PROFILE_SCHEMA = require('../schema/profileSchema.json');

/**
 * Validate a profile using AJV if available, else the simple validator
 * @param {Object} profile
 * @returns {{isValid:boolean, errors:Array<string>, ajvErrors:Array<Object>}}
 */
function validateProfileWithSchema(profile) {
  if (Ajv) {
      const ajv = new Ajv({ allErrors: true, strict: false });
      try {
        // add formats if available
        const ajvFormats = require('ajv-formats');
        ajvFormats(ajv);
      } catch (err) {
        // ignore if not available in browser
      }
    const validate = ajv.compile(PROFILE_SCHEMA);
    const valid = validate(profile.data ? profile : profile.data || profile);
    if (valid) return { isValid: true, errors: [], ajvErrors: [] };
    const errors = (validate.errors || []).map(err => `${err.instancePath.replace(/\//g, '.') || err.params.missingProperty || ''} ${err.message}`.trim());
    return { isValid: false, errors, ajvErrors: validate.errors };
  }
  // Fallback to lightweight checks
  const v = validateProfile(profile);
  return { isValid: v.isValid, errors: v.errors, ajvErrors: [] };
}

// Expose functions for popup usage and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { stripMarkers, parseProfileJSON, validateProfile, validateProfileWithSchema };
}

// Make global for browser popup scripts
if (typeof window !== 'undefined') {
  window.validateProfile = validateProfile;
  window.parseProfileJSON = parseProfileJSON;
  window.stripMarkers = stripMarkers;
  window.validateProfileWithSchema = validateProfileWithSchema;
}
