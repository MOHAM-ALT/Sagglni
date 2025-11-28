/**
 * StorageManager - centralized storage helper for chrome.storage.local operations
 *
 * Provides a Promise-based wrapper around chrome.storage.local for storing
 * profiles, application history, settings and other metadata.
 *
 * All functions return Promises to simplify async/await usage in the extension.
 */
class StorageManager {
  constructor() {
    this.keys = {
      profiles: 'profiles',
      applicationHistory: 'applicationHistory',
      settings: 'settings',
      metadata: 'metadata'
    };
  }

  /* ----------------------------- Helpers ----------------------------- */
  /**
   * Helper to wrap chrome.storage.local.get as Promise
   * @param {string|string[]} keys
   * @returns {Promise<Object>}
   */
  async _get(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve(result);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Helper to wrap chrome.storage.local.set as Promise
   * @param {Object} items
   * @returns {Promise<void>}
   */
  async _set(items) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Helper to wrap chrome.storage.local.remove as Promise
   * @param {string|string[]} keys
   * @returns {Promise<void>}
   */
  async _remove(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get all profiles stored. Returns an array (may be empty).
   * @returns {Promise<Array<Object>>}
   */
  async getAllProfiles() {
    const res = await this._get(this.keys.profiles);
    return res?.profiles || [];
  }

  /**
   * Save or update a profile.
   * @param {Object} profile - Must contain at least a name and data object
   * @returns {Promise<Object>} saved profile
   */
  async saveProfile(profile) {
    if (!profile || typeof profile !== 'object') {
      throw new Error('Invalid profile');
    }

    const profiles = await this.getAllProfiles();

    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update
      profiles[existingIndex] = Object.assign({}, profiles[existingIndex], {
        ...profile,
        updatedAt: now
      });
    } else {
      // Create
      profiles.push(Object.assign({
        id: profile.id || this._generateId('profile-'),
        createdAt: now,
        updatedAt: now,
        version: '1.0'
      }, profile));
    }

    await this._set({ profiles });
    return profile;
  }

  /**
   * Get a profile by id
   * @param {string} profileId
   * @returns {Promise<Object|null>} profile
   */
  async getProfile(profileId) {
    const profiles = await this.getAllProfiles();
    return profiles.find(p => p.id === profileId) || null;
  }

  /**
   * Delete a profile by id
   * @param {string} profileId
   * @returns {Promise<boolean>} true if deleted
   */
  async deleteProfile(profileId) {
    const profiles = await this.getAllProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    await this._set({ profiles: filtered });
    return true;
  }

  /**
   * Update a profile by id with partial changes.
   * @param {string} profileId
   * @param {Object} update
   */
  async updateProfile(profileId, update) {
    const profiles = await this.getAllProfiles();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx < 0) throw new Error('Profile not found');
    profiles[idx] = Object.assign({}, profiles[idx], update, { updatedAt: new Date().toISOString() });
    await this._set({ profiles });
    return profiles[idx];
  }

  /* ----------------------- Application History ----------------------- */
  /**
   * Save an application record
   * @param {Object} record
   * @returns {Promise<Object>} saved record
   */
  async saveApplicationRecord(record) {
    if (!record || typeof record !== 'object') throw new Error('Invalid record');
    const r = Object.assign({ id: record.id || this._generateId('app-'), dateApplied: new Date().toISOString() }, record);
    const res = await this._get(this.keys.applicationHistory);
    const history = res?.applicationHistory || [];
    history.unshift(r); // Add to front (recent first)
    // Keep only recent 500 by default
    const MAX = 500;
    if (history.length > MAX) history.length = MAX;
    await this._set({ applicationHistory: history });
    return r;
  }

  /**
   * Get application history optionally filtered by profileId
   * @param {string|null} profileId
   * @returns {Promise<Array<Object>>}
   */
  async getApplicationHistory(profileId = null) {
    const res = await this._get(this.keys.applicationHistory);
    const history = res?.applicationHistory || [];
    if (profileId) return history.filter(h => h.profileId === profileId);
    return history;
  }

  /**
   * Delete an application record
   * @param {string} id
   */
  async deleteApplicationRecord(id) {
    const res = await this._get(this.keys.applicationHistory);
    let history = res?.applicationHistory || [];
    history = history.filter(r => r.id !== id);
    await this._set({ applicationHistory: history });
    return true;
  }

  /* ------------------------- Settings Management ------------------------ */
  /**
   * Save extension settings
   * @param {Object} settings
   */
  async saveSettings(settings) {
    await this._set({ settings });
    return settings;
  }

  /**
   * Get extension settings (or defaults)
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const res = await this._get(this.keys.settings);
    const defaults = {
      aiEnabled: false,
      aiPort: 11434,
      aiModel: 'neural-chat',
      autoDetectAI: true,
      theme: 'light',
      language: 'en',
      notificationEnabled: true
    };
    return Object.assign({}, defaults, res?.settings || {});
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults() {
    const defaults = await this.getSettings();
    await this._set({ settings: defaults });
    return defaults;
  }

  /* ------------------------- Export / Import --------------------------- */
  /**
   * Export profile data for a profileId
   * @param {string} profileId
   * @returns {Promise<string>} JSON string
   */
  async exportProfileData(profileId) {
    const profile = await this.getProfile(profileId);
    if (!profile) throw new Error('Profile not found');
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile data as JSON or object
   * @param {string|Object} jsonData
   * @returns {Promise<Object>} imported profile
   */
  async importProfileData(jsonData) {
    let dataObj = jsonData;
    if (typeof jsonData === 'string') {
      dataObj = JSON.parse(jsonData);
    }
    // Basic validation
    if (!dataObj || !dataObj.data || !dataObj.data.personalInfo) throw new Error('Invalid profile format');
    dataObj.id = dataObj.id || this._generateId('profile-');
    dataObj.createdAt = dataObj.createdAt || new Date().toISOString();
    dataObj.updatedAt = new Date().toISOString();
    return await this.saveProfile(dataObj);
  }

  /* ------------------------- Meta / Utilities ------------------------- */
  /**
   * Clear ALL extension data (use with caution)
   */
  async clearAllData() {
    await new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        resolve();
      });
    });
  }

  /**
   * Generate a semi-unique ID prefixed string
   * @param {string} prefix
   */
  _generateId(prefix = '') {
    return `${prefix}${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
  }
}

// Export for testability
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
