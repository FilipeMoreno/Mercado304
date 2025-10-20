import { CategoriasClient } from "./categorias-client"

interface CategoriasPageProps {
	searchParams: Promise<{
		search?: string
		sort?: string
		page?: string
	}>
}

export default async function CategoriasPage(props: CategoriasPageProps) {
    const searchParams = await props.searchParams;
    return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Categorias</h1>
					<p className="text-gray-600 mt-2">Gerencie as categorias dos seus produtos</p>
				</div>
			</div>
			<CategoriasClient searchParams={searchParams} />
		</div>
	)
}
