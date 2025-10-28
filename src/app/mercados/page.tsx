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
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Mercados</h1>
				<p className="text-muted-foreground">
					Gerencie os mercados onde você faz suas compras
				</p>
			</div>

			<MercadosClient searchParams={searchParams} />
		</div>
	)
}
