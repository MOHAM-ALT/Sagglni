// Sagglni Plus - Background Service Worker

console.log('Sagglni Plus Background Service Worker Loaded');

// Initialize storage on first install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Sagglni Plus installed!');
  
  // Initialize default storage
  chrome.storage.local.get('profiles', data => {
    if (!data.profiles) {
      chrome.storage.local.set({
        profiles: [],
        settings: {
          aiEnabled: false,
          aiPort: '11434',
          autoFillSpeed: 'normal'
        }
      });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request);
  
  if (request.action === 'saveProfile') {
    saveProfile(request.profile)
      .then(result => sendResponse({success: true, data: result}));
    return true;
  }
  
  if (request.action === 'getProfile') {
    getProfile(request.profileId)
      .then(profile => sendResponse({success: true, data: profile}));
    return true;
  }
});

async function saveProfile(profile) {
  const { profiles } = await chrome.storage.local.get('profiles');
  const existingIndex = (profiles || []).findIndex(p => p.id === profile.id);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  await chrome.storage.local.set({ profiles });
  return profile;
}

async function getProfile(profileId) {
  const { profiles } = await chrome.storage.local.get('profiles');
  return (profiles || []).find(p => p.id === profileId);
}
