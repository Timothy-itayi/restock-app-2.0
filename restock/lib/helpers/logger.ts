/**
 * Logger Utility
 * 
 * Centralized logging for the application.
 * Integrates with Sentry for production error tracking and breadcrumbs.
 */

import * as Sentry from '@sentry/react-native';
import Config from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = Config.IS_PRODUCTION ? 'info' : 'debug';

  debug(message: string, ...args: any[]) {
    if (this.level === 'debug') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    console.log(`[INFO] ${message}`, ...args);
    
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: 'info',
      data: args,
    });
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args);
    
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: 'warning',
      data: args,
    });
  }

  error(message: string, error?: unknown, ...args: any[]) {
    console.error(`[ERROR] ${message}`, error, ...args);
    
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, additionalArgs: args },
      });
    } else {
      // If it's not an Error object, capture it as a message with extras
      Sentry.captureMessage(`${message}: ${JSON.stringify(error)}`, {
        level: 'error',
        extra: { additionalArgs: args }
      });
    }
  }
}

export const logger = new Logger();
export default logger;
