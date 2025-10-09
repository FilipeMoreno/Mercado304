"use client"

import { motion } from "framer-motion"
import { Package } from "lucide-react"
import { ProductCardMemo } from "@/components/memoized"
import { Product } from "@/types"

interface ProductListProps {
	products: Product[]
	onDelete: (product: Product) => void
	onEdit?: (product: Product) => void
	isLoading?: boolean
}

// Componente para estado vazio
function EmptyState() {
	return (
		<motion.div
			className="col-span-full flex flex-col items-center justify-center py-12 text-center"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
		>
			<Package className="h-16 w-16 text-muted-foreground mb-4" />
			<h3 className="text-lg font-semibold text-muted-foreground mb-2">
				Nenhum produto encontrado
			</h3>
			<p className="text-sm text-muted-foreground max-w-md">
				Não há produtos cadastrados ainda. Comece adicionando seu primeiro produto.
			</p>
		</motion.div>
	)
}

// Componente para skeleton loading
function ProductSkeleton() {
	return (
		<div className="animate-pulse">
			<div className="bg-muted rounded-lg h-32 w-full" />
		</div>
	)
}

// Variantes de animação otimizadas
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			duration: 0.3,
			staggerChildren: 0.05,
			delayChildren: 0.1,
		},
	},
}

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
}

export function ProductList({ products, onDelete, onEdit, isLoading = false }: ProductListProps) {
	// Loading state
	if (isLoading) {
		return (
			<div 
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
				role="status"
				aria-label="Carregando produtos"
			>
				{Array.from({ length: 8 }).map((_, index) => (
					<ProductSkeleton key={index} />
				))}
			</div>
		)
	}

	// Empty state
	if (!products || products.length === 0) {
		return <EmptyState />
	}

	return (
		<motion.div
			className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			role="grid"
			aria-label={`Lista de ${products.length} produtos`}
		>
			{products.map((product) => (
				<motion.div
					key={product.id}
					variants={itemVariants}
					role="gridcell"
				>
					<ProductCardMemo 
						product={product} 
						onDelete={onDelete} 
						onEdit={onEdit} 
					/>
				</motion.div>
			))}
		</motion.div>
	)
}
