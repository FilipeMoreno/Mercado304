import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductsClient } from "./products-client"

interface ProductsPageProps {
	searchParams: {
		search?: string
		category?: string
		brand?: string
		sort?: string
		page?: string
	}
}

export default function ProdutosPage({ searchParams }: ProductsPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Produtos</h1>
					<p className="text-gray-600 mt-2">Gerencie o catálogo de produtos</p>
				</div>
				<Link href="/produtos/novo">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Novo Produto
					</Button>
				</Link>
			</div>

			<ProductsClient searchParams={searchParams} />
		</div>
	)
}
