"use client"

import { Suspense, lazy } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const EditStockClient = lazy(() =>
	import("./edit-stock-client").then((module) => ({ default: module.EditStockClient }))
)

interface EditStockPageProps {
	params: { id: string }
}

function EditStockSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-9 w-20" />
				<div>
					<Skeleton className="h-8 w-48 mb-2" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
			<div className="flex gap-3">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-24" />
			</div>
		</div>
	)
}

export default function EditStockPage({ params }: EditStockPageProps) {
	return (
		<Suspense fallback={<EditStockSkeleton />}>
			<EditStockClient params={params} />
		</Suspense>
	)
}
