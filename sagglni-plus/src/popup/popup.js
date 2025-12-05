/* global parseProfileJSON, validateProfileWithSchema */
// Sagglni Plus - Popup Script

console.log('Sagglni Plus Popup Loaded');
const { buildInterviewPrompt } = require('./prompt-generator');

// Load profiles on startup
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
  await loadSettings();
  setupEventListeners();
  setupProfileModalUI();
});

async function loadProfiles() {
  const select = document.getElementById('profileSelect');
  select.innerHTML = '<option value="">Select Profile...</option>';
  try {
    chrome.runtime.sendMessage({ action: 'getAllProfiles' }, (resp) => {
      if (!resp || !resp.success) return;
      const profiles = resp.data || [];
      profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name;
        select.appendChild(option);
      });
    });
  } catch (err) {
    console.error('Failed to load profiles', err);
  }
}

function toggleAiPref(fieldName, accept, btnAccept, btnReject) {
  window.aiFieldPreferences = window.aiFieldPreferences || {};
  window.aiFieldPreferences[fieldName] = accept;
  // update UI
  if (accept) {
    btnAccept.classList.add('accepted');
    btnAccept.textContent = 'Accepted';
    btnReject.classList.remove('rejected');
    btnReject.textContent = 'Reject';
  } else {
    btnAccept.classList.remove('accepted');
    btnAccept.textContent = 'Accept';
    btnReject.classList.add('rejected');
    btnReject.textContent = 'Rejected';
  }
  // persist to settings
  const settings = { aiEnabled: document.getElementById('aiEnabled').checked, aiFieldPreferences: window.aiFieldPreferences };
  chrome.runtime.sendMessage({ action: 'saveSettings', settings }, (resp) => {
    if (!resp || !resp.success) console.warn('Failed to save AI preference');
  });
}

  async function loadSettings() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (resp) => {
          if (!resp || !resp.success) return resolve({});
          const settings = resp.data || {};
          window.settings = settings;
          window.aiFieldPreferences = settings.aiFieldPreferences || {};
          
          // Load AI settings into UI
          const aiEnabled = document.getElementById('aiEnabled');
          if (aiEnabled) {
            aiEnabled.checked = !!settings.aiEnabled;
            const aiSettings = document.getElementById('aiSettings');
            if (aiSettings) aiSettings.style.display = settings.aiEnabled ? 'block' : 'none';
          }
          
          const aiEngineType = document.getElementById('aiEngineType');
          if (aiEngineType) aiEngineType.value = settings.aiEngineType || 'ollama';
          
          const aiCustomHost = document.getElementById('aiCustomHost');
          if (aiCustomHost) aiCustomHost.value = settings.aiCustomHost || '';
          
          const aiCustomPort = document.getElementById('aiCustomPort');
          if (aiCustomPort) aiCustomPort.value = settings.aiCustomPort || '';
          
          resolve(settings || {});
        });
      } catch (e) { resolve({}); }
    });
  }

function setupEventListeners() {
  document.getElementById('autoFillBtn').addEventListener('click', autoFill);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeForm);
  document.getElementById('newProfileBtn').addEventListener('click', createNewProfile);
  document.getElementById('parseJsonBtn').addEventListener('click', parseProfileJson);
    const genBtn = document.getElementById('generatePromptBtn');
    if (genBtn) genBtn.addEventListener('click', generatePrompt);
    const copyBtn = document.getElementById('copyPromptBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyPromptToClipboard);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfileFromModal);
  document.getElementById('cancelProfileBtn').addEventListener('click', closeProfileModal);
  document.getElementById('profileClose').addEventListener('click', closeProfileModal);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('aiEnabled').addEventListener('change', toggleAISettings);
  // Consent modal handlers
  const consentUse = document.getElementById('aiConsentUseBtn');
  const consentCancel = document.getElementById('aiConsentCancelBtn');
  const consentClose = document.getElementById('aiConsentClose');
  if (consentUse) consentUse.addEventListener('click', () => handleAiConsent(true));
  if (consentCancel) consentCancel.addEventListener('click', () => handleAiConsent(false));
  if (consentClose) consentClose.addEventListener('click', () => handleAiConsent(false));
  const testBtn = document.getElementById('testAIBtn');
  if (testBtn) testBtn.addEventListener('click', testAIConnection);
  document.getElementById('profileSelect').addEventListener('change', enableAutoFill);
  // history actions
  document.addEventListener('DOMContentLoaded', () => loadHistory());
  // Edit profile button element (may be disabled initially)
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) editBtn.addEventListener('click', editSelectedProfile);
}

