// Data Transformer - Converts data to match form requirements
// Integrates with local LLM

let AITransformer;
try {
  AITransformer = require('./ai-transformer');
} catch (e) { AITransformer = undefined; }

class DataTransformer {
  constructor(aiPort = '11434') {
    this.aiPort = aiPort;
    this.aiEnabled = false;
  }
  
  async transformData(data, fieldType, formContext) {
    // Try AI transformation first if enabled
    if (this.aiEnabled) {
      try {
        return await this.transformWithAI(data, fieldType, formContext);
      } catch (error) {
        console.warn('AI transformation failed, using fallback:', error);
      }
    }
    
    // Use fallback transformations
    return this.transformWithRules(data, fieldType);
  }
  
  async transformWithAI(data, fieldType, formContext) {
    if (!AITransformer) throw new Error('AITransformer not available');
    const ai = new AITransformer({ type: 'ollama', port: this.aiPort });
    const fmt = (formContext && formContext.detectedFormat) ? formContext.detectedFormat : null;
    const result = await ai.transform(data, fieldType, fmt);
    if (!result) throw new Error('AI returned no result');
    return result;
  }
  
  transformWithRules(data, fieldType) {
    switch(fieldType) {
      case 'phone':
        return this.transformPhone(data);
      case 'date':
        return this.transformDate(data);
      case 'email':
        return this.transformEmail(data);
      case 'name':
        return this.transformName(data);
      default:
        return data;
    }
  }
  
  transformPhone(phone) {
    // Remove all non-digits except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('+')) {
      return cleaned;
    } else if (cleaned.startsWith('00')) {
      return '+' + cleaned.substring(2);
    } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
      return '+966' + cleaned;
    }
    
    return cleaned;
  }
  
  transformDate(date) {
    // Parse various date formats
    const parsed = new Date(date);
    if (!isNaN(parsed)) {
      // Return in multiple formats
      const formats = {
        'MM/DD/YYYY': `${String(parsed.getMonth() + 1).padStart(2, '0')}/${String(parsed.getDate()).padStart(2, '0')}/${parsed.getFullYear()}`,
        'DD/MM/YYYY': `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`,
        'YYYY-MM-DD': parsed.toISOString().split('T')[0]
      };
      return formats;
    }
    return date;
  }
  
  transformEmail(email) {
    return email.toLowerCase().trim();
  }
  
  transformName(name) {
    return name.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  setAIEnabled(enabled) {
    this.aiEnabled = enabled;
  }
  
  setAIPort(port) {
    this.aiPort = port;
  }
}

// Export for CommonJS environments
// Expose for different module systems and as a browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataTransformer;
}
try { exports.default = DataTransformer; } catch (e) { /* ignore for non-CommonJS environments */ }
if (typeof window !== 'undefined') window.DataTransformer = DataTransformer;

// Export default for ES Module environments (background service worker with type: module)
if (typeof window === 'undefined' && typeof importScripts === 'undefined') {
  // Not a browser page; Node or bundler
} else {
  try {
    // In browser content scripts, this will be available as a global class
  } catch (e) {
    /* ignore */
  }
}

// No ES module export to keep compatibility with Node/Jest tests and content scripts
