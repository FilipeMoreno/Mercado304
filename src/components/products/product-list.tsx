"use client"

import { motion } from "framer-motion"
import { ProductCardMemo } from "@/components/memoized"

interface ProductListProps {
	products: any[]
	onDelete: (product: any) => void
	onEdit?: (product: any) => void
}

export function ProductList({ products, onDelete, onEdit }: ProductListProps) {
	return (
		<motion.div
			className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 0.2 }}
		>
			{products.map((product: any, index: number) => (
				<motion.div
					key={product.id}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
				>
					<ProductCardMemo product={product} onDelete={onDelete} onEdit={onEdit} />onEdit={onEdit} />
				</motion.div>
			))}
		</motion.div>
	)
}
