"use client"

import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { memo, useMemo } from "react"
import { SwipeableCard } from "@/components/ui/swipeable-card"
import { AnimatedList, ListItem } from "@/components/ui/animated-list"
import { VirtualizedList } from "@/components/ui/virtualized-list"
import { ProductCard } from "./product-card"
import { useMobile } from "@/hooks/use-mobile"

interface ProductListProps {
	products: any[]
	onEdit: (product: any) => void
	onDelete: (product: any) => void
	onArchive: (product: any) => void
}

export const ProductList = memo(function ProductList({ products, onEdit, onDelete, onArchive }: ProductListProps) {
	const mobile = useMobile()
	const router = useRouter()

	// Convert products to ListItems for AnimatedList
	const productListItems: ListItem[] = useMemo(() => 
		products.map((product: any) => ({
			id: product.id,
			content: (
				<SwipeableCard
					leftActions={[
						{
							icon: <Edit className="h-5 w-5" />,
							color: "text-blue-600", 
							background: "bg-blue-100",
							action: () => onEdit(product)
						}
					]}
					rightActions={[
						{
							icon: <Trash2 className="h-5 w-5" />,
							color: "text-red-600",
							background: "bg-red-100", 
							action: () => onDelete(product)
						}
					]}
					onClick={() => {
						router.push(`/produtos/${product.id}`)
					}}
					className="mb-0"
				>
					<ProductCard product={product} isMobile={true} />
				</SwipeableCard>
			)
		})), [products, onEdit, onDelete, router])

	// Render individual product item for virtualization
	const renderProductItem = useMemo(() => (product: any, index: number) => (
		<motion.div
			key={product.id}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			className="p-2"
		>
			<Link href={`/produtos/${product.id}`}>
				<ProductCard product={product} onDelete={onDelete} />
			</Link>
		</motion.div>
	), [onDelete])

	if (mobile.isTouchDevice) {
		return (
			<AnimatedList
				items={productListItems}
				enableSwipeActions={true}
				enableAnimations={true}
				onItemEdit={onEdit}
				onItemDelete={onDelete}
				onItemArchive={onArchive}
			/>
		)
	}

	// Use virtualization for large lists (>50 items)
	if (products.length > 50) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
			>
				<VirtualizedList
					items={products}
					height={600} // 6 rows of ~100px each
					itemHeight={120}
					renderItem={renderProductItem}
					className="w-full"
				/>
			</motion.div>
		)
	}

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
					<Link href={`/produtos/${product.id}`}>
						<ProductCard product={product} onDelete={onDelete} />
					</Link>
				</motion.div>
			))}
		</motion.div>
	)
})