import { MarcasClient } from "./marcas-client"

interface MarcasPageProps {
	searchParams: Promise<{
		search?: string
		sort?: string
		page?: string
	}>
}

export default async function MarcasPage(props: MarcasPageProps) {
    const searchParams = await props.searchParams;
    return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Marcas</h1>
					<p className="text-gray-600 mt-2">Gerencie as marcas dos seus produtos</p>
				</div>
			</div>

			<MarcasClient searchParams={searchParams} />
		</div>
	)
}
