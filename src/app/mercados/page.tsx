"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense, lazy } from "react"
import { MarketsSkeleton } from "@/components/skeletons/markets-skeleton"

const MercadosClient = lazy(() =>
  import("./mercados-client").then((module) => ({ default: module.MercadosClient }))
)

interface MercadosPageProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export default function MercadosPage({ searchParams }: MercadosPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Mercados</h1>
					<p className="text-gray-600 mt-2">Gerencie os mercados onde você faz suas compras</p>
				</div>
				<Link href="/mercados/novo">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Novo Mercado
					</Button>
				</Link>
			</div>

			<Suspense fallback={<MarketsSkeleton />}>
				<MercadosClient searchParams={searchParams} />
			</Suspense>
		</div>
	)
}
