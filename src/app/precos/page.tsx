import API_BASE_URL from "@/lib/api"
import { PriceRecordClient } from "./price-record-client"

async function fetchInitialData() {
	try {
		const [productsRes, marketsRes] = await Promise.all([
			fetch(`${API_BASE_URL}/products?limit=1000`, { cache: "no-store" }), // Buscar mais produtos para autocomplete
			fetch(`${API_BASE_URL}/markets`, { cache: "no-store" }),
		])

		if (!productsRes.ok || !marketsRes.ok) {
			console.error("Erro ao buscar dados iniciais")
			return { products: [], markets: [] }
		}

		const [productsData, marketsData] = await Promise.all([productsRes.json(), marketsRes.json()])

		// Extrair arrays dos objetos de resposta
		const markets = marketsData.markets || []
		const products = productsData.products || []

		return { products, markets }
	} catch (error) {
		console.error("Erro ao carregar dados:", error)
		return { products: [], markets: [] }
	}
}

export default async function PrecosPage() {
	const { products, markets } = await fetchInitialData()

	return <PriceRecordClient initialProducts={products} initialMarkets={markets} />
}
