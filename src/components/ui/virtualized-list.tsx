"use client"

import { forwardRef, useMemo } from "react"
import type { FixedSizeListProps } from "react-window"
import { FixedSizeList as List } from "react-window"
import { ProductCardMemo } from "@/components/memoized"
import { cn } from "@/lib/utils"

interface VirtualizedListProps<T> extends Omit<FixedSizeListProps, "children"> {
	items: T[]
	renderItem: (props: { index: number; style: React.CSSProperties; data: T }) => React.ReactNode
	className?: string
	itemClassName?: string
}

export function VirtualizedList<T>({ items, renderItem, className, itemClassName, ...props }: VirtualizedListProps<T>) {
	const ItemRenderer = forwardRef<HTMLDivElement, { index: number; style: React.CSSProperties; data: T }>(
		({ index, style, data }, ref) => (
			<div ref={ref} style={style} className={cn("flex items-center", itemClassName)}>
				{renderItem({ index, style, data })}
			</div>
		),
	)

	ItemRenderer.displayName = "ItemRenderer"

	return (
		<div className={cn("w-full", className)}>
			<List {...props} itemCount={items.length} itemData={items}>
				{ItemRenderer}
			</List>
		</div>
	)
}

// Hook para calcular altura dinâmica baseada no conteúdo
export function useDynamicHeight(items: any[], baseHeight: number = 60) {
	return useMemo(() => {
		// Lógica para calcular altura baseada no conteúdo
		// Por exemplo, produtos com mais informações podem ter altura maior
		return items.length > 0 ? Math.min(baseHeight * items.length, 600) : 200
	}, [items.length, baseHeight])
}

// Componente específico para lista de produtos virtualizada
interface VirtualizedProductListProps {
	products: any[]
	onDelete: (product: any) => void
	height?: number
	itemHeight?: number
}

export function VirtualizedProductList({
	products,
	onDelete,
	height = 600,
	itemHeight = 200,
}: VirtualizedProductListProps) {
	const renderProduct = ({ index, style, data }: { index: number; style: React.CSSProperties; data: any[] }) => {
		const product = data[index]

		return (
			<div style={style} className="p-2">
				<div className="h-full">
					{/* Aqui você pode usar o ProductCard memoizado */}
					<ProductCardMemo product={product} onDelete={onDelete} />
				</div>
			</div>
		)
	}

	return (
		<VirtualizedList
			items={products}
			renderItem={renderProduct}
			height={height}
			itemSize={itemHeight}
			className="border rounded-lg"
		/>
	)
}

// Componente específico para lista de compras virtualizada
interface VirtualizedPurchaseListProps {
	purchases: any[]
	height?: number
	itemHeight?: number
}

export function VirtualizedPurchaseList({ purchases, height = 500, itemHeight = 120 }: VirtualizedPurchaseListProps) {
	const renderPurchase = ({ index, style, data }: { index: number; style: React.CSSProperties; data: any[] }) => {
		const purchase = data[index]

		return (
			<div style={style} className="p-2">
				<div className="bg-white rounded-lg shadow-sm border p-4 h-full">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="font-medium">{purchase.market?.name || "Mercado"}</h3>
							<p className="text-sm text-gray-600">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
							<p className="text-sm text-gray-500">{purchase.items?.length || 0} itens</p>
						</div>
						<div className="text-right">
							<p className="font-bold text-lg">R$ {purchase.totalAmount?.toFixed(2) || "0.00"}</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<VirtualizedList
			items={purchases}
			renderItem={renderPurchase}
			height={height}
			itemSize={itemHeight}
			className="border rounded-lg"
		/>
	)
}
