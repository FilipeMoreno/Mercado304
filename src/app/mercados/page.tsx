
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
			</div>

			<MercadosClient searchParams={searchParams} />
		</div>
	)
}
