/**
 * Simple logger abstraction to standardize error reporting.
 * In the future, this can be swapped for Sentry, Datadog, etc.
 */

export const logger = {
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, error, context, timestamp: new Date().toISOString() }))
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, context, timestamp: new Date().toISOString() }))
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }))
  },
}
