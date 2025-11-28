/**
 * Lightweight AI connector utilities for local LLM detection & health checks
 */
const DEFAULTS = {
  ollama: { port: 11434 },
  lmstudio: { port: 8000 }
};

async function probeUrl(url, timeout = 1500) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(id);
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function checkOllama(port = DEFAULTS.ollama.port) {
  // Try standard endpoints: models and ping
  const base = `http://localhost:${port}`;
  const endpoints = ['/v1/models', '/v1/engines', '/'];
  for (const ep of endpoints) {
    const ok = await probeUrl(`${base}${ep}`);
    if (ok) return { type: 'ollama', port, healthy: true, endpoint: `${base}${ep}` };
  }
  return { type: 'ollama', port, healthy: false };
}

async function checkLMStudio(port = DEFAULTS.lmstudio.port) {
  // LM Studio health endpoints may vary; try common ones
  const base = `http://localhost:${port}`;
  const endpoints = ['/api/health', '/api/status', '/status', '/'];
  for (const ep of endpoints) {
    const ok = await probeUrl(`${base}${ep}`);
    if (ok) return { type: 'lmstudio', port, healthy: true, endpoint: `${base}${ep}` };
  }
  return { type: 'lmstudio', port, healthy: false };
}

async function detectAIEndpoints() {
  const results = [];
  const ollama = await checkOllama();
  const lm = await checkLMStudio();
  results.push(ollama, lm);
  return results;
}

async function checkAIHealth({ type = 'ollama', port } = {}) {
  if (type === 'lmstudio') return checkLMStudio(port || DEFAULTS.lmstudio.port);
  return checkOllama(port || DEFAULTS.ollama.port);
}

module.exports = { detectAIEndpoints, checkAIHealth };
