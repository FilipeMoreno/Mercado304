import { ListaClient } from "./lista-client"

interface ListaPageProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
		status?: string
	}
}

export default function ListaPage({ searchParams }: ListaPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Listas de Compras</h1>
					<p className="text-gray-600 mt-2">Organize suas listas de compras</p>
				</div>
			</div>

			<ListaClient searchParams={searchParams} />
		</div>
	)
}
