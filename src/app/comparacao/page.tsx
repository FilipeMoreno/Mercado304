import { TrendingUp } from "lucide-react"
import API_BASE_URL from "@/lib/api"
import { ComparisonClient } from "./comparison-client"

async function fetchInitialData() {
	const [listsRes, marketsRes, productsRes] = await Promise.all([
		fetch(`${API_BASE_URL}/shopping-lists`, { cache: "no-store" }),
		fetch(`${API_BASE_URL}/markets`, { cache: "no-store" }),
		fetch(`${API_BASE_URL}/products`, { cache: "no-store" }),
	])

	const [lists, marketsData, products] = await Promise.all([listsRes.json(), marketsRes.json(), productsRes.json()])

	// Extrair o array 'markets' do objeto de resposta
	const markets = marketsData.markets || []

	return { lists, markets, products }
}

export default async function ComparacaoPage({ searchParams }: { searchParams: { lista?: string } }) {
	const { lists, markets, products } = await fetchInitialData()

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div className="flex items-center gap-4">
					<TrendingUp className="h-8 w-8 text-blue-600" />
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold">
							Comparação de Preços
						</h1>
						<p className="text-gray-600 mt-2 text-sm sm:text-base">
							Compare preços entre diferentes mercados
						</p>
					</div>
				</div>
			</div>

			<ComparisonClient
				initialLists={lists}
				initialMarkets={markets}
				initialProducts={products}
				searchParams={searchParams}
			/>
		</div>
	)
}