function showAiConsentModal() {
  const modal = document.getElementById('aiConsentModal');
  if (modal) modal.style.display = 'flex';
}

function closeAiConsentModal() {
  const modal = document.getElementById('aiConsentModal');
  if (modal) modal.style.display = 'none';
}

function handleAiConsent(accepted) {
  const settings = window.settings || {};
  settings.aiConsent = !!accepted;
  // persist
  chrome.runtime.sendMessage({ action: 'saveSettings', settings }, (resp) => {
    if (!resp || !resp.success) console.warn('Failed to save AI consent');
  });
  // close modal
  closeAiConsentModal();
  // optionally proceed if accepted
  if (accepted) {
    showStatus('AI enabled for this session', 'success');
    // re-run analyze to show AI-based results for the current page
    analyzeForm();
  } else {
    showStatus('AI use cancelled', 'info');
  }
}

function setupProfileModalUI() {
  // tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(panel => panel.style.display = 'none');
      const show = document.getElementById(`tab-${target}`);
      if (show) show.style.display = 'block';
    });
  });

  // dynamic education
  document.getElementById('addEducationBtn').addEventListener('click', addEducationItem);
  document.getElementById('addExperienceBtn').addEventListener('click', addExperienceItem);
  document.getElementById('addLanguageBtn').addEventListener('click', addLanguageItem);

  // skills input handlers
  const techInput = document.getElementById('techSkillInput');
  techInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      addSkillTag('technical', techInput.value.trim());
      techInput.value = '';
    }
  });
  const softInput = document.getElementById('softSkillInput');
  softInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      addSkillTag('soft', softInput.value.trim());
      softInput.value = '';
    }
  });

  // inline validation helpers will be defined outside
  // Add inline validation listeners for personal info inputs
  const inlineFields = ['#firstName', '#lastName', '#email', '#phone'];
  inlineFields.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', () => validateSingleField(sel));
  });
}

/* Inline validation helpers: valid state */
function setFieldValid(selector, message) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    clearFieldError(selector);
    el.classList.add('field-valid');
    let span = el.nextElementSibling;
    if (span && span.classList && span.classList.contains('input-success')) {
      span.textContent = message || 'Looks good';
    } else {
      span = document.createElement('div');
      span.className = 'input-success';
      span.textContent = message || 'Looks good';
      span.style.color = '#48bb78';
      span.style.fontSize = '12px';
      span.style.marginTop = '4px';
      el.parentNode.insertBefore(span, el.nextSibling);
    }
  } catch (e) { /* ignore */ }
}

function clearFieldValid(selector) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove('field-valid');
    const next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('input-success')) next.remove();
  } catch (e) { /* ignore */ }
}

function validateSingleField(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const id = el.id;
  const val = el.value || '';
  // Clear any prior success/error for immediate start
  clearFieldError(selector);
  clearFieldValid(selector);
  if (id === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val || !emailRegex.test(val.trim())) {
      setFieldError(selector, 'Invalid email address');
      return false;
    }
    setFieldValid(selector, 'Valid email');
    return true;
  }
  if (id === 'phone') {
    if (!val || !/^[+\d\s-()]+$/.test(val.trim())) {
      setFieldError(selector, 'Invalid phone number');
      return false;
    }
    setFieldValid(selector, 'Valid phone');
    return true;
  }
  // default: not empty
  if (!val || val.trim().length === 0) {
    setFieldError(selector, 'This field is required');
    return false;
  }
  setFieldValid(selector, 'Looks good');
  return true;
}

/* Inline field error handling */
function clearFieldError(selector) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove('field-error');
    const next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('input-error')) next.remove();
  } catch (e) { /* ignore DOM errors when elements are not found */ }
}

function setFieldError(selector, message) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    clearFieldError(selector);
    el.classList.add('field-error');
    const span = document.createElement('div');
    span.className = 'input-error';
    span.textContent = message;
    span.style.color = '#e53e3e';
    span.style.fontSize = '12px';
    span.style.marginTop = '4px';
    el.parentNode.insertBefore(span, el.nextSibling);
  } catch (e) { /* ignore DOM errors when inserting error nodes */ }
}

function clearModalFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.input-error').forEach(el => el.remove());
}

