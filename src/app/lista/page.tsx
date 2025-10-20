import { ListaClient } from "./lista-client"

interface ListaPageProps {
	searchParams: Promise<{
		search?: string
		sort?: string
		page?: string
		status?: string
	}>
}

export default async function ListaPage(props: ListaPageProps) {
    const searchParams = await props.searchParams;
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
