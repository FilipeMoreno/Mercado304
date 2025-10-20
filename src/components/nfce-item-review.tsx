"use client"

import type { Brand, Category, Product } from "@prisma/client"
import { Camera, PlusCircle, Trash2 } from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { BarcodeListScanner } from "@/components/barcode-list-scanner"
import { QuickBrandForm } from "@/components/quick-brand-form"
import { QuickProductForm } from "@/components/quick-product-form"
import { ProductSelect } from "@/components/selects/product-select"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUIPreferences } from "@/hooks"
import { normalizeBarcode } from "@/lib/barcode-utils"
import { cn } from "@/lib/utils"

// Interfaces para os dados da nota e itens mapeados
export interface NfceItem {
	name: string
	quantity: number
	unit: string
	unitPrice: number
	totalPrice: number
	discount?: number // Desconto total do item
	code?: string // Código de barras do produto (opcional)
}

export interface MappedPurchaseItem {
	productId: string
	productName: string
	quantity: number
	price: number
	unitDiscount?: number
}

interface NfceItemReviewProps {
	items: NfceItem[]
	onConfirm: (mappedItems: MappedPurchaseItem[], totalDiscount?: number) => void
	onCancel: () => void
	isSubmitting: boolean
}

// Tipo correto para o estado interno do componente
type MappedItemState = MappedPurchaseItem & {
	originalName: string
	isAssociated: boolean
	unitDiscount?: number
}