function mapAjvErrorToSelector(err) {
  if (!err || !err.instancePath) return null;
  const path = err.instancePath.replace(/^\//, '');
  const parts = path.split('/');
  if (parts[0] === 'data' && parts[1] === 'personalInfo') {
    const field = parts[2];
    switch (field) {
      case 'firstName': return '#firstName';
      case 'lastName': return '#lastName';
      case 'email': return '#email';
      case 'phone': return '#phone';
      case 'dateOfBirth': return '#dateOfBirth';
      case 'gender': return '#gender';
      case 'nationality': return '#nationality';
      case 'city': return '#city';
      case 'postalCode': return '#postalCode';
      default: return null;
    }
  }
  if (parts[0] === 'data' && parts[1] === 'education') {
    const idx = parseInt(parts[2], 10);
    const field = parts[3];
    const base = '#educationList .education-item';
    switch (field) {
      case 'degree': return `${base}:nth-child(${idx + 1}) .edu-degree`;
      case 'field': return `${base}:nth-child(${idx + 1}) .edu-field`;
      case 'university': return `${base}:nth-child(${idx + 1}) .edu-university`;
      default: return `${base}:nth-child(${idx + 1})`;
    }
  }
  if (parts[0] === 'data' && parts[1] === 'experience') {
    const idx = parseInt(parts[2], 10);
    const field = parts[3];
    const base = '#experienceList .experience-item';
    switch (field) {
      case 'jobTitle': return `${base}:nth-child(${idx + 1}) .exp-jobTitle`;
      case 'company': return `${base}:nth-child(${idx + 1}) .exp-company`;
      default: return `${base}:nth-child(${idx + 1})`;
    }
  }
  return null;
}

function showAjvErrors(ajvErrors) {
  clearModalFieldErrors();
  if (!Array.isArray(ajvErrors)) return;
  ajvErrors.forEach(err => {
    const sel = mapAjvErrorToSelector(err);
    const message = `${(err.instancePath || '').replace(/\//g, '.') || (err.params && err.params.missingProperty) || 'field'} ${err.message}`;
    if (sel) {
      setFieldError(sel, message);
    }
  });
}

function addSkillTag(type, value) {
  if (!value) return;
  const container = type === 'technical' ? document.getElementById('technicalSkills') : document.getElementById('softSkills');
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.innerHTML = `<span class="tag-text">${escapeHtml(value)}</span><button class="remove-btn" title="Remove">x</button>`;
  tag.querySelector('.remove-btn').addEventListener('click', () => tag.remove());
  container.appendChild(tag);
}

function addEducationItem(data) {
  const template = document.getElementById('educationTemplate');
  const container = document.getElementById('educationList');
  const clone = template.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.display = 'block';
  clone.classList.add('education-item');
  // fill if data provided
  if (data) {
    clone.querySelector('.edu-degree').value = data.degree || '';
    clone.querySelector('.edu-field').value = data.field || '';
    clone.querySelector('.edu-university').value = data.university || '';
    clone.querySelector('.edu-country').value = data.country || '';
    clone.querySelector('.edu-startYear').value = data.startYear || '';
    clone.querySelector('.edu-graduationYear').value = data.graduationYear || '';
    clone.querySelector('.edu-gpa').value = data.gpa || '';
    clone.querySelector('.edu-stillAttending').checked = !!data.stillAttending;
  }
  clone.querySelector('.removeEducationBtn').addEventListener('click', () => clone.remove());
  container.appendChild(clone);
}

function addExperienceItem(data) {
  const template = document.getElementById('experienceTemplate');
  const container = document.getElementById('experienceList');
  const clone = template.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.display = 'block';
  clone.classList.add('experience-item');
  if (data) {
    clone.querySelector('.exp-jobTitle').value = data.jobTitle || '';
    clone.querySelector('.exp-company').value = data.company || '';
    clone.querySelector('.exp-startDate').value = data.startDate || '';
    clone.querySelector('.exp-endDate').value = data.endDate || '';
    clone.querySelector('.exp-currentlyWorking').checked = !!data.currentlyWorking;
    clone.querySelector('.exp-description').value = data.description || '';
  }
  clone.querySelector('.removeExperienceBtn').addEventListener('click', () => clone.remove());
  container.appendChild(clone);
}

function addLanguageItem(data) {
  const template = document.getElementById('languageTemplate');
  const container = document.getElementById('languagesList');
  const clone = template.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.display = 'block';
  clone.classList.add('language-item');
  if (data) {
    clone.querySelector('.lang-name').value = data.language || '';
    clone.querySelector('.lang-level').value = data.level || 'basic';
  }
  clone.querySelector('.removeLanguageBtn').addEventListener('click', () => clone.remove());
  container.appendChild(clone);
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

async function autoFill() {
  const profileId = document.getElementById('profileSelect').value;
  if (!profileId) {
    showStatus('Please select a profile first!', 'error');
    return;
  }
  showStatus('Filling form...', 'loading');
  chrome.runtime.sendMessage({ action: 'autoFill', profileId }, (resp) => {
    if (resp && resp.success) {
      const total = resp.data?.totalFields || 0;
      const filled = resp.data?.filledCount || resp.data?.filledFields || 0;
      const skipped = resp.data?.skippedCount || 0;
      const failed = resp.data?.failedCount || 0;
      showStatus(`Filled ${filled}/${total} fields ✅` + (skipped ? ` • Skipped: ${skipped}` : '') + (failed ? ` • Failed: ${failed}` : ''), 'success');
      // Optionally show details in the profile errors area
      const detail = document.getElementById('profileErrors');
      if (resp.data?.details && resp.data.details.length > 0) {
        detail.textContent = resp.data.details.map(d => `${d.fieldName}: ${d.status}${d.reason ? ' (' + d.reason + ')' : ''}${d.error ? ' - ' + d.error : ''}`).join('; ');
        detail.className = 'status status-info';
      } else {
        detail.textContent = '';
      }
      loadHistory();
    } else {
      showStatus(`Error filling form: ${resp?.error || 'unknown'}`, 'error');
    }
  });
}

function analyzeForm() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.classList.add('loading'); }
  showStatus('Analyzing form...', 'loading');
  const aiEnabled = document.getElementById('aiEnabled')?.checked;
  // If AI is enabled but user hasn't consented, show consent modal
  if (aiEnabled && !(window.settings && window.settings.aiConsent === true)) {
    showAiConsentModal();
    showStatus('Awaiting AI consent…', 'info');
    if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }
    return;
  }

  chrome.runtime.sendMessage({ action: 'analyzeForm' }, (response) => {
    try {
      const aiResultDiv = document.getElementById('aiAnalysisResult');
      const aiFieldsList = document.getElementById('aiFieldsList');
      if (response && response.success) {
        const count = response.fieldCount || (response.data && response.data.fields && response.data.fields.length) || 0;
        showStatus(`Found ${count} fields on this page`, 'success');
        const aiUsed = response.aiUsed || (response.data && response.data.aiUsed);
        if (aiUsed) {
          aiFieldsList.innerHTML = '';
          const fields = (response.data && response.data.fields) || response.fields || [];
          fields.forEach(f => {
            if (f.aiSuggested || f.aiConfidence) {
              const r = document.createElement('div');
              r.className = 'ai-field-row';
              const pref = (window.aiFieldPreferences && window.aiFieldPreferences[f.name]) ? window.aiFieldPreferences[f.name] : null;
              r.innerHTML = `<b>${escapeHtml(f.name || f.label || '')}</b> — Detected: ${escapeHtml(f.detectedType || '')} (${(f.detectionConfidence||0).toFixed(2)}) ${f.aiSuggested ? '<span class="ai-suggest">• AI: ' + escapeHtml(f.aiSuggested) + ' (' + (f.aiConfidence||0).toFixed(2) + ')</span>' : ''}`;
              // add accept / reject buttons
              const btnAccept = document.createElement('button');
              btnAccept.className = 'btn btn-small ai-accept';
              btnAccept.textContent = pref === true ? 'Accepted' : 'Accept';
              if (pref === true) btnAccept.classList.add('accepted');
              const btnReject = document.createElement('button');
              btnReject.className = 'btn btn-small ai-reject';
              btnReject.textContent = pref === false ? 'Rejected' : 'Reject';
              if (pref === false) btnReject.classList.add('rejected');
              btnAccept.addEventListener('click', () => toggleAiPref(f.name, true, btnAccept, btnReject));
              btnReject.addEventListener('click', () => toggleAiPref(f.name, false, btnAccept, btnReject));
              const wrapper = document.createElement('div');
              wrapper.style.display = 'flex';
              wrapper.style.gap = '8px';
              wrapper.appendChild(btnAccept);
              wrapper.appendChild(btnReject);
              const container = document.createElement('div');
              container.style.display = 'flex';
              container.style.justifyContent = 'space-between';
              container.appendChild(r);
              container.appendChild(wrapper);
              aiFieldsList.appendChild(container);
            }
          });
          aiResultDiv.style.display = 'block';
          // if first time use, ensure aiFieldPreferences exists locally
          window.aiFieldPreferences = window.aiFieldPreferences || {};
        } else {
          aiResultDiv.style.display = 'none';
        }
      } else {
        showStatus('Failed to analyze form', 'error');
      }
    } catch (e) {
      showStatus('Failed to analyze form', 'error');
    } finally {
      if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }
    }
  });
}

function loadHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = '<div>Loading history...</div>';
  chrome.runtime.sendMessage({ action: 'getApplicationHistory' }, (resp) => {
    if (!resp || !resp.success) { list.innerHTML = '<div>No history</div>'; return; }
    const data = resp.data || [];
    if (data.length === 0) { list.innerHTML = '<div>No history</div>'; return; }
    list.innerHTML = '';
    data.slice(0, 20).forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `<div><b>${item.formInfo.pageTitle || item.formInfo.websiteUrl}</b></div>
        <div>${item.dateApplied} - ${item.fillResult.filledFields}/${item.fillResult.totalFields}</div>
        <div>Profile: ${item.profileId || 'N/A'}</div>
        <div><button class='btn btn-link' data-id='${item.id}'>Delete</button></div>`;
      const btn = row.querySelector('button');
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'deleteApplicationRecord', recordId: item.id }, (r) => { if (r?.success) loadHistory(); });
      });
      list.appendChild(row);
    });
  });
}

function createNewProfile() {
  // Open modal for profile creation/import and clear existing values
  fillModalFieldsFromObject({ name: '', data: { personalInfo: {} } });
  const modal = document.getElementById('profileModal');
  if (modal?.dataset?.editingId) delete modal.dataset.editingId;
}

function openProfileModal() {
  const modal = document.getElementById('profileModal');
  modal.style.display = 'flex';
  document.getElementById('profileErrors').textContent = '';
  // Reset editing id when opening a new modal
  if (modal.dataset.editingId) delete modal.dataset.editingId;
  // default to personal tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const pTab = document.querySelector('.tab[data-tab="personal"]');
  if (pTab) pTab.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(panel => panel.style.display = 'none');
  const showPersonal = document.getElementById('tab-personal');
  if (showPersonal) showPersonal.style.display = 'block';
  // ensure there's at least one education/experience entry available
  if (document.getElementById('educationList') && document.getElementById('educationList').children.length === 0) addEducationItem();
  if (document.getElementById('experienceList') && document.getElementById('experienceList').children.length === 0) addExperienceItem();
  // focus the first input for accessibility
  setTimeout(() => { try { const el = document.getElementById('firstName'); if (el) el.focus(); } catch (e) { console.warn('Failed to focus modal input', e && e.message); } }, 50);
  // add Escape key handler to close modal
  const escHandler = (e) => { if (e.key === 'Escape') closeProfileModal(); };
  document.addEventListener('keydown', escHandler);
  // remove handler when closing
  const removeHandler = () => { document.removeEventListener('keydown', escHandler); modal.removeEventListener('transitionend', removeHandler); };
  if (modal) modal.addEventListener('transitionend', removeHandler);
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  modal.style.display = 'none';
}

