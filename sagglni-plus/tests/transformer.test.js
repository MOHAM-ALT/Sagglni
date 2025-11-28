const DataTransformer = require('../src/transformer/transformer');

describe('DataTransformer', () => {
  test('transformPhone adds +966 for 9-digit local numbers starting with 5', () => {
    const dt = new DataTransformer();
    const result = dt.transformPhone('555555555');
    expect(result).toBe('+966555555555');
  });

  test('transformEmail lowercases', () => {
    const dt = new DataTransformer();
    expect(dt.transformEmail('Test@Example.COM')).toBe('test@example.com');
  });

  test('transformData uses AI transformer when enabled and returns ai output', async () => {
    const dt = new DataTransformer();
    dt.setAIEnabled(true);
    dt.setAIPort(11434);
    // mock fetch for AI transformer
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'test-model' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ output_text: '+966555' }] }) });
    const out = await dt.transformData('555', 'phone');
    expect(out).toBe('+966555');
  });
});
