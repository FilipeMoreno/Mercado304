"use client"

import { Barcode, Package } from "lucide-react"
import { memo, useCallback, useMemo } from "react"
import { BarcodeListDisplay } from "@/components/products/barcode-list-display"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardBadge } from "../shared/card-badge"
import { CardFooter } from "../shared/card-footer"
import { CardImageArea } from "../shared/card-image-area"

interface ProductCardMemoProps {
	product: any
	onDelete: (product: any) => void
	onEdit?: (product: any) => void
}

export const ProductCardMemo = memo<ProductCardMemoProps>(
	({ product, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(product)
		}, [product, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(product)
		}, [product, onEdit])

		const handleCardClick = useCallback(() => {
			window.location.href = `/produtos/${product.id}`
		}, [product.id])

		const productDisplayName = useMemo(() => {
			return product.name || "Produto sem nome"
		}, [product.name])

		const productUnit = useMemo(() => {
			return product.unit || "un"
		}, [product.unit])

		const brandName = useMemo(() => {
			return product.brand?.name || null
		}, [product.brand?.name])

		const imageUrl = useMemo(() => {
			if (product.barcodes && product.barcodes.length > 0) {
				const primaryBarcode = product.barcodes.find((b: any) => b.isPrimary) || product.barcodes[0]
				return `https://cdn-cosmos.bluesoft.com.br/products/${primaryBarcode.barcode}`
			}
			if (product.barcode) {
				return `https://cdn-cosmos.bluesoft.com.br/products/${product.barcode}`
			}
			return null
		}, [product.barcodes, product.barcode])

		return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<CardImageArea imageUrl={imageUrl} alt={productDisplayName} fallbackIcon={Package}>
					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Produto" />

					<div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
						{brandName && (
							<CardBadge>
								<span className="line-clamp-1">{brandName}</span>
							</CardBadge>
						)}
						{product.packageSize && (
							<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-md shadow-lg text-xs font-medium text-primary-foreground border border-primary/50">
								📦 {product.packageSize}
							</div>
						)}
					</div>
				</CardImageArea>

				<CardContent className="flex-1 flex flex-col p-4">
					<h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
						{productDisplayName}
					</h3>

					<div className="flex flex-wrap gap-2 mb-3">
						{product.category?.name && (
							<Badge variant="outline" className="text-xs">
								{product.category.icon} {product.category.name}
							</Badge>
						)}
						<Badge variant="secondary" className="text-xs">
							{productUnit}
						</Badge>
					</div>

					{product.barcodes && product.barcodes.length > 0 && (
						<div className="mb-3 flex gap-2 items-center">
							<Barcode className="h-3 w-3" />
							<BarcodeListDisplay barcodes={product.barcodes} variant="inline" showCount={false} />
						</div>
					)}

					<CardFooter />
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.product.id === nextProps.product.id &&
			prevProps.product.name === nextProps.product.name &&
			prevProps.product.brand?.name === nextProps.product.brand?.name &&
			prevProps.product.unit === nextProps.product.unit &&
			prevProps.product.barcodes?.length === nextProps.product.barcodes?.length &&
			prevProps.product.updatedAt === nextProps.product.updatedAt
		)
	},
)

ProductCardMemo.displayName = "ProductCardMemo"
