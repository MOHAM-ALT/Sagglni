// Storage Manager - Handles all data persistence

class StorageManager {
  constructor() {
    this.storageKey = 'sagglni_data';
  }
  
  async saveProfile(profile) {
    const { profiles = [] } = await this.getAllProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    
    await chrome.storage.local.set({ profiles });
    return profile;
  }
  
  async getProfile(profileId) {
    const { profiles = [] } = await this.getAllProfiles();
    return profiles.find(p => p.id === profileId);
  }
  
  async getAllProfiles() {
    return await chrome.storage.local.get('profiles');
  }
  
  async deleteProfile(profileId) {
    const { profiles = [] } = await this.getAllProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    await chrome.storage.local.set({ profiles: filtered });
  }
  
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }
  
  async getSettings() {
    const { settings } = await chrome.storage.local.get('settings');
    return settings || {};
  }
  
  async clearAllData() {
    await chrome.storage.local.clear();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
