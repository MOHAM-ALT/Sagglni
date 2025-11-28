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

  // Analyze a page's form HTML and ask the AI to make field suggestions
  // `formHtml` is the outer HTML of the form and `fields` is an array of field metadata.
  // Returns: { suggestions: [{ index, name, suggestedType, confidence }], raw: <aiResponse> }
  async analyzeFormWithAI(formHtml, fields = []) {
    // Build a JSON-friendly request to the LLM
    const prompt = `You are given a form HTML. For each input field in the form, return a JSON array of suggestions of the form { index, name, suggestedType, confidence } where confidence is between 0 and 1. HTML:\n${formHtml}\nFields: ${JSON.stringify(fields.map(f => ({ name: f.name, id: f.id || null, placeholder: f.placeholder || '' })))}\nReturn a JSON string only.`;
    try {
      if (this.type === 'ollama') {
        const base = `http://localhost:${this.port}`;
        // read models if available
        const modelResp = await fetch(`${base}/v1/models`).then(r => r.json()).catch(() => null);
        const model = modelResp && modelResp.length ? modelResp[0].name : 'ollama';
        const url = `${base}/v1/completions`;
        const body = { model, input: prompt };
        const resp = await postJson(url, body, this.timeout);
        // try to extract JSON from resp text (common LLM response may include text)
        const txt = resp?.choices?.[0]?.output_text || resp?.output || JSON.stringify(resp);
        // Attempt to parse a JSON array from txt
        const match = txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try { return { suggestions: JSON.parse(match[0]), raw: resp }; } catch (e) { return { suggestions: [], raw: resp }; }
        }
        return { suggestions: [], raw: resp };
      }
      if (this.type === 'lmstudio') {
        const base = `http://localhost:${this.port}`;
        const url = `${base}/api/generate`;
        const body = { prompt };
        const resp = await postJson(url, body, this.timeout);
        const txt = resp?.content || resp?.outputs?.[0];
        const match = txt && (txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/));
        if (match) {
          try { return { suggestions: JSON.parse(match[0]), raw: resp }; } catch (e) { return { suggestions: [], raw: resp }; }
        }
        return { suggestions: [], raw: resp };
      }
      return { suggestions: [], raw: null };
    } catch (err) {
      return { suggestions: [], raw: null };
    }
  }
}

module.exports = AITransformer;
