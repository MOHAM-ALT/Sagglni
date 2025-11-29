/**
 * Lightweight AI connector utilities for local LLM detection & health checks
 */
const DEFAULTS = {
  ollama: { port: 11434 },
  lmstudio: { port: 8000 }
};

// Configuration: retries, timeout per attempt (ms), and backoff multiplier
const DEFAULT_CONFIG = {
  timeoutMs: 1500,
  retries: 3,
  backoff: 1.5,
  verbose: false
};

async function probeUrl(url, { timeout = DEFAULT_CONFIG.timeoutMs, retries = DEFAULT_CONFIG.retries, backoff = DEFAULT_CONFIG.backoff, verbose = DEFAULT_CONFIG.verbose } = {}) {
  // Try a GET on the given URL with timeout and retry logic
  let attempt = 0;
  let lastErr = null;
  while (attempt < retries) {
    attempt++;
    let id;
    try {
      const controller = new AbortController();
      id = setTimeout(() => controller.abort(), timeout);
      const start = Date.now();
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      const elapsed = Date.now() - start;
      if (verbose) console.log(`probeUrl success ${url} [attempt ${attempt}] status=${res.status} latency=${elapsed}ms`);
      return { ok: res.ok, status: res.status, latency: elapsed };
    } catch (e) {
      lastErr = e;
      if (verbose) console.warn(`probeUrl attempt ${attempt} failed for ${url}:`, e && e.message ? e.message : e);
      // Backoff before retrying (only if another attempt will be run)
      if (attempt < retries) await new Promise(r => setTimeout(r, Math.round(timeout * Math.pow(backoff, attempt - 1))));
    } finally {
      try { if (id) clearTimeout(id); } catch (e) { if (verbose) console.warn('Failed clearing abort timeout', e?.message || e); }
    }
  }
  return { ok: false, error: lastErr };
}

async function checkOllama(port = DEFAULTS.ollama.port, config = DEFAULT_CONFIG) {
  const base = `http://localhost:${port}`;
  const endpoints = ['/v1/models', '/v1/engines', '/v1/health', '/'];
  const results = [];
  for (const ep of endpoints) {
    // probeUrl returns object {ok, status}
    const r = await probeUrl(`${base}${ep}`, config);
    results.push({ endpoint: `${base}${ep}`, ...r });
    if (r && r.ok) return { type: 'ollama', port, healthy: true, endpoint: `${base}${ep}`, results };
  }
  return { type: 'ollama', port, healthy: false, results };
}

async function checkLMStudio(port = DEFAULTS.lmstudio.port, config = DEFAULT_CONFIG) {
  // LM Studio health endpoints may vary; try common ones
  const base = `http://localhost:${port}`;
  const endpoints = ['/api/health', '/api/status', '/health', '/status', '/api/v1/health', '/'];
  const results = [];
  for (const ep of endpoints) {
    const r = await probeUrl(`${base}${ep}`, config);
    results.push({ endpoint: `${base}${ep}`, ...r });
    if (r && r.ok) return { type: 'lmstudio', port, healthy: true, endpoint: `${base}${ep}`, results };
  }
  return { type: 'lmstudio', port, healthy: false, results };
}

async function detectAIEndpoints(options = {}) {
  // options: { ports: {ollama:[...], lmstudio:[...] }, config }
  const config = Object.assign({}, DEFAULT_CONFIG, options.config || {});
  const results = [];
  // Allowed ports arrays for detection
  const ollamaPorts = (options.ports && options.ports.ollama) || [DEFAULTS.ollama.port];
  const lmPorts = (options.ports && options.ports.lmstudio) || [DEFAULTS.lmstudio.port];
  // scan ollama ports
  for (const p of ollamaPorts) {
    try {
      const r = await checkOllama(p, config);
      results.push(r);
      if (r.healthy) break;
    } catch (err) {
      if (config.verbose) console.warn('checkOllama scan error', err && err.message ? err.message : err);
      results.push({ type: 'ollama', port: p, healthy: false, error: err });
    }
  }
  // scan LM Studio ports
  for (const p of lmPorts) {
    try {
      const r = await checkLMStudio(p, config);
      results.push(r);
      if (r.healthy) break;
    } catch (err) {
      if (config.verbose) console.warn('checkLMStudio scan error', err && err.message ? err.message : err);
      results.push({ type: 'lmstudio', port: p, healthy: false, error: err });
    }
  }
  return results;
}

async function checkAIHealth({ type = 'ollama', port, config } = {}) {
  const cfg = Object.assign({}, DEFAULT_CONFIG, config || {});
  if (type === 'lmstudio') return checkLMStudio(port || DEFAULTS.lmstudio.port, cfg);
  return checkOllama(port || DEFAULTS.ollama.port, cfg);
}

module.exports = { detectAIEndpoints, checkAIHealth, DEFAULTS, DEFAULT_CONFIG };
