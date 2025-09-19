"use client"

import { Suspense, lazy } from "react"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"

const DashboardClient = lazy(() =>
	import("./dashboard-client").then((module) => ({ default: module.DashboardClient }))
)

export default function Home() {
	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<DashboardClient />
		</Suspense>
	)
}
