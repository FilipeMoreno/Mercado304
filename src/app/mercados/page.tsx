import { MercadosClient } from "./mercados-client"

interface MercadosPageProps {
	searchParams: Promise<{
		search?: string
		sort?: string
		page?: string
	}>
}

export default async function MercadosPage(props: MercadosPageProps) {
	const searchParams = await props.searchParams
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
