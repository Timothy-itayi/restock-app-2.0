import Constants from 'expo-constants';

/**
 * App Configuration
 * 
 * Accesses environment variables passed via eas.json and app.config.js
 */

const extra = Constants.expoConfig?.extra || {};

export const Config = {
  COMPANY_API_URL: extra.COMPANY_API_URL || 'https://restock-company.parse-doc.workers.dev',
  PARSE_DOC_API_URL: extra.PARSE_DOC_API_URL || 'https://restock-parse-doc.parse-doc.workers.dev',
  SEND_EMAIL_API_URL: extra.SEND_EMAIL_API_URL || 'https://restock-send-email.parse-doc.workers.dev',
  
  // Placeholder for future observability
  SENTRY_DSN: extra.SENTRY_DSN || null,
  
  // Environment identification
  IS_PRODUCTION: Constants.expoConfig?.extra?.channel === 'production',
  VERSION: Constants.expoConfig?.version || '1.0.0',
};

export default Config;

