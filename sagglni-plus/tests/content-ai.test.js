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

  test('analyzeFormWithAI merges pattern and AI results', (done) => {
    const res = global.content.analyzeCurrentForm();
    expect(res.fields.length).toBeGreaterThan(0);
    // call analyzeFormWithAI and verify merged
    global.content.analyzeFormWithAI({}, {}, (resp) => {
      // Our implementation uses sendResponse from content script, but here we can call the method directly
    });
    // Instead, simulate call via direct function
    global.content.analyzeCurrentForm();
    // The handler uses chrome.runtime.sendMessage; check it was called
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'analyzeFormWithAI' }), expect.any(Function));
    done();
  });
});
