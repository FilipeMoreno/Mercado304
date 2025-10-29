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
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
				<p className="text-muted-foreground">
					Gerencie as categorias dos seus produtos
				</p>
			</div>

			<CategoriasClient searchParams={searchParams} />
		</div>
	)
}
