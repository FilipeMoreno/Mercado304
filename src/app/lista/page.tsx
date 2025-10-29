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
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Listas de Compras</h1>
				<p className="text-muted-foreground">
					Organize suas listas de compras
				</p>
			</div>

			<ListaClient searchParams={searchParams} />
		</div>
	)
}
