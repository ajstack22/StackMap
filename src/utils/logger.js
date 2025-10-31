/**
 * Production-safe logging utility for StackMap
 *
 * Disables console output in production builds while maintaining
 * debug capability in development.
 *
 * Usage:
 *   import { log, logError, logWarn } from './utils/logger';
 *   log('Debug message');
 *   logError('Error occurred', errorObject);
 */

// Enhanced environment detection with null checks
const isDev =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' &&
   process.env &&
   process.env.NODE_ENV === 'development');

/**
 * Log informational messages (development only)
 */
export const log = (message, ...args) => {
  if (isDev) {
    console.log(message, ...args);
  }
};

/**
 * Log warning messages (development only)
 */
export const logWarn = (message, ...args) => {
  if (isDev) {
    console.warn(message, ...args);
  }
};

/**
 * Log error messages
 * Always logs CRITICAL errors for monitoring
 * Other errors only in development
 */
export const logError = (message, ...args) => {
  // Always log critical errors for production monitoring
  const isCritical =
    typeof message === 'string' &&
    (message.includes('CRITICAL') || message.includes('[CRITICAL]'));

  if (isCritical || isDev) {
    console.error(message, ...args);
  }
};

/**
 * Create a namespaced logger for specific modules
 * Usage: const moduleLog = createLogger('SyncService');
 */
export const createLogger = (namespace) => ({
  log: (message, ...args) => log(`[${namespace}] ${message}`, ...args),
  warn: (message, ...args) => logWarn(`[${namespace}] ${message}`, ...args),
  error: (message, ...args) => logError(`[${namespace}] ${message}`, ...args),
});

export default { log, logWarn, logError, createLogger };
