/* global parseProfileJSON, validateProfile, validateProfileWithSchema */
// Sagglni Plus - Popup Script

console.log('Sagglni Plus Popup Loaded');

// Load profiles on startup
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
  setupEventListeners();
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
  document.getElementById('profileClose').addEventListener('click', closeProfileModal);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('aiEnabled').addEventListener('change', toggleAISettings);
  document.getElementById('profileSelect').addEventListener('change', enableAutoFill);
  // Edit profile button element (may be disabled initially)
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) editBtn.addEventListener('click', editSelectedProfile);
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
  // Open modal for profile creation/import
  openProfileModal();
  const name = '';
  if (!name) return;
  const firstName = prompt('First Name:') || '';
  const lastName = prompt('Last Name:') || '';
  const email = prompt('Email:') || '';
  const phone = prompt('Phone (include country code):') || '';
  const profile = {
    name,
    data: {
      personalInfo: {
        firstName,
        lastName,
        email,
        phone
      }
    }
  };
  // Save now via modal (the save function handles sendMessage)
  fillModalFieldsFromObject(profile);
}

function openProfileModal() {
  const modal = document.getElementById('profileModal');
  modal.style.display = 'flex';
  document.getElementById('profileErrors').textContent = '';
  // Reset editing id when opening a new modal
  if (modal.dataset.editingId) delete modal.dataset.editingId;
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
  const name = document.getElementById('profileName').value || 'My Profile';
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const data = { personalInfo: { firstName, lastName, email, phone } };

  const validation = validateProfile(data);
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
