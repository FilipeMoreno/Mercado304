"use client"

import { addDays, format } from "date-fns"
import { motion } from "framer-motion"
import { ArrowLeft, Box, Package, Plus, Save, Settings2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { BestPriceAlert } from "@/components/best-price-alert"
import { PriceAiInsight } from "@/components/price-ai-insight"
import { PriceAlert } from "@/components/price-alert"
import { MarketSelect } from "@/components/selects/market-select"
import { MarketSelectDialog } from "@/components/selects/market-select-dialog"
import { PaymentMethodSelectDialog } from "@/components/selects/payment-method-select-dialog"
import { ProductSelect } from "@/components/selects/product-select"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { NovaCompraSkeleton } from "@/components/skeletons/nova-compra-skeleton"
import { type StockEntry, StockEntryDialog } from "@/components/stock-entry-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreatePurchaseMutation, useUIPreferences } from "@/hooks"
import { toDateInputValue } from "@/lib/date-utils"
import { TempStorage } from "@/lib/temp-storage"
import { PaymentMethod, type Product } from "@/types"

interface PurchaseItem {
	id?: string
	productId: string
	quantity: number
	unitPrice: number
	unitDiscount?: number
	priceAlert?: {
		hasAlert: boolean
		alertType?: "price_warning" | "high_price"
		message: string
		details?: {
			currentPrice: number
			suggestedPrice?: number
			averagePrice?: number
			savings?: number
			savingsPercent?: number
			suggestedMarket?: {
				name: string
			}
			difference?: number
			percentDifference?: number
			totalComparisons: number
			historicalPurchases?: number
		}
	}
	bestPriceAlert?: {
		isBestPrice: boolean
		previousBestPrice?: number
		totalRecords?: number
		isFirstRecord?: boolean
	}
	addToStock: boolean
	stockEntries: StockEntry[]
	aiInsight: string | null
	isAiLoading: boolean
}

export default function NovaCompraPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const createPurchaseMutation = useCreatePurchaseMutation()
	const id = useId()
	const { selectStyle } = useUIPreferences()
	const [products, setProducts] = useState<Product[]>([])
	const [loading, setLoading] = useState(false)
	const [dataLoading, setDataLoading] = useState(true)
	const restoredRef = React.useRef(false)

	const [stockDialogState, setStockDialogState] = useState<{
		isOpen: boolean
		itemIndex: number | null
	}>({ isOpen: false, itemIndex: null })

	const [formData, setFormData] = useState({
		marketId: "",
		purchaseDate: new Date().toISOString().split("T")[0],
		paymentMethod: PaymentMethod.MONEY,
		totalDiscount: 0,
	})

	const [items, setItems] = useState<PurchaseItem[]>([
		{
			id: Math.random().toString(),
			productId: "",
			quantity: 1,
			unitPrice: 0,
			unitDiscount: 0,
			addToStock: false,
			stockEntries: [],
			aiInsight: null,
			isAiLoading: false, // Changed from boolean | null to boolean
		},
	])
	const [checkingPrices, setCheckingPrices] = useState<boolean[]>([false])

	// Inputs control arrays to support empty values (qty with 3 decimals, price with 2)
	const [quantityInputs, setQuantityInputs] = useState<string[]>(["1.000"])
	const [unitPriceInputs, setUnitPriceInputs] = useState<string[]>(["0.00"])
	const [unitDiscountInputs, setUnitDiscountInputs] = useState<string[]>(["0.00"])
	const [totalDiscountInput, setTotalDiscountInput] = useState<string>("0.00")

	const fetchData = React.useCallback(async () => {
		try {
			// Buscar TODOS os produtos sem paginação
			const productsRes = await fetch("/api/products?limit=10000")
			if (productsRes.ok) {
				const productsData = await productsRes.json()
				setProducts(productsData.products)
			}
		} catch (error) {
			console.error("Erro ao carregar dados:", error)
		} finally {
			setDataLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchData()
	}, [fetchData])
	// Restaurar itens do storageKey quando a página carregar
	useEffect(() => {
		const storageKey = searchParams.get("storageKey")
		if (storageKey && !restoredRef.current) {
			restoredRef.current = true
			const storedData = TempStorage.get(storageKey)

			if (storedData?.items) {
				console.log("Restaurando itens do storageKey:", storedData.items)

				// Transformar os itens da lista em itens de compra
				const purchaseItems = storedData.items.map(
					(item: { productId?: string; quantity?: number; unitPrice?: number }) => ({
						id: Math.random().toString(),
						productId: item.productId || "",
						quantity: item.quantity || 1,
						unitPrice: item.unitPrice || 0,
					}),
				)

				// Adicionar um item vazio no final se não houver
				if (purchaseItems.length > 0) {
					purchaseItems.push({
						id: Math.random().toString(),
						productId: "",
						quantity: 1,
						unitPrice: 0,
					})
				}

				setItems(purchaseItems)

				// Remover dados temporários após uso
				TempStorage.remove(storageKey)

				toast.success(`${storedData.items.length} itens carregados da lista de compras!`)
			}
		}
	}, [searchParams])

	const addItem = () => {
		setItems([
			...items,
			{
				id: Math.random().toString(),
				productId: "",
				quantity: 1,
				unitPrice: 0,
				unitDiscount: 0,
				addToStock: false,
				stockEntries: [],
				aiInsight: null,
				isAiLoading: false, // Changed from boolean | null to boolean
			},
		])
		setCheckingPrices([...checkingPrices, false])
		setQuantityInputs((prev) => [...prev, "1.000"])
		setUnitPriceInputs((prev) => [...prev, "0.00"])
		setUnitDiscountInputs((prev) => [...prev, "0.00"])
	}

	const fetchAiAnalysis = async (index: number, productId: string, unitPrice: number) => {
		if (!productId || !unitPrice) return

		setItems((current) =>
			current.map((item, i) => (i === index ? { ...item, isAiLoading: true, aiInsight: null } : item)),
		)

		try {
			const response = await fetch("/api/ai/prices", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId, currentPrice: unitPrice }),
			})
			if (response.ok) {
				const data = await response.json()
				setItems((current) => current.map((item, i) => (i === index ? { ...item, aiInsight: data.analysis } : item)))
			}
		} catch (error) {
			console.error("Erro na análise da IA:", error)
		} finally {
			setItems((current) => current.map((item, i) => (i === index ? { ...item, isAiLoading: false } : item)))
		}
	}

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index))
			setCheckingPrices(checkingPrices.filter((_, i) => i !== index))
			setQuantityInputs((prev) => prev.filter((_, i) => i !== index))
			setUnitPriceInputs((prev) => prev.filter((_, i) => i !== index))
			setUnitDiscountInputs((prev) => prev.filter((_, i) => i !== index))
		}
	}

	const checkPrice = async (index: number, productId: string, unitPrice: number) => {
		if (!productId || !unitPrice || !formData.marketId) return

		setCheckingPrices((current) => current.map((c, i) => (i === index ? true : c)))

		try {
			const response = await fetch("/api/price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId,
					currentPrice: unitPrice,
					currentMarketId: formData.marketId,
				}),
			})
			const alertData = await response.json()

			setItems((currentItems) =>
				currentItems.map((item, i) => (i === index ? { ...item, priceAlert: alertData } : item)),
			)
		} catch (error) {
			console.error("Erro ao verificar preço:", error)
		} finally {
			setCheckingPrices((current) => current.map((c, i) => (i === index ? false : c)))
		}
	}

	const checkBestPrice = async (index: number, productId: string, unitPrice: number) => {
		if (!productId || !unitPrice) return

		try {
			const response = await fetch("/api/best-price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId, currentPrice: unitPrice }),
			})
			const bestPriceData = await response.json()
			setItems((currentItems) =>
				currentItems.map((item, i) => (i === index ? { ...item, bestPriceAlert: bestPriceData } : item)),
			)
		} catch (error) {
			console.error("Erro ao verificar melhor preço:", error)
		}
	}

	const updateItem = (
		index: number,
		field: keyof PurchaseItem,
		value: string | number | boolean | null | StockEntry[],
	) => {
		setItems((currentItems) => {
			const newItems = [...currentItems]
			const currentItem = { ...newItems[index] }

			// @ts-expect-error
			currentItem[field] = value

			if (field === "productId" || (field === "addToStock" && value === true)) {
				const product = products.find((p) => p.id === currentItem.productId)
				if (product && currentItem.addToStock) {
					const defaultExpiration =
						product.hasExpiration && product.defaultShelfLifeDays
							? format(addDays(new Date(), product.defaultShelfLifeDays), "yyyy-MM-dd")
							: ""

					currentItem.stockEntries = Array.from({
						length: Math.floor(currentItem.quantity),
					}).map(() => ({
						id: Math.random().toString(),
						location: "Despensa",
						expirationDate: defaultExpiration,
						batchNumber: "",
						notes: "",
					}))
				}
			} else if (field === "addToStock" && value === false) {
				currentItem.stockEntries = []
			}

			if (field === "quantity") {
				const product = products.find((p) => p.id === currentItem.productId)
				if (product && currentItem.addToStock) {
					const newQuantity = Math.floor(Number(value) || 0)
					const oldEntries = currentItem.stockEntries
					const newEntries = Array.from({ length: newQuantity }).map(
						(_, i) =>
							oldEntries[i] || {
								id: Math.random().toString(),
								location: oldEntries[0]?.location || "Despensa",
								expirationDate: oldEntries[0]?.expirationDate || "",
								batchNumber: oldEntries[0]?.batchNumber || "",
								notes: oldEntries[0]?.notes || "",
							},
					)
					currentItem.stockEntries = newEntries
				}
			}

			newItems[index] = currentItem

			if ((field === "unitPrice" || field === "productId") && currentItem.productId && currentItem.unitPrice > 0) {
				setTimeout(() => {
					checkBestPrice(index, currentItem.productId, currentItem.unitPrice)
					checkPrice(index, currentItem.productId, currentItem.unitPrice)
					fetchAiAnalysis(index, currentItem.productId, currentItem.unitPrice)
				}, 1000)
			}

			return newItems
		})
	}

	// Keep input strings in sync when items array changes in size (e.g., after restoring or loading)
	useEffect(() => {
		setQuantityInputs((prev) => {
			if (prev.length === items.length) return prev
			return items.map((it, i) => prev[i] ?? (it.quantity ? String(it.quantity) : ""))
		})
		setUnitPriceInputs((prev) => {
			if (prev.length === items.length) return prev
			return items.map((it, i) => prev[i] ?? (it.unitPrice ? String(it.unitPrice) : ""))
		})
		setUnitDiscountInputs((prev) => {
			if (prev.length === items.length) return prev
			return items.map((it, i) => prev[i] ?? (it.unitDiscount ? String(it.unitDiscount) : ""))
		})
	}, [items])

	const _calculateTotal = () => {
		return items.reduce((sum, item) => {
			const totalPrice = item.quantity * item.unitPrice
			const totalDiscount = item.quantity * (item.unitDiscount || 0)
			return sum + totalPrice - totalDiscount
		}, 0)
	}

	const calculateTotalWithoutDiscounts = () => {
		return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
	}

	const calculateTotalDiscounts = () => {
		const itemDiscounts = items.reduce((sum, item) => sum + item.quantity * (item.unitDiscount || 0), 0)
		return itemDiscounts + (formData.totalDiscount || 0)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.marketId) {
			toast.error("Selecione um mercado")
			return
		}

		const validItems = items.filter((item) => item.productId && item.quantity > 0 && item.unitPrice > 0)

		if (validItems.length === 0) {
			toast.error("Adicione pelo menos um item válido")
			return
		}

		setLoading(true)

		try {
			// Mapear items com productName
			const itemsWithNames = validItems.map((item) => {
				const product = products.find((p) => p.id === item.productId)
				return {
					...item,
					productName: product?.name || "Produto sem nome",
				}
			})

			await createPurchaseMutation.mutateAsync({
				marketId: formData.marketId,
				purchaseDate: formData.purchaseDate,
				paymentMethod: formData.paymentMethod,
				totalDiscount: formData.totalDiscount || 0,
				items: itemsWithNames,
			})

			toast.success("Compra registrada com sucesso!")
			// Pequeno delay para garantir que a invalidação seja processada
			setTimeout(() => {
				router.push("/compras")
			}, 100)
		} catch (error) {
			console.error("Erro ao criar compra:", error)
			toast.error("Erro ao criar compra")
		} finally {
			setLoading(false)
		}
	}

	const handleSaveStockDetails = (entries: StockEntry[]) => {
		if (stockDialogState.itemIndex !== null) {
			updateItem(stockDialogState.itemIndex, "stockEntries", entries)
		}
	}

	if (dataLoading) {
		return <NovaCompraSkeleton />
	}

	return (
		<div className="min-h-screen bg-gray-50/50 pb-20 md:pb-6">
			{/* Header fixo para mobile */}
			<div className="sticky top-0 z-10 bg-white border-b shadow-xs md:relative md:shadow-none md:border-none">
				<div className="px-4 py-4 md:px-0">
					<div className="flex items-center gap-4">
						<Link href="/compras">
							<Button variant="outline" size="sm">
								<ArrowLeft className="size-4 mr-2" />
								<span className="hidden sm:inline">Voltar</span>
							</Button>
						</Link>
						<div className="flex-1">
							<h1 className="text-xl md:text-3xl font-bold">Nova Compra</h1>
							<p className="text-gray-600 text-sm md:text-base mt-1 md:mt-2">Registre uma nova compra</p>
						</div>
					</div>
				</div>
			</div>

			<div className="px-4 md:px-0 space-y-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
						<Card>
							<CardHeader>
								<CardTitle>Informações da Compra</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label htmlFor="marketId">Mercado *</Label>
										{selectStyle === "dialog" ? (
											<MarketSelectDialog
												value={formData.marketId}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, marketId: value }))
												}}
											/>
										) : (
											<MarketSelect
												value={formData.marketId}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, marketId: value }))
												}}
											/>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor={`purchaseDate-${id}`}>Data da Compra</Label>
										<Input
											id={`purchaseDate-${id}`}
											name="purchaseDate"
											type="date"
											value={toDateInputValue(formData.purchaseDate)}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													purchaseDate: e.target.value,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="paymentMethod">Método de Pagamento *</Label>
										{selectStyle === "dialog" ? (
											<PaymentMethodSelectDialog
												value={formData.paymentMethod}
												onValueChange={(value) =>
													setFormData((prev) => ({
														...prev,
														paymentMethod: value,
													}))
												}
											/>
										) : (
											<Select
												value={formData.paymentMethod}
												onValueChange={(value) =>
													setFormData((prev) => ({
														...prev,
														paymentMethod: value as PaymentMethod,
													}))
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Selecione..." />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={PaymentMethod.MONEY}>💵 Dinheiro</SelectItem>
													<SelectItem value={PaymentMethod.DEBIT}>💳 Cartão de Débito</SelectItem>
													<SelectItem value={PaymentMethod.CREDIT}>💳 Cartão de Crédito</SelectItem>
													<SelectItem value={PaymentMethod.PIX}>📱 PIX</SelectItem>
													<SelectItem value={PaymentMethod.VOUCHER}>🎫 Vale Alimentação/Refeição</SelectItem>
													<SelectItem value={PaymentMethod.CHECK}>📄 Cheque</SelectItem>
													<SelectItem value={PaymentMethod.OTHER}>🔄 Outros</SelectItem>
												</SelectContent>
											</Select>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<Package className="size-5" />
										Itens da Compra
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{items.map((item, index) => {
										const selectedProduct = products.find((p) => p.id === item.productId)
										return (
											<motion.div
												key={item.id || index}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.3 + index * 0.05 }}
												className="space-y-4 p-4 border rounded-lg bg-white shadow-xs"
											>
												{/* Número do item */}
												<div className="text-xs text-gray-500 font-medium">Item {index + 1}</div>

												{/* Produto em largura total */}
												<div className="space-y-2">
													<Label>Produto *</Label>
													{selectStyle === "dialog" ? (
														<ProductSelectDialog
															value={item.productId || ""}
															className="w-full"
															onValueChange={(value) => updateItem(index, "productId", value)}
															preserveFormData={{
																formData,
																items,
																targetItemIndex: index,
															}}
														/>
													) : (
														<ProductSelect
															value={item.productId || ""}
															className="w-full"
															onValueChange={(value) => updateItem(index, "productId", value)}
															products={products}
															preserveFormData={{
																formData,
																items,
																targetItemIndex: index,
															}}
														/>
													)}
												</div>

												{/* Quantidade, Preço, Desconto e Total em 4 colunas */}
												<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
													<div className="space-y-2">
														<Label>Quantidade *</Label>
														<Input
															type="text"
															inputMode="decimal"
															step="0.001"
															min="0"
															value={quantityInputs[index] ?? (item.quantity ? String(item.quantity) : "")}
															onChange={(e) => {
																const raw = e.target.value
																setQuantityInputs((prev) => {
																	const next = [...prev]
																	next[index] = raw
																	return next
																})
																const normalized = raw.replace(",", ".")
																const parsed = parseFloat(normalized)
																if (!Number.isNaN(parsed)) {
																	updateItem(index, "quantity", parsed)
																} else if (raw === "") {
																	updateItem(index, "quantity", 0)
																}
															}}
															placeholder="0,000"
															className="text-center"
														/>
													</div>
													<div className="space-y-2">
														<Label>Preço Unitário *</Label>
														<Input
															type="text"
															inputMode="decimal"
															step="0.01"
															min="0"
															value={unitPriceInputs[index] ?? (item.unitPrice ? String(item.unitPrice) : "")}
															onChange={(e) => {
																const raw = e.target.value
																setUnitPriceInputs((prev) => {
																	const next = [...prev]
																	next[index] = raw
																	return next
																})
																const normalized = raw.replace(",", ".")
																const parsed = parseFloat(normalized)
																if (!Number.isNaN(parsed)) {
																	updateItem(index, "unitPrice", parsed)
																} else if (raw === "") {
																	updateItem(index, "unitPrice", 0)
																}
															}}
															placeholder="0,00"
															className="text-center"
														/>
													</div>
													<div className="space-y-2">
														<Label>Desconto por Unidade</Label>
														<Input
															type="text"
															inputMode="decimal"
															step="0.01"
															min="0"
															value={unitDiscountInputs[index] ?? (item.unitDiscount ? String(item.unitDiscount) : "")}
															onChange={(e) => {
																const raw = e.target.value
																setUnitDiscountInputs((prev) => {
																	const next = [...prev]
																	next[index] = raw
																	return next
																})
																const normalized = raw.replace(",", ".")
																const parsed = parseFloat(normalized)
																if (!Number.isNaN(parsed)) {
																	updateItem(index, "unitDiscount", parsed)
																} else if (raw === "") {
																	updateItem(index, "unitDiscount", 0)
																}
															}}
															placeholder="0,00"
															className="text-center"
														/>
													</div>
													<div className="space-y-2 md:block">
														<Label>Total</Label>
														<Input
															value={`R$ ${(item.quantity * item.unitPrice - item.quantity * (item.unitDiscount || 0)).toFixed(2)}`}
															disabled
															className="bg-secondary text-secondary-foreground dark:opacity-70 text-center font-semibold"
														/>
													</div>
												</div>

												{/* Alertas e insights */}
												<div className="space-y-3">
													<PriceAlert
														alertData={item.priceAlert || null}
														loading={checkingPrices[index]}
														onClose={() => updateItem(index, "priceAlert", null)}
													/>

													{item.bestPriceAlert?.isBestPrice && !item.bestPriceAlert.isFirstRecord && (
														<BestPriceAlert
															productName={selectedProduct?.name || "Produto"}
															currentPrice={item.unitPrice}
															previousBestPrice={item.bestPriceAlert.previousBestPrice || 0}
															totalRecords={item.bestPriceAlert.totalRecords || 0}
															onClose={() => updateItem(index, "bestPriceAlert", null)}
														/>
													)}

													<PriceAiInsight analysis={item.aiInsight} loading={item.isAiLoading} />
												</div>

												{/* Gestão de estoque */}
												{selectedProduct && (selectedProduct.hasStock || selectedProduct.hasExpiration) && (
													<div className="pt-4 border-t space-y-4">
														<div className="flex justify-between items-center">
															<Label className="flex items-center gap-2 font-medium">
																<Box className="size-4" />
																Gestão de Estoque
															</Label>
															{item.addToStock && (
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		setStockDialogState({
																			isOpen: true,
																			itemIndex: index,
																		})
																	}
																>
																	<Settings2 className="size-4 mr-2" />
																	<span className="hidden sm:inline">Detalhar Estoque</span>
																	<span className="sm:hidden">Detalhar</span>
																</Button>
															)}
														</div>
														<div className="flex items-center space-x-2">
															<Checkbox
																id={`addToStock-${index}`}
																checked={item.addToStock}
																onCheckedChange={(checked) => updateItem(index, "addToStock", !!checked)}
															/>
															<Label htmlFor={`addToStock-${index}`} className="cursor-pointer">
																Adicionar ao estoque
															</Label>
														</div>
													</div>
												)}

												{/* Botão de remover */}
												<div className="flex justify-end pt-2">
													{items.length > 1 && (
														<Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
															<Trash2 className="size-4 mr-1" />
															Remover
														</Button>
													)}
												</div>
											</motion.div>
										)
									})}
								</div>

								{/* Resumo da compra com descontos */}
								<div className="space-y-4 pt-4 border-t">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Desconto Total da Compra</Label>
											<Input
												type="text"
												inputMode="decimal"
												step="0.01"
												min="0"
												value={totalDiscountInput}
												onChange={(e) => {
													const raw = e.target.value
													setTotalDiscountInput(raw)
													const normalized = raw.replace(",", ".")
													const parsed = parseFloat(normalized)
													if (!Number.isNaN(parsed)) {
														setFormData((prev) => ({ ...prev, totalDiscount: parsed }))
													} else if (raw === "") {
														setFormData((prev) => ({ ...prev, totalDiscount: 0 }))
													}
												}}
												placeholder="0,00"
												className="text-center"
											/>
										</div>
										<div className="space-y-2">
											<Label>Resumo</Label>
											<div className="space-y-1 text-sm">
												<div className="flex justify-between">
													<span>Subtotal:</span>
													<span>R$ {calculateTotalWithoutDiscounts().toFixed(2)}</span>
												</div>
												<div className="flex justify-between text-red-600">
													<span>Descontos:</span>
													<span>-R$ {calculateTotalDiscounts().toFixed(2)}</span>
												</div>
												<div className="flex justify-between font-bold text-lg border-t pt-1">
													<span>Total Final:</span>
													<span>R$ {(calculateTotalWithoutDiscounts() - calculateTotalDiscounts()).toFixed(2)}</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Total e botões de ação - apenas no desktop */}
								<div className="hidden md:flex justify-between items-center pt-4 border-t">
									<div className="text-lg font-bold">
										Total da Compra ({items.length} itens): R${" "}
										{(calculateTotalWithoutDiscounts() - calculateTotalDiscounts()).toFixed(2)}
									</div>
									<div className="flex gap-3">
										<Button type="button" onClick={addItem} variant="outline">
											<Plus className="size-4 mr-2" />
											Adicionar Item
										</Button>
										<Button type="submit" disabled={loading}>
											<Save className="size-4 mr-2" />
											{loading ? "Salvando..." : "Salvar Compra"}
										</Button>
										<Link href="/compras">
											<Button type="button" variant="outline">
												Cancelar
											</Button>
										</Link>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</form>
			</div>

			{/* Barra fixa na parte inferior para mobile */}
			<div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg md:hidden">
				<div className="px-4 py-3">
					<div className="flex items-center justify-between gap-3">
						{/* Botão de adicionar item */}
						<Button type="button" onClick={addItem} className="flex-1 bg-primary hover:bg-primary/90" size="lg">
							<Plus className="size-5 mr-2" />
							Adicionar Item
						</Button>

						{/* Total da compra */}
						<div className="text-center min-w-[120px]">
							<div className="text-sm text-gray-600">Total</div>
							<div className="text-lg font-bold text-primary">
								R$ {(calculateTotalWithoutDiscounts() - calculateTotalDiscounts()).toFixed(2)}
							</div>
						</div>
					</div>

					{/* Botões de ação */}
					<div className="flex gap-2 mt-3">
						<Button type="submit" disabled={loading} onClick={handleSubmit} className="flex-1" size="lg">
							<Save className="size-4 mr-2" />
							{loading ? "Salvando..." : "Salvar Compra"}
						</Button>
						<Link href="/compras" className="flex-1">
							<Button type="button" variant="outline" className="w-full" size="lg">
								Cancelar
							</Button>
						</Link>
					</div>
				</div>
			</div>

			{stockDialogState.isOpen && stockDialogState.itemIndex !== null && (
				<StockEntryDialog
					isOpen={stockDialogState.isOpen}
					onClose={() => setStockDialogState({ isOpen: false, itemIndex: null })}
					onSave={handleSaveStockDetails}
					product={products.find((p) => p.id === items[stockDialogState.itemIndex ?? 0].productId)}
					quantity={items[stockDialogState.itemIndex ?? 0].quantity}
					initialEntries={items[stockDialogState.itemIndex ?? 0].stockEntries}
				/>
			)}
		</div>
	)
}
