"use client"

import { Package, ShoppingCart, Plus, Search, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
	onViewDetails 
}: ProductRecognitionCardProps) {
	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Package className="h-5 w-5 text-blue-600" />
					Produto Identificado
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Preview da imagem */}
				{imagePreview && (
					<div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
						<img 
							src={imagePreview} 
							alt="Produto capturado"
							className="w-full h-full object-cover"
						/>
					</div>
				)}

				{/* Informações do produto */}
				<div className="space-y-2">
					<h3 className="font-semibold text-lg">{product.name}</h3>
					
					<div className="space-y-1 text-sm text-muted-foreground">
						{product.brand && (
							<div className="flex items-center gap-1">
								<span className="font-medium">Marca:</span>
								<span>{product.brand}</span>
							</div>
						)}
						{product.category && (
							<div className="flex items-center gap-1">
								<span className="font-medium">Categoria:</span>
								<span>{product.category}</span>
							</div>
						)}
						{product.barcode && (
							<div className="flex items-center gap-1">
								<span className="font-medium">Código:</span>
								<span className="font-mono text-xs">{product.barcode}</span>
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
					{product.description && (
						<p className="text-sm text-muted-foreground mt-2">
							{product.description}
						</p>
					)}
				</div>

				{/* Ações */}
				<div className="flex flex-col gap-2 pt-2">
					{onAddToList && (
						<Button onClick={onAddToList} className="w-full">
							<ShoppingCart className="h-4 w-4 mr-2" />
							Adicionar à Lista
						</Button>
					)}
					
					<div className="flex gap-2">
						{onSearchProduct && (
							<Button variant="outline" onClick={onSearchProduct} className="flex-1">
								<Search className="h-4 w-4 mr-2" />
								Buscar Preços
							</Button>
						)}
						{onViewDetails && (
							<Button variant="outline" onClick={onViewDetails} className="flex-1">
								<ExternalLink className="h-4 w-4 mr-2" />
								Ver Detalhes
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}