const NfceItemReview: React.FC<NfceItemReviewProps> = ({ items, onConfirm, onCancel, isSubmitting }) => {
	const { selectStyle } = useUIPreferences()
	const totalDiscountId = React.useId()
	const [mappedItems, setMappedItems] = useState<MappedItemState[]>(() =>
		items.map((item) => {
			// Calcular desconto unitário a partir do desconto total do item
			const unitDiscount = item.discount && item.quantity > 0 ? item.discount / item.quantity : 0

			return {
				productId: "",
				productName: "",
				quantity: item.quantity,
				price: item.unitPrice,
				unitDiscount: unitDiscount,
				originalName: item.name,
				isAssociated: false,
			}
		}),
	)
	const [isInitialized, setIsInitialized] = useState(false)
	const [totalDiscount, setTotalDiscount] = useState<number>(0)

	// Estados para controlar os dialogs
	const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] = useState(false)
	const [isCreateBrandDialogOpen, setIsCreateBrandDialogOpen] = useState(false)
	const [currentItemIndexForCreation, setCurrentItemIndexForCreation] = useState<number | null>(null)
	const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)

	// Função para buscar produto por código de barras
	const fetchProductByBarcode = React.useCallback(async (barcode: string): Promise<Product | null> => {
		try {
			// Primeiro tenta com o código original
			let response = await fetch(`/api/products/barcode/${barcode}`)

			if (!response.ok && response.status === 404) {
				// Se não encontrou, tenta com o código normalizado
				const normalizedCode = normalizeBarcode(barcode)
				if (normalizedCode !== barcode) {
					response = await fetch(`/api/products/barcode/${normalizedCode}`)
				}
			}

			if (response.ok) {
				return await response.json()
			}
			return null
		} catch (error) {
			console.error("Erro ao buscar produto por código de barras:", error)
			return null
		}
	}, [])

	// Função para calcular similaridade entre duas strings (usando Levenshtein simplificado)
	const calculateStringSimilarity = (str1: string, str2: string): number => {
		const s1 = str1.toLowerCase().trim()
		const s2 = str2.toLowerCase().trim()

		if (s1 === s2) return 1.0

		// Verifica se uma string contém a outra
		if (s1.includes(s2) || s2.includes(s1)) {
			return 0.8
		}

		// Calcula palavras em comum
		const words1 = s1.split(/\s+/)
		const words2 = s2.split(/\s+/)
		const commonWords = words1.filter((w) => words2.includes(w))

		if (commonWords.length > 0) {
			const similarity = (commonWords.length * 2) / (words1.length + words2.length)
			return similarity * 0.7 // Peso reduzido para palavras em comum
		}

		return 0
	}

	// Função para calcular score de match entre produto e item da nota
	const calculateMatchScore = (
		product: Product,
		item: MappedItemState,
		productPriceHistory?: Array<{ price: number }>,
	): number => {
		let score = 0

		// 1. Similaridade de nome (peso 40%)
		const nameSimilarity = calculateStringSimilarity(product.name, item.originalName)
		score += nameSimilarity * 0.4

		// 2. Similaridade de preço (peso 35%)
		if (productPriceHistory && productPriceHistory.length > 0) {
			// Buscar preços no histórico
			const prices = productPriceHistory.map((record) => record.price)
			const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
			const minPrice = Math.min(...prices)
			const maxPrice = Math.max(...prices)

			// Verifica se o preço está dentro do range histórico ou próximo
			if (item.price >= minPrice && item.price <= maxPrice) {
				score += 0.35 // Preço dentro do range
			} else {
				// Calcula proximidade com média
				const priceDiff = Math.abs(item.price - avgPrice)
				const priceRatio = 1 - Math.min(priceDiff / avgPrice, 1)
				score += priceRatio * 0.35
			}
		} else {
			// Sem histórico, apenas dá um score médio se o preço for razoável
			if (item.price > 0 && item.price < 1000) {
				score += 0.15
			}
		}

		// 3. Consistência de valor total (peso 25%)
		const expectedTotal = item.price * item.quantity
		const actualTotal = item.price * item.quantity - (item.unitDiscount || 0) * item.quantity

		if (Math.abs(expectedTotal - actualTotal) < 0.01) {
			score += 0.25
		} else {
			// Score proporcional à proximidade
			const totalDiff = Math.abs(expectedTotal - actualTotal)
			const totalRatio = 1 - Math.min(totalDiff / expectedTotal, 1)
			score += totalRatio * 0.25
		}

		return score
	}

	// Função para processar códigos de barras escaneados do cupom físico
	const handleBarcodesScanned = async (barcodes: string[]) => {
		setIsBarcodeScannerOpen(false)

		if (barcodes.length === 0) return

		toast.info(`Processando ${barcodes.length} código(s) de barras...`)

		const updatedItems = [...mappedItems]
		let matchCount = 0

		// Para cada código de barras, buscar o melhor match inteligente
		for (const barcode of barcodes) {
			const product = await fetchProductByBarcode(barcode)

			if (!product) {
				toast.warning(`Código ${barcode} não encontrado no cadastro`)
				continue
			}

			// Buscar histórico de preços do produto
			let priceHistory: Array<{ price: number }> = []
			try {
				const priceResponse = await fetch(`/api/products/${product.id}/prices`)
				if (priceResponse.ok) {
					const prices = await priceResponse.json()
					priceHistory = prices
				}
			} catch {
				console.log("Não foi possível buscar histórico de preços")
			}

			// Calcular score para todos os itens não associados
			const unassociatedItems = updatedItems
				.map((item, index) => ({ item, index }))
				.filter(({ item }) => !item.isAssociated)

			if (unassociatedItems.length === 0) {
				toast.warning("Todos os itens já foram associados")
				break
			}

			let bestMatch = { index: -1, score: 0 }

			for (const { item, index } of unassociatedItems) {
				const score = calculateMatchScore(product, item, priceHistory)

				if (score > bestMatch.score) {
					bestMatch = { index, score }
				}
			}

			// Associar apenas se o score for razoável (> 0.3)
			if (bestMatch.score > 0.3) {
				updatedItems[bestMatch.index] = {
					...updatedItems[bestMatch.index],
					productId: product.id,
					productName: product.name,
					isAssociated: true,
				}
				matchCount++

				const confidence = Math.round(bestMatch.score * 100)
				toast.success(`"${product.name}" associado a "${updatedItems[bestMatch.index].originalName}" (${confidence}% confiança)`)
			} else {
				toast.warning(
					`Produto "${product.name}" não teve match suficiente com nenhum item (melhor score: ${Math.round(bestMatch.score * 100)}%)`,
				)
			}
		}

		if (matchCount > 0) {
			setMappedItems(updatedItems)
			toast.success(`${matchCount} produto(s) associado(s) com sucesso!`)
		}
	}

	// Inicialização automática dos produtos baseada nos códigos de barras
	useEffect(() => {
		const initializeProducts = async () => {
			if (isInitialized) return

			const updatedItems = [...mappedItems]
			let hasChanges = false

			for (let i = 0; i < items.length; i++) {
				const item = items[i]
				if (item.code) {
					const product = await fetchProductByBarcode(item.code)
					if (product) {
						updatedItems[i] = {
							...updatedItems[i],
							productId: product.id,
							productName: product.name,
							isAssociated: true,
						}
						hasChanges = true
						toast.success(`Produto "${product.name}" associado automaticamente pelo código ${item.code}.`)
					}
				}
			}

			if (hasChanges) {
				setMappedItems(updatedItems)
			}
			setIsInitialized(true)
		}

		initializeProducts()
	}, [items, mappedItems, isInitialized, fetchProductByBarcode])

	// Função para remover um item da lista
	const handleRemoveItem = (index: number) => {
		const newItems = mappedItems.filter((_, i) => i !== index)
		setMappedItems(newItems)
		toast.success("Item removido da revisão.")
	}

	const handleProductChange = (index: number, product: Product | null) => {
		const newItems = [...mappedItems]
		if (product) {
			newItems[index].productId = product.id
			newItems[index].productName = product.name
			newItems[index].isAssociated = true
			toast.success(`"${newItems[index].originalName}" associado a "${product.name}".`)
		} else {
			newItems[index].productId = ""
			newItems[index].productName = ""
			newItems[index].isAssociated = false
		}
		setMappedItems(newItems)
	}

	const handleFieldChange = (index: number, field: "quantity" | "price" | "unitDiscount", value: string) => {
		const newItems = [...mappedItems]
		const numericValue = parseFloat(value) || 0
		newItems[index][field] = numericValue
		setMappedItems(newItems)
	}

	const openCreateProductDialog = (index: number) => {
		setCurrentItemIndexForCreation(index)
		setIsCreateProductDialogOpen(true)
	}

	const openCreateBrandDialog = () => {
		setIsCreateBrandDialogOpen(true)
	}

	// Função chamada quando um novo produto é criado com sucesso pelo dialog
	const handleProductCreated = (newProduct: Product & { brand: Brand | null; category: Category }) => {
		if (currentItemIndexForCreation === null) return

		// Associa automaticamente o item ao produto recém-criado
		handleProductChange(currentItemIndexForCreation, newProduct)
		setIsCreateProductDialogOpen(false)
		setCurrentItemIndexForCreation(null)
	}

	const handleSubmit = () => {
		const confirmedItems = mappedItems
			.filter((item) => item.isAssociated && item.productId && item.productId !== "")
			.map(({ originalName, isAssociated, ...rest }) => rest)

		if (confirmedItems.length === 0) {
			toast.error("Nenhum item foi associado a um produto.", {
				description: "Associe pelo menos um item da nota para poder salvar.",
			})
			return
		}

		onConfirm(confirmedItems, totalDiscount)
	}

	// Calcular totais
	const subtotal = mappedItems.reduce((acc, item) => {
		return acc + (item.price - (item.unitDiscount || 0)) * item.quantity
	}, 0)

	const total = subtotal - totalDiscount

	const associatedItemsCount = mappedItems.filter((item) => item.isAssociated).length
	const _currentItemToCreate = currentItemIndexForCreation !== null ? mappedItems[currentItemIndexForCreation] : null

	// Função para lidar com a criação de uma nova marca
	const handleBrandCreated = (newBrand: Brand) => {
		setIsCreateBrandDialogOpen(false)
		toast.success(`Marca ${newBrand.name} criada com sucesso!`)
	}

	return (
		<>
			<Dialog open={isCreateProductDialogOpen} onOpenChange={setIsCreateProductDialogOpen}>
				{isCreateProductDialogOpen && currentItemIndexForCreation !== null && (
					<QuickProductForm
						onClose={() => setIsCreateProductDialogOpen(false)}
						onProductCreated={handleProductCreated}
						onOpenBrandForm={openCreateBrandDialog}
					/>
				)}
			</Dialog>

			<Dialog open={isCreateBrandDialogOpen} onOpenChange={setIsCreateBrandDialogOpen}>
				{isCreateBrandDialogOpen && (
					<QuickBrandForm onClose={() => setIsCreateBrandDialogOpen(false)} onBrandCreated={handleBrandCreated} />
				)}
			</Dialog>

			<BarcodeListScanner
				isOpen={isBarcodeScannerOpen}
				onScanComplete={handleBarcodesScanned}
				onClose={() => setIsBarcodeScannerOpen(false)}
			/>

			<Card className="w-full">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle>Revise e Associe os Itens</CardTitle>
							<CardDescription>Associe os itens da nota fiscal aos seus produtos cadastrados.</CardDescription>
						</div>
						<Button variant="outline" size="sm" onClick={() => setIsBarcodeScannerOpen(true)} className="gap-2">
							<Camera className="size-4" />
							Escanear Códigos
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{mappedItems.map((item, index) => (
							<div
								key={`item-${index}-${item.originalName}`}
								className={cn(
									"p-4 border rounded-lg space-y-4 transition-all",
									item.isAssociated ? "border-green-500 bg-green-500/5" : "",
								)}
							>
								<div className="flex items-center gap-2 flex-wrap">
									<p className="text-sm font-semibold text-muted-foreground">
										Item da Nota: <span className="font-bold text-primary">{item.originalName}</span>
									</p>
									{item.unitDiscount && item.unitDiscount > 0 && (
										<Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
											🏷️ Desconto: R$ {item.unitDiscount.toFixed(2)}/un
										</Badge>
									)}
								</div>
								<div className="flex flex-col sm:flex-row gap-2">
									{/* --- CORREÇÃO DE LAYOUT E LÓGICA AQUI --- */}
									<div className="grow">
										<Label>Associar ao Produto</Label>
										{selectStyle === "dialog" ? (
											<ProductSelectDialog
												value={item.productId ? item.productId.toString() : undefined}
												onValueChange={(value) => {
													if (value) {
														// Buscar o produto pelo ID para obter o nome
														fetch(`/api/products/${value}`)
															.then((res) => res.json())
															.then((product) => {
																handleProductChange(index, product)
															})
															.catch((err) => {
																console.error("Erro ao buscar produto:", err)
															})
													} else {
														handleProductChange(index, null)
													}
												}}
											/>
										) : (
											<ProductSelect
												value={item.productId ? item.productId.toString() : undefined}
												onValueChange={(value) => {
													if (value) {
														// Buscar o produto pelo ID para obter o nome
														fetch(`/api/products/${value}`)
															.then((res) => res.json())
															.then((product) => {
																handleProductChange(index, product)
															})
															.catch((err) => {
																console.error("Erro ao buscar produto:", err)
															})
													} else {
														handleProductChange(index, null)
													}
												}}
											/>
										)}
									</div>
									<div className="sm:self-end flex gap-2">
										<Button
											variant="outline"
											className="w-full sm:w-auto"
											onClick={() => openCreateProductDialog(index)}
										>
											<PlusCircle className="mr-2 size-4" />
											Novo
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleRemoveItem(index)}
											title="Remover item"
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div>
										<Label htmlFor={`quantity-${index}`}>Quantidade</Label>
										<Input
											id={`quantity-${index}`}
											type="number"
											step="0.001"
											value={item.quantity}
											onChange={(e) => handleFieldChange(index, "quantity", e.target.value)}
										/>
									</div>
									<div>
										<Label htmlFor={`price-${index}`}>Preço Unitário</Label>
										<Input
											id={`price-${index}`}
											type="number"
											step="0.01"
											value={item.price}
											onChange={(e) => handleFieldChange(index, "price", e.target.value)}
										/>
									</div>
									<div>
										<Label htmlFor={`discount-${index}`}>Desconto Unit. (R$)</Label>
										<Input
											id={`discount-${index}`}
											type="number"
											step="0.01"
											value={item.unitDiscount || 0}
											onChange={(e) => handleFieldChange(index, "unitDiscount", e.target.value)}
										/>
									</div>
								</div>
								<div className="text-right text-sm">
									<span className="text-muted-foreground">Subtotal: </span>
									<span className="font-semibold">
										R$ {((item.price - (item.unitDiscount || 0)) * item.quantity).toFixed(2)}
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					{/* Resumo de totais */}
					<div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
						<div className="flex justify-between items-center text-sm">
							<span className="text-muted-foreground">Subtotal dos itens:</span>
							<span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
						</div>

						<div className="flex justify-between items-center gap-4">
							<Label htmlFor={totalDiscountId} className="text-sm text-muted-foreground">
								Desconto total da compra:
							</Label>
							<Input
								id={totalDiscountId}
								type="number"
								step="0.01"
								min="0"
								value={totalDiscount}
								onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
								className="w-32 text-right"
							/>
						</div>

						<div className="border-t pt-3 flex justify-between items-center">
							<span className="font-semibold text-lg">Valor Total:</span>
							<span className="font-bold text-2xl text-green-600">R$ {total.toFixed(2)}</span>
						</div>

						<div className="text-xs text-muted-foreground text-center">
							{associatedItemsCount} de {mappedItems.length} itens associados
						</div>
					</div>

					{/* Botões de ação */}
					<div className="flex justify-end gap-2 w-full">
						<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
							Cancelar
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting || associatedItemsCount === 0}>
							{isSubmitting ? "Salvando..." : `Salvar ${associatedItemsCount} Itens`}
						</Button>
					</div>
				</CardFooter>
			</Card>
		</>
	)
}

export default NfceItemReview
