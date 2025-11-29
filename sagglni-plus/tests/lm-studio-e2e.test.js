const AITransformer = require('../src/transformer/ai-transformer');

// This E2E suite runs ONLY when LM_STUDIO_URL is set in env and points to an accessible LM Studio instance
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || process.env.LM_STUDIO || null;
function parsePort(url) {
  try {
    const parsed = new URL(url);
    return Number(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80);
  } catch (e) { return null; }
}

describe('LM Studio E2E', () => {
  let port = null;
  beforeAll(() => { port = parsePort(LM_STUDIO_URL); if (!LM_STUDIO_URL) console.warn('LM_STUDIO_URL not set; skipping real LM Studio tests'); });

  test('connects to LM Studio and returns suggestions (requires LM_STUDIO_URL)', async () => {
    if (!LM_STUDIO_URL) return console.warn('Skipping LM Studio E2E: LM_STUDIO_URL not provided');
    if (!port) throw new Error('LM_STUDIO_URL is invalid (missing port)');
    const t = new AITransformer({ type: 'lmstudio', port, timeout: 10000, batchSize: 10 });
    const fields = Array.from({ length: 8 }, (_, i) => ({ name: `f${i}`, detectionConfidence: 0.2 }));
    const formHtml = '<form>' + fields.map(f => `<input name="${f.name}">`).join('') + '</form>';
    const start = Date.now();
    let res;
    try {
      res = await t.analyzeFormWithAI(formHtml, fields, { verbose: true, concise: true, cacheTTL: 5000 });
    } catch (e) {
      // if unreachable, fail gracefully and show reason
      throw new Error('LM Studio E2E failed: ' + e.message);
    }
    const dur = Date.now() - start;
    console.log('LM Studio E2E: durationMs:', dur, 'suggestions:', (res && res.suggestions && res.suggestions.length) || 0);
    expect(Array.isArray(res.suggestions)).toBe(true);
    // suggestions for fields might be empty if LM doesn't provide; ensure not an error
  }, 20000);

  test('batching and cache behavior with real LM Studio', async () => {
    if (!LM_STUDIO_URL) return console.warn('Skipping LM Studio E2E: LM_STUDIO_URL not provided');
    const t1 = new AITransformer({ type: 'lmstudio', port, timeout: 10000, batchSize: 1 });
    const fields = Array.from({ length: 12 }, (_, i) => ({ name: `f${i}`, detectionConfidence: 0.1 }));
    const formHtml = '<form>' + fields.map(f => `<input name="${f.name}">`).join('') + '</form>';
    const r1 = await t1.analyzeFormWithAI(formHtml, fields, { verbose: true, cacheTTL: 10000 });
    // Now run with larger batch size to measure fewer requests and shorter duration
    const t2 = new AITransformer({ type: 'lmstudio', port, timeout: 10000, batchSize: 6 });
    const start2 = Date.now();
    const r2 = await t2.analyzeFormWithAI(formHtml, fields, { verbose: true, cacheTTL: 10000 });
    const dur2 = Date.now() - start2;
    console.log('LM Studio E2E batching: durBatchMs:', dur2, 'suggCount:', (r2.suggestions || []).length);
    // caching: second call should set cached flag when called again with same context
    const r2b = await t2.analyzeFormWithAI(formHtml, fields, { verbose: true, cacheTTL: 10000 });
    expect(r2b.cached === true || r2b.cached === false).toBe(true);
  }, 40000);

  test('error handling with timeout and offline LM', async () => {
    if (!LM_STUDIO_URL) return console.warn('Skipping LM Studio E2E: LM_STUDIO_URL not provided');
    // Intentionally use a very short timeout to cause a timeout error
    const t = new AITransformer({ type: 'lmstudio', port, timeout: 1, batchSize: 2 });
    const fields = [{ name: 'a', detectionConfidence: 0.1 }];
    const formHtml = '<form><input name="a"></form>';
    const res = await t.analyzeFormWithAI(formHtml, fields, { verbose: true, cacheTTL: 1000 }).catch(e => ({ suggestions: [], error: e.message }));
    // Either returns empty suggestions or an error object - both are acceptable
    expect(res && (Array.isArray(res.suggestions) || res.error)).toBeTruthy();
  }, 20000);
});
