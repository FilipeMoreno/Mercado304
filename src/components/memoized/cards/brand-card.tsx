"use client"

import { Package } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardBadge } from "../shared/card-badge"
import { CardFooter } from "../shared/card-footer"

interface BrandCardMemoProps {
	brand: any
	onDelete: (brand: any) => void
	onEdit?: (brand: any) => void
}


export const BrandCardMemo = ({ brand, onDelete, onEdit }: BrandCardMemoProps) => {
	const [imageError, setImageError] = useState(false)

	const handleDelete = () => {
		onDelete(brand)
	}

	const handleEdit = () => {
		onEdit?.(brand)
	}

	const handleCardClick = () => {
		window.location.href = `/marcas/${brand.id}`
	}

	const brandName = brand.name || "Marca sem nome"
	const brandInitials = (() => {
		const words = brandName.split(" ")
		if (words.length >= 2) {
			return `${words[0][0]}${words[1][0]}`.toUpperCase()
		}
		return brandName.substring(0, 2).toUpperCase()
	})()

	return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
					{brand.imageUrl && !imageError ? (
						<>
							<Image
								src={brand.imageUrl}
								alt={brandName}
								fill
								className="object-contain p-6 transition-transform duration-500 group-hover:scale-110"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
								onError={() => setImageError(true)}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0" />
						</>
					) : (
						<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
							<div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30 shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
								<span className="text-3xl font-bold text-primary">{brandInitials}</span>
							</div>
							<p className="mt-4 text-sm text-muted-foreground">Sem logo</p>
						</div>
					)}

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Marca" />

					{brand._count?.products !== undefined && (
						<div className="absolute bottom-3 left-3">
							<CardBadge>
								<Package className="h-3 w-3" />
								<span>
									{brand._count.products} produto
									{brand._count.products !== 1 ? "s" : ""}
								</span>
							</CardBadge>
						</div>
					)}
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
						{brandName}
					</h3>

					{brand.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{brand.description}</p>}

					<CardFooter />
				</CardContent>
			</Card>
		)
}

BrandCardMemo.displayName = "BrandCardMemo"
