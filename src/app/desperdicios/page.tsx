"use client"

import { Suspense, lazy } from "react"
import WasteSkeleton from "@/components/skeletons/waste-skeleton"

const DesperdiciosClient = lazy(() =>
	import("./desperdicios-client").then((module) => ({ default: module.default }))
)

export default function DesperdiciosPage() {
	return (
		<Suspense fallback={<WasteSkeleton />}>
			<DesperdiciosClient />
		</Suspense>
	)
}
