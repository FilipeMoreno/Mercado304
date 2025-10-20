import { DollarSign } from "lucide-react"
import API_BASE_URL from "@/lib/api"
import { PriceRecordClient } from "./price-record-client"

async function fetchInitialData() {
	try {
		const [productsRes, marketsRes] = await Promise.all([
			fetch(`${API_BASE_URL}/products?limit=10000`, { next: { revalidate: 300 } }), // Cache por 5 minutos, buscar até 10000 produtos
			fetch(`${API_BASE_URL}/markets?limit=1000`, { next: { revalidate: 300 } }), // Cache por 5 minutos, buscar até 1000 mercados
		])

		if (!productsRes.ok || !marketsRes.ok) {
			console.error("Erro ao buscar dados iniciais")
			return { products: [], markets: [] }
		}

		const [productsData, marketsData] = await Promise.all([productsRes.json(), marketsRes.json()])

		// Extrair arrays dos objetos de resposta
		const markets = marketsData.markets || []
		const products = productsData.products || []

		console.log(`[Preços Page] Produtos carregados: ${products.length}`)
		console.log(`[Preços Page] Mercados carregados: ${markets.length}`)

		return { products, markets }
	} catch (error) {
		console.error("Erro ao carregar dados:", error)
		return { products: [], markets: [] }
	}
}

export default async function PrecosPage() {
	const { products, markets } = await fetchInitialData()

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div className="flex items-center gap-4">
					<DollarSign className="size-8 text-green-600" />
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold">
							Registro de Preços
						</h1>
						<p className="text-gray-600 mt-2 text-sm sm:text-base">
							Registre e acompanhe os preços dos produtos
						</p>
					</div>
				</div>
			</div>

			<PriceRecordClient initialProducts={products} initialMarkets={markets} />
		</div>
	)
}
