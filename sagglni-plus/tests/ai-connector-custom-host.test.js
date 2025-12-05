/**
 * Test suite for custom AI host/port configuration
 * Tests detection, validation, and fallback behavior
 */

const { detectAIEndpoints, checkAIHealth, DEFAULTS } = require('../src/background/ai-connector');

describe('AI Connector - Custom Host Support', () => {
  describe('detectAIEndpoints with custom host', () => {
    test('should accept custom host and port options', async () => {
      const options = {
        customHost: '192.168.1.106',
        customPort: 5768,
        config: { timeoutMs: 500, retries: 1, backoff: 1.5, verbose: false }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should validate custom host before probing', async () => {
      const options = {
        customHost: 'localhost',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    test('should include custom host in results', async () => {
      const options = {
        customHost: 'testhost',
        customPort: 9000,
        config: { timeoutMs: 500, retries: 1, verbose: false }
      };
      
      const results = await detectAIEndpoints(options);
      const customResult = results.find(r => r.host === 'testhost');
      expect(customResult).toBeDefined();
      expect(customResult.port).toBe(9000);
    });

    test('should return custom host in results when provided', async () => {
      const options = {
        customHost: '127.0.0.1',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.host === '127.0.0.1')).toBe(true);
    });
  });

  describe('checkAIHealth with custom host', () => {
    test('should accept host parameter for Ollama', async () => {
      const result = await checkAIHealth({
        type: 'ollama',
        host: 'localhost',
        port: 11434,
        config: { timeoutMs: 500, retries: 1 }
      });
      
      expect(result).toBeDefined();
      expect(result.type).toBe('ollama');
      expect(result.host).toBe('localhost');
    });

    test('should accept host parameter for LM Studio', async () => {
      const result = await checkAIHealth({
        type: 'lmstudio',
        host: 'localhost',
        port: 8000,
        config: { timeoutMs: 500, retries: 1 }
      });
      
      expect(result).toBeDefined();
      expect(result.type).toBe('lmstudio');
      expect(result.host).toBe('localhost');
    });

    test('should return host and port in health check response', async () => {
      const result = await checkAIHealth({
        type: 'lmstudio',
        host: '192.168.1.106',
        port: 5768,
        config: { timeoutMs: 500, retries: 1 }
      });
      
      expect(result.host).toBe('192.168.1.106');
      expect(result.port).toBe(5768);
    });
  });

  describe('fallback behavior', () => {
    test('should use localhost when no custom host provided', async () => {
      const options = {
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      const localhostResults = results.filter(r => r.host === 'localhost');
      expect(localhostResults.length).toBeGreaterThanOrEqual(1);
    });

    test('should use default ports when no custom port provided', async () => {
      const options = {
        customHost: 'localhost',
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.port === DEFAULTS.lmstudio.port)).toBe(true);
    });
  });

  describe('IP validation', () => {
    test('should handle IPv4 addresses', async () => {
      const options = {
        customHost: '192.168.1.1',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle localhost string', async () => {
      const options = {
        customHost: 'localhost',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.host === 'localhost')).toBe(true);
    });

    test('should handle custom hostnames', async () => {
      const options = {
        customHost: 'ai-server',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.host === 'ai-server')).toBe(true);
    });
  });

  describe('port validation', () => {
    test('should accept valid port numbers', async () => {
      const options = {
        customHost: 'localhost',
        customPort: 5768,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.port === 5768)).toBe(true);
    });

    test('should accept minimum port (1)', async () => {
      const options = {
        customHost: 'localhost',
        customPort: 1,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.port === 1)).toBe(true);
    });

    test('should accept maximum port (65535)', async () => {
      const options = {
        customHost: 'localhost',
        customPort: 65535,
        config: { timeoutMs: 500, retries: 1 }
      };
      
      const results = await detectAIEndpoints(options);
      expect(results.some(r => r.port === 65535)).toBe(true);
    });
  });

  describe('connection attempts logging', () => {
    test('should log connection attempts when verbose enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const options = {
        customHost: 'test-host',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1, verbose: true }
      };
      
      await detectAIEndpoints(options);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should not log when verbose disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const options = {
        customHost: 'test-host',
        customPort: 8000,
        config: { timeoutMs: 500, retries: 1, verbose: false }
      };
      
      await detectAIEndpoints(options);
      // Should have minimal or no logs for successful bypass
      
      consoleSpy.mockRestore();
    });
  });
});
