"use client"

import { DollarSign, Package, Receipt, ShoppingCart, Store } from "lucide-react"
import { memo, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardMemoProps {
	cardId: string
	stats: any
	onClick?: () => void
}

const iconMap = {
	ShoppingCart,
	DollarSign,
	Package,
	Store,
	Receipt,
}

export const DashboardCardMemo = memo<DashboardCardMemoProps>(
	({ cardId, stats, onClick }) => {
		const cardContent = useMemo(() => {
			switch (cardId) {
				case "total-purchases":
					return {
						title: "Total de Compras",
						value: stats?.totalPurchases || 0,
						icon: "ShoppingCart",
						format: "number",
					}
				case "total-spent":
					return {
						title: "Total Gasto",
						value: stats?.totalSpent || 0,
						icon: "DollarSign",
						format: "currency",
					}
				case "total-products":
					return {
						title: "Produtos Cadastrados",
						value: stats?.totalProducts || 0,
						icon: "Package",
						format: "number",
					}
				case "total-markets":
					return {
						title: "Mercados Cadastrados",
						value: stats?.totalMarkets || 0,
						icon: "Store",
						format: "number",
					}
				case "price-records":
					return {
						title: "Preços Registrados",
						value: stats?.priceRecords?.totalRecords || 0,
						icon: "Receipt",
						format: "number",
						subtitle:
							stats?.priceRecords?.averagePrice > 0
								? `Média: R$ ${stats.priceRecords.averagePrice.toFixed(2)}`
								: undefined,
					}
				default:
					return null
			}
		}, [cardId, stats])

		if (!cardContent) return null

		const formatValue = (value: number, format: string) => {
			switch (format) {
				case "currency":
					return `R$ ${value.toFixed(2)}`
				default:
					return value.toString()
			}
		}

		const Icon = iconMap[cardContent.icon as keyof typeof iconMap]
		const CardComponent = onClick ? "button" : "div"
		const cardProps = onClick ? { onClick } : {}

		return (
			<CardComponent
				{...cardProps}
				className={`shadow-sm hover:shadow-lg transition-shadow min-w-0 ${onClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
			>
				<Card className="h-full min-w-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs md:text-sm font-medium truncate pr-2">{cardContent.title}</CardTitle>
						<Icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-xl md:text-2xl font-bold">{formatValue(cardContent.value, cardContent.format)}</div>
						{cardContent.subtitle && <div className="text-xs text-muted-foreground mt-1">{cardContent.subtitle}</div>}
					</CardContent>
				</Card>
			</CardComponent>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.cardId === nextProps.cardId &&
			prevProps.stats?.totalPurchases === nextProps.stats?.totalPurchases &&
			prevProps.stats?.totalSpent === nextProps.stats?.totalSpent &&
			prevProps.stats?.totalProducts === nextProps.stats?.totalProducts &&
			prevProps.stats?.totalMarkets === nextProps.stats?.totalMarkets &&
			prevProps.stats?.priceRecords?.totalRecords === nextProps.stats?.priceRecords?.totalRecords &&
			prevProps.stats?.priceRecords?.averagePrice === nextProps.stats?.priceRecords?.averagePrice
		)
	},
)

DashboardCardMemo.displayName = "DashboardCardMemo"
