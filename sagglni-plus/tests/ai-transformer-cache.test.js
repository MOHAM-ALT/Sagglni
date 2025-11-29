const AITransformer = require('../src/transformer/ai-transformer');

describe('AITransformer caching behavior', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/api/generate')) {
        return Promise.resolve({ ok: true, json: async () => ({ content: '[{"index":0,"name":"firstName","suggestedType":"firstName","confidence":0.95}]' }) });
      }
      if (url.includes('/v1/models')) { return Promise.resolve({ ok: true, json: async () => ([])}); }
      if (url.includes('/v1/completions')) { return Promise.resolve({ ok: true, json: async () => ({ choices: [{ output_text: '[{"index":0,"name":"firstName","suggestedType":"firstName","confidence":0.95}]' }] }) }); }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });
  afterEach(() => { global.fetch = originalFetch; jest.resetModules(); });

  test('cache returns cached results when called twice', async () => {
    const t = new AITransformer({ type: 'lmstudio', port: 9999, timeout: 500 });
    const formHtml = '<form><input name="firstName"></form>';
    const fields = [{ name: 'firstName', detectedType: 'unknown' }];
    const res1 = await t.analyzeFormWithAI(formHtml, fields, { verbose: true, cacheTTL: 10000 });
    expect(res1.suggestions && res1.suggestions.length).toBeGreaterThan(0);
    expect(res1.cached).not.toBe(true);
    expect(typeof res1.latencyMs).toBe('number');
    const res2 = await t.analyzeFormWithAI(formHtml, fields, { verbose: true, cacheTTL: 10000 });
    expect(res2.cached).toBe(true);
  });
});
