// Sagglni Plus - Content Script
// Runs on every webpage

console.log('Sagglni Plus Content Script Loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === 'autoFill') {
    handleAutoFill(request.profileId)
      .then(result => sendResponse({success: true, data: result}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Keep the connection open for async response
  }
  
  if (request.action === 'analyzeForm') {
    const analysis = analyzeCurrentForm();
    sendResponse({success: true, ...analysis});
  }
});

async function handleAutoFill(profileId) {
  // Get profile data from storage
  const { profiles } = await chrome.storage.local.get('profiles');
  const profile = profiles.find(p => p.id === profileId);
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  // Get all form fields
  const fields = getAllFormFields();
  
  // Fill each field
  let filledCount = 0;
  for (const field of fields) {
    if (fillField(field, profile)) {
      filledCount++;
    }
  }
  
  return { filledCount, totalFields: fields.length };
}

function getAllFormFields() {
  const fields = [];
  
  // Get all input fields
  document.querySelectorAll('input').forEach(input => {
    fields.push({
      type: 'input',
      element: input,
      name: input.name || input.id || '',
      inputType: input.type,
      placeholder: input.placeholder
    });
  });
  
  // Get all select fields
  document.querySelectorAll('select').forEach(select => {
    fields.push({
      type: 'select',
      element: select,
      name: select.name || select.id || ''
    });
  });
  
  // Get all textarea fields
  document.querySelectorAll('textarea').forEach(textarea => {
    fields.push({
      type: 'textarea',
      element: textarea,
      name: textarea.name || textarea.id || ''
    });
  });
  
  return fields;
}

function fillField(field, profile) {
  const fieldName = (field.name||'').toLowerCase();
  let value = null;
  
  // Map field names to profile data
  if (fieldName.includes('first') && fieldName.includes('name')) {
    value = profile.data?.firstName;
  } else if (fieldName.includes('last') && fieldName.includes('name')) {
    value = profile.data?.lastName;
  } else if (fieldName.includes('email')) {
    value = profile.data?.email;
  } else if (fieldName.includes('phone') || fieldName.includes('mobile')) {
    value = profile.data?.phone;
  } else if (fieldName.includes('date') && fieldName.includes('birth')) {
    value = profile.data?.dateOfBirth;
  }
  
  if (value) {
    if (field.type === 'input' || field.type === 'textarea') {
      field.element.value = value;
      field.element.dispatchEvent(new Event('input', { bubbles: true }));
      field.element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  
  return false;
}

function analyzeCurrentForm() {
  const fields = getAllFormFields();
  const fieldTypes = {};
  
  fields.forEach(field => {
    const key = field.inputType || field.type;
    fieldTypes[key] = (fieldTypes[key] || 0) + 1;
  });
  
  return {
    fieldCount: fields.length,
    fieldTypes: fieldTypes,
    fields: fields.map(f => ({
      name: f.name,
      type: f.type,
      inputType: f.inputType
    }))
  };
}
