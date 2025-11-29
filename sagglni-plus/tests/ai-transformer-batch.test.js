const AITransformer = require('../src/transformer/ai-transformer');

describe('AITransformer batch behavior', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; jest.resetModules(); });

  test('batches fields into multiple LLM calls and maps indexes', async () => {
    // 5 fields, batchSize 2 => 3 LM calls (2+2+1)
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/api/generate')) {
        // Extract fields JSON from prompt
        const body = JSON.parse(opts.body || '{}');
        const prompt = body.prompt || '';
        const matches = [...prompt.matchAll(/"index"\s*:\s*(\d+)\s*,\s*"name"\s*:\s*"(\w+)"/g)];
        const suggestions = matches.map(m => ({ index: Number(m[1]), name: m[2], suggestedType: 'firstName', confidence: 0.9 }));
        return Promise.resolve({ ok: true, json: async () => ({ content: JSON.stringify(suggestions) }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const t = new AITransformer({ type: 'lmstudio', port: 9999, timeout: 500, batchSize: 2, onlyLowConfidence: true });
    const formHtml = '<form><input name="a"><input name="b"><input name="c"><input name="d"><input name="e"></form>';
    const fields = [
      { name: 'a', detectionConfidence: 0.3 },
      { name: 'b', detectionConfidence: 0.2 },
      { name: 'c', detectionConfidence: 0.1 },
      { name: 'd', detectionConfidence: 0.1 },
      { name: 'e', detectionConfidence: 0.2 },
    ];
    const res = await t.analyzeFormWithAI(formHtml, fields, { verbose: true });
    // expect 3 calls to /api/generate
    const generateCalls = global.fetch.mock.calls.filter(c => c[0].includes('/api/generate'));
    expect(generateCalls.length).toBe(3);
    // suggestions should map back to original indexes
    expect(Array.isArray(res.suggestions)).toBe(true);
    const idxs = res.suggestions.map(s => s.index).sort();
    expect(idxs).toEqual([0,1,2,3,4]);
  });

  test('onlyLowConfidence avoids creating calls when all high confidence', async () => {
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/api/generate')) return Promise.resolve({ ok: true, json: async () => ({ content: '[]' }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    const t = new AITransformer({ type: 'lmstudio', port: 9999, timeout: 500, batchSize: 2, onlyLowConfidence: true });
    const formHtml = '<form><input name="a"><input name="b"></form>';
    const fields = [ { name: 'a', detectionConfidence: 0.9 }, { name: 'b', detectionConfidence: 0.95 } ];
    const res = await t.analyzeFormWithAI(formHtml, fields, {});
    expect(Array.isArray(res.suggestions)).toBe(true);
    expect(res.suggestions.length).toBe(0);
    // ensure no /api/generate calls
    const generateCalls = global.fetch.mock.calls.filter(c => c[0].includes('/api/generate'));
    expect(generateCalls.length).toBe(0);
  });

  test('multiple runs use per-chunk cache to avoid duplicate LLM calls', async () => {
    // 4 fields, batchSize 2 => 2 LM calls
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/api/generate')) {
        const body = JSON.parse(opts.body || '{}');
        const prompt = body.prompt || '';
        const matches = [...prompt.matchAll(/"index"\s*:\s*(\d+)\s*,\s*"name"\s*:\s*"(\w+)"/g)];
        const suggestions = matches.map(m => ({ index: Number(m[1]), name: m[2], suggestedType: 'firstName', confidence: 0.9 }));
        return Promise.resolve({ ok: true, json: async () => ({ content: JSON.stringify(suggestions) }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    const t = new AITransformer({ type: 'lmstudio', port: 9999, timeout: 500, batchSize: 2, onlyLowConfidence: true });
    const formHtml = '<form><input name="a"><input name="b"><input name="c"><input name="d"></form>';
    const fields = [
      { name: 'a', detectionConfidence: 0.2 },
      { name: 'b', detectionConfidence: 0.1 },
      { name: 'c', detectionConfidence: 0.2 },
      { name: 'd', detectionConfidence: 0.1 },
    ];
    await t.analyzeFormWithAI(formHtml, fields, { verbose: true });
    const callsAfterFirst = global.fetch.mock.calls.filter(c => c[0].includes('/api/generate')).length;
    expect(callsAfterFirst).toBe(2);
    const res2 = await t.analyzeFormWithAI(formHtml, fields, { verbose: true });
    const callsAfterSecond = global.fetch.mock.calls.filter(c => c[0].includes('/api/generate')).length;
    // Since the per-chunk results are cached, no new /api/generate calls should have been made
    expect(callsAfterSecond).toBe(callsAfterFirst);
    // And cached flag should be true
    expect(res2.cached).toBe(true);
  });
});
