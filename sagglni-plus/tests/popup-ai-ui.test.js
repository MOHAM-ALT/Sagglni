const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

describe('Popup AI UI', () => {
  let dom;
  beforeEach(async () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../src/popup/popup.html'), 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    global.window = dom.window;
    global.document = dom.window.document;
    // Mock chrome runtime to return an AI-enhanced analysis and profiles
    global.chrome = { runtime: { sendMessage: jest.fn((msg, cb) => {
      if (msg.action === 'analyzeForm') {
        const data = { aiUsed: true, fields: [{ name: 'firstName', detectedType: 'unknown', detectionConfidence: 0.4, aiSuggested: 'firstName', aiConfidence: 0.93 }, { name: 'email', detectedType: 'email', detectionConfidence: 0.8 }] };
        cb({ success: true, data, aiUsed: true, fieldCount: 2 });
      } else if (msg.action === 'getAllProfiles') {
        cb({ success: true, data: [{ id: 'p-1', name: 'Default', data: { personalInfo: {} } }] });
      } else if (msg.action === 'getApplicationHistory') {
        cb({ success: true, data: [] });
      } else {
        cb({ success: true, data: {} });
      }
    }) } };
    // load popup.js (it sets up event listeners on DOMContentLoaded)
    require('../src/popup/popup.js');
    // JSDOM may have already fired DOMContentLoaded; dispatch to ensure listeners are set
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.chrome;
    jest.resetModules();
  });

  test('displays AI-enhanced badge and field list when AI is used during analysis', (done) => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    expect(analyzeBtn).toBeTruthy();
    analyzeBtn.click();
    // ensure sendMessage is called
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'analyzeForm' }), expect.any(Function));
    // debug: print mock calls
    // eslint-disable-next-line no-console
    console.log('sendMessage calls:', global.chrome.runtime.sendMessage.mock.calls.map(c => c[0]));
    setTimeout(() => {
      const aiResult = document.getElementById('aiAnalysisResult');
      const fieldsList = document.getElementById('aiFieldsList');
      expect(aiResult).toBeTruthy();
      expect(aiResult.style.display).not.toBe('none');
      expect(fieldsList.children.length).toBeGreaterThan(0);
      const first = fieldsList.children[0];
      expect(first.textContent).toContain('firstName');
      expect(first.textContent).toContain('AI: firstName');
      done();
    }, 50);
  });
});
