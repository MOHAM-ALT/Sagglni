/**
 * Sagglni Plus - Logging Utility
 * Provides comprehensive logging for debugging and monitoring
 * Logs to console and chrome.storage.local for persistence
 */

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(namespace = 'Sagglni', options = {}) {
    this.namespace = namespace;
    this.debugMode = options.debugMode || false;
    this.maxLogs = options.maxLogs || 500;
    this.enableConsole = options.enableConsole !== false;
    this.enableStorage = options.enableStorage !== false;
  }

  /**
   * Set debug mode on/off
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Format log message with timestamp and namespace
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevels).find(key => LogLevels[key] === level);
    const prefix = `[${timestamp}] [${this.namespace}] [${levelName}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Log a message at the specified level
   */
  log(level, message, data) {
    if (!this.debugMode && level < LogLevels.WARN) return; // Skip debug/info if not in debug mode

    const formattedMessage = this.formatMessage(level, message, data);

    // Log to console
    if (this.enableConsole) {
      const consoleLevel = this.getConsoleLevel(level);
      console[consoleLevel](formattedMessage);
    }

    // Log to storage
    if (this.enableStorage) {
      this.storeLog(level, message, data, formattedMessage);
    }
  }

  /**
   * Get console.log method name for the level
   */
  getConsoleLevel(level) {
    switch (level) {
      case LogLevels.DEBUG: return 'debug';
      case LogLevels.INFO: return 'info';
      case LogLevels.WARN: return 'warn';
      case LogLevels.ERROR: return 'error';
      default: return 'log';
    }
  }

  /**
   * Store log to chrome.storage.local
   */
  storeLog(level, message, data, formattedMessage) {
    chrome.storage.local.get(['logs'], (result) => {
      const logs = result?.logs || [];
      logs.push({
        timestamp: new Date().toISOString(),
        level: Object.keys(LogLevels).find(key => LogLevels[key] === level),
        namespace: this.namespace,
        message,
        data,
        formattedMessage
      });

      // Keep only recent logs
      if (logs.length > this.maxLogs) {
        logs.splice(0, logs.length - this.maxLogs);
      }

      chrome.storage.local.set({ logs });
    });
  }

  // Convenience methods
  debug(message, data) {
    this.log(LogLevels.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LogLevels.INFO, message, data);
  }

  warn(message, data) {
    this.log(LogLevels.WARN, message, data);
  }

  error(message, data) {
    this.log(LogLevels.ERROR, message, data);
  }

  /**
   * Log AI connection attempt
   */
  logAIConnection(host, port, type, result) {
    this.info(`AI Connection Attempt: ${type}@${host}:${port}`, {
      host,
      port,
      type,
      success: result.ok || result.healthy,
      latency: result.latency,
      status: result.status,
      error: result.error?.message
    });
  }

  /**
   * Log profile operation
   */
  logProfileOperation(operation, profileId, success, details) {
    const level = success ? LogLevels.INFO : LogLevels.ERROR;
    this.log(level, `Profile ${operation}: ${profileId}`, {
      success,
      ...details
    });
  }

  /**
   * Log form analysis
   */
  logFormAnalysis(url, fieldCount, aiUsed, details) {
    this.info('Form Analysis', {
      url,
      fieldCount,
      aiUsed,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log JSON parse operation
   */
  logJSONParse(success, error, fieldCount) {
    const level = success ? LogLevels.INFO : LogLevels.ERROR;
    this.log(level, `JSON Parse: ${success ? 'Success' : 'Failed'}`, {
      error: error?.message,
      fieldCount
    });
  }

  /**
   * Get recent logs from storage
   */
  async getLogs(filter = {}) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['logs'], (result) => {
        let logs = result?.logs || [];

        // Filter by level
        if (filter.level) {
          logs = logs.filter(log => log.level === filter.level);
        }

        // Filter by namespace
        if (filter.namespace) {
          logs = logs.filter(log => log.namespace === filter.namespace);
        }

        // Filter by time range
        if (filter.since) {
          const sinceTime = new Date(filter.since).getTime();
          logs = logs.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
        }

        // Limit to recent N logs
        if (filter.limit) {
          logs = logs.slice(-filter.limit);
        }

        resolve(logs);
      });
    });
  }

  /**
   * Clear logs from storage
   */
  clearLogs() {
    chrome.storage.local.set({ logs: [] });
  }

  /**
   * Export logs as JSON
   */
  async exportLogs() {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

// Create global logger instance
const logger = new Logger('Sagglni', {
  debugMode: false,
  maxLogs: 500,
  enableConsole: true,
  enableStorage: true
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, logger, LogLevels };
}

// Make available globally in browser context
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
  window.LogLevels = LogLevels;
}
