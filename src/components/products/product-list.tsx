"use client"

import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SwipeableCard } from "@/components/ui/swipeable-card"
import { AnimatedList, ListItem } from "@/components/ui/animated-list"
import { ProductCard } from "./product-card"
import { useMobile } from "@/hooks/use-mobile"
import { useMemo } from "react"

interface ProductListProps {
	products: any[]
	onEdit: (product: any) => void
	onDelete: (product: any) => void
	onArchive: (product: any) => void
}

export function ProductList({ products, onEdit, onDelete, onArchive }: ProductListProps) {
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
}