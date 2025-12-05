document.addEventListener('DOMContentLoaded', async () => {
  const aiEnabled = document.getElementById('aiEnabled');
  const aiConfigPanel = document.getElementById('aiConfigPanel');
  const aiEngineType = document.getElementById('aiEngineType');
  const aiCustomHost = document.getElementById('aiCustomHost');
  const aiCustomPort = document.getElementById('aiCustomPort');
  const hostError = document.getElementById('hostError');
  const portError = document.getElementById('portError');
  const testAIConnectionBtn = document.getElementById('testAIConnectionBtn');
  const aiTestStatus = document.getElementById('aiTestStatus');
  const aiOnlyLowConfidence = document.getElementById('aiOnlyLowConfidence');
  const aiLowConfidenceThreshold = document.getElementById('aiLowConfidenceThreshold');
  const aiConcisePrompts = document.getElementById('aiConcisePrompts');
  const aiBatchSize = document.getElementById('aiBatchSize');
  const themeSelect = document.getElementById('themeSelect');
  const status = document.getElementById('status');

  // Validation functions
  function validateIPAddress(ip) {
    if (!ip || ip === 'localhost') return true;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^localhost$/;
    if (!ipRegex.test(ip)) return false;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return parts.every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255;
      });
    }
    return true;
  }

  function validatePortNumber(port) {
    const num = parseInt(port);
    return !isNaN(num) && num >= 1 && num <= 65535;
  }

  function clearErrors() {
    hostError.style.display = 'none';
    portError.style.display = 'none';
  }

  function validateAndShowErrors() {
    clearErrors();
    let isValid = true;

    if (aiEngineType.value === 'lmstudio' || aiCustomHost.value) {
      const host = aiCustomHost.value.trim();
      if (!host) {
        hostError.textContent = 'Host/IP is required for LM Studio';
        hostError.style.display = 'block';
        isValid = false;
      } else if (!validateIPAddress(host)) {
        hostError.textContent = 'Invalid IP address format (e.g., 192.168.1.106 or localhost)';
        hostError.style.display = 'block';
        isValid = false;
      }
    }

    if (aiEngineType.value === 'lmstudio' || aiCustomPort.value) {
      const port = aiCustomPort.value.trim();
      if (!port) {
        portError.textContent = 'Port is required for LM Studio';
        portError.style.display = 'block';
        isValid = false;
      } else if (!validatePortNumber(port)) {
        portError.textContent = 'Port must be between 1 and 65535';
        portError.style.display = 'block';
        isValid = false;
      }
    }

    return isValid;
  }

  // Toggle AI config panel visibility
  aiEnabled.addEventListener('change', () => {
    aiConfigPanel.style.display = aiEnabled.checked ? 'block' : 'none';
  });

  // Load settings
  chrome.runtime.sendMessage({ action: 'getSettings' }, (resp) => {
    if (!resp || !resp.success) return;
    const settings = resp.data;
    aiEnabled.checked = !!settings.aiEnabled;
    aiConfigPanel.style.display = settings.aiEnabled ? 'block' : 'none';
    aiEngineType.value = settings.aiEngineType || 'ollama';
    aiCustomHost.value = settings.aiCustomHost || '';
    aiCustomPort.value = settings.aiCustomPort || '';
    aiOnlyLowConfidence.checked = typeof settings.aiOnlyLowConfidence === 'boolean' ? settings.aiOnlyLowConfidence : true;
    aiLowConfidenceThreshold.value = (typeof settings.aiLowConfidenceThreshold === 'number') ? settings.aiLowConfidenceThreshold : 0.7;
    aiConcisePrompts.checked = !!settings.aiConcise;
    aiBatchSize.value = settings.aiBatchSize || 10;
    themeSelect.value = settings.theme || 'light';
  });

  // Validate on blur
  aiCustomHost.addEventListener('blur', validateAndShowErrors);
  aiCustomPort.addEventListener('blur', validateAndShowErrors);

  // Test AI Connection
  testAIConnectionBtn.addEventListener('click', async () => {
    if (!validateAndShowErrors()) {
      aiTestStatus.textContent = '❌ Validation failed. Please check errors above.';
      aiTestStatus.style.backgroundColor = '#fed7d7';
      aiTestStatus.style.color = '#c53030';
      aiTestStatus.style.display = 'block';
      return;
    }

    testAIConnectionBtn.disabled = true;
    aiTestStatus.textContent = '🔄 Testing connection...';
    aiTestStatus.style.backgroundColor = '#bee3f8';
    aiTestStatus.style.color = '#2c5282';
    aiTestStatus.style.display = 'block';

    try {
      const host = aiCustomHost.value || 'localhost';
      const port = aiCustomPort.value || (aiEngineType.value === 'ollama' ? 11434 : 8000);
      const testUrl = `http://${host}:${port}/v1/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 405) {
        aiTestStatus.textContent = `✅ Connection successful! (${host}:${port})`;
        aiTestStatus.style.backgroundColor = '#c6f6d5';
        aiTestStatus.style.color = '#22543d';
      } else {
        aiTestStatus.textContent = `⚠️ Connected but received: ${response.status}`;
        aiTestStatus.style.backgroundColor = '#feebc8';
        aiTestStatus.style.color = '#7c2d12';
      }
    } catch (err) {
      aiTestStatus.textContent = `❌ Connection failed: ${err.message || 'Network error'}`;
      aiTestStatus.style.backgroundColor = '#fed7d7';
      aiTestStatus.style.color = '#c53030';
    } finally {
      testAIConnectionBtn.disabled = false;
    }
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    if (!validateAndShowErrors()) {
      status.textContent = 'Please fix validation errors';
      status.className = 'status status-error';
      return;
    }

    const settings = {
      aiEnabled: aiEnabled.checked,
      aiEngineType: aiEngineType.value,
      aiCustomHost: aiCustomHost.value.trim(),
      aiCustomPort: aiCustomPort.value.trim(),
      aiOnlyLowConfidence: aiOnlyLowConfidence.checked,
      aiLowConfidenceThreshold: Number(aiLowConfidenceThreshold.value),
      aiConcise: aiConcisePrompts.checked,
      aiBatchSize: Number(aiBatchSize.value),
      theme: themeSelect.value
    };
    chrome.runtime.sendMessage({ action: 'saveSettings', settings }, (resp) => {
      if (resp && resp.success) {
        status.textContent = 'Settings saved ✅';
        status.className = 'status status-success';
      } else {
        status.textContent = 'Failed to save settings';
        status.className = 'status status-error';
      }
    });
  });
});
