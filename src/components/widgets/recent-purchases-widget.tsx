"use client"

import { ptBR } from "date-fns/locale"
import { ShoppingCart, Store } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { formatLocalDate } from "@/lib/date-utils"
import type { RecentPurchase } from "@/types"

interface RecentPurchasesWidgetProps {
	recentPurchases?: RecentPurchase[]
	totalPurchases?: number
}

export function RecentPurchasesWidget({ recentPurchases, totalPurchases }: RecentPurchasesWidgetProps) {
	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle>Compras Recentes</CardTitle>
				<CardDescription>Últimas 5 compras realizadas</CardDescription>
			</CardHeader>
			<CardContent>
				{!recentPurchases || recentPurchases.length === 0 ? (
					<Empty className="border border-dashed py-8">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<ShoppingCart className="size-6" />
							</EmptyMedia>
							<EmptyTitle>Nenhuma compra registrada ainda</EmptyTitle>
							<EmptyDescription>Registre uma compra para ver aqui.</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Link href="/compras/nova" className="inline-flex">
								<span className="text-blue-600 hover:text-blue-800">Registre sua primeira compra</span>
							</Link>
						</EmptyContent>
					</Empty>
				) : (
					<div className="space-y-3">
						{recentPurchases.slice(0, 5).map((purchase: RecentPurchase) => (
							<div
								key={purchase.id}
								className="flex items-center justify-between p-3 border border-border bg-card rounded-sm hover:bg-muted/50 transition-colors shadow-xs"
							>
								<div className="flex items-center gap-3">
									<Store className="size-5 text-muted-foreground" />
									<div>
										<div className="font-medium">{purchase.market?.name || "Mercado não identificado"}</div>
										<div className="text-sm text-muted-foreground">
											{formatLocalDate(purchase.purchaseDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="font-medium">R$ {(purchase.totalAmount || 0).toFixed(2)}</div>
									<div className="text-sm text-muted-foreground">
										{purchase.items?.length || 0} {purchase.items?.length === 1 ? "item" : "itens"}
									</div>
								</div>
							</div>
						))}

						{recentPurchases.length > 5 && totalPurchases && (
							<div className="text-center pt-3 border-t border-border">
								<Link href="/compras" className="text-sm text-primary hover:text-primary/80 font-medium">
									Ver todas as compras ({totalPurchases})
								</Link>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}