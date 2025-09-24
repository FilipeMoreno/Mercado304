"use client"

import { motion } from "framer-motion"
import { DollarSign } from "lucide-react"
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

	return (
		<div className="space-y-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
			>
				<div className="flex items-center gap-4">
					<DollarSign className="h-8 w-8 text-green-600" />
					<div>
						<motion.h1
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className="text-2xl sm:text-3xl font-bold"
						>
							Registro de Preços
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="text-gray-600 mt-2 text-sm sm:text-base"
						>
							Registre e acompanhe os preços dos produtos
						</motion.p>
					</div>
				</div>
			</motion.div>

			<PriceRecordClient initialProducts={products} initialMarkets={markets} />
		</div>
	)
}
