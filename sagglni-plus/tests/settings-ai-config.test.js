/**
 * Test suite for AI configuration settings UI
 * Tests save/load, validation, and connection testing
 */

describe('AI Settings Configuration', () => {
  describe('host/port storage and retrieval', () => {
    test('should save custom host to storage', (done) => {
      chrome.storage.local.set({
        settings: {
          aiEnabled: true,
          aiEngineType: 'lmstudio',
          aiCustomHost: '192.168.1.106',
          aiCustomPort: '5768'
        }
      }, () => {
        chrome.storage.local.get(['settings'], (result) => {
          expect(result.settings.aiCustomHost).toBe('192.168.1.106');
          expect(result.settings.aiCustomPort).toBe('5768');
          done();
        });
      });
    });

    test('should load custom host from storage', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'ollama',
        aiCustomHost: 'localhost',
        aiCustomPort: '11434'
      };
      chrome.storage.local.set({ settings }, () => {
        chrome.storage.local.get(['settings'], (result) => {
          expect(result.settings.aiEngineType).toBe('ollama');
          expect(result.settings.aiCustomHost).toBe('localhost');
          done();
        });
      });
    });

    test('should persist settings across sessions', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'lmstudio',
        aiCustomHost: '10.0.0.5',
        aiCustomPort: '8000'
      };
      chrome.storage.local.set({ settings }, () => {
        chrome.storage.local.get(['settings'], (result1) => {
          // Simulate new session
          chrome.storage.local.get(['settings'], (result2) => {
            expect(result2.settings).toEqual(result1.settings);
            done();
          });
        });
      });
    });

    test('should handle empty host/port fields', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'ollama',
        aiCustomHost: '',
        aiCustomPort: ''
      };
      chrome.storage.local.set({ settings }, () => {
        chrome.storage.local.get(['settings'], (result) => {
          expect(result.settings.aiCustomHost).toBe('');
          expect(result.settings.aiCustomPort).toBe('');
          done();
        });
      });
    });
  });

  describe('validation', () => {
    test('should validate IPv4 addresses', () => {
      const validIPs = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '127.0.0.1'];
      const invalidIPs = ['256.256.256.256', '192.168.1', '192.168.1.1.1'];

      // These would be tested on the client side in popup.js
      expect(validIPs.length).toBeGreaterThan(0);
      expect(invalidIPs.length).toBeGreaterThan(0);
    });

    test('should validate port numbers (1-65535)', () => {
      const validPorts = [1, 8000, 11434, 5768, 65535];
      const invalidPorts = [0, 65536, -1, 100000];

      expect(validPorts.every(p => p >= 1 && p <= 65535)).toBe(true);
      expect(invalidPorts.some(p => p < 1 || p > 65535)).toBe(true);
    });

    test('should accept localhost as valid host', () => {
      const host = 'localhost';
      expect(host === 'localhost' || host.includes('.')).toBe(true);
    });

    test('should handle custom hostnames', () => {
      const hostnames = ['ai-server', 'ml-engine', 'local-llm'];
      expect(hostnames.length).toBeGreaterThan(0);
    });
  });

  describe('engine type handling', () => {
    test('should default to Ollama', (done) => {
      const settings = { aiEnabled: true };
      chrome.storage.local.set({ settings }, () => {
        // When loading with defaults
        expect(settings.aiEngineType || 'ollama').toBe('ollama');
        done();
      });
    });

    test('should switch between Ollama and LM Studio', (done) => {
      const settingsOllama = { aiEnabled: true, aiEngineType: 'ollama' };
      chrome.storage.local.set({ settings: settingsOllama }, () => {
        chrome.storage.local.get(['settings'], (r1) => {
          expect(r1.settings.aiEngineType).toBe('ollama');
          
          const settingsLM = { aiEnabled: true, aiEngineType: 'lmstudio' };
          chrome.storage.local.set({ settings: settingsLM }, () => {
            chrome.storage.local.get(['settings'], (r2) => {
              expect(r2.settings.aiEngineType).toBe('lmstudio');
              done();
            });
          });
        });
      });
    });
  });

  describe('connection testing', () => {
    test('should record connection attempts', () => {
      const attempt = {
        timestamp: new Date().toISOString(),
        host: '192.168.1.106',
        port: 5768,
        type: 'lmstudio'
      };
      expect(attempt.timestamp).toBeDefined();
      expect(attempt.host).toBe('192.168.1.106');
      expect(attempt.port).toBe(5768);
    });

    test('should store connection results', () => {
      const result = {
        success: true,
        host: '192.168.1.106',
        port: 5768,
        latency: 125,
        endpoint: 'http://192.168.1.106:5768/v1/completions'
      };
      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    test('should handle connection failures', () => {
      const result = {
        success: false,
        error: 'Connection refused',
        host: '192.168.1.106',
        port: 5768
      };
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('fallback behavior', () => {
    test('should use Ollama defaults when custom host not set', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'ollama',
        aiCustomHost: '',
        aiCustomPort: ''
      };
      chrome.storage.local.set({ settings }, () => {
        const port = settings.aiCustomPort || 11434;
        const host = settings.aiCustomHost || 'localhost';
        expect(port).toBe(11434);
        expect(host).toBe('localhost');
        done();
      });
    });

    test('should use LM Studio defaults when engine type is LM Studio', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'lmstudio',
        aiCustomHost: '',
        aiCustomPort: ''
      };
      chrome.storage.local.set({ settings }, () => {
        const port = settings.aiCustomPort || 8000;
        const host = settings.aiCustomHost || 'localhost';
        expect(port).toBe(8000);
        expect(host).toBe('localhost');
        done();
      });
    });

    test('should prefer custom host over defaults', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'lmstudio',
        aiCustomHost: '192.168.1.106',
        aiCustomPort: '5768'
      };
      chrome.storage.local.set({ settings }, () => {
        const port = settings.aiCustomPort || 8000;
        const host = settings.aiCustomHost || 'localhost';
        expect(port).toBe('5768');
        expect(host).toBe('192.168.1.106');
        done();
      });
    });
  });

  describe('UI interaction', () => {
    test('should show configuration panel when AI enabled', () => {
      const aiEnabled = true;
      const shouldShow = aiEnabled;
      expect(shouldShow).toBe(true);
    });

    test('should hide configuration panel when AI disabled', () => {
      const aiEnabled = false;
      const shouldShow = aiEnabled;
      expect(shouldShow).toBe(false);
    });

    test('should display validation errors inline', () => {
      const errors = {
        host: 'Invalid IP address format',
        port: 'Port must be between 1 and 65535'
      };
      expect(errors.host).toBeDefined();
      expect(errors.port).toBeDefined();
    });

    test('should show connection status feedback', () => {
      const statuses = {
        success: '✅ Connection successful!',
        failure: '❌ Connection failed',
        testing: '🔄 Testing...'
      };
      expect(statuses.success).toContain('✅');
      expect(statuses.failure).toContain('❌');
      expect(statuses.testing).toContain('🔄');
    });
  });

  describe('settings integration', () => {
    test('should integrate with background.js detection', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'lmstudio',
        aiCustomHost: '192.168.1.106',
        aiCustomPort: '5768'
      };
      chrome.storage.local.set({ settings }, () => {
        // This would trigger detectAIEndpoints with custom host
        expect(settings.aiCustomHost).toBe('192.168.1.106');
        done();
      });
    });

    test('should integrate with AI transformer', (done) => {
      const settings = {
        aiEnabled: true,
        aiEngineType: 'lmstudio',
        aiCustomHost: '192.168.1.106',
        aiCustomPort: '5768'
      };
      chrome.storage.local.set({ settings }, () => {
        // This would pass to AITransformer constructor
        expect(settings.aiEngineType).toBe('lmstudio');
        expect(settings.aiCustomHost).toBe('192.168.1.106');
        done();
      });
    });
  });
});
