"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PostHogProvider } from "posthog-js/react"
import { initPostHog, posthog } from "@/lib/posthog"

export function AnalyticsProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initPostHog()
  }, [])

  // Pageviews no App Router
  useEffect(() => {
    if (!posthog) return
    posthog.capture("$pageview")
  }, [pathname, searchParams])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}


