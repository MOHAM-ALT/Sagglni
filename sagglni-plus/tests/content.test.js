const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const path = require('path');
const fs = require('fs');

describe('Content script helpers', () => {
  let window, document, content;
  beforeEach(() => {
    const html = `<!doctype html><html><body>
      <form>
        <input id="firstName" name="firstName" />
        <input id="emailAddress" name="emailAddress" />
        <input id="phone" name="phone" />
      </form></body></html>`;
    const dom = new JSDOM(html);
    window = dom.window;
    document = dom.window.document;
    global.document = document;
    // require content.js in a CommonJS-friendly way by reading and evaluating
    // require content module via CommonJS bundling (module exports added in content.js)
    const contentModulePath = require.resolve('../src/content/content.js');
    const contentModule = require(contentModulePath);
    content = contentModule;
  });

  test('analyzeCurrentForm returns detected fields and formInfo', () => {
    expect(typeof content.analyzeCurrentForm).toBe('function');
    const res = content.analyzeCurrentForm();
    expect(res.fields.length).toBe(3);
    const types = res.fields.map(f => f.detectedType);
    expect(types).toEqual(expect.arrayContaining(['firstName', 'email', 'phone']));
  });

  test('fillFieldAdvanced fills inputs and checkboxes', () => {
    // create simple input
    const input = document.getElementById('firstName');
    expect(input.value).toBe('');
    const field = { element: input };
    // load module again to get helper
    const ok = content.fillFieldAdvanced(field, 'John');
    expect(ok).toBe(true);
    expect(input.value).toBe('John');
  });
});
