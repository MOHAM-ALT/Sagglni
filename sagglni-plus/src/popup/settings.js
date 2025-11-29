document.addEventListener('DOMContentLoaded', async () => {
  const aiEnabled = document.getElementById('aiEnabled');
  const aiPort = document.getElementById('aiPort');
  const aiOnlyLowConfidence = document.getElementById('aiOnlyLowConfidence');
  const aiLowConfidenceThreshold = document.getElementById('aiLowConfidenceThreshold');
  const aiConcisePrompts = document.getElementById('aiConcisePrompts');
  const aiBatchSize = document.getElementById('aiBatchSize');
  const themeSelect = document.getElementById('themeSelect');
  const status = document.getElementById('status');

  // Load settings
  chrome.runtime.sendMessage({ action: 'getSettings' }, (resp) => {
    if (!resp || !resp.success) return;
    const settings = resp.data;
    aiEnabled.checked = !!settings.aiEnabled;
    aiPort.value = settings.aiPort || 11434;
    aiOnlyLowConfidence.checked = typeof settings.aiOnlyLowConfidence === 'boolean' ? settings.aiOnlyLowConfidence : true;
    aiLowConfidenceThreshold.value = (typeof settings.aiLowConfidenceThreshold === 'number') ? settings.aiLowConfidenceThreshold : 0.7;
    aiConcisePrompts.checked = !!settings.aiConcise;
    aiBatchSize.value = settings.aiBatchSize || 10;
    themeSelect.value = settings.theme || 'light';
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    const settings = {
      aiEnabled: aiEnabled.checked,
      aiPort: aiPort.value,
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
