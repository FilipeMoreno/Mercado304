"use client"

import { ArrowLeft, Grid3X3, ListChecks, Loader2, Plus, Save, Store, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
	useAllCategoriesQuery,
	useBudgetQuery,
	useMarketsQuery,
	useProductsQuery,
	useUpdateBudgetMutation,
} from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"
import type { QuoteItem } from "@/types"
import { QuoteType } from "@/types"

interface FormQuoteItem extends Omit<QuoteItem, "id" | "quoteId" | "createdAt" | "updatedAt"> {
	tempId: string
	id?: string
}

export default function EditBudgetPage() {
	const router = useRouter()
	const params = useParams()
	const budgetId = params.id as string

	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [quoteType, setQuoteType] = useState<QuoteType>(QuoteType.BY_ITEMS)
	const [marketId, setMarketId] = useState<string>("")
	const [categoryId, setCategoryId] = useState<string>("")
	const [budgetDate, setBudgetDate] = useState(new Date().toISOString().split("T")[0])
	const [validUntil, setValidUntil] = useState("")
	const [notes, setNotes] = useState("")
	const [status, setStatus] = useState<string>("DRAFT")
	const [items, setItems] = useState<FormQuoteItem[]>([])
	const [searchProduct, setSearchProduct] = useState("")
	const [debouncedSearch, setDebouncedSearch] = useState("")

	// Campos para orçamento por categoria ou mercado (valor fixo)
	const [totalAmount, setTotalAmount] = useState<number>(0)
	const [discountAmount, setDiscountAmount] = useState<number>(0)

	// Queries
	const { data: budget, isLoading: loadingBudget } = useBudgetQuery(budgetId)
	const { data: marketsData } = useMarketsQuery()
	const { data: categoriesData } = useAllCategoriesQuery()
	const { data: productsData } = useProductsQuery(
		debouncedSearch ? new URLSearchParams({ search: debouncedSearch, limit: "10" }) : undefined,
	)
	const updateMutation = useUpdateBudgetMutation()

	const markets = marketsData?.markets || []
	const categories = Array.isArray(categoriesData) ? categoriesData : []
	const products = productsData?.products || []

	// Debounce para busca de produtos
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchProduct)
		}, 500)
		return () => clearTimeout(timer)
	}, [searchProduct])

	// Carregar dados do orçamento existente
	useEffect(() => {
		if (budget) {
			setName(budget.name)
			setDescription(budget.description || "")
			setQuoteType(budget.type || QuoteType.BY_ITEMS)
			setMarketId(budget.marketId || "")
			setCategoryId(budget.categoryId || "")
			setBudgetDate(budget.budgetDate ? new Date(budget.budgetDate).toISOString().split("T")[0] : "")
			setValidUntil(budget.validUntil ? new Date(budget.validUntil).toISOString().split("T")[0] : "")
			setNotes(budget.notes || "")
			setStatus(budget.status || "DRAFT")

			// Carregar itens
			if (budget.items && budget.items.length > 0) {
				// Se é por categoria ou mercado, extrair valores do item genérico
				if (budget.type === QuoteType.BY_CATEGORY || budget.type === QuoteType.BY_MARKET) {
					const firstItem = budget.items[0]
					setTotalAmount(firstItem.totalPrice || 0)
					setDiscountAmount(firstItem.totalDiscount || 0)
				} else {
					// Por itens, carregar todos os itens
					setItems(
						budget.items.map((item: any) => ({
							...item,
							tempId: item.id || `temp-${Date.now()}-${Math.random()}`,
						})),
					)
				}
			}
		}
	}, [budget])

	// Limpar dados quando mudar o tipo
	const handleTypeChange = (newType: QuoteType) => {
		setQuoteType(newType)
		if (newType !== QuoteType.BY_ITEMS) {
			setItems([])
		}
		if (newType === QuoteType.BY_ITEMS) {
			setTotalAmount(0)
			setDiscountAmount(0)
		}
	}

	const addItem = () => {
		const newItem: FormQuoteItem = {
			tempId: `temp-${Date.now()}`,
			productId: undefined,
			quantity: 1,
			unitPrice: 0,
			unitDiscount: 0,
			totalPrice: 0,
			totalDiscount: 0,
			finalPrice: 0,
			productName: "",
			productUnit: "unidade",
			productCategory: undefined,
			brandName: undefined,
			notes: undefined,
			priority: 0,
		}
		setItems([...items, newItem])
	}

	const removeItem = (tempId: string) => {
		setItems(items.filter((item) => item.tempId !== tempId))
	}

	const updateItem = (tempId: string, field: keyof FormQuoteItem, value: any) => {
		setItems(
			items.map((item) => {
				if (item.tempId !== tempId) return item

				const updatedItem = { ...item, [field]: value }

				if (field === "quantity" || field === "unitPrice" || field === "unitDiscount") {
					const qty = Number.parseFloat(updatedItem.quantity.toString()) || 0
					const price = Number.parseFloat(updatedItem.unitPrice.toString()) || 0
					const discount = Number.parseFloat(updatedItem.unitDiscount.toString()) || 0

					updatedItem.totalPrice = qty * price
					updatedItem.totalDiscount = qty * discount
					updatedItem.finalPrice = updatedItem.totalPrice - updatedItem.totalDiscount
				}

				return updatedItem
			}),
		)
	}

	const selectProduct = (tempId: string, productId: string) => {
		const product = products.find((p: any) => p.id === productId)
		if (!product) return

		setItems(
			items.map((item) => {
				if (item.tempId !== tempId) return item

				const averagePrice = product.averagePrice || 0
				const qty = item.quantity || 1

				return {
					...item,
					productId: product.id,
					productName: product.name,
					productUnit: product.unit,
					productCategory: product.category?.name,
					brandName: product.brand?.name,
					unitPrice: averagePrice,
					totalPrice: qty * averagePrice,
					finalPrice: qty * averagePrice,
				}
			}),
		)
	}

	const calculateTotals = () => {
		if (quoteType === QuoteType.BY_CATEGORY || quoteType === QuoteType.BY_MARKET) {
			return {
				totalEstimated: totalAmount,
				totalDiscount: discountAmount,
				finalEstimated: totalAmount - discountAmount,
			}
		}

		const totalEstimated = items.reduce((sum, item) => sum + item.totalPrice, 0)
		const totalDiscount = items.reduce((sum, item) => sum + item.totalDiscount, 0)
		const finalEstimated = totalEstimated - totalDiscount

		return { totalEstimated, totalDiscount, finalEstimated }
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			toast.error("Nome do orçamento é obrigatório")
			return
		}

		if (quoteType === QuoteType.BY_CATEGORY && !categoryId) {
			toast.error("Selecione uma categoria para orçamento por categoria")
			return
		}

		if (quoteType === QuoteType.BY_MARKET && !marketId) {
			toast.error("Selecione um mercado para orçamento por mercado")
			return
		}

		if (quoteType === QuoteType.BY_ITEMS) {
			if (items.length === 0) {
				toast.error("Adicione ao menos um item ao orçamento")
				return
			}

			const hasInvalidItems = items.some((item) => !item.productName.trim() || item.quantity <= 0)
			if (hasInvalidItems) {
				toast.error("Todos os itens devem ter nome e quantidade válida")
				return
			}
		}

		if (quoteType === QuoteType.BY_CATEGORY || quoteType === QuoteType.BY_MARKET) {
			if (totalAmount <= 0) {
				toast.error("Valor total deve ser maior que zero")
				return
			}

			const categoryName = categories.find((c) => c.id === categoryId)?.name || "Categoria"
			const marketName = markets.find((m: any) => m.id === marketId)?.name || "Mercado"

			const genericItem: Omit<QuoteItem, "id" | "quoteId" | "createdAt" | "updatedAt"> = {
				productId: undefined,
				quantity: 1,
				unitPrice: totalAmount,
				unitDiscount: discountAmount,
				totalPrice: totalAmount,
				totalDiscount: discountAmount,
				finalPrice: totalAmount - discountAmount,
				productName:
					quoteType === QuoteType.BY_CATEGORY ? `Orçamento para ${categoryName}` : `Orçamento para ${marketName}`,
				productUnit: "total",
				productCategory: quoteType === QuoteType.BY_CATEGORY ? categoryName : undefined,
				brandName: undefined,
				notes: undefined,
				priority: 0,
			}

			const budgetData = {
				name,
				description: description || undefined,
				type: quoteType,
				marketId: marketId || undefined,
				categoryId: categoryId || undefined,
				status: status,
				budgetDate,
				validUntil: validUntil || undefined,
				notes: notes || undefined,
				items: [genericItem],
			}

			try {
				await updateMutation.mutateAsync({ id: budgetId, data: budgetData as any })
				router.push(`/orcamentos/${budgetId}`)
			} catch (_error) {
				// Error já tratado pelo mutation
			}
			return
		}

		const budgetData = {
			name,
			description: description || undefined,
			type: quoteType,
			marketId: marketId || undefined,
			categoryId: categoryId || undefined,
			status: status,
			budgetDate,
			validUntil: validUntil || undefined,
			notes: notes || undefined,
			items: items.map(({ tempId, id, ...item }) => item),
		}

		try {
			await updateMutation.mutateAsync({ id: budgetId, data: budgetData as any })
			router.push(`/orcamentos/${budgetId}`)
		} catch (_error) {
			// Error já tratado pelo mutation
		}
	}

	if (loadingBudget) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		)
	}

	const totals = calculateTotals()
	const isByItems = quoteType === QuoteType.BY_ITEMS
	const isByCategory = quoteType === QuoteType.BY_CATEGORY
	const isByMarket = quoteType === QuoteType.BY_MARKET

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<h1 className="text-3xl font-bold">Editar Orçamento</h1>
					<p className="text-muted-foreground">Atualize os dados do orçamento</p>
				</div>
				<Button onClick={handleSubmit} disabled={updateMutation.isPending}>
					<Save className="mr-2 h-4 w-4" />
					Salvar Alterações
				</Button>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Info */}
				<Card>
					<CardHeader>
						<CardTitle>Informações Básicas</CardTitle>
						<CardDescription>Dados gerais do orçamento</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Budget Type Selection */}
						<div className="space-y-2">
							<Label>Tipo de Orçamento</Label>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								<Card
									className={`cursor-pointer transition-all ${
										quoteType === QuoteType.BY_ITEMS ? "border-primary bg-primary/5" : "hover:border-primary/50"
									}`}
									onClick={() => handleTypeChange(QuoteType.BY_ITEMS)}
								>
									<CardContent className="flex items-center gap-3 p-4">
										<ListChecks className={`h-5 w-5 ${quoteType === QuoteType.BY_ITEMS ? "text-blue-600" : ""}`} />
										<div className="flex-1">
											<div className="font-medium">Por Itens</div>
											<div className="text-xs text-muted-foreground">Orçamento de itens individuais</div>
										</div>
									</CardContent>
								</Card>

								<Card
									className={`cursor-pointer transition-all ${
										quoteType === QuoteType.BY_CATEGORY ? "border-primary bg-primary/5" : "hover:border-primary/50"
									}`}
									onClick={() => handleTypeChange(QuoteType.BY_CATEGORY)}
								>
									<CardContent className="flex items-center gap-3 p-4">
										<Grid3X3 className={`h-5 w-5 ${quoteType === QuoteType.BY_CATEGORY ? "text-purple-600" : ""}`} />
										<div className="flex-1">
											<div className="font-medium">Por Categoria</div>
											<div className="text-xs text-muted-foreground">Valor total para uma categoria</div>
										</div>
									</CardContent>
								</Card>

								<Card
									className={`cursor-pointer transition-all ${
										quoteType === QuoteType.BY_MARKET ? "border-primary bg-primary/5" : "hover:border-primary/50"
									}`}
									onClick={() => handleTypeChange(QuoteType.BY_MARKET)}
								>
									<CardContent className="flex items-center gap-3 p-4">
										<Store className={`h-5 w-5 ${quoteType === QuoteType.BY_MARKET ? "text-green-600" : ""}`} />
										<div className="flex-1">
											<div className="font-medium">Por Mercado</div>
											<div className="text-xs text-muted-foreground">Valor total para um mercado</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Nome do Orçamento *</Label>
								<Input
									id="name"
									placeholder="Ex: Compra Mensal Outubro"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="market">Mercado {isByMarket && "*"}</Label>
								<Select value={marketId || undefined} onValueChange={setMarketId}>
									<SelectTrigger id="market">
										<SelectValue
											placeholder={isByMarket ? "Selecione um mercado" : "Selecione um mercado (opcional)"}
										/>
									</SelectTrigger>
									<SelectContent>
										{markets.map((market: any) => (
											<SelectItem key={market.id} value={market.id}>
												{market.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{isByCategory && (
							<div className="space-y-2">
								<Label htmlFor="category">Categoria *</Label>
								<Select value={categoryId || undefined} onValueChange={setCategoryId}>
									<SelectTrigger id="category">
										<SelectValue placeholder="Selecione uma categoria" />
									</SelectTrigger>
									<SelectContent>
										{categories.map((category) => (
											<SelectItem key={category.id} value={category.id}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="description">Descrição</Label>
							<Textarea
								id="description"
								placeholder="Descrição detalhada do orçamento"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="budgetDate">Data do Orçamento</Label>
								<Input id="budgetDate" type="date" value={budgetDate} onChange={(e) => setBudgetDate(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="validUntil">Válido Até</Label>
								<Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notes">Observações</Label>
							<Textarea
								id="notes"
								placeholder="Observações adicionais"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={2}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status">Status do Orçamento</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger id="status">
									<SelectValue placeholder="Selecione o status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DRAFT">Rascunho</SelectItem>
									<SelectItem value="FINALIZED">Finalizado</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{status === "DRAFT"
									? "Orçamento em rascunho pode ser editado posteriormente"
									: "Orçamento finalizado não pode ser alterado"}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Valores para BY_CATEGORY ou BY_MARKET */}
				{(isByCategory || isByMarket) && (
					<Card>
						<CardHeader>
							<CardTitle>Valor do Orçamento</CardTitle>
							<CardDescription>
								{isByCategory
									? "Defina o valor total estimado para esta categoria"
									: "Defina o valor total estimado para este mercado"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="totalAmount">Valor Total *</Label>
									<Input
										id="totalAmount"
										type="number"
										step="0.01"
										min="0"
										placeholder="Ex: 500.00"
										value={totalAmount || ""}
										onChange={(e) => setTotalAmount(Number.parseFloat(e.target.value) || 0)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="discountAmount">Desconto (opcional)</Label>
									<Input
										id="discountAmount"
										type="number"
										step="0.01"
										min="0"
										placeholder="Ex: 50.00"
										value={discountAmount || ""}
										onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
									/>
								</div>
							</div>

							<Separator className="my-4" />

							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Valor Estimado:</span>
									<span>{formatCurrency(totalAmount)}</span>
								</div>
								{discountAmount > 0 && (
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Desconto:</span>
										<span className="text-green-600">-{formatCurrency(discountAmount)}</span>
									</div>
								)}
								<Separator />
								<div className="flex justify-between text-lg font-bold">
									<span>Total Final:</span>
									<span>{formatCurrency(totalAmount - discountAmount)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Items - apenas para BY_ITEMS */}
				{isByItems && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Itens do Orçamento</CardTitle>
									<CardDescription>Adicione os produtos e seus preços</CardDescription>
								</div>
								<Button type="button" variant="outline" onClick={addItem}>
									<Plus className="mr-2 h-4 w-4" />
									Adicionar Item
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{items.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground">
									<p>Nenhum item adicionado</p>
									<Button type="button" variant="outline" onClick={addItem} className="mt-4">
										<Plus className="mr-2 h-4 w-4" />
										Adicionar Primeiro Item
									</Button>
								</div>
							) : (
								<>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Produto</TableHead>
												<TableHead className="w-24">Qtd</TableHead>
												<TableHead className="w-32">Preço Unit.</TableHead>
												<TableHead className="w-32">Desconto</TableHead>
												<TableHead className="w-32">Total</TableHead>
												<TableHead className="w-12"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{items.map((item) => (
												<TableRow key={item.tempId}>
													<TableCell>
														<div className="space-y-2">
															<div className="relative">
																<Input
																	placeholder="Digite para buscar produto ou nome manual"
																	value={item.productName}
																	onChange={(e) => {
																		updateItem(item.tempId, "productName", e.target.value)
																		setSearchProduct(e.target.value)
																	}}
																/>
																{debouncedSearch &&
																	products.length > 0 &&
																	item.productName === searchProduct &&
																	searchProduct.length >= 2 && (
																		<div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
																			{products.map((product: any) => (
																				<div
																					key={product.id}
																					className="px-3 py-2 hover:bg-accent cursor-pointer"
																					onClick={() => {
																						selectProduct(item.tempId, product.id)
																						setSearchProduct("")
																					}}
																				>
																					<div className="font-medium">{product.name}</div>
																					<div className="text-xs text-muted-foreground">
																						{product.brand?.name} • {product.category?.name}
																					</div>
																				</div>
																			))}
																		</div>
																	)}
																{searchProduct !== debouncedSearch && searchProduct.length >= 2 && (
																	<div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-sm px-3 py-2">
																		<div className="text-sm text-muted-foreground">Buscando...</div>
																	</div>
																)}
															</div>
															<div className="grid grid-cols-2 gap-2">
																<Input
																	placeholder="Marca"
																	value={item.brandName || ""}
																	onChange={(e) => updateItem(item.tempId, "brandName", e.target.value)}
																	className="text-sm"
																/>
																<Input
																	placeholder="Categoria"
																	value={item.productCategory || ""}
																	onChange={(e) => updateItem(item.tempId, "productCategory", e.target.value)}
																	className="text-sm"
																/>
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															step="0.01"
															min="0"
															value={item.quantity}
															onChange={(e) => updateItem(item.tempId, "quantity", Number.parseFloat(e.target.value))}
														/>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															step="0.01"
															min="0"
															value={item.unitPrice}
															onChange={(e) => updateItem(item.tempId, "unitPrice", Number.parseFloat(e.target.value))}
														/>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															step="0.01"
															min="0"
															value={item.unitDiscount}
															onChange={(e) =>
																updateItem(item.tempId, "unitDiscount", Number.parseFloat(e.target.value))
															}
														/>
													</TableCell>
													<TableCell className="font-medium">{formatCurrency(item.finalPrice)}</TableCell>
													<TableCell>
														<Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.tempId)}>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>

									<Separator className="my-4" />

									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Subtotal:</span>
											<span>{formatCurrency(totals.totalEstimated)}</span>
										</div>
										{totals.totalDiscount > 0 && (
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">Desconto:</span>
												<span className="text-green-600">-{formatCurrency(totals.totalDiscount)}</span>
											</div>
										)}
										<Separator />
										<div className="flex justify-between text-lg font-bold">
											<span>Total:</span>
											<span>{formatCurrency(totals.finalEstimated)}</span>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => router.back()}>
						Cancelar
					</Button>
					<Button type="submit" disabled={updateMutation.isPending}>
						<Save className="mr-2 h-4 w-4" />
						{updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
					</Button>
				</div>
			</form>
		</div>
	)
}
