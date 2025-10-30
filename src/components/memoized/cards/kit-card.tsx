"use client"

import { Package } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardFooter } from "../shared/card-footer"

interface KitCardMemoProps {
	kit: any
	onDelete: (kit: any) => void
	onEdit?: (kit: any) => void
}

export const KitCardMemo = ({ kit, onDelete, onEdit }: KitCardMemoProps) => {
	const [imageError, setImageError] = useState(false)

	const handleDelete = () => {
		onDelete(kit)
	}

	const handleEdit = () => {
		onEdit?.(kit)
	}

	const handleCardClick = () => {
		window.location.href = `/produtos/kits/${kit.kitProductId}`
	}

	const kitName = kit.kitProduct?.name || "Kit sem nome"
	const itemCount = kit.items?.length || 0
	const isActive = kit.isActive || false
	const imageUrl = (() => {
		if (kit.kitProduct?.barcodes && kit.kitProduct.barcodes.length > 0) {
			const primaryBarcode = kit.kitProduct.barcodes.find((b: any) => b.isPrimary) || kit.kitProduct.barcodes[0]
			return `https://cdn-cosmos.bluesoft.com.br/products/${primaryBarcode.barcode}`
		}
		if (kit.kitProduct?.barcode) {
			return `https://cdn-cosmos.bluesoft.com.br/products/${kit.kitProduct.barcode}`
		}
		return null
	})()

	return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-fuchsia-500/10">
					{imageUrl && !imageError ? (
						<>
							<Image
								src={imageUrl}
								alt={kitName}
								fill
								className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
								onError={() => setImageError(true)}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-purple-900/0 to-purple-900/0" />
						</>
					) : (
						<>
							<div className="absolute inset-0 flex items-center justify-center opacity-5">
								<Package className="h-32 w-32 text-purple-600" />
							</div>

							<div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
								<div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center border-4 border-purple-500/30 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
									<Package className="h-10 w-10 text-purple-600" />
								</div>

								{itemCount > 0 && (
									<div className="flex items-center gap-2 text-sm">
										<div className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
											📦 {itemCount} produto{itemCount !== 1 ? "s" : ""}
										</div>
									</div>
								)}
							</div>
						</>
					)}

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Kit" />

					<div className="absolute bottom-3 left-3">
						<div
							className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg text-xs font-medium border ${
								isActive
									? "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400"
									: "bg-gray-500/20 border-gray-500/50 text-gray-700 dark:text-gray-400"
							}`}
						>
							{isActive ? "✓ Ativo" : "⊗ Inativo"}
						</div>
					</div>
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">
						{kitName}
					</h3>

					{kit.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{kit.description}</p>}

					{kit.items && kit.items.length > 0 && (
						<div className="space-y-1 mb-3">
							{kit.items.slice(0, 2).map((item: any, index: number) => (
								<div
									key={`${kit.id}-item-${index}`}
									className="flex items-center gap-2 text-xs bg-secondary/30 rounded-md px-2 py-1"
								>
									<Badge variant="outline" className="text-xs px-1.5 py-0">
										{item.quantity}x
									</Badge>
									<span className="truncate flex-1">{item.product?.name || "Produto"}</span>
								</div>
							))}
							{kit.items.length > 2 && (
								<div className="text-xs text-muted-foreground text-center py-1">
									+{kit.items.length - 2} produto
									{kit.items.length - 2 !== 1 ? "s" : ""}
								</div>
							)}
						</div>
					)}

					<CardFooter />
				</CardContent>
			</Card>
		)
}

KitCardMemo.displayName = "KitCardMemo"
