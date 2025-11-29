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
  async analyzeFormWithAI(formHtml, fields = [], context = {}) {
    // Build a JSON-friendly request to the LLM
    // Build a compact form context to limit token usage
    const pageTitle = context.pageTitle || context.pageInfo?.pageTitle || '';
    const pageUrl = context.pageUrl || context.pageInfo?.websiteUrl || '';
    const company = context.company || context.pageInfo?.company || '';
    const fieldsList = JSON.stringify(fields.map(f => ({ name: f.name, label: f.label || '', placeholder: f.placeholder || '', detectedType: f.detectedType || null })));
    const shortHtml = String(formHtml || '').replace(/\s+/g, ' ').slice(0, 8192); // cap HTML length
    const prompt = `You are a form analyzer. Given a webpage and a form, for each field provide a suggestion in the form { index, name, suggestedType, confidence, reason } as a JSON array. Return only JSON.\nPage: ${pageTitle || pageUrl} ${company ? 'Company: ' + company : ''}\nForm HTML (trimmed): ${shortHtml}\nFields: ${fieldsList}`;
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
        let txt = resp?.choices?.[0]?.output_text || resp?.output || (typeof resp === 'string' ? resp : JSON.stringify(resp));
        // Attempt to parse a JSON array from txt
        const match = txt && txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try { return { suggestions: JSON.parse(match[0]), raw: resp, rawText: txt }; } catch (e) {
            // try to sanitize common model formatting (strip code fences and backticks)
            const cleaned = txt.replace(/```[\s\S]*?```/g, '').replace(/`/g, '');
            const m2 = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (m2) {
              try { return { suggestions: JSON.parse(m2[0]), raw: resp, rawText: txt }; } catch (err) { /* fallthrough */ }
            }
            return { suggestions: [], raw: resp, rawText: txt };
          }
        }
        return { suggestions: [], raw: resp };
      }
      if (this.type === 'lmstudio') {
        const base = `http://localhost:${this.port}`;
        const url = `${base}/api/generate`;
        const body = { prompt };
        const resp = await postJson(url, body, this.timeout);
        let txt = resp?.content || (Array.isArray(resp?.outputs) ? resp.outputs[0] : resp?.outputs) || (typeof resp === 'string' ? resp : JSON.stringify(resp));
        const match = txt && (txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/));
        if (match) {
          try { return { suggestions: JSON.parse(match[0]), raw: resp, rawText: txt }; } catch (e) {
            const cleaned = txt.replace(/```[\s\S]*?```/g, '').replace(/`/g, '');
            const m2 = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (m2) {
              try { return { suggestions: JSON.parse(m2[0]), raw: resp, rawText: txt }; } catch (err) { /* fallthrough */ }
            }
            return { suggestions: [], raw: resp, rawText: txt };
          }
        }
        return { suggestions: [], raw: resp, rawText: txt };
      }
      return { suggestions: [], raw: null };
    } catch (err) {
      return { suggestions: [], raw: null };
    }
  }
}

module.exports = AITransformer;
