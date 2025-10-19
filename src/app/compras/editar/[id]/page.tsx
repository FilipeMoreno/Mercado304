"use client"

import { ArrowLeft, Edit, Plus, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { BestPriceAlert } from "@/components/best-price-alert"
import { MarketSelect } from "@/components/selects/market-select"
import { MarketSelectDialog } from "@/components/selects/market-select-dialog"
import { PaymentMethodSelectDialog } from "@/components/selects/payment-method-select-dialog"
import { ProductSelect } from "@/components/selects/product-select"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { NovaCompraSkeleton } from "@/components/skeletons/nova-compra-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	useAllProductsQuery,
	useMarketsQuery,
	usePurchaseQuery,
	useUIPreferences,
	useUpdatePurchaseMutation,
} from "@/hooks"
import { toDateInputValue } from "@/lib/date-utils"
import { TempStorage } from "@/lib/temp-storage"
import { PaymentMethod } from "@/types"

interface PurchaseItem {
	productId: string
	quantity: number
	unitPrice: number
	unitDiscount?: number
	bestPriceAlert?: any
}

export default function EditarCompraPage() {
	const params = useParams()
	const router = useRouter()
	const searchParams = useSearchParams()
	const purchaseId = params.id as string
	const id = useId()
	const { selectStyle } = useUIPreferences()

	const [loading, setLoading] = useState(false)

	// React Query hooks
	const { data: productsData } = useAllProductsQuery()
	const { data: marketsData } = useMarketsQuery()
	const {
		data: purchaseData,
		isLoading: purchaseLoading,
		error: purchaseError,
	} = usePurchaseQuery(purchaseId, {
		enabled: !!purchaseId,
	})
	const updatePurchaseMutation = useUpdatePurchaseMutation()

	const products = productsData?.products || []

	const _markets = marketsData?.markets || []

	const [formData, setFormData] = useState({
		marketId: "",
		purchaseDate: "",
		paymentMethod: PaymentMethod.MONEY,
		totalDiscount: 0,
	})

	const [items, setItems] = useState<PurchaseItem[]>([])

	// Control separate string inputs (qty 3 decimals, price 2) and empty typing
	const [quantityInputs, setQuantityInputs] = useState<string[]>([])
	const [unitPriceInputs, setUnitPriceInputs] = useState<string[]>([])
	const [unitDiscountInputs, setUnitDiscountInputs] = useState<string[]>([])
	const [totalDiscountInput, setTotalDiscountInput] = useState<string>("0.00")

	const checkBestPrice = useCallback(async (index: number, productId: string, unitPrice: number) => {
		if (!productId || !unitPrice) return
		try {
			const response = await fetch("/api/best-price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId, currentPrice: unitPrice }),
			})
			const bestPriceData = await response.json()
			setItems((prevItems) => {
				const newItems = [...prevItems]
				newItems[index] = { ...newItems[index], bestPriceAlert: bestPriceData }
				return newItems
			})
		} catch (error) {
			console.error("Erro ao verificar melhor preço:", error)
		}
	}, [])

	const updateItem = useCallback(
		(index: number, field: keyof PurchaseItem, value: string | number) => {
			const newItems = [...items]
			newItems[index] = { ...newItems[index], [field]: value }
			setItems(newItems)

			if (field === "unitPrice" || field === "productId") {
				const item = newItems[index]
				if (item.productId && item.unitPrice > 0) {
					setTimeout(() => {
						checkBestPrice(index, item.productId, item.unitPrice)
					}, 1000)
				}
			}
		},
		[items, checkBestPrice],
	)

	// Carregar dados da compra quando os dados estiverem disponíveis
	useEffect(() => {
		if (purchaseData && !purchaseLoading) {
			setFormData({
				marketId: purchaseData.marketId,
				purchaseDate: purchaseData.purchaseDate.split("T")[0],
				paymentMethod: purchaseData.paymentMethod || PaymentMethod.MONEY,
				totalDiscount: purchaseData.totalDiscount || 0,
			})

			const mappedItems = purchaseData.items.map((item: any) => ({
				productId: item.productId || "",
				quantity: item.quantity || 1,
				unitPrice: item.unitPrice || 0,
				unitDiscount: item.unitDiscount || 0,
				bestPriceAlert: null,
			}))
			setItems(mappedItems)
			setQuantityInputs(
				mappedItems.map((it: any) => (typeof it.quantity === "number" ? it.quantity.toFixed(3) : "1.000")),
			)
			setUnitPriceInputs(
				mappedItems.map((it: any) => (typeof it.unitPrice === "number" ? it.unitPrice.toFixed(2) : "0.00")),
			)
			setUnitDiscountInputs(
				mappedItems.map((it: any) => (typeof it.unitDiscount === "number" ? it.unitDiscount.toFixed(2) : "0.00")),
			)
			setTotalDiscountInput(purchaseData.totalDiscount ? purchaseData.totalDiscount.toFixed(2) : "0.00")
		}
	}, [purchaseData, purchaseLoading])

	useEffect(() => {
		const storageKey = searchParams.get("storageKey")
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey)
			if (preservedData) {
				try {
					if (preservedData.formData) {
						setFormData((prev) => ({
							marketId: preservedData.formData.marketId || prev.marketId,
							purchaseDate: preservedData.formData.purchaseDate || prev.purchaseDate,
							paymentMethod: preservedData.formData.paymentMethod || prev.paymentMethod,
							totalDiscount: preservedData.formData.totalDiscount || prev.totalDiscount,
						}))
					}
					if (preservedData.items) setItems(preservedData.items)
					if (preservedData.newProductId && preservedData.targetItemIndex !== undefined) {
						setTimeout(() => {
							updateItem(preservedData.targetItemIndex, "productId", preservedData.newProductId)
						}, 1000)
					}
					TempStorage.remove(storageKey)
					window.history.replaceState({}, "", `/compras/editar/${params.id}`)
				} catch (error) {
					console.error("Erro ao restaurar dados:", error)
					TempStorage.remove(storageKey)
				}
			}
		}
	}, [searchParams, params.id, updateItem])

	// Verificar se há erro ao carregar a compra
	useEffect(() => {
		if (purchaseError) {
			toast.error("Compra não encontrada")
			router.push("/compras")
		}
	}, [purchaseError, router])

	const addItem = () => {
		setItems([...items, { productId: "", quantity: 1, unitPrice: 0, unitDiscount: 0, bestPriceAlert: null }])
		setQuantityInputs((prev) => [...prev, "1.000"])
		setUnitPriceInputs((prev) => [...prev, "0.00"])
		setUnitDiscountInputs((prev) => [...prev, "0.00"])
	}

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index))
			setQuantityInputs((prev) => prev.filter((_, i) => i !== index))
			setUnitPriceInputs((prev) => prev.filter((_, i) => i !== index))
			setUnitDiscountInputs((prev) => prev.filter((_, i) => i !== index))
		}
	}

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
				const product = products.find((p: any) => p.id === item.productId)
				return {
					...item,
					productName: product?.name || "Produto sem nome",
				}
			})

			await updatePurchaseMutation.mutateAsync({
				id: purchaseId,
				data: {
					marketId: formData.marketId,
					items: itemsWithNames,
					purchaseDate: formData.purchaseDate,
					paymentMethod: formData.paymentMethod,
					totalDiscount: formData.totalDiscount || 0,
				},
			})
			toast.success("Compra atualizada com sucesso!")
			// Pequeno delay para garantir que a invalidação seja processada
			setTimeout(() => {
				router.push("/compras")
			}, 100)
		} catch (error) {
			console.error("Erro ao atualizar compra:", error)
			toast.error("Erro ao atualizar compra")
		} finally {
			setLoading(false)
		}
	}

	if (purchaseLoading) {
		return <NovaCompraSkeleton />
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/compras">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Edit className="h-8 w-8" />
						Editar Compra
					</h1>
					<p className="text-gray-600 mt-2">Modifique os dados da compra</p>
				</div>
			</div>
			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Informações da Compra</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="market">Mercado *</Label>
								{selectStyle === "dialog" ? (
									<MarketSelectDialog
										value={formData.marketId}
										onValueChange={(value) => setFormData((prev) => ({ ...prev, marketId: value }))}
									/>
								) : (
									<MarketSelect
										value={formData.marketId}
										onValueChange={(value) => setFormData((prev) => ({ ...prev, marketId: value }))}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor={`purchaseDate-${id}`}>Data da Compra</Label>
								<Input
									id={`purchaseDate-${id}`}
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
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Itens da Compra</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{items.length === 0 ? (
							<div className="text-center text-gray-500 py-8">
								<p>Nenhum item encontrado nesta compra.</p>
							</div>
						) : (
							items.map((item, index) => {
								const selectedProduct = products.find((p: any) => p.id === item.productId)
								return (
									<div key={`item-${item.productId}-${index}`} className="space-y-4 p-4 border rounded-lg">
										{/* Número do item */}
										<div className="text-xs text-gray-500 font-medium">Item {index + 1}</div>
										{/* Produto full width */}
										<div className="space-y-2">
											<Label>Produto *</Label>
											{selectStyle === "dialog" ? (
												<ProductSelectDialog
													value={item.productId}
													onValueChange={(value) => updateItem(index, "productId", value)}
													preserveFormData={{
														formData,
														items,
														targetItemIndex: index,
													}}
												/>
											) : (
												<ProductSelect
													value={item.productId}
													products={products}
													onValueChange={(value) => updateItem(index, "productId", value)}
													preserveFormData={{
														formData,
														items,
														targetItemIndex: index,
													}}
												/>
											)}
										</div>
										{/* Quantidade, Preço, Total em 3 colunas */}
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
												/>
											</div>
											<div className="space-y-2">
												<Label>Preço Unitário (R$) *</Label>
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
												/>
											</div>
											<div className="space-y-2">
												<Label>Total</Label>
												<Input
													value={`R$ ${(item.quantity * item.unitPrice - item.quantity * (item.unitDiscount || 0)).toFixed(2)}`}
													disabled
													className="bg-gray-50"
												/>
											</div>
										</div>
										{item.bestPriceAlert?.isBestPrice && !item.bestPriceAlert.isFirstRecord && (
											<BestPriceAlert
												productName={products.find((p: any) => p.id === item.productId)?.name || "Produto"}
												currentPrice={item.unitPrice}
												previousBestPrice={item.bestPriceAlert.previousBestPrice}
												totalRecords={item.bestPriceAlert.totalRecords}
												onClose={() => {
													const newItems = [...items]
													newItems[index] = {
														...newItems[index],
														bestPriceAlert: null,
													}
													setItems(newItems)
												}}
											/>
										)}
										<div className="flex justify-between items-center">
											<div className="text-sm text-gray-600">
												{selectedProduct && (
													<span>
														Unidade: {selectedProduct.unit}
														{selectedProduct.category && ` • Categoria: ${selectedProduct.category.name}`}
													</span>
												)}
											</div>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => removeItem(index)}
												disabled={items.length <= 1}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								)
							})
						)}
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						{/* Resumo da compra com descontos */}
						<div className="space-y-4 mb-6">
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

						<div className="flex justify-between items-center text-xl font-bold">
							<span>Total da Compra ({items.length} itens):</span>
							<span>R$ {(calculateTotalWithoutDiscounts() - calculateTotalDiscounts()).toFixed(2)}</span>
						</div>
						<div className="flex gap-4 mt-6">
							<Button type="button" onClick={addItem} variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Adicionar Item
							</Button>
							<Button type="submit" disabled={loading} className="flex-1">
								<Save className="h-4 w-4 mr-2" />
								{loading ? "Salvando..." : "Salvar Alterações"}
							</Button>
							<Link href="/compras">
								<Button type="button" variant="outline">
									Cancelar
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</form>
		</div>
	)
}