function fillModalFieldsFromObject(profile, aiFieldMap = {}) {
  document.getElementById('profileName').value = profile.name || '';
  const pi = profile.data?.personalInfo || {};
  document.getElementById('firstName').value = pi.firstName || '';
  document.getElementById('lastName').value = pi.lastName || '';
  document.getElementById('email').value = pi.email || '';
  document.getElementById('phone').value = pi.phone || '';
  document.getElementById('dateOfBirth').value = pi.dateOfBirth || '';
  document.getElementById('gender').value = pi.gender || '';
  document.getElementById('nationality').value = pi.nationality || '';
  document.getElementById('city').value = pi.city || '';
  document.getElementById('postalCode').value = pi.postalCode || '';
  // clear any existing ai badges
  document.querySelectorAll('.field-ai-badge').forEach(b => b.remove());
  // clear previous AI suggested visual markers
  document.querySelectorAll('.ai-suggested').forEach(e => e.classList.remove('ai-suggested'));
  // education
  const education = profile.data?.education || [];
  document.getElementById('educationList').innerHTML = '';
  education.forEach(e => addEducationItem(e));
  // experience
  const experience = profile.data?.experience || [];
  document.getElementById('experienceList').innerHTML = '';
  experience.forEach(x => addExperienceItem(x));
  // skills
  const skills = profile.data?.skills || { technical: [], soft: [] };
  document.getElementById('technicalSkills').innerHTML = '';
  (skills.technical || []).forEach(t => addSkillTag('technical', t));
  document.getElementById('softSkills').innerHTML = '';
  (skills.soft || []).forEach(s => addSkillTag('soft', s));
  // languages
  const langs = profile.data?.languages || [];
  document.getElementById('languagesList').innerHTML = '';
  langs.forEach(l => addLanguageItem(l));
  // preferences
  const pref = profile.data?.workPreferences || {};
  document.getElementById('targetPositions').value = pref.targetPositions || '';
  document.getElementById('willingToRelocate').checked = !!pref.willingToRelocate;
  document.getElementById('willingToTravel').checked = !!pref.willingToTravel;
  document.getElementById('maxTravelPercentage').value = pref.maxTravelPercentage || '';
  document.getElementById('employmentTypes').value = (pref.employmentTypes || []).join(', ');
  // Show modal
  openProfileModal();

  // attach ai badges for fields that were AI sourced
  Object.keys(aiFieldMap || {}).forEach(fn => {
    const el = document.querySelector(`#${fn}`);
    if (el) {
      const badge = document.createElement('span');
      badge.className = 'field-ai-badge ai-badge';
      badge.textContent = '🤖 AI';
      el.parentNode.insertBefore(badge, el.nextSibling);
      // mark fields visually as AI-suggested
      el.classList.add('ai-suggested');
    }
  });
}

