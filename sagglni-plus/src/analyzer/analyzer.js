// Form Analyzer - Detects and analyzes form fields

class FormAnalyzer {
  constructor() {
    this.fields = [];
    this.fieldPatterns = {
      email: /email|mail/i,
      phone: /phone|mobile|tel|telephone/i,
      firstName: /first.?name|fname|given.?name/i,
      lastName: /last.?name|lname|family.?name|surname/i,
      middleName: /middle.?name|mname/i,
      date: /date|dob|birth|\d{1,2}\/\d{1,2}\/\d{4}/i,
      gender: /gender|sex/i,
      country: /country|nation/i,
      city: /city|town/i,
      address: /address|street|location/i
    };
  }
  
  analyzeForm() {
    this.fields = [];
    this.collectFields();
    this.classifyFields();
    return this.fields;
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
  
  classifyFields() {
    this.fields.forEach(field => {
      field.detectedType = this.detectFieldType(field);
    });
  }
  
  detectFieldType(field) {
    const searchText = `${field.name} ${field.placeholder} ${field.label}`.toLowerCase();
    
    for (const [type, pattern] of Object.entries(this.fieldPatterns)) {
      if (pattern.test(searchText)) {
        return type;
      }
    }
    
    return 'unknown';
  }
  
  findLabel(element) {
    // Try to find associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent;
    }
    
    return '';
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormAnalyzer;
}
