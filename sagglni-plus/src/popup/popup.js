/* global parseProfileJSON, validateProfile, validateProfileWithSchema */
// Sagglni Plus - Popup Script

console.log('Sagglni Plus Popup Loaded');

// Load profiles on startup
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
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

function setupEventListeners() {
  document.getElementById('autoFillBtn').addEventListener('click', autoFill);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeForm);
  document.getElementById('newProfileBtn').addEventListener('click', createNewProfile);
  document.getElementById('parseJsonBtn').addEventListener('click', parseProfileJson);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfileFromModal);
  document.getElementById('cancelProfileBtn').addEventListener('click', closeProfileModal);
  document.getElementById('profileClose').addEventListener('click', closeProfileModal);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('aiEnabled').addEventListener('change', toggleAISettings);
  document.getElementById('profileSelect').addEventListener('change', enableAutoFill);
  // Edit profile button element (may be disabled initially)
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) editBtn.addEventListener('click', editSelectedProfile);
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
  
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'autoFill',
    profileId: profileId
  }, response => {
    if (response && response.success) {
      showStatus('Form filled successfully! ✅', 'success');
    } else {
      showStatus('Error filling form', 'error');
    }
  });
}

function analyzeForm() {
  showStatus('Analyzing form...', 'loading');
  
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'analyzeForm'
    }, response => {
      if (response) {
        showStatus(`Found ${response.fieldCount} fields on this page`, 'success');
      }
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
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  modal.style.display = 'none';
}

function fillModalFieldsFromObject(profile) {
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
}

async function parseProfileJson() {
  const raw = document.getElementById('aiJson').value;
  const errorsDiv = document.getElementById('profileErrors');
  errorsDiv.textContent = '';
  try {
    const parsed = parseProfileJSON(raw);
    // Accept both top-level profile object or wrapper { data: {...} }
    const profile = parsed.id && parsed.data ? parsed : { data: parsed };
    // Use AJV schema validator (if available)
    const sv = validateProfileWithSchema(profile);
    if (!sv.isValid) {
      const messages = sv.errors || [];
      // if ajvErrors exist, include details
      if (sv.ajvErrors && sv.ajvErrors.length > 0) {
        const ajvMsgs = sv.ajvErrors.map(e => `${e.instancePath.replace(/\//g, '.') || e.params.missingProperty || 'field'} ${e.message}`);
        messages.push(...ajvMsgs);
      }
      errorsDiv.textContent = messages.join('; ');
      errorsDiv.className = 'status status-error';
      return;
    }
    // Fill modal fields
    fillModalFieldsFromObject(profile);
    // clear editing id
    const modal = document.getElementById('profileModal');
    if (modal?.dataset?.editingId) delete modal.dataset.editingId;
    errorsDiv.textContent = 'Parsed successfully. You may edit values and Save.';
    errorsDiv.className = 'status status-success';
  } catch (err) {
    errorsDiv.textContent = err.message || 'Invalid JSON';
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
  if (document.getElementById('aiEnabled').checked) {
    aiSettings.style.display = 'block';
  } else {
    aiSettings.style.display = 'none';
  }
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
