"use client"

import { Receipt, ShoppingCart, Store } from "lucide-react"
import { memo, useCallback, useMemo } from "react"
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

export const PurchaseCardMemo = memo<PurchaseCardMemoProps>(
	({ purchase, onDelete, onEdit, onView }) => {
		const handleDelete = useCallback(() => {
			onDelete(purchase)
		}, [purchase, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(purchase)
		}, [purchase, onEdit])

		const handleCardClick = useCallback(() => {
			if (onView) {
				onView(purchase)
			}
		}, [purchase, onView])

		const purchaseDate = useMemo(() => {
			return new Date(purchase.purchaseDate).toLocaleDateString("pt-BR", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		}, [purchase.purchaseDate])

		const totalAmount = useMemo(() => {
			return purchase.totalAmount?.toFixed(2) || "0.00"
		}, [purchase.totalAmount])

		const totalDiscount = useMemo(() => {
			return purchase.totalDiscount?.toFixed(2) || "0.00"
		}, [purchase.totalDiscount])

		const hasDiscount = useMemo(() => {
			return purchase.totalDiscount && purchase.totalDiscount > 0
		}, [purchase.totalDiscount])

		const itemsWithDiscount = useMemo(() => {
			if (!purchase.items) return 0
			return purchase.items.filter((item: { totalDiscount?: number }) => item.totalDiscount && item.totalDiscount > 0).length
		}, [purchase.items])

		const itemCount = useMemo(() => {
			return purchase.items?.length || 0
		}, [purchase.items?.length])

		const marketName = useMemo(() => {
			return purchase.market?.name || "Mercado"
		}, [purchase.market?.name])

		const paymentMethod = useMemo(() => {
			const methods: Record<string, string> = {
				MONEY: "💵 Dinheiro",
				DEBIT: "💳 Débito",
				CREDIT: "💳 Crédito",
				PIX: "📱 PIX",
				VOUCHER: "🎟️ Vale",
			}
			return methods[purchase.paymentMethod] || purchase.paymentMethod
		}, [purchase.paymentMethod])

		return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-green-500/10 via-green-500/5 to-emerald-500/10">
					<div className="absolute inset-0 flex items-center justify-center opacity-5">
						<Receipt className="h-32 w-32 text-green-600" />
					</div>

					<div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
						<div className="mb-3">
							<p className="text-xs text-muted-foreground mb-1">Total da Compra</p>
							<p className="text-4xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">
								R$ {totalAmount}
							</p>
						</div>

						<div className="flex items-center gap-2 mb-2">
							<Store className="h-4 w-4 text-muted-foreground" />
							<p className="font-semibold text-base line-clamp-1">{marketName}</p>
						</div>

						<p className="text-sm text-muted-foreground">{purchaseDate}</p>
					</div>

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Compra" />

					<div className="absolute bottom-3 left-3 flex items-center gap-2">
						{purchase.paymentMethod && (
							<CardBadge>{paymentMethod}</CardBadge>
						)}
						<CardBadge>
							<ShoppingCart className="h-3 w-3 mr-1" />
							{itemCount} {itemCount === 1 ? "item" : "itens"}
						</CardBadge>
						{hasDiscount && itemsWithDiscount > 0 && (
							<CardBadge className="bg-orange-100 text-orange-700 border-orange-300">
								Desconto: -R$ {totalDiscount} ({itemsWithDiscount})
							</CardBadge>
						)}
					</div>
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<CardFooter />
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.purchase.id === nextProps.purchase.id &&
			prevProps.purchase.totalAmount === nextProps.purchase.totalAmount &&
			prevProps.purchase.totalDiscount === nextProps.purchase.totalDiscount &&
			prevProps.purchase.purchaseDate === nextProps.purchase.purchaseDate &&
			prevProps.purchase.items?.length === nextProps.purchase.items?.length &&
			prevProps.purchase.updatedAt === nextProps.purchase.updatedAt
		)
	},
)

PurchaseCardMemo.displayName = "PurchaseCardMemo"
