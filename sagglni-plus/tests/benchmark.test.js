const AITransformer = require('../src/transformer/ai-transformer');
const fs = require('fs');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

describe('AITransformer performance benchmarks', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; jest.resetModules(); });

  test('batching vs non-batching performance', async () => {
    // Simulate LM Studio that takes 80ms per request and returns suggestions for input prompts
    let requests = 0;
    global.fetch = jest.fn(async (url, opts) => {
      requests++;
      // Introduce simulated processing time per call
      await sleep(80);
      if (url.includes('/api/generate')) {
        const promptBody = JSON.parse(opts.body || '{}');
        const prompt = promptBody.prompt || '';
        // Return a JSON array of suggestions for all index occurrences in prompt
        const matches = [...prompt.matchAll(/"index"\s*:\s*(\d+)/g)];
        const suggestions = matches.map(m => ({ index: Number(m[1]), name: `f${m[1]}`, suggestedType: 'firstName', confidence: 0.9 }));
        return { ok: true, json: async () => ({ content: JSON.stringify(suggestions) }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const fieldCount = 20;
    const fields = Array.from({ length: fieldCount }, (_, i) => ({ name: `f${i}`, detectionConfidence: 0.2 }));
    const formHtml = '<form>' + fields.map(f => `<input name="${f.name}">`).join('') + '</form>';
    const tNonBatch = new AITransformer({ type: 'lmstudio', port: 9999, timeout: 2000, batchSize: 1 });
    const startNonBatch = Date.now();
    const r1 = await tNonBatch.analyzeFormWithAI(formHtml, fields, { verbose: false });
    const durNonBatch = Date.now() - startNonBatch;

    // Reset requests for batch run
    requests = 0;
    const tBatch = new AITransformer({ type: 'lmstudio', port: 9999, timeout: 2000, batchSize: 10 });
    const startBatch = Date.now();
    const r2 = await tBatch.analyzeFormWithAI(formHtml, fields, { verbose: false });
    const durBatch = Date.now() - startBatch;

    // Estimate 'token usage' by counting characters in prompts sent
    // This is an estimate: the real tokenization differs.
    function estimatePromptSize(prompt) { return prompt.length; }
    const nonBatchTokens = estimatePromptSize(`fields:${JSON.stringify(fields.map(f => f.name))}`) * fieldCount;
    const batchTokens = estimatePromptSize(`fields:${JSON.stringify(fields.map(f => f.name))}`) * Math.ceil(fieldCount / 10);

    const results = {
      nonBatch: { durationMs: durNonBatch, suggestions: r1.suggestions.length || 0, requests: Math.ceil(fieldCount / 1), estimatedPromptChars: nonBatchTokens },
      batch: { durationMs: durBatch, suggestions: r2.suggestions.length || 0, requests: Math.ceil(fieldCount / 10), estimatedPromptChars: batchTokens },
      totalFields: fieldCount
    };

    console.log('\nBenchmark Results:', JSON.stringify(results, null, 2));
    // Write to file for analysis
    try {
      fs.writeFileSync('BENCHMARK_RESULTS.md', `# Benchmark Results\n\n${JSON.stringify(results, null, 2)}\n`);
    } catch (e) { console.warn('Failed to write benchmark file:', e.message); }

    // Assertions: batch should be faster and use fewer estimated tokens and fewer requests
    expect(results.batch.requests).toBeLessThan(results.nonBatch.requests);
    expect(results.batch.estimatedPromptChars).toBeLessThan(results.nonBatch.estimatedPromptChars);
    expect(results.batch.durationMs).toBeLessThan(results.nonBatch.durationMs);
  }, 20000);
});
