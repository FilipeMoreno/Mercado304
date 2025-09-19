"use client"

import { Suspense, lazy } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const PriceRecordClient = lazy(() =>
	import("./price-record-client").then((module) => ({ default: module.PriceRecordClient }))
)

function PriceRecordSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-48 mb-2" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-24" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-40 w-full" />
				</div>
			</div>
		</div>
	)
}

export default function PrecosPage() {
	return (
		<Suspense fallback={<PriceRecordSkeleton />}>
			<PriceRecordClient />
		</Suspense>
	)
}
