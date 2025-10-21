"use client"

import { motion } from "framer-motion"
import { use } from "react"
import { ProductsClient } from "./products-client"

interface ProductsPageProps {
	searchParams: Promise<{
		search?: string
		category?: string
		brand?: string
		sort?: string
		page?: string
	}>
}

export default function ProdutosPage(props: ProductsPageProps) {
	const searchParams = use(props.searchParams)
	return (
		<div className="space-y-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex justify-between items-center"
			>
				<div>
					<motion.h1
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="text-3xl font-bold"
					>
						Produtos
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
						className="text-gray-600 mt-2"
					>
						Gerencie o catálogo de produtos
					</motion.p>
				</div>
			</motion.div>

			<ProductsClient searchParams={searchParams} />
		</div>
	)
}
