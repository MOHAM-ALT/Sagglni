// Form Analyzer - Detects and analyzes form fields

class FormAnalyzer {
  /**
   * FormAnalyzer constructor
   */
  constructor() {
    this.fields = [];
    this.fieldPatterns = {
      email: /email|mail|e-?mail/i,
      phone: /phone|mobile|tel|telephone|cell/i,
      firstName: /first.?name|fname|given.?name|first/i,
      lastName: /last.?name|lname|family.?name|surname|last/i,
      middleName: /middle.?name|mname|middle/i,
      date: /date|dob|birth|birthday|birthday|\d{1,2}\/\d{1,2}\/\d{4}/i,
      gender: /gender|sex/i,
      country: /country|nation|nationality/i,
      city: /city|town|location|municipality/i,
      address: /address|street|location|addr|postal/i,
      postalCode: /postal|zip|code|postcode/i
    };
  }
  
  /**
   * Analyze the current document for form fields, classify and detect formats.
   * @returns {Object} result { fields: [...], summary: {...} }
   */
  analyzeForm() {
    this.fields = [];
    this.collectFields();
    this.classifyFields();
    this.detectFormats();

    const total = this.fields.length;
    const detected = this.fields.filter(f => f.detectedType !== 'unknown').length;
    const summary = {
      totalFields: total,
      detectedCount: detected,
      undetectedCount: total - detected,
      detectionRate: total === 0 ? 0 : (detected / total),
      fieldTypes: this.fields.reduce((acc, f) => {
        acc[f.detectedType] = (acc[f.detectedType] || 0) + 1;
        return acc;
      }, {})
    };

    return { fields: this.fields, summary };
  }
  
  collectFields() {
    // Collect all form fields
    document.querySelectorAll('input, select, textarea').forEach(element => {
      this.fields.push({
        element: element,
        type: element.tagName.toLowerCase(),
        inputType: element.type || '',
        name: element.name || element.id || '',
        placeholder: element.placeholder || '',
        label: this.findLabel(element),
        value: element.value || ''
      });
    });
  }
  
  /**
   * Classify all fields and calculate a confidence score
   */
  classifyFields() {
    this.fields.forEach(field => {
      field.detectedType = this.detectFieldType(field);
      // Calculate a simple confidence score: 1.0 if matched by pattern, else 0.2 default
      field.detectionConfidence = field.detectedType === 'unknown' ? 0.2 : 0.95;
    });
  }
  
  /**
   * Detect field type using pattern matching across name, placeholder, label
   * @param {Object} field
   * @returns {string} detected type or 'unknown'
   */
  detectFieldType(field) {
    const searchText = `${field.name} ${field.placeholder} ${field.label}`.toLowerCase();
    for (const [type, pattern] of Object.entries(this.fieldPatterns)) {
      if (pattern.test(searchText)) {
        return type;
      }
    }
    // Heuristics: check input type attribute
    if (field.inputType === 'email') return 'email';
    if (field.inputType === 'tel') return 'phone';
    if (field.inputType === 'date') return 'date';
    return 'unknown';
  }
  
  /**
   * Find a text label for the element, using for=, parent labels or aria labels
   * @param {HTMLElement} element
   * @returns {string}
   */
  findLabel(element) {
    // Try to find associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return (label.textContent || '').trim();
    }
    // Check for a wrapping label
    const parentLabel = element.closest('label');
    if (parentLabel) return (parentLabel.textContent || '').trim();
    // aria-labelledby
    const ariaId = element.getAttribute('aria-labelledby');
    if (ariaId) {
      const label = document.getElementById(ariaId);
      if (label) return (label.textContent || '').trim();
    }
    return '';
  }

  /**
   * Detect expected formats for fields
   */
  detectFormats() {
    this.fields.forEach(field => {
      field.detectedFormat = this.detectFormat(field);
    });
  }

  /**
   * Detect format for a single field (date, phone, email, select options)
   * @param {Object} field
   */
  detectFormat(field) {
    if (field.inputType === 'date') {
      // HTML input[type=date] generally uses YYYY-MM-DD
      return { type: 'date', expectedFormat: 'YYYY-MM-DD', confidence: 0.95 };
    }
    if (field.detectedType === 'date') {
      // try to guess from placeholder
      const ph = field.placeholder || '';
      if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(ph)) return { type: 'date', expectedFormat: 'DD/MM/YYYY', confidence: 0.8 };
      return { type: 'date', expectedFormat: 'DD/MM/YYYY', confidence: 0.5 };
    }
    if (field.detectedType === 'phone' || field.inputType === 'tel') {
      return { type: 'phone', expectedFormat: 'E.164', confidence: 0.8 };
    }
    if (field.detectedType === 'email' || field.inputType === 'email') {
      return { type: 'email', expectedFormat: 'email', confidence: 0.95 };
    }
    return { type: field.inputType || field.type, expectedFormat: 'text', confidence: 0.4 };
  }
}

// Export for use
// Export for CommonJS and ES Module environments, and attach to global for content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormAnalyzer;
}
try {
  // ES module default export
  exports.default = FormAnalyzer;
} catch (e) {}
if (typeof window !== 'undefined') window.FormAnalyzer = FormAnalyzer;
