"use client"

import { useState, useEffect } from "react"
import { Check, X, Package, Tag, Weight, Ruler, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { useAllBrandsQuery } from "@/hooks/use-react-query"

interface GTINProduct {
	gtin: string
	name: string
	brand?: string
	grossWeight?: number
	netWeight?: number
	height?: number
	length?: number
	width?: number
	avgPrice?: number
	maxPrice?: number
	thumbnail?: string
	imageUrl?: string
	gpc?: {
		code: string
		description: string
	}
	ncm?: {
		code: string
		description: string
		fullDescription: string
	}
	cached: boolean
	source: 'cache' | 'api'
}

interface AutofillData {
	name: string
	brand?: {
		id: string
		name: string
	} | undefined
	barcode: string
	grossWeight?: number | undefined
	netWeight?: number | undefined
	height?: number | undefined
	length?: number | undefined
	width?: number | undefined
	description?: string | undefined
}

interface GTINAutofillDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	product: GTINProduct | null
	onAccept: (data: AutofillData) => void
	onDecline: () => void
}

export function GTINAutofillDialog({
	open,
	onOpenChange,
	product,
	onAccept,
	onDecline
}: GTINAutofillDialogProps) {
	const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(null)
	const { data: brands } = useAllBrandsQuery()

	// Buscar marca correspondente quando o produto muda
	useEffect(() => {
		if (product?.brand && brands) {
			// Buscar marca exata primeiro
			let matchedBrand = brands.find((brand: any) => 
				brand.name.toLowerCase() === product.brand?.toLowerCase()
			)

			// Se não encontrar exata, buscar similar
			if (!matchedBrand) {
				matchedBrand = brands.find((brand: any) => {
					const brandName = brand.name.toLowerCase()
					const productBrand = product.brand?.toLowerCase() || ''
					return brandName.includes(productBrand) || productBrand.includes(brandName)
				})
			}

			setSelectedBrand(matchedBrand ? {
				id: matchedBrand.id,
				name: matchedBrand.name
			} : null)
		} else {
			setSelectedBrand(null)
		}
	}, [product, brands])

	if (!product) return null

	const handleAccept = () => {
		const autofillData: AutofillData = {
			name: product.name,
			brand: selectedBrand || undefined,
			barcode: product.gtin,
			grossWeight: product.grossWeight,
			netWeight: product.netWeight,
			height: product.height,
			length: product.length,
			width: product.width,
			description: product.gpc?.description || product.ncm?.description || undefined
		}

		onAccept(autofillData)
		onOpenChange(false)
	}

	const handleDecline = () => {
		onDecline()
		onOpenChange(false)
	}

	const formatWeight = (weight?: number) => {
		if (!weight) return null
		if (weight >= 1000) {
			return `${(weight / 1000).toFixed(1)} kg`
		}
		return `${weight} g`
	}

	const formatDimensions = (height?: number, length?: number, width?: number) => {
		const dims = [height, length, width].filter(Boolean)
		if (dims.length === 0) return null
		return dims.map(d => `${d} cm`).join(' × ')
	}

	const formatPrice = (price?: number) => {
		if (!price) return null
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(price)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5 text-blue-500" />
						Produto Encontrado
					</DialogTitle>
					<DialogDescription>
						Deseja preencher automaticamente os dados do produto com as informações encontradas?
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Status e fonte */}
					<div className="flex items-center gap-2">
						<Badge variant={product.cached ? "secondary" : "default"}>
							{product.cached ? (
								<><Clock className="h-3 w-3 mr-1" /> Cache</>
							) : (
								<>⚡ API Cosmos</>
							)}
						</Badge>
						{product.source === 'api' && (
							<Badge variant="outline" className="text-orange-600">
								Nova consulta
							</Badge>
						)}
					</div>

					{/* Imagem do produto */}
					{(product.imageUrl || product.thumbnail) && (
						<div className="flex justify-center">
							<img
								src={product.imageUrl || product.thumbnail}
								alt={product.name}
								className="max-w-32 max-h-32 object-contain rounded-lg border"
								onError={(e) => {
									// Se a imagem falhar, tentar a thumbnail
									const img = e.target as HTMLImageElement
									if (img.src === product.imageUrl && product.thumbnail) {
										img.src = product.thumbnail
									}
								}}
							/>
						</div>
					)}

					{/* Informações básicas */}
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium text-gray-600">Nome do Produto</label>
							<p className="text-lg font-semibold mt-1">{product.name}</p>
						</div>

						<div>
							<label className="text-sm font-medium text-gray-600">Código de Barras</label>
							<p className="font-mono text-sm mt-1">{product.gtin}</p>
						</div>

						{product.brand && (
							<div>
								<label className="text-sm font-medium text-gray-600">Marca</label>
								<div className="flex items-center gap-2 mt-1">
									<p className="font-medium">{product.brand}</p>
									{selectedBrand ? (
										<Badge variant="default" className="text-xs">
											✓ Encontrada no sistema
										</Badge>
									) : (
										<Badge variant="secondary" className="text-xs">
											Nova marca
										</Badge>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Especificações técnicas */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{(product.grossWeight || product.netWeight) && (
							<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
								<Weight className="h-4 w-4 text-gray-500" />
								<div>
									<p className="text-xs text-gray-600">Peso</p>
									<div className="text-sm">
										{product.grossWeight && (
											<div>Bruto: {formatWeight(product.grossWeight)}</div>
										)}
										{product.netWeight && (
											<div>Líquido: {formatWeight(product.netWeight)}</div>
										)}
									</div>
								</div>
							</div>
						)}

						{formatDimensions(product.height, product.length, product.width) && (
							<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
								<Ruler className="h-4 w-4 text-gray-500" />
								<div>
									<p className="text-xs text-gray-600">Dimensões</p>
									<p className="text-sm">{formatDimensions(product.height, product.length, product.width)}</p>
								</div>
							</div>
						)}

						{(product.avgPrice || product.maxPrice) && (
							<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
								<DollarSign className="h-4 w-4 text-gray-500" />
								<div>
									<p className="text-xs text-gray-600">Preços de Referência</p>
									<div className="text-sm">
										{product.avgPrice && (
											<div>Médio: {formatPrice(product.avgPrice)}</div>
										)}
										{product.maxPrice && (
											<div>Máximo: {formatPrice(product.maxPrice)}</div>
										)}
									</div>
								</div>
							</div>
						)}

						{product.gpc && (
							<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
								<Tag className="h-4 w-4 text-gray-500" />
								<div>
									<p className="text-xs text-gray-600">Categoria (GPC)</p>
									<p className="text-sm">{product.gpc.description}</p>
								</div>
							</div>
						)}
					</div>

					{/* NCM Info (se disponível) */}
					{product.ncm && (
						<div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
							<p className="text-xs text-blue-600 font-medium">NCM: {product.ncm.code}</p>
							<p className="text-sm text-blue-800 mt-1">{product.ncm.description}</p>
						</div>
					)}

					{/* Ações */}
					<div className="flex gap-3 pt-4 border-t">
						<Button
							onClick={handleAccept}
							className="flex-1"
							size="lg"
						>
							<Check className="h-4 w-4 mr-2" />
							Preencher Dados
						</Button>
						<Button
							onClick={handleDecline}
							variant="outline"
							size="lg"
						>
							<X className="h-4 w-4 mr-2" />
							Cancelar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}