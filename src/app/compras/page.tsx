import { PurchasesClient } from "./purchases-client"

interface ComprasPageProps {
	searchParams: {
		search?: string
		market?: string
		sort?: string
		period?: string
		dateFrom?: string
		dateTo?: string
		page?: string
	}
}

export default async function ComprasPage({ searchParams }: ComprasPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Compras</h1>
					<p className="text-gray-600 mt-2">Registre e acompanhe suas compras</p>
				</div>
			</div>

			<PurchasesClient searchParams={searchParams} />
		</div>
	)
}
