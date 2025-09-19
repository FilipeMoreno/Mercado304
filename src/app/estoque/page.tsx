"use client"

import { Suspense, lazy } from "react"
import StockSkeleton from "@/components/skeletons/stock-skeleton"

const EstoqueClient = lazy(() =>
	import("./estoque-client").then((module) => ({ default: module.EstoqueClient }))
)

interface EstoquePageProps {
	searchParams: {
		location?: string
		search?: string
	}
}

export default function EstoquePage({ searchParams }: EstoquePageProps) {
	return (
		<Suspense fallback={<StockSkeleton />}>
			<EstoqueClient searchParams={searchParams} />
		</Suspense>
	)
}
