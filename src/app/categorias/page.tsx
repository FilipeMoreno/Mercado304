import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CategoriasClient } from "./categorias-client"

interface CategoriasPageProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export default function CategoriasPage({ searchParams }: CategoriasPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Categorias</h1>
					<p className="text-gray-600 mt-2">Gerencie as categorias dos seus produtos</p>
				</div>
				<Link href="/categorias/nova">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Nova Categoria
					</Button>
				</Link>
			</div>

			<CategoriasClient searchParams={searchParams} />
		</div>
	)
}
