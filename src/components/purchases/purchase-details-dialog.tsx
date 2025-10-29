"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	Calendar,
	Check,
	ChevronRight,
	Copy,
	CreditCard,
	DollarSign,
	Download,
	Edit,
	MapPin,
	Package,
	Receipt,
	Share2,
	ShoppingCart,
	Store,
	Tag,
	TrendingDown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Separator } from "@/components/ui/separator"
import { useAddToShoppingListMutation, useShoppingListsQuery } from "@/hooks"
import { formatLocalDate } from "@/lib/date-utils"
import { AppToasts } from "@/lib/toasts"
import type { Purchase } from "@/types"

interface PurchaseDetailsDialogProps {
	purchase: Purchase | null
	isOpen: boolean
	onClose: () => void
	isLoading?: boolean
}

export function PurchaseDetailsDialog({ purchase, isOpen, onClose, isLoading }: PurchaseDetailsDialogProps) {
	const router = useRouter()
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
	const { data: shoppingListsData } = useShoppingListsQuery()
	const addToListMutation = useAddToShoppingListMutation()

	const shoppingLists = shoppingListsData?.lists || []

	const handleSelectItem = (itemId: string) => {
		const newSelected = new Set(selectedItems)
		if (newSelected.has(itemId)) {
			newSelected.delete(itemId)
		} else {
			newSelected.add(itemId)
		}
		setSelectedItems(newSelected)
	}

	const handleSelectAll = () => {
		if (selectedItems.size === purchase?.items?.length) {
			setSelectedItems(new Set())
		} else {
			setSelectedItems(new Set(purchase?.items?.map((item: any) => item.id) || []))
		}
	}

	const handleAddToShoppingList = async (listId: string) => {
		if (!purchase || selectedItems.size === 0) return

		try {
			const itemsToAdd = purchase.items?.filter((item: any) => selectedItems.has(item.id)) || []

			for (const item of itemsToAdd) {
				await addToListMutation.mutateAsync({
					listId,
					item: {
						productId: item.productId,
						productName: item.product?.name || item.productName,
						quantity: item.quantity,
						estimatedPrice: item.unitPrice,
						priority: "medium",
					},
				})
			}

			AppToasts.success(`${selectedItems.size} ${selectedItems.size === 1 ? "item adicionado" : "itens adicionados"} à lista de compras.`)

			setSelectedItems(new Set())
		} catch (error) {
			AppToasts.error(error, "Não foi possível adicionar os itens à lista.")
		}
	}

	const handleCopyItems = () => {
		if (!purchase) return

		const selectedItemsList = purchase.items?.filter((item: any) => selectedItems.has(item.id)) || []
		const text = selectedItemsList
			.map((item: any) => `${item.product?.name || item.productName} - ${item.quantity} ${item.product?.unit || item.productUnit}`)
			.join("\n")

		navigator.clipboard.writeText(text)
		AppToasts.success("Itens copiados para a área de transferência.")
	}

	const handleSharePurchase = async () => {
		if (!purchase) return

		const text = `Compra em ${purchase.market?.name}\nData: ${formatLocalDate(purchase.purchaseDate, "dd/MM/yyyy", { locale: ptBR })}\nTotal: R$ ${purchase.totalAmount.toFixed(2)}\n\nItens:\n${purchase.items?.map((item: any) => `- ${item.product?.name || item.productName} (${item.quantity} ${item.product?.unit || item.productUnit})`).join("\n")}`

		if (navigator.share) {
			try {
				await navigator.share({ text })
			} catch (error) {
				console.error("Error sharing:", error)
			}
		} else {
			navigator.clipboard.writeText(text)
			AppToasts.success("Detalhes da compra copiados para a área de transferência.")
		}
	}

	const handleExportPurchase = () => {
		if (!purchase) return

		const data = {
			market: purchase.market?.name,
			date: formatLocalDate(purchase.purchaseDate, "dd/MM/yyyy", { locale: ptBR }),
			paymentMethod: purchase.paymentMethod,
			items: purchase.items?.map((item: any) => ({
				product: item.product?.name || item.productName,
				quantity: item.quantity,
				unit: item.product?.unit || item.productUnit,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
				discount: item.totalDiscount || 0,
				finalPrice: item.finalPrice,
			})),
			totalAmount: purchase.totalAmount,
			totalDiscount: purchase.totalDiscount || 0,
			finalAmount: purchase.finalAmount || purchase.totalAmount,
		}

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `compra-${purchase.market?.name}-${format(new Date(purchase.purchaseDate), "yyyy-MM-dd")}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)

		AppToasts.success("Compra exportada com sucesso.")
	}

	const paymentMethodLabels: Record<string, string> = {
		MONEY: "💵 Dinheiro",
		DEBIT: "💳 Débito",
		CREDIT: "💳 Crédito",
		PIX: "📱 PIX",
		VOUCHER: "🎟️ Vale",
	}

	if (!purchase) return null

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title="Detalhes da Compra" maxWidth="5xl">
			{isLoading ? (
				<div className="space-y-4">
					<div className="animate-pulse space-y-2">
						<div className="h-4 bg-gray-200 rounded w-3/4" />
						<div className="h-4 bg-gray-200 rounded w-1/2" />
					</div>
				</div>
			) : (
				<div className="space-y-6">
					{/* Header com informações principais */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card className="border-l-4 border-l-green-500">
							<CardContent className="pt-6">
								<div className="flex items-center gap-2 text-muted-foreground mb-1">
									<Store className="h-4 w-4" />
									<span className="text-sm">Mercado</span>
								</div>
								<p className="font-semibold text-lg">{purchase.market?.name}</p>
								{purchase.market?.location && (
									<p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
										<MapPin className="h-3 w-3" />
										{purchase.market.location}
									</p>
								)}
							</CardContent>
						</Card>

						<Card className="border-l-4 border-l-blue-500">
							<CardContent className="pt-6">
								<div className="flex items-center gap-2 text-muted-foreground mb-1">
									<Calendar className="h-4 w-4" />
									<span className="text-sm">Data</span>
								</div>
								<p className="font-semibold text-lg">
									{formatLocalDate(purchase.purchaseDate, "dd/MM/yyyy", { locale: ptBR })}
								</p>
								<p className="text-sm text-muted-foreground">
									{formatLocalDate(purchase.purchaseDate, "EEEE", { locale: ptBR })}
								</p>
							</CardContent>
						</Card>

						<Card className="border-l-4 border-l-purple-500">
							<CardContent className="pt-6">
								<div className="flex items-center gap-2 text-muted-foreground mb-1">
									<CreditCard className="h-4 w-4" />
									<span className="text-sm">Pagamento</span>
								</div>
								<p className="font-semibold text-lg">{paymentMethodLabels[purchase.paymentMethod] || purchase.paymentMethod}</p>
							</CardContent>
						</Card>
					</div>

					{/* Ações rápidas */}
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" size="sm" onClick={() => router.push(`/compras/editar/${purchase.id}`)}>
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
						<Button variant="outline" size="sm" onClick={handleSharePurchase}>
							<Share2 className="h-4 w-4 mr-2" />
							Compartilhar
						</Button>
						<Button variant="outline" size="sm" onClick={handleExportPurchase}>
							<Download className="h-4 w-4 mr-2" />
							Exportar JSON
						</Button>
						{selectedItems.size > 0 && (
							<Button variant="outline" size="sm" onClick={handleCopyItems}>
								<Copy className="h-4 w-4 mr-2" />
								Copiar Selecionados ({selectedItems.size})
							</Button>
						)}
					</div>

					<Separator />

					{/* Lista de itens */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<Package className="h-5 w-5 text-muted-foreground" />
								<h4 className="font-semibold text-lg">Itens da Compra</h4>
								<Badge variant="secondary">
									{purchase.items?.length || 0} {purchase.items?.length === 1 ? "item" : "itens"}
								</Badge>
							</div>
							<Button variant="ghost" size="sm" onClick={handleSelectAll}>
								{selectedItems.size === purchase.items?.length ? "Desmarcar Todos" : "Selecionar Todos"}
							</Button>
						</div>

						<div className="space-y-2 max-h-96 overflow-y-auto pr-2">
							{purchase.items?.map((item: any) => {
								const isSelected = selectedItems.has(item.id)
								return (
									<Card
										key={item.id}
										className={`cursor-pointer transition-all hover:shadow-md ${
											isSelected ? "ring-2 ring-green-500 bg-green-50" : ""
										}`}
										onClick={() => handleSelectItem(item.id)}
									>
										<CardContent className="p-4">
											<div className="flex items-start justify-between gap-4">
												<div className="flex items-start gap-3 flex-1">
													<div
														className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
															isSelected ? "bg-green-500 border-green-500" : "border-gray-300"
														}`}
													>
														{isSelected && <Check className="h-3 w-3 text-white" />}
													</div>

													<div className="flex-1">
														<div className="flex items-start justify-between">
															<div>
																<p className="font-medium">
																	{item.product?.name || item.productName}
																	{!item.product && <span className="text-red-500 text-xs ml-1">(removido)</span>}
																</p>
																{item.product?.brand?.name && (
																	<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
																		<Tag className="h-3 w-3" />
																		{item.product.brand.name}
																	</p>
																)}
																{item.product?.category?.name && (
																	<Badge variant="outline" className="mt-1 text-xs">
																		{item.product.category.name}
																	</Badge>
																)}
															</div>
														</div>

														<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
															<span>
																{item.quantity} {item.product?.unit || item.productUnit}
															</span>
															<span>×</span>
															<span>R$ {item.unitPrice.toFixed(2)}</span>
															{item.unitDiscount > 0 && (
																<span className="text-red-600 font-medium">-R$ {item.unitDiscount.toFixed(2)}</span>
															)}
														</div>
													</div>
												</div>

												<div className="text-right">
													<p className="font-semibold text-lg">R$ {(item.finalPrice || item.totalPrice).toFixed(2)}</p>
													{item.totalDiscount > 0 && (
														<p className="text-xs text-red-600 flex items-center gap-1 justify-end">
															<TrendingDown className="h-3 w-3" />
															-R$ {item.totalDiscount.toFixed(2)}
														</p>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})}
						</div>

						{/* Adicionar à lista */}
						{selectedItems.size > 0 && shoppingLists.length > 0 && (
							<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
								<p className="text-sm font-medium mb-2 flex items-center gap-2">
									<ShoppingCart className="h-4 w-4" />
									Adicionar {selectedItems.size} {selectedItems.size === 1 ? "item" : "itens"} à lista:
								</p>
								<div className="flex flex-wrap gap-2">
									{shoppingLists.map((list: any) => (
										<Button
											key={list.id}
											size="sm"
											variant="outline"
											onClick={() => handleAddToShoppingList(list.id)}
											disabled={addToListMutation.isPending}
											className="bg-white hover:bg-green-100"
										>
											{list.name}
											<ChevronRight className="h-3 w-3 ml-1" />
										</Button>
									))}
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Resumo financeiro */}
					<div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
						<div className="flex items-center gap-2 mb-4">
							<Receipt className="h-5 w-5 text-green-600" />
							<h4 className="font-semibold text-lg">Resumo Financeiro</h4>
						</div>

						<div className="space-y-3">
							{purchase.totalDiscount > 0 && (
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Subtotal:</span>
									<span className="font-medium">R$ {purchase.totalAmount.toFixed(2)}</span>
								</div>
							)}

							{purchase.totalDiscount > 0 && (
								<div className="flex justify-between items-center text-red-600">
									<span className="flex items-center gap-2">
										<TrendingDown className="h-4 w-4" />
										Desconto Total:
									</span>
									<span className="font-semibold">-R$ {purchase.totalDiscount.toFixed(2)}</span>
								</div>
							)}

							<Separator />

							<div className="flex justify-between items-center text-xl font-bold text-green-700">
								<span className="flex items-center gap-2">
									<DollarSign className="h-6 w-6" />
									Total Pago:
								</span>
								<span>R$ {(purchase.finalAmount || purchase.totalAmount).toFixed(2)}</span>
							</div>

							{purchase.totalDiscount > 0 && (
								<p className="text-sm text-green-600 text-center mt-2">
									Você economizou R$ {purchase.totalDiscount.toFixed(2)} nesta compra! 🎉
								</p>
							)}
						</div>
					</div>

					{/* Notas */}
					{purchase.notes && (
						<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm font-medium text-yellow-800 mb-1">Observações:</p>
							<p className="text-sm text-yellow-700">{purchase.notes}</p>
						</div>
					)}
				</div>
			)}
		</ResponsiveDialog>
	)
}
