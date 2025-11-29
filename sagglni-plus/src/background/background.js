// Sagglni Plus - Background Service Worker (module)
console.log('Sagglni Plus Background Service Worker Loaded');
const { detectAIEndpoints, checkAIHealth, DEFAULTS } = require('./ai-connector');

/** Initialize default data on installation */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Sagglni Plus installed!');
  // Initialize default storage if not set
  chrome.storage.local.get(['profiles', 'settings'], (res) => {
    if (!res.profiles) chrome.storage.local.set({ profiles: [] });
    if (!res.settings) chrome.storage.local.set({ settings: { aiEnabled: false, aiPort: 11434, autoDetectAI: true } });
  });
  // Attempt to auto-detect local AI backends and update settings if found
  (async () => {
    try {
      const settingsRes = await new Promise((resolve) => chrome.storage.local.get(['settings'], (r) => resolve(r?.settings || {})));
      const config = { timeoutMs: 1000, retries: 2, backoff: 1.3, verbose: !!settingsRes.aiDebug };
      const det = await detectAIEndpoints({ ports: { lmstudio: [DEFAULTS?.lmstudio?.port || 8000, 8080], ollama: [DEFAULTS?.ollama?.port || 11434] }, config });
      const available = det.find(d => d.healthy);
      if (available) {
        chrome.storage.local.get(['settings'], (res) => {
          const s = Object.assign({}, res?.settings || {}, { aiEnabled: true, aiPort: available.port, aiType: available.type });
          chrome.storage.local.set({ settings: s });
        });
      }
    } catch (err) { /* ignore detection errors */ }
  })();
});

/**
 * Message router - handles requests from popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'saveProfile': {
        // Save profile locally
        chrome.storage.local.get(['profiles'], (res) => {
          const profiles = res?.profiles || [];
          const existingIndex = profiles.findIndex(p => p.id === request.profile.id);
          const now = new Date().toISOString();
          if (existingIndex >= 0) {
            profiles[existingIndex] = Object.assign({}, profiles[existingIndex], { ...request.profile, updatedAt: now });
          } else {
            profiles.push(Object.assign({ id: request.profile.id || `profile-${Date.now()}`, createdAt: now, updatedAt: now, version: '1.0' }, request.profile));
          }
          chrome.storage.local.set({ profiles }, () => sendResponse({ success: true, data: request.profile }));
        });
        return true;
      }
      case 'deleteProfile': {
        chrome.storage.local.get(['profiles'], (res) => {
          const profiles = (res?.profiles || []).filter(p => p.id !== request.profileId);
          chrome.storage.local.set({ profiles }, () => sendResponse({ success: true }));
        });
        return true;
      }
      case 'saveSettings': {
        chrome.storage.local.set({ settings: request.settings }, () => sendResponse({ success: true, data: request.settings }));
        return true;
      }
      case 'getSettings': {
        chrome.storage.local.get(['settings'], (res) => sendResponse({ success: true, data: res?.settings || {} }));
        return true;
      }
      case 'analyzeForm': {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (!tab) return sendResponse({ success: false, error: 'No active tab' });
          chrome.tabs.sendMessage(tab.id, { action: 'analyzeForm' }, (resp) => sendResponse(resp));
        });
        return true;
      }
      case 'analyzeFormWithAI': {
        // receive { formHtml, fields }
        const { formHtml, fields } = request || {};
        (async () => {
          try {
            const AIClass = require('../transformer/ai-transformer');
            const aiClient = new AIClass({ type: 'ollama', port: (request.port || 11434) });
              const resp = await aiClient.analyzeFormWithAI(formHtml, fields, request.pageInfo || {});
            sendResponse({ success: true, data: resp });
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }
      case 'autoFill': {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (!tab) return sendResponse({ success: false, error: 'No active tab' });
          chrome.tabs.sendMessage(tab.id, { action: 'autoFill', profileId: request.profileId }, (resp) => {
            // Save application record
            const formInfoFromContent = resp?.data?.formInfo || {};
            const record = {
              id: `app-${Date.now()}`,
              profileId: request.profileId,
              dateApplied: new Date().toISOString(),
              formInfo: { websiteUrl: tab.url || '', pageTitle: formInfoFromContent.pageTitle || '', company: formInfoFromContent.company || '' },
              fillResult: {
                totalFields: resp?.data?.totalFields || 0,
                filledFields: resp?.data?.filledCount || (resp?.data?.filledFields || 0),
                skippedFields: (resp?.data?.totalFields || 0) - (resp?.data?.filledCount || (resp?.data?.filledFields || 0)),
                fieldDetails: resp?.data?.details || []
              },
              status: 'submitted'
            };
            chrome.storage.local.get(['applicationHistory'], (res) => {
              const history = res?.applicationHistory || [];
              history.unshift(record);
              if (history.length > 500) history.length = 500;
              chrome.storage.local.set({ applicationHistory: history });
            });
            sendResponse(resp);
          });
        });
        return true;
      }
      case 'getApplicationHistory': {
        chrome.storage.local.get(['applicationHistory'], (res) => sendResponse({ success: true, data: res?.applicationHistory || [] }));
        return true;
      }
      case 'deleteApplicationRecord': {
        chrome.storage.local.get(['applicationHistory'], (res) => {
          const history = (res?.applicationHistory || []).filter(r => r.id !== request.recordId);
          chrome.storage.local.set({ applicationHistory: history }, () => sendResponse({ success: true }));
        });
        return true;
      }
      case 'transformData': {
        // Basic rule-based transformation inline for background (MVP)
        const data = request.data;
        let transformed = data;
        if (request.fieldType === 'phone') {
          transformed = String(data).replace(/[^\d+]/g, '');
          if (transformed.startsWith('00')) transformed = '+' + transformed.substring(2);
          if (!transformed.startsWith('+') && transformed.length === 9 && transformed.startsWith('5')) transformed = '+966' + transformed;
        }
        if (request.fieldType === 'email') {
          transformed = String(data).trim().toLowerCase();
        }
        if (request.fieldType === 'name') {
          transformed = String(data).trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
        }
        return sendResponse({ success: true, data: transformed });
      }
      case 'testAI': {
        chrome.storage.local.get(['settings'], async (res) => {
          const s = res?.settings || {};
          if (!s.aiEnabled) return sendResponse({ success: false, error: 'AI disabled' });
          const cfg = { timeoutMs: s.aiTimeout || 1000, retries: s.aiRetries || 2, backoff: s.aiBackoff || 1.3, verbose: !!s.aiDebug };
          // perform a health check using ai-connector
          const health = await checkAIHealth({ type: s.aiType || 'ollama', port: s.aiPort, config: cfg });
          sendResponse({ success: true, data: { aiAvailable: !!health.healthy, type: health.type, port: health.port, endpoint: health.endpoint, results: health.results || [] } });
        });
        return true;
      }
      default:
        return sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    console.error('Background error:', err);
    sendResponse({ success: false, error: err.message });
  }
  return true;
});

// AI health / detection helpers are exported from ./ai-connector.js
