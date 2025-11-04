"use client"

import { Receipt, ShoppingCart, Store } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardBadge } from "../shared/card-badge"
import { CardFooter } from "../shared/card-footer"

interface PurchaseCardMemoProps {
	purchase: any
	onDelete: (purchase: any) => void
	onEdit?: (purchase: any) => void
	onView?: (purchase: any) => void
}

export const PurchaseCardMemo = ({ purchase, onDelete, onEdit, onView }: PurchaseCardMemoProps) => {
	const handleDelete = () => {
		onDelete(purchase)
	}

	const handleEdit = () => {
		onEdit?.(purchase)
	}

	const handleCardClick = () => {
		if (onView) {
			onView(purchase)
		}
	}

	const purchaseDate = new Date(purchase.purchaseDate).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	})

	const totalAmount = purchase.totalAmount?.toFixed(2) || "0.00"
	const itemCount = purchase.items?.length || purchase._count?.items || 0
	const totalItemDiscounts = purchase.items?.reduce((sum: number, item: any) => sum + (item.totalDiscount || 0), 0) || 0
	const totalGeneralDiscount = purchase.totalDiscount || 0
	const totalDiscount = totalItemDiscounts + totalGeneralDiscount
	const hasDiscount = totalDiscount > 0
	const itemsWithDiscount = (() => {
		if (!purchase.items) return 0
		return purchase.items.filter((item: { totalDiscount?: number }) => item.totalDiscount && item.totalDiscount > 0).length
	})()
	const marketName = purchase.market?.name || "Mercado"
	const paymentMethod = (() => {
		const methods: Record<string, string> = {
			MONEY: "💵 Dinheiro",
			DEBIT: "💳 Débito",
			CREDIT: "💳 Crédito",
			PIX: "📱 PIX",
			VOUCHER: "🎟️ Vale",
		}
		return methods[purchase.paymentMethod] || purchase.paymentMethod
	})()

	return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-green-500/10 via-green-500/5 to-emerald-500/10">
					<div className="absolute inset-0 flex items-center justify-center opacity-5">
						<Receipt className="h-32 w-32 text-green-600" />
					</div>

					<div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
						<div className="mb-2">
							<p className="text-xs text-muted-foreground mb-1">Total da Compra</p>
							<p className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">
								R$ {totalAmount}
							</p>
						</div>

						<div className="flex items-center gap-2 mb-1">
							<Store className="h-4 w-4 text-muted-foreground" />
							<p className="font-semibold text-sm line-clamp-1">{marketName}</p>
						</div>

						<p className="text-xs text-muted-foreground">{purchaseDate}</p>
					</div>

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Compra" />
				</div>

				<CardContent className="flex-1 flex flex-col p-4 pt-3">
					<div className="flex flex-wrap items-center gap-2 mb-2">
						{purchase.paymentMethod && (
							<CardBadge>{paymentMethod}</CardBadge>
						)}
						<CardBadge>
							<ShoppingCart className="h-3 w-3 mr-1" />
							{itemCount} {itemCount === 1 ? "item" : "itens"}
						</CardBadge>
						{hasDiscount && (
							<CardBadge className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
								💰 Desconto: R$ {totalDiscount.toFixed(2)}
							</CardBadge>
						)}
					</div>
					<CardFooter />
				</CardContent>
			</Card>
		)
}

PurchaseCardMemo.displayName = "PurchaseCardMemo"
