"use client"

import { motion } from "framer-motion"
import { ProductsClient } from "./products-client"

export default function ProdutosPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
				<p className="text-muted-foreground">
					Gerencie o catálogo de produtos
				</p>
			</div>

            <ProductsClient />
		</div>
	)
}
