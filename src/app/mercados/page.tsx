import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MercadosClient } from "./mercados-client"

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

			<MercadosClient searchParams={searchParams} />
		</div>
	)
}