/* parseProfileJson moved below (updated implementation) */
// prompt generator already loaded above

function generatePrompt() {
  const profile = gatherModalProfileData();
  const modelType = window.settings?.aiEngineType || 'ollama';
  const prompt = buildInterviewPrompt(profile, { 
    modelType: modelType === 'lmstudio' ? 'lmstudio' : 'default',
    concise: false 
  });
  const textarea = document.getElementById('generatedPrompt');
  if (textarea) {
    textarea.value = prompt;
    textarea.focus();
    showStatus('✅ Interview prompt generated! Copy to clipboard to use with ChatGPT, Claude, or other AI.', 'success');
  }
}

function copyPromptToClipboard() {
  const textarea = document.getElementById('generatedPrompt');
  if (!textarea || !textarea.value) {
    showStatus('⚠️ No prompt to copy. Generate a prompt first.', 'error');
    return;
  }
  
  // Use modern Clipboard API if available, fallback to older method
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textarea.value)
      .then(() => {
        showStatus('✅ Prompt copied to clipboard! Paste it into ChatGPT, Claude, or your favorite AI.', 'success');
      })
      .catch(() => {
        // Fallback to old method
        fallbackCopyToClipboard(textarea);
      });
  } else {
    fallbackCopyToClipboard(textarea);
  }
}

function fallbackCopyToClipboard(textarea) {
  try {
    textarea.select();
    if (document.execCommand('copy')) {
      showStatus('✅ Prompt copied to clipboard! Paste it into ChatGPT, Claude, or your favorite AI.', 'success');
    } else {
      showStatus('❌ Failed to copy prompt. Try selecting and copying manually.', 'error');
    }
  } catch (err) {
    showStatus('❌ Failed to copy prompt. Try selecting and copying manually.', 'error');
  }
}

