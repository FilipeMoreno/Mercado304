"use client"

import { motion } from "framer-motion"
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

export default async function ComparacaoPage(props: { searchParams: Promise<{ lista?: string }> }) {
	const searchParams = await props.searchParams
	const { lists, markets, products } = await fetchInitialData()

	return (
		<div className="space-y-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
			>
				<div className="flex items-center gap-4">
					<TrendingUp className="size-8 text-blue-600" />
					<div>
						<motion.h1
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className="text-2xl sm:text-3xl font-bold"
						>
							Comparação de Preços
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="text-gray-600 mt-2 text-sm sm:text-base"
						>
							Compare preços entre diferentes mercados
						</motion.p>
					</div>
				</div>
			</motion.div>

			<ComparisonClient
				initialLists={lists}
				initialMarkets={markets}
				initialProducts={products}
				searchParams={searchParams}
			/>
		</div>
	)
}
