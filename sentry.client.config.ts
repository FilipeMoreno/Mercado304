import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV !== "development",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.1,
})


