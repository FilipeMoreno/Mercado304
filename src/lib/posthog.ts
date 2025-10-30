"use client"

import posthog from "posthog-js"

let initialized = false

export function initPostHog() {
  if (initialized) return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
  })
  initialized = true
}

export { posthog }


