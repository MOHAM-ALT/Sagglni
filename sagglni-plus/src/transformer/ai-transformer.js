/**
 * AITransformer provides a best-effort client to local LLM endpoints (Ollama, LM Studio)
 * This is intentionally resilient and works via multiple endpoint attempts; production integration
 * should adjust requests to match the local LLM's API.
 */
const DEFAULTS = { ollamaPort: 11434, lmStudioPort: 8000 };

function hashString(s = '') {
  // simple djb2 hash
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return String(h >>> 0);
}

async function postJson(url, body, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

class AITransformer {
  constructor({ type = 'ollama', port = DEFAULTS.ollamaPort, timeout = 3000, batchSize = 10, onlyLowConfidence = true, lowConfidenceThreshold = 0.7 } = {}) {
    this.type = type;
    this.port = port;
    this.timeout = timeout;
    this.batchSize = batchSize;
    this.onlyLowConfidence = onlyLowConfidence;
    this.lowConfidenceThreshold = lowConfidenceThreshold;
    // shared cache per worker - simple in-memory Map with entries { value, ts }
    this._cache = AITransformer._cache || new Map();
    AITransformer._cache = this._cache;
  }

  async transform(value, fieldType, format) {
    // Build a simple prompt that asks for a type-specific transformation
    const prompt = `Transform the following value to a ${fieldType} string in format ${format && format.expectedFormat ? format.expectedFormat : 'suitable format'}: ${value}`;
    try {
      if (this.type === 'ollama') {
        // Ollama: try common completions endpoint
        const base = `http://localhost:${this.port}`;
        // attempt to find a model name and call /v1/completions
          const models = await fetch(`${base}/v1/models`).then(r => r.json()).catch(() => null);
          const model = models && models.length ? models[0].name : 'ollama';
          const url = `${base}/v1/completions`;
          const body = { model, input: prompt };
          const resp = await postJson(url, body, this.timeout);
          // Resp parsing: try .choices[0].output_text or .output
          if (resp && resp.choices && resp.choices[0] && resp.choices[0].output_text) return resp.choices[0].output_text.trim();
          if (resp && resp.output) return String(resp.output).trim();
          return null;
      }
      if (this.type === 'lmstudio') {
        const base = `http://localhost:${this.port}`;
        const url = `${base}/api/generate`;
        const body = { prompt };
        const resp = await postJson(url, body, this.timeout);
        if (resp && resp.content) return String(resp.content).trim();
        if (resp && resp.outputs && resp.outputs[0]) return String(resp.outputs[0]).trim();
        return null;
      }
      return null;
    } catch (err) {
      // Upper layer will fallback
      return null;
    }
  }

  // Analyze a page's form HTML and ask the AI to make field suggestions
  // `formHtml` is the outer HTML of the form and `fields` is an array of field metadata.
  // Returns: { suggestions: [{ index, name, suggestedType, confidence }], raw: <aiResponse> }
  async analyzeFormWithAI(formHtml, fields = [], context = {}) {
    // Build a JSON-friendly request to the LLM
    // Build a compact form context to limit token usage
    const pageTitle = context.pageTitle || context.pageInfo?.pageTitle || '';
    const pageUrl = context.pageUrl || context.pageInfo?.websiteUrl || '';
    const company = context.company || context.pageInfo?.company || '';
    // include index so returned suggestions can be mapped back reliably
    const fieldsList = (fList) => JSON.stringify(fList.map((f, i) => ({ index: f.index || i, name: f.name, label: f.label || '', placeholder: f.placeholder || '', detectedType: f.detectedType || null })));
    const shortHtml = String(formHtml || '').replace(/\s+/g, ' ').slice(0, 8192); // cap HTML length
    // Start timestamp is tracked per chunk in the requestPrompt helper
    const ttl = context.cacheTTL || (5 * 60 * 1000); // default 5 minutes
    const baseKey = `${this.type}|${this.port}|${hashString((formHtml || '').slice(0, 4096))}|${hashString(context.pageInfo?.pageTitle || '')}`;
    // Cache checks are performed per-chunk below to allow batching

    try {
      const batchSize = context.batchSize || this.batchSize || 10;
      const onlyLowConfidence = typeof context.onlyLowConfidence === 'boolean' ? context.onlyLowConfidence : this.onlyLowConfidence;
      const lowConfidenceThreshold = context.lowConfidenceThreshold || this.lowConfidenceThreshold || 0.7;
      // ensure fields array has index annotations (original indexes)
      const indexedFields = fields.map((f, i) => Object.assign({}, f, { index: i }));
      let candidates = indexedFields;
      if (onlyLowConfidence) {
        const low = indexedFields.filter(f => (f.detectionConfidence || 0) < lowConfidenceThreshold);
        candidates = low; // if no low-confidence fields, we will have candidates.length===0 and return early
      }
      // if there are no candidates, fall back to nothing (avoid unnecessary LLM calls)
      if (!candidates || candidates.length === 0) return { suggestions: [], raw: null };
      // chunk candidates by batchSize
      const chunks = [];
      for (let i = 0; i < candidates.length; i += batchSize) chunks.push(candidates.slice(i, i + batchSize));
      const allSuggestions = [];
      let totalLatency = 0;

      const requestPrompt = async (promptText, cacheKey) => {
        // check per-chunk cache
        if (this._cache.has(cacheKey)) {
          const entry = this._cache.get(cacheKey);
          if (entry && (Date.now() - entry.ts) < ttl) {
            if (context.verbose) console.log('AITransformer: cache hit for form chunk');
            return Object.assign({}, entry.value, { cached: true });
          }
        }
        const chunkStart = Date.now();
        if (this.type === 'ollama') {
          const base = `http://localhost:${this.port}`;
          const modelResp = await fetch(`${base}/v1/models`).then(r => r.json()).catch(() => null);
          const model = modelResp && modelResp.length ? modelResp[0].name : 'ollama';
          const url = `${base}/v1/completions`;
          const body = { model, input: promptText };
          const resp = await postJson(url, body, this.timeout);
          let txt = resp?.choices?.[0]?.output_text || resp?.output || (typeof resp === 'string' ? resp : JSON.stringify(resp));
          const match = txt && txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            try {
              const val = { suggestions: JSON.parse(match[0]), raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart };
              this._cache.set(cacheKey, { value: val, ts: Date.now() });
              return val;
            } catch (e) {
              const cleaned = txt.replace(/```[\s\S]*?```/g, '').replace(/`/g, '');
              const m2 = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
              if (m2) {
                try {
                  const val = { suggestions: JSON.parse(m2[0]), raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart };
                  this._cache.set(cacheKey, { value: val, ts: Date.now() });
                  return val;
                } catch (err) { /* fallthrough */ }
              }
              const val2 = { suggestions: [], raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart };
              this._cache.set(cacheKey, { value: val2, ts: Date.now() });
              return val2;
            }
          }
          const val3 = { suggestions: [], raw: resp, latencyMs: Date.now() - chunkStart };
          this._cache.set(cacheKey, { value: val3, ts: Date.now() });
          return val3;
        }
        if (this.type === 'lmstudio') {
          const base = `http://localhost:${this.port}`;
          const url = `${base}/api/generate`;
          const body = { prompt: promptText };
          const resp = await postJson(url, body, this.timeout);
          let txt = resp?.content || (Array.isArray(resp?.outputs) ? resp.outputs[0] : resp?.outputs) || (typeof resp === 'string' ? resp : JSON.stringify(resp));
          const match = txt && (txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/));
          if (match) {
            try {
              const val = { suggestions: JSON.parse(match[0]), raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart };
              this._cache.set(cacheKey, { value: val, ts: Date.now() });
              return val;
            } catch (e) {
              const cleaned = txt.replace(/```[\s\S]*?```/g, '').replace(/`/g, '');
              const m2 = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
              if (m2) {
                try { const val = { suggestions: JSON.parse(m2[0]), raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart }; this._cache.set(cacheKey, { value: val, ts: Date.now() }); return val; } catch (err) { /* fallthrough */ }
              }
              const val2 = { suggestions: [], raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart };
              this._cache.set(cacheKey, { value: val2, ts: Date.now() });
              return val2;
            }
          }
          const val3 = { suggestions: [], raw: resp, rawText: txt, latencyMs: Date.now() - chunkStart };
          this._cache.set(cacheKey, { value: val3, ts: Date.now() });
          return val3;
        }
        return { suggestions: [], raw: null };
      };

      let anyCached = false;
      for (const chunk of chunks) {
        const chunkKey = `${baseKey}|${hashString(JSON.stringify(chunk.map(f => f.name || '')))}|${hashString(JSON.stringify(chunk.map(f => f.index || 0)))}`;
        const conciseMode = context.concise || false;
        const basePrompt = conciseMode ? 'Analyze fields and return only JSON array of { index, name, suggestedType, confidence }' : 'You are a form analyzer. Given a webpage and a form, for each field provide a suggestion in the form { index, name, suggestedType, confidence, reason } as a JSON array. Return only JSON.';
        const promptChunk = `${basePrompt}\nPage: ${pageTitle || pageUrl} ${company ? 'Company: ' + company : ''}\nForm HTML (trimmed): ${shortHtml}\nFields: ${fieldsList(chunk)}`;
        const val = await requestPrompt(promptChunk, chunkKey);
        allSuggestions.push(...(val.suggestions || []));
        if (val && val.cached) anyCached = true;
        totalLatency += val.latencyMs || 0;
      }
      return { suggestions: allSuggestions, raw: null, latencyMs: totalLatency, cached: anyCached };
    } catch (err) {
      return { suggestions: [], raw: null };
    }
  }
}

module.exports = AITransformer;
