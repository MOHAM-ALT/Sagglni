/**
 * Test suite for logging utility
 * Tests log levels, storage, filtering, and export
 */

const { Logger, LogLevels } = require('../src/utils/logger');

describe('Logger Utility', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger('Test', { debugMode: true, enableStorage: true });
  });

  describe('initialization', () => {
    test('should create logger with namespace', () => {
      expect(logger.namespace).toBe('Test');
    });

    test('should set debug mode', () => {
      logger.setDebugMode(true);
      expect(logger.debugMode).toBe(true);
    });

    test('should have all log levels', () => {
      expect(LogLevels.DEBUG).toBe(0);
      expect(LogLevels.INFO).toBe(1);
      expect(LogLevels.WARN).toBe(2);
      expect(LogLevels.ERROR).toBe(3);
    });

    test('should have default configuration', () => {
      expect(logger.debugMode).toBe(true);
      expect(logger.maxLogs).toBeGreaterThan(0);
      expect(logger.enableConsole).toBe(true);
    });
  });

  describe('logging levels', () => {
    test('should log debug messages in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      logger.debug('Test debug message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log info messages in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log warn messages always', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      logger.warn('Test warning');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log error messages always', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      logger.error('Test error');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should not log debug in non-debug mode', () => {
      const loggerNoDebug = new Logger('NoDebug', { debugMode: false });
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      loggerNoDebug.debug('Should not log');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('message formatting', () => {
    test('should format message with timestamp and namespace', () => {
      const message = logger.formatMessage(LogLevels.INFO, 'Test', null);
      expect(message).toContain('[Test]');
      expect(message).toContain('[INFO]');
      expect(message).toContain('Test');
    });

    test('should include data in formatted message', () => {
      const data = { host: '192.168.1.1', port: 8000 };
      const message = logger.formatMessage(LogLevels.INFO, 'Connection', data);
      expect(message).toContain('Connection');
      expect(message).toContain('192.168.1.1');
    });

    test('should format timestamp in ISO format', () => {
      const message = logger.formatMessage(LogLevels.INFO, 'Test', null);
      expect(message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('AI connection logging', () => {
    test('should log successful AI connection', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logAIConnection('192.168.1.106', 5768, 'lmstudio', { ok: true, latency: 125 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log failed AI connection', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logAIConnection('localhost', 11434, 'ollama', { ok: false, error: new Error('Connection refused') });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should include host and port in connection log', () => {
      const message = logger.formatMessage(LogLevels.INFO, 'AI Connection', {
        host: '192.168.1.106',
        port: 5768,
        type: 'lmstudio'
      });
      expect(message).toContain('192.168.1.106');
      expect(message).toContain('5768');
    });
  });

  describe('profile operation logging', () => {
    test('should log profile creation', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logProfileOperation('create', 'profile-123', true, { name: 'My Profile' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log profile update', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logProfileOperation('update', 'profile-123', true, { name: 'Updated Profile' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log profile deletion', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logProfileOperation('delete', 'profile-123', true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log failed profile operations as errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      logger.logProfileOperation('save', 'profile-123', false, { error: 'Validation failed' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('form analysis logging', () => {
    test('should log form analysis', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logFormAnalysis('https://example.com', 10, true, { aiUsedFor: ['email', 'name'] });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should include URL in analysis log', () => {
      const message = logger.formatMessage(LogLevels.INFO, 'Form Analysis', {
        url: 'https://example.com',
        fieldCount: 10
      });
      expect(message).toContain('example.com');
    });
  });

  describe('JSON parse logging', () => {
    test('should log successful JSON parse', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      logger.logJSONParse(true, null, 15);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log failed JSON parse as error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Invalid JSON');
      logger.logJSONParse(false, error, 0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('console output', () => {
    test('should use correct console methods', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    test('should disable console output when configured', () => {
      const noConsoleLogger = new Logger('NoConsole', { enableConsole: false });
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      noConsoleLogger.info('Should not log');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('data with errors', () => {
    test('should handle error objects in log data', () => {
      const error = new Error('Test error');
      const message = logger.formatMessage(LogLevels.ERROR, 'Error occurred', {
        error: error.message,
        stack: error.stack
      });
      expect(message).toContain('Test error');
    });

    test('should serialize complex objects', () => {
      const complexData = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        null: null
      };
      const message = logger.formatMessage(LogLevels.INFO, 'Complex', complexData);
      expect(message).toContain('nested');
    });
  });

  describe('logging constraints', () => {
    test('should maintain max log limit', (done) => {
      const limitedLogger = new Logger('Limited', { maxLogs: 5, enableStorage: true });
      
      // Add more logs than max
      for (let i = 0; i < 10; i++) {
        limitedLogger.info(`Log ${i}`);
      }

      // Check after a small delay
      setTimeout(() => {
        chrome.storage.local.get(['logs'], (result) => {
          const logs = result?.logs || [];
          expect(logs.length).toBeLessThanOrEqual(5);
          done();
        });
      }, 100);
    });

    test('should support custom namespace', () => {
      const customLogger = new Logger('CustomApp');
      expect(customLogger.namespace).toBe('CustomApp');
    });
  });

  describe('export and retrieval', () => {
    test('should export logs as JSON string', (done) => {
      logger.info('Test log 1');
      logger.warn('Test log 2');
      
      setTimeout(async () => {
        const exported = await logger.exportLogs();
        expect(typeof exported).toBe('string');
        const parsed = JSON.parse(exported);
        expect(Array.isArray(parsed)).toBe(true);
        done();
      }, 100);
    });

    test('should support clearing logs', (done) => {
      logger.info('Test log');
      
      setTimeout(() => {
        logger.clearLogs();
        
        setTimeout(() => {
          chrome.storage.local.get(['logs'], (result) => {
            const logs = result?.logs || [];
            expect(logs.length).toBe(0);
            done();
          });
        }, 50);
      }, 50);
    });
  });
});
