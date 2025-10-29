"use client"

import { DollarSign, ShoppingCart, Store } from "lucide-react"
import { memo, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardBadge } from "../shared/card-badge"
import { CardFooter } from "../shared/card-footer"

interface ShoppingListCardMemoProps {
	shoppingList: any
	onDelete: (shoppingList: any) => void
	onEdit?: (shoppingList: any) => void
}

export const ShoppingListCardMemo = memo<ShoppingListCardMemoProps>(
	({ shoppingList, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(shoppingList)
		}, [shoppingList, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(shoppingList)
		}, [shoppingList, onEdit])

		const handleCardClick = useCallback(() => {
			window.location.href = `/lista/${shoppingList.id}`
		}, [shoppingList.id])

		const listName = useMemo(() => {
			return shoppingList.name || "Lista sem nome"
		}, [shoppingList.name])

		const itemCount = useMemo(() => {
			return shoppingList.items?.length || 0
		}, [shoppingList.items?.length])

		const completedCount = useMemo(() => {
			return shoppingList.items?.filter((item: any) => item.checked)?.length || 0
		}, [shoppingList.items])

		const totalEstimated = useMemo(() => {
			const total =
				shoppingList.items?.reduce((sum: number, item: any) => {
					return sum + (item.estimatedPrice || 0) * (item.quantity || 1)
				}, 0) || 0
			return total.toFixed(2)
		}, [shoppingList.items])

		const createdAt = useMemo(() => {
			return new Date(shoppingList.createdAt).toLocaleDateString("pt-BR", {
				day: "2-digit",
				month: "short",
			})
		}, [shoppingList.createdAt])

		const progressPercent = useMemo(() => {
			if (itemCount === 0) return 0
			return Math.round((completedCount / itemCount) * 100)
		}, [completedCount, itemCount])

		return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-indigo-500/10">
					<div className="absolute inset-0 flex items-center justify-center opacity-5">
						<ShoppingCart className="h-32 w-32 text-blue-600" />
					</div>

					<div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
						<div className="relative mb-4">
							<div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center border-4 border-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
								<ShoppingCart className="h-10 w-10 text-blue-600" />
							</div>
							{itemCount > 0 && (
								<div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
									{itemCount}
								</div>
							)}
						</div>

						{itemCount > 0 && (
							<div className="w-full max-w-[160px]">
								<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
									<span>
										{completedCount}/{itemCount}
									</span>
									<span>{progressPercent}%</span>
								</div>
								<div className="h-2 bg-background/50 rounded-full overflow-hidden">
									<div
										className="h-full bg-blue-600 transition-all duration-300 rounded-full"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
							</div>
						)}
					</div>

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Lista" />

					<div className="absolute bottom-3 left-3">
						<CardBadge>📅 {createdAt}</CardBadge>
					</div>
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">
						{listName}
					</h3>

					<div className="flex items-center justify-between mb-3">
						{parseFloat(totalEstimated) > 0 && (
							<Badge variant="outline" className="text-xs">
								<DollarSign className="h-3 w-3 mr-1" />
								R$ {totalEstimated}
							</Badge>
						)}
						{shoppingList.marketId && (
							<Badge variant="secondary" className="text-xs">
								<Store className="h-3 w-3 mr-1" />
								Mercado definido
							</Badge>
						)}
					</div>

					<CardFooter text="Ver lista" />
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		// Verifica se o número de itens checados mudou
		const prevChecked = prevProps.shoppingList.items?.filter((item: any) => item.checked)?.length || 0
		const nextChecked = nextProps.shoppingList.items?.filter((item: any) => item.checked)?.length || 0

		return (
			prevProps.shoppingList.id === nextProps.shoppingList.id &&
			prevProps.shoppingList.name === nextProps.shoppingList.name &&
			prevProps.shoppingList.items?.length === nextProps.shoppingList.items?.length &&
			prevChecked === nextChecked &&
			prevProps.shoppingList.updatedAt === nextProps.shoppingList.updatedAt
		)
	},
)

ShoppingListCardMemo.displayName = "ShoppingListCardMemo"
