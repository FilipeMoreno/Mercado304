"use client"

import * as Sentry from "@sentry/nextjs"

// Inicialização mínima do Sentry no cliente (usa env padrão do SDK)
if (typeof window !== "undefined" && !Sentry.isInitialized()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart


