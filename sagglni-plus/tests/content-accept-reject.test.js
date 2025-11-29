const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const path = require('path');
const fs = require('fs');

describe('Content script respects AI field preferences', () => {
  beforeEach(() => {
    const html = `<!doctype html><html><body><form><input id="fieldA" name="fieldA" /></form></body></html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;
    // Mock chrome runtime for content.js
    global.chrome = {
      runtime: { sendMessage: jest.fn((msg, cb) => { if (msg.action === 'getProfile') { cb({ success: true, data: { id: 'p1', data: { personalInfo: { firstName: 'John', email: '' } } } }); } }) },
      storage: { local: { get: jest.fn((keys, cb) => cb({ settings: { aiFieldPreferences: { fieldA: false } } })) } }
    };
    // Mock upward analyzer to provide a single field where AI suggested 'email'
    class MockAnalyzer { analyzeForm() { return { fields: [{ name: 'fieldA', element: document.getElementById('fieldA'), detectedType: 'firstName', detectionConfidence: 0.6, aiSuggested: 'email', aiConfidence: 0.95, originalDetectedType: 'firstName', originalDetectionConfidence: 0.6 }], summary: { totalFields: 1, detections: { firstName: 1 } } }; } }
    global.window.FormAnalyzer = MockAnalyzer;
    // require content module
    const contentModulePath = require.resolve('../src/content/content.js');
    const contentModule = require(contentModulePath);
    global.content = contentModule;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.chrome;
    jest.resetModules();
  });

  test('reverts AI suggestion based on user preference', async () => {
    // Call handleAutoFill which should consult storage and revert AI suggestion
    const res = await global.content.handleAutoFill('p1');
    // Since profile has firstName but not email, field should be filled due to rejection of AI suggestion
    const input = document.getElementById('fieldA');
    expect(input.value).toBe('John');
    expect(res.filledCount).toBe(1);
  });
});
