"use client"

import { ArrowLeft, Edit, Plus, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { BestPriceAlert } from "@/components/best-price-alert"
import { MarketSelect } from "@/components/selects/market-select"
import { ProductSelect } from "@/components/selects/product-select"
import { NovaCompraSkeleton } from "@/components/skeletons/nova-compra-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAllProductsQuery, useMarketsQuery, usePurchaseQuery, useUpdatePurchaseMutation } from "@/hooks"
import { toDateInputValue } from "@/lib/date-utils"
import { TempStorage } from "@/lib/temp-storage"
import { PaymentMethod } from "@/types"

interface PurchaseItem {
	productId: string
	quantity: number
	unitPrice: number
	bestPriceAlert?: any
}

export default function EditarCompraPage() {
	const params = useParams()
	const router = useRouter()
	const searchParams = useSearchParams()
	const purchaseId = params.id as string

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
	})

	const [items, setItems] = useState<PurchaseItem[]>([])

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
			})

			setItems(
				purchaseData.items.map((item: any) => ({
					productId: item.productId || "",
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					bestPriceAlert: null,
				})),
			)
		}
	}, [purchaseData, purchaseLoading])

	useEffect(() => {
		const storageKey = searchParams.get("storageKey")
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey)
			if (preservedData) {
				try {
					if (preservedData.formData) setFormData(preservedData.formData)
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
		setItems([...items, { productId: "", quantity: 1, unitPrice: 0, bestPriceAlert: null }])
	}

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index))
		}
	}

	const calculateTotal = () => {
		return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
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
			await updatePurchaseMutation.mutateAsync({
				id: purchaseId,
				data: {
					marketId: formData.marketId,
					items: validItems,
					purchaseDate: formData.purchaseDate,
					paymentMethod: formData.paymentMethod,
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
								<MarketSelect
									value={formData.marketId}
									onValueChange={(value) => setFormData((prev) => ({ ...prev, marketId: value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="date">Data da Compra</Label>
								<Input
									id="date"
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
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Itens da Compra</CardTitle>
						<Button type="button" onClick={addItem} variant="outline">
							<Plus className="h-4 w-4 mr-2" />
							Adicionar Item
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						{items.map((item, index) => {
							const selectedProduct = products.find((p: any) => p.id === item.productId)
							return (
								<div key={index} className="space-y-4 p-4 border rounded-lg">
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
										<div className="space-y-2">
											<Label>Produto *</Label>
											<ProductSelect
												value={item.productId}
												onValueChange={(value) => updateItem(index, "productId", value)}
												preserveFormData={{
													formData,
													items,
													targetItemIndex: index,
												}}
											/>
										</div>
										<div className="space-y-2">
											<Label>Quantidade *</Label>
											<Input
												type="number"
												step="0.01"
												min="0"
												value={item.quantity}
												onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
												placeholder="0.00"
											/>
										</div>
										<div className="space-y-2">
											<Label>Preço Unitário (R$) *</Label>
											<Input
												type="number"
												step="0.01"
												min="0"
												value={item.unitPrice}
												onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
												placeholder="0.00"
											/>
										</div>
										<div className="space-y-2">
											<Label>Total</Label>
											<Input
												value={`R$ ${(item.quantity * item.unitPrice).toFixed(2)}`}
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
						})}
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex justify-between items-center text-xl font-bold">
							<span>Total da Compra:</span>
							<span>R$ {calculateTotal().toFixed(2)}</span>
						</div>
						<div className="flex gap-4 mt-6">
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
