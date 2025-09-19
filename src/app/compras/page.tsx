"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense, lazy } from "react"
import { PurchasesSkeleton } from "@/components/skeletons/purchases-skeleton"

const PurchasesClient = lazy(() =>
  import("./purchases-client").then((module) => ({ default: module.PurchasesClient }))
)

interface ComprasPageProps {
	searchParams: {
		search?: string
		market?: string
		sort?: string
		period?: string
		dateFrom?: string
		dateTo?: string
		page?: string
	}
}

export default function ComprasPage({ searchParams }: ComprasPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Compras</h1>
					<p className="text-gray-600 mt-2">Registre e acompanhe suas compras</p>
				</div>
				<Link href="/compras/nova">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Nova Compra
					</Button>
				</Link>
			</div>

			<Suspense fallback={<PurchasesSkeleton />}>
				<PurchasesClient searchParams={searchParams} />
			</Suspense>
		</div>
	)
}
