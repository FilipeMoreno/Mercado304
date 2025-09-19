"use client"

import { Suspense, lazy } from "react"
import ComparisonSkeleton from "@/components/skeletons/comparison-skeleton"

const ComparisonClient = lazy(() =>
	import("./comparison-client").then((module) => ({ default: module.ComparisonClient }))
)

export default function ComparacaoPage({ searchParams }: { searchParams: { lista?: string } }) {
	return (
		<Suspense fallback={<ComparisonSkeleton />}>
			<ComparisonClient 
				searchParams={searchParams} 
				initialLists={[]}
				initialMarkets={[]}
				initialProducts={[]}
			/>
		</Suspense>
	)
}
