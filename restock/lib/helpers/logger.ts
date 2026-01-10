/**
 * Logger Utility
 * 
 * Centralized logging for the application.
 * Integrates with Sentry for production error tracking and breadcrumbs.
 * 
 * Use `error()` for unexpected errors that should be reported to Sentry.
 * Use `userError()` for expected user-facing errors (e.g., validation) that shouldn't spam Sentry.
 */

import * as Sentry from '@sentry/react-native';
import Config from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = Config.IS_PRODUCTION ? 'info' : 'debug';

  debug(message: string, data?: Record<string, unknown>) {
    if (this.level === 'debug') {
      console.log(`[DEBUG] ${message}`, data ?? '');
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    if (!Config.IS_PRODUCTION) {
      console.log(`[INFO] ${message}`, data ?? '');
    }
    
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: 'info',
      data,
    });
  }

  warn(message: string, data?: Record<string, unknown>) {
    if (!Config.IS_PRODUCTION) {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
    
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: 'warning',
      data,
    });
  }

  /**
   * Log an unexpected error and report to Sentry.
   * Use this for actual bugs/crashes that need investigation.
   */
  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    // Always log to console in dev
    if (!Config.IS_PRODUCTION) {
      console.error(`[ERROR] ${message}`, error ?? '', data ?? '');
    }
    
    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      category: 'error',
      message,
      level: 'error',
      data,
    });
    
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, ...data },
      });
    } else if (error) {
      // Non-Error object - capture as message
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { errorData: error, ...data },
      });
    }
  }

  /**
   * Log a user-facing error (validation, expected failures).
   * Does NOT report to Sentry - these are expected behaviors.
   * Still adds breadcrumb for debugging context.
   */
  userError(message: string, data?: Record<string, unknown>) {
    if (!Config.IS_PRODUCTION) {
      console.warn(`[USER_ERROR] ${message}`, data ?? '');
    }
    
    Sentry.addBreadcrumb({
      category: 'user_error',
      message,
      level: 'warning',
      data,
    });
  }
}

export const logger = new Logger();
export default logger;
