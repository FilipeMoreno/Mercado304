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
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Compras</h1>
				<p className="text-muted-foreground">
					Registre e acompanhe suas compras
				</p>
			</div>

			<PurchasesClient searchParams={searchParams} />
		</div>
	)
}
