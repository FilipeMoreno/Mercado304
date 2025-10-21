"use client"

import { ExternalLink, Package, Search, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { ImageViewerModal } from "@/components/image-viewer-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductRecognitionCardProps {
	product: {
		name: string
		brand?: string
		category?: string
		barcode?: string
		confidence?: number
		description?: string
	}
	imagePreview?: string
	onAddToList?: () => void
	onSearchProduct?: () => void
	onViewDetails?: () => void
}

export function ProductRecognitionCard({
	product,
	imagePreview,
	onAddToList,
	onSearchProduct,
	onViewDetails,
}: ProductRecognitionCardProps) {
	const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)

	return (
		<>
			<Card className="w-full">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Package className="size-5 text-blue-600" />
						Produto Identificado
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Preview da imagem */}
					{imagePreview && (
						<div
							className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
							onClick={() => setIsImageViewerOpen(true)}
						>
							<img src={imagePreview} alt="Produto capturado" className="w-full h-full object-cover" />
							<div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
								<div className="bg-white/90 rounded-full p-2">
									<Search className="size-4 text-gray-700" />
								</div>
							</div>
						</div>
					)}

					{/* Informações do produto */}
					<div className="space-y-2">
						<h3 className="font-semibold text-lg break-words">{product.name}</h3>

						<div className="space-y-1 text-sm text-muted-foreground">
							{product.brand && (
								<div className="flex items-start gap-1">
									<span className="font-medium shrink-0">Marca:</span>
									<span className="break-words">{product.brand}</span>
								</div>
							)}
							{product.category && (
								<div className="flex items-start gap-1">
									<span className="font-medium shrink-0">Categoria:</span>
									<span className="break-words">{product.category}</span>
								</div>
							)}
							{product.barcode && (
								<div className="flex items-start gap-1">
									<span className="font-medium shrink-0">Código de barras:</span>
									<span className="font-mono text-xs break-all">{product.barcode}</span>
								</div>
							)}
						</div>

						{/* Badge de confiança */}
						{product.confidence && (
							<Badge variant={product.confidence > 0.8 ? "default" : "secondary"} className="text-xs">
								{Math.round(product.confidence * 100)}% de confiança
							</Badge>
						)}

						{/* Descrição */}
						{product.description && <p className="text-sm text-muted-foreground mt-2">{product.description}</p>}
					</div>

					{/* Ações */}
					<div className="flex flex-col gap-2 pt-2">
						{onAddToList && (
							<Button onClick={onAddToList} className="w-full">
								<ShoppingCart className="size-4 mr-2" />
								Adicionar à Lista
							</Button>
						)}

						<div className="flex gap-2">
							{onSearchProduct && (
								<Button variant="outline" onClick={onSearchProduct} className="flex-1">
									<Search className="size-4 mr-2" />
									Buscar Preços
								</Button>
							)}
							{onViewDetails && (
								<Button variant="outline" onClick={onViewDetails} className="flex-1">
									<ExternalLink className="size-4 mr-2" />
									Ver Detalhes
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Modal do visualizador de imagem */}
			{imagePreview && (
				<ImageViewerModal
					isOpen={isImageViewerOpen}
					onClose={() => setIsImageViewerOpen(false)}
					imageUrl={imagePreview}
					alt="Produto identificado"
				/>
			)}
		</>
	)
}
