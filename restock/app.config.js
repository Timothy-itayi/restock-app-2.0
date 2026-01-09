export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      COMPANY_API_URL: process.env.COMPANY_API_URL || config.extra.COMPANY_API_URL,
      PARSE_DOC_API_URL: process.env.PARSE_DOC_API_URL || config.extra.PARSE_DOC_API_URL,
      SEND_EMAIL_API_URL: process.env.SEND_EMAIL_API_URL || config.extra.SEND_EMAIL_API_URL,
      SENTRY_DSN: process.env.SENTRY_DSN || config.extra.SENTRY_DSN,
    },
  };
};

