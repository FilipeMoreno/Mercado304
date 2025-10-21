"use client"

import type { Brand, Category, Product } from "@prisma/client"
import { Check, Lightbulb, PlusCircle, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { QuickBrandForm } from "@/components/quick-brand-form"
import { QuickProductForm } from "@/components/quick-product-form"
import { ProductSelect } from "@/components/selects/product-select"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import { useUIPreferences } from "@/hooks"
import { cn } from "@/lib/utils"
import { type ProductSuggestion, ProductSuggestionsDialog } from "./product-suggestions-dialog"

// Interface para itens identificados pela IA
export interface AIIdentifiedItem {
	id: string
	name: string
	quantity: number
	isMatched: boolean
	matchedProductId?: string
	matchedProductName?: string
	confidence?: number
	originalText?: string
}

// Interface para itens processados no dialog
interface ProcessedAIItem {
	id: string
	originalName: string
	quantity: number
	productId: string
	productName: string
	isAssociated: boolean
	isTemporary: boolean
}

// Interface para o resultado final
export interface FinalListItem {
	productId?: string
	tempName?: string
	quantity: number
	isTemporary: boolean
}

interface AIListReviewDialogProps {
	isOpen: boolean
	onClose: () => void
	items: AIIdentifiedItem[]
	onConfirm: (finalItems: FinalListItem[]) => void
	isSubmitting?: boolean
}

export function AIListReviewDialog({
	isOpen,
	onClose,
	items,
	onConfirm,
	isSubmitting = false,
}: AIListReviewDialogProps) {
	const { selectStyle } = useUIPreferences()
	const [processedItems, setProcessedItems] = useState<ProcessedAIItem[]>([])
	const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] = useState(false)
	const [isCreateBrandDialogOpen, setIsCreateBrandDialogOpen] = useState(false)
	const [currentItemIndexForCreation, setCurrentItemIndexForCreation] = useState<number | null>(null)
	const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false)

	// Inicializar itens processados quando o dialog abrir
	useEffect(() => {
		if (isOpen && items.length > 0) {
			const processed = items.map(
				(item): ProcessedAIItem => ({
					id: item.id,
					originalName: item.name,
					quantity: item.quantity,
					productId: item.matchedProductId || "",
					productName: item.matchedProductName || "",
					isAssociated: item.isMatched || false,
					isTemporary: false,
				}),
			)
			setProcessedItems(processed)
		}
	}, [isOpen, items])

	const handleProductChange = (index: number, product: Product | null) => {
		const newItems = [...processedItems]
		if (product) {
			newItems[index].productId = product.id
			newItems[index].productName = product.name
			newItems[index].isAssociated = true
			newItems[index].isTemporary = false
			toast.success(`"${newItems[index].originalName}" associado a "${product.name}".`)
		} else {
			newItems[index].productId = ""
			newItems[index].productName = ""
			newItems[index].isAssociated = false
			newItems[index].isTemporary = false
		}
		setProcessedItems(newItems)
	}

	const handleQuantityChange = (index: number, value: string) => {
		const newItems = [...processedItems]
		const numericValue = parseFloat(value) || 0
		newItems[index].quantity = numericValue
		setProcessedItems(newItems)
	}

	const handleRemoveItem = (index: number) => {
		const newItems = processedItems.filter((_, i) => i !== index)
		setProcessedItems(newItems)
		toast.success("Item removido da lista.")
	}

	const handleMarkAsTemporary = (index: number) => {
		const newItems = [...processedItems]
		newItems[index].isTemporary = !newItems[index].isTemporary

		if (newItems[index].isTemporary) {
			newItems[index].isAssociated = true // Considerar como "resolvido"
			toast.success(`"${newItems[index].originalName}" será criado como produto temporário.`)
		} else {
			newItems[index].isAssociated = false
			toast.info(`"${newItems[index].originalName}" não será mais temporário.`)
		}
		setProcessedItems(newItems)
	}

	const openCreateProductDialog = (index: number) => {
		setCurrentItemIndexForCreation(index)
		setIsCreateProductDialogOpen(true)
	}

	const openCreateBrandDialog = () => {
		setIsCreateBrandDialogOpen(true)
	}

	const handleProductCreated = (newProduct: Product & { brand: Brand | null; category: Category }) => {
		if (currentItemIndexForCreation === null) return

		handleProductChange(currentItemIndexForCreation, newProduct)
		setIsCreateProductDialogOpen(false)
		setCurrentItemIndexForCreation(null)
	}

	const handleBrandCreated = (newBrand: Brand) => {
		setIsCreateBrandDialogOpen(false)
		toast.success(`Marca ${newBrand.name} criada com sucesso!`)
	}

	const handleMarkAllAsTemporary = () => {
		const newItems = [...processedItems]
		let markedCount = 0

		newItems.forEach((item) => {
			if (!item.isAssociated && !item.isTemporary) {
				item.isTemporary = true
				item.isAssociated = true
				markedCount++
			}
		})

		if (markedCount > 0) {
			setProcessedItems(newItems)
			toast.success(`${markedCount} itens marcados como temporários!`)
		} else {
			toast.info("Todos os itens já estão processados.")
		}
	}

	const handleAddSuggestions = (suggestions: ProductSuggestion[]) => {
		const newItems = suggestions.map(
			(suggestion): ProcessedAIItem => ({
				id: crypto.randomUUID(),
				originalName: suggestion.matchedProductName || suggestion.name,
				quantity: 1,
				productId: suggestion.matchedProductId || "",
				productName: suggestion.matchedProductName || "",
				isAssociated: suggestion.isMatched,
				isTemporary: !suggestion.isMatched,
			}),
		)

		setProcessedItems([...processedItems, ...newItems])
		setIsSuggestionsDialogOpen(false)
	}

	const handleSubmit = () => {
		const finalItems: FinalListItem[] = processedItems
			.filter((item) => item.isAssociated && item.quantity > 0)
			.map((item) => ({
				productId: item.isTemporary ? undefined : item.productId,
				tempName: item.isTemporary ? item.originalName : undefined,
				quantity: item.quantity,
				isTemporary: item.isTemporary,
			}))

		if (finalItems.length === 0) {
			toast.error("Nenhum item foi processado.", {
				description: "Associe ou marque como temporário pelo menos um item.",
			})
			return
		}

		onConfirm(finalItems)
	}

	const handleClose = () => {
		setProcessedItems([])
		setCurrentItemIndexForCreation(null)
		onClose()
	}

	const associatedItemsCount = processedItems.filter((item) => item.isAssociated).length
	const temporaryItemsCount = processedItems.filter((item) => item.isTemporary).length

	return (
		<>
			{/* Dialogs para criação de produto e marca */}
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

			<ResponsiveFormDialog
				open={isOpen}
				onOpenChange={(open) => !open && handleClose()}
				title="Conferir Itens Identificados"
				description="A IA identificou os seguintes itens. Associe-os aos produtos cadastrados ou marque como temporários."
				maxWidth="2xl"
			>
				{/* Botões de ação rápida */}
				<div className="space-y-3 mb-4">
					{/* Sugestões de IA */}
					<div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-purple-900">Sugestões Inteligentes</p>
								<p className="text-xs text-purple-700">A IA pode sugerir produtos complementares</p>
							</div>
							<Button
								onClick={() => setIsSuggestionsDialogOpen(true)}
								variant="outline"
								size="sm"
								className="border-purple-300 text-purple-700 hover:bg-purple-100"
							>
								<Lightbulb className="size-4 mr-1" />
								Sugerir Produtos
							</Button>
						</div>
					</div>

					{/* Marcar todos como temporários */}
					{processedItems.some((item) => !item.isAssociated && !item.isTemporary) && (
						<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-900">Ação Rápida</p>
									<p className="text-xs text-blue-700">
										{processedItems.filter((item) => !item.isAssociated && !item.isTemporary).length} itens ainda não
										processados
									</p>
								</div>
								<Button
									onClick={handleMarkAllAsTemporary}
									variant="outline"
									size="sm"
									className="border-blue-300 text-blue-700 hover:bg-blue-100"
								>
									<PlusCircle className="size-4 mr-1" />
									Marcar Todos como Temporários
								</Button>
							</div>
						</div>
					)}
				</div>

				<div className="space-y-6 max-h-[46vh] overflow-y-auto">
					{processedItems.map((item, index) => (
						<div
							key={item.id}
							className={cn(
								"p-4 border rounded-lg space-y-4 transition-all",
								item.isAssociated && !item.isTemporary ? "border-green-500 bg-green-500/5" : "",
								item.isTemporary ? "border-blue-500 bg-blue-500/5" : "",
								!item.isAssociated ? "border-gray-300" : "",
							)}
						>
							{/* Cabeçalho do item */}
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-muted-foreground">
										Item identificado: <span className="font-bold text-primary">{item.originalName}</span>
									</p>
									{item.isAssociated && !item.isTemporary && (
										<div className="flex items-center gap-1 text-green-600 text-sm mt-1">
											<Check className="h-3 w-3" />
											Associado a: {item.productName}
										</div>
									)}
									{item.isTemporary && (
										<div className="flex items-center gap-1 text-blue-600 text-sm mt-1">
											<Check className="h-3 w-3" />
											Será criado como temporário
										</div>
									)}
								</div>
								<Button variant="destructive" size="sm" onClick={() => handleRemoveItem(index)} title="Remover item">
									<Trash2 className="size-4" />
								</Button>
							</div>

							{/* Seleção de produto */}
							{!item.isTemporary && (
								<div className="space-y-2">
									<Label>Associar ao Produto</Label>
									<div className="flex gap-2">
										<div className="flex-1">
											{selectStyle === "dialog" ? (
												<ProductSelectDialog
													value={item.productId || undefined}
													onValueChange={(value) => {
														if (value) {
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
													value={item.productId || undefined}
													onValueChange={(value) => {
														if (value) {
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
										<Button variant="outline" onClick={() => openCreateProductDialog(index)}>
											<PlusCircle className="size-4 mr-1" />
											Novo
										</Button>
									</div>
								</div>
							)}

							{/* Quantidade */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor={`quantity-${index}`}>Quantidade</Label>
									<Input
										id={`quantity-${index}`}
										type="text"
										inputMode="decimal"
										value={item.quantity.toString()}
										onChange={(e) => handleQuantityChange(index, e.target.value)}
										placeholder="0,000"
									/>
								</div>
								<div className="flex items-end">
									<Button
										variant={item.isTemporary ? "default" : "outline"}
										onClick={() => handleMarkAsTemporary(index)}
										className="w-full"
									>
										{item.isTemporary ? (
											<>
												<X className="size-4 mr-1" />
												Cancelar Temporário
											</>
										) : (
											<>
												<PlusCircle className="size-4 mr-1" />
												Criar Temporário
											</>
										)}
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Footer com estatísticas e botões */}
				<div className="border-t pt-4 mt-6">
					<div className="flex justify-between items-center mb-4">
						<div className="text-sm text-muted-foreground space-y-1">
							<div>
								{associatedItemsCount} de {processedItems.length} itens processados
							</div>
							{temporaryItemsCount > 0 && (
								<div className="text-blue-600">{temporaryItemsCount} serão criados como temporários</div>
							)}
						</div>
					</div>

					<div className="flex gap-3 justify-end">
						<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
							Cancelar
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting || associatedItemsCount === 0}>
							{isSubmitting ? "Criando Lista..." : `Criar Lista (${associatedItemsCount} itens)`}
						</Button>
					</div>
				</div>
			</ResponsiveFormDialog>

			{/* Dialog de Sugestões de Produtos */}
			<ProductSuggestionsDialog
				isOpen={isSuggestionsDialogOpen}
				onClose={() => setIsSuggestionsDialogOpen(false)}
				currentItems={processedItems}
				onAddSuggestions={handleAddSuggestions}
			/>
		</>
	)
}
