const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const FormAnalyzer = require('../src/analyzer/analyzer');

describe('FormAnalyzer', () => {
  test('detects email field by name', () => {
    const dom = new JSDOM(`<!doctype html><html><body><form><input name="emailAddress"></form></body></html>`);
    global.document = dom.window.document;
    const analyzer = new FormAnalyzer();
    const result = analyzer.analyzeForm();
    const fields = result.fields;
    expect(fields.length).toBe(1);
    expect(fields[0].detectedType).toBe('email');
  });

  test('defaults to unknown for unlabeled fields', () => {
    const dom = new JSDOM(`<!doctype html><html><body><form><input name="foo"></form></body></html>`);
    global.document = dom.window.document;
    const analyzer = new FormAnalyzer();
    const result = analyzer.analyzeForm();
    const fields = result.fields;
    expect(fields.length).toBe(1);
    expect(fields[0].detectedType).toBe('unknown');
  });
});
