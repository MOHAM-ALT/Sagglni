const AITransformer = require('../src/transformer/ai-transformer');

describe('AITransformer', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  test('ollama transform returns transformed value from completions', async () => {
    global.fetch = jest.fn()
      // first call: GET /v1/models
      .mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'test-model' }] })
      // second call: POST /v1/completions
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ output_text: '++966555' }] }) });

    const ai = new AITransformer({ type: 'ollama', port: 11434, timeout: 1000 });
    const out = await ai.transform('555', 'phone', { expectedFormat: 'E.164' });
    expect(out).toBe('++966555');
  });

  test('lmstudio transform returns content output', async () => {
    global.fetch = jest.fn()
      // LM Studio attempt to POST /api/generate
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '+966777' }) });
    const ai = new AITransformer({ type: 'lmstudio', port: 8000, timeout: 1000 });
    const out = await ai.transform('777', 'phone', { expectedFormat: 'E.164' });
    expect(out).toBe('+966777');
  });
});