async function parseProfileJson() {
  // Lightweight parse handler. Uses existing helpers.
  const raw = document.getElementById('aiJson').value;
  const errorsDiv = document.getElementById('profileErrors');
  errorsDiv.textContent = '';
  errorsDiv.className = '';

  // Check if input is empty
  if (!raw || raw.trim().length === 0) {
    errorsDiv.textContent = '⚠️ Please paste JSON data in the textarea above';
    errorsDiv.className = 'status status-error';
    return;
  }

  try {
    // Parse the JSON
    const parsed = parseProfileJSON(raw);
    
    // Ensure we have a proper profile structure
    const profile = parsed.id && parsed.data ? parsed : { data: parsed };

    // Validate against schema
    const sv = validateProfileWithSchema(profile);
    
    if (!sv.isValid) {
      const messages = sv.errors || [];
      
      // Add AJV error messages if available
      if (sv.ajvErrors && sv.ajvErrors.length > 0) {
        const ajvMsgs = sv.ajvErrors.map(e => {
          const path = (e.instancePath || '').replace(/\//g, '.') || e.params?.missingProperty || 'field';
          return `${path}: ${e.message}`;
        });
        messages.push(...ajvMsgs);
        showAjvErrors(sv.ajvErrors);
      }

      errorsDiv.textContent = '❌ Validation failed: ' + messages.join('; ');
      errorsDiv.className = 'status status-error';
      return;
    }

    // Success: populate the form fields
    const aiFieldMap = parsed.aiFieldMap || parsed.meta?.aiFieldMap || {};
    fillModalFieldsFromObject(profile, aiFieldMap);
    
    // Clear editing ID if this is a new import
    const modal = document.getElementById('profileModal');
    if (modal?.dataset?.editingId) delete modal.dataset.editingId;
    
    errorsDiv.textContent = '✅ JSON parsed successfully! You can now edit values and save the profile.';
    errorsDiv.className = 'status status-success';
    
    // Scroll to show the success message
    errorsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (err) {
    errorsDiv.textContent = '❌ Error: ' + (err.message || 'Invalid JSON');
    errorsDiv.className = 'status status-error';
  }
}

async function saveProfileFromModal() {
  const collected = gatherModalProfileData();
  const name = collected.name || 'My Profile';
  const data = collected.data || {};
  const validation = validateProfileWithSchema({ name, data });
  const errorsDiv = document.getElementById('profileErrors');
  errorsDiv.textContent = '';
  if (!validation.isValid) {
    errorsDiv.className = 'status status-error';
    errorsDiv.textContent = validation.errors.join('; ');
    if (validation.ajvErrors && validation.ajvErrors.length > 0) showAjvErrors(validation.ajvErrors);
    return;
  }
  const profile = { name, data };
  const modal = document.getElementById('profileModal');
  const editingId = modal?.dataset?.editingId;
  if (editingId) {
    profile.id = editingId;
    delete modal.dataset.editingId;
  }
  profile.updatedAt = new Date().toISOString();
  showStatus('Saving profile...', 'loading');
  chrome.runtime.sendMessage({ action: 'saveProfile', profile }, (resp) => {
    if (resp?.success) {
      showStatus('Profile saved ✅', 'success');
      closeProfileModal();
      loadProfiles();
    } else {
      errorsDiv.textContent = resp?.error || 'Failed to save profile';
      errorsDiv.className = 'status status-error';
      showStatus('Failed to save profile', 'error');
    }
  });
}

function gatherModalProfileData() {
  const name = document.getElementById('profileName').value || 'My Profile';
  const pi = {
    firstName: document.getElementById('firstName').value || '',
    lastName: document.getElementById('lastName').value || '',
    email: document.getElementById('email').value || '',
    phone: document.getElementById('phone').value || '',
    dateOfBirth: document.getElementById('dateOfBirth').value || null,
    gender: document.getElementById('gender').value || null,
    nationality: document.getElementById('nationality').value || null,
    city: document.getElementById('city').value || null,
    postalCode: document.getElementById('postalCode').value || null
  };
  const education = Array.from(document.querySelectorAll('#educationList .education-item')).map(item => ({
    id: item.dataset.id || undefined,
    degree: item.querySelector('.edu-degree').value || '',
    field: item.querySelector('.edu-field').value || '',
    university: item.querySelector('.edu-university').value || '',
    country: item.querySelector('.edu-country').value || '',
    startYear: parseInt(item.querySelector('.edu-startYear').value) || undefined,
    graduationYear: parseInt(item.querySelector('.edu-graduationYear').value) || undefined,
    gpa: item.querySelector('.edu-gpa').value || undefined,
    stillAttending: !!item.querySelector('.edu-stillAttending').checked
  }));
  const experience = Array.from(document.querySelectorAll('#experienceList .experience-item')).map(item => ({
    id: item.dataset.id || undefined,
    jobTitle: item.querySelector('.exp-jobTitle').value || '',
    company: item.querySelector('.exp-company').value || '',
    startDate: item.querySelector('.exp-startDate').value || undefined,
    endDate: item.querySelector('.exp-endDate').value || undefined,
    currentlyWorking: !!item.querySelector('.exp-currentlyWorking').checked,
    description: item.querySelector('.exp-description').value || ''
  }));
  const skills = {
    technical: Array.from(document.querySelectorAll('#technicalSkills .tag .tag-text')).map(n => n.textContent),
    soft: Array.from(document.querySelectorAll('#softSkills .tag .tag-text')).map(n => n.textContent)
  };
  const languages = Array.from(document.querySelectorAll('#languagesList .language-item')).map(item => ({
    language: item.querySelector('.lang-name').value || '',
    level: item.querySelector('.lang-level').value || 'basic'
  }));
  const preferences = {
    targetPositions: document.getElementById('targetPositions').value || '',
    willingToRelocate: !!document.getElementById('willingToRelocate').checked,
    willingToTravel: !!document.getElementById('willingToTravel').checked,
    maxTravelPercentage: parseInt(document.getElementById('maxTravelPercentage').value) || 0,
    employmentTypes: document.getElementById('employmentTypes').value ? document.getElementById('employmentTypes').value.split(',').map(s => s.trim()).filter(Boolean) : []
  };
  return {
    name,
    data: {
      personalInfo: pi,
      education: education,
      experience: experience,
      skills: skills,
      languages: languages,
      workPreferences: preferences
    }
  };
}


async function editSelectedProfile() {
  const profileId = document.getElementById('profileSelect').value;
  if (!profileId) return;
  chrome.runtime.sendMessage({ action: 'getProfile', profileId }, (resp) => {
    if (!resp || !resp.success || !resp.data) return showStatus('Failed to load profile', 'error');
    const profile = resp.data;
    fillModalFieldsFromObject(profile);
    const modal = document.getElementById('profileModal');
    modal.dataset.editingId = profile.id;
  });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

function toggleAISettings() {
  const aiSettings = document.getElementById('aiSettings');
  const aiEnabled = document.getElementById('aiEnabled').checked;
  if (aiEnabled) {
    aiSettings.style.display = 'block';
    // Load settings from storage
    chrome.runtime.sendMessage({ action: 'getSettings' }, (resp) => {
      if (resp && resp.success) {
        const settings = resp.data || {};
        document.getElementById('aiEngineType').value = settings.aiEngineType || 'ollama';
        document.getElementById('aiCustomHost').value = settings.aiCustomHost || '';
        document.getElementById('aiCustomPort').value = settings.aiCustomPort || '';
      }
    });
  } else {
    aiSettings.style.display = 'none';
  }
}

function testAIConnection() {
  const aiEngineType = document.getElementById('aiEngineType').value;
  const aiCustomHost = document.getElementById('aiCustomHost').value || '';
  const aiCustomPort = document.getElementById('aiCustomPort').value || '';
  const statusDiv = document.getElementById('aiStatus');
  const testBtn = document.getElementById('testAIBtn');
  const hostError = document.getElementById('popupHostError');
  const portError = document.getElementById('popupPortError');
  
  // Clear previous errors
  hostError.style.display = 'none';
  portError.style.display = 'none';

  // Save settings first
  const settings = {
    aiEnabled: true,
    aiEngineType,
    aiCustomHost: aiCustomHost.trim(),
    aiCustomPort: aiCustomPort.trim()
  };
  
  // Load all current settings
  chrome.runtime.sendMessage({ action: 'getSettings' }, (resp) => {
    if (resp && resp.success) {
      const allSettings = Object.assign({}, resp.data || {}, settings);
      
      if (testBtn) { testBtn.disabled = true; testBtn.classList.add('loading'); }
      statusDiv.textContent = '🔄 Testing connection...';
      statusDiv.className = 'status status-info';
      statusDiv.style.display = 'block';
      
      // Save settings and test
      chrome.runtime.sendMessage({ action: 'saveSettings', settings: allSettings }, (saveResp) => {
        // Now test
        chrome.runtime.sendMessage({ action: 'testAI' }, (resp) => {
          if (!resp || !resp.success) {
            statusDiv.textContent = '❌ AI not available';
            statusDiv.className = 'status status-error';
            if (testBtn) { testBtn.disabled = false; testBtn.classList.remove('loading'); }
            return;
          }
          const d = resp.data || {};
          if (d.aiAvailable) {
            const host = d.host || aiCustomHost || 'localhost';
            const port = d.port || aiCustomPort || 11434;
            statusDiv.textContent = `✅ ${d.type || aiEngineType} @ ${host}:${port} - Connected!`;
            statusDiv.className = 'status status-success';
          } else {
            statusDiv.textContent = '❌ AI not available. Check host and port.';
            statusDiv.className = 'status status-error';
          }
          if (testBtn) { testBtn.disabled = false; testBtn.classList.remove('loading'); }
        });
      });
    }
  });
}

function enableAutoFill() {
  const btn = document.getElementById('autoFillBtn');
  btn.disabled = !document.getElementById('profileSelect').value;
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) editBtn.disabled = !document.getElementById('profileSelect').value;
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status status-${type}`;
}
