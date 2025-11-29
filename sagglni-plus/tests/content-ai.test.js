const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const path = require('path');
const fs = require('fs');

describe('Content script AI merging', () => {
  beforeEach(() => {
    const html = `<!doctype html><html><body><form><input id="firstName" name="firstName" /><input id="email" name="email" /></form></body></html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;
    // Mock chrome runtime for content.js to call background
    global.chrome = { runtime: { sendMessage: jest.fn((msg, cb) => { if (msg.action === 'analyzeFormWithAI') { cb({ success: true, data: { suggestions: [{ index: 0, name: 'firstName', suggestedType: 'firstName', confidence: 0.9 }, { index: 1, name: 'email', suggestedType: 'email', confidence: 0.95 }] } }); } }) } };
    // require content script helpers
    const content = require('../src/content/content.js');
    global.content = content;
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
    delete global.chrome;
    jest.resetModules();
  });

  test('mergeAIWithPattern merges pattern and AI results', () => {
    const res = global.content.analyzeCurrentForm();
    expect(res.fields.length).toBeGreaterThan(0);
    const analysis = { fields: res.fields.map((f, i) => ({ ...f, detectionConfidence: i === 0 ? 0.4 : (f.detectionConfidence || 0.8) })) };
    const suggestions = [{ index: 0, name: analysis.fields[0].name, suggestedType: 'firstName', confidence: 0.95 }];
    const merged = global.content.mergeAIWithPattern(analysis, suggestions);
    expect(merged[0].aiSuggested).toBe('firstName');
    expect(merged[0].aiConfidence).toBeGreaterThan(0.9);
    expect(merged[0].detectionConfidence).toBeGreaterThanOrEqual(merged[0].aiConfidence);
  });
});
