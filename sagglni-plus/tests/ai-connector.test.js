const { detectAIEndpoints, checkAIHealth, DEFAULTS, DEFAULT_CONFIG } = require('../src/background/ai-connector');

describe('AI connector detection', () => {
  test('detectAIEndpoints runs and returns array', async () => {
    const results = await detectAIEndpoints({ config: { timeoutMs: 200, retries: 1 } });
    expect(Array.isArray(results)).toBe(true);
    // Should return at least two results for ollama and lmstudio
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  test('checkAIHealth returns an object with type', async () => {
    const r = await checkAIHealth({ type: 'lmstudio', port: DEFAULTS.lmstudio.port, config: { timeoutMs: 200, retries: 1 } });
    expect(r).toHaveProperty('type');
    expect(r.type).toBe('lmstudio');
  });
});
