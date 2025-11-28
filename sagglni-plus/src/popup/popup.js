// Sagglni Plus - Popup Script

console.log('Sagglni Plus Popup Loaded');

// Load profiles on startup
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
  setupEventListeners();
});

async function loadProfiles() {
  const { profiles } = await chrome.storage.local.get('profiles');
  const select = document.getElementById('profileSelect');
  
  if (profiles && profiles.length > 0) {
    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name;
      select.appendChild(option);
    });
  }
}

function setupEventListeners() {
  document.getElementById('autoFillBtn').addEventListener('click', autoFill);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeForm);
  document.getElementById('newProfileBtn').addEventListener('click', createNewProfile);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('aiEnabled').addEventListener('change', toggleAISettings);
  document.getElementById('profileSelect').addEventListener('change', enableAutoFill);
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
  const name = prompt('Enter profile name:');
  if (name) {
    showStatus('Creating profile...', 'loading');
    // TODO: Implement profile creation
  }
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
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status status-${type}`;
}
