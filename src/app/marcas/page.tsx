import { MarcasClient } from "./marcas-client"

interface MarcasPageProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export default function MarcasPage({ searchParams }: MarcasPageProps) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
				<p className="text-muted-foreground">
					Gerencie as marcas dos seus produtos
				</p>
			</div>

			<MarcasClient searchParams={searchParams} />
		</div>
	)
}
