/**
 * AITransformer provides a best-effort client to local LLM endpoints (Ollama, LM Studio)
 * This is intentionally resilient and works via multiple endpoint attempts; production integration
 * should adjust requests to match the local LLM's API.
 */
const DEFAULTS = { ollamaPort: 11434, lmStudioPort: 8000 };

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
  constructor({ type = 'ollama', port = DEFAULTS.ollamaPort, timeout = 3000 } = {}) {
    this.type = type;
    this.port = port;
    this.timeout = timeout;
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
}

module.exports = AITransformer;
