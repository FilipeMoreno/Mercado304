"use client"

import { Store } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { MarketComparison } from "@/types"

interface MarketComparisonWidgetProps {
	marketComparison?: MarketComparison[]
}

export function MarketComparisonWidget({ marketComparison }: MarketComparisonWidgetProps) {
	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle>Estatísticas por Mercado</CardTitle>
				<CardDescription>Seus mercados mais frequentados</CardDescription>
			</CardHeader>
			<CardContent>
				{!marketComparison || marketComparison.length === 0 ? (
					<Empty className="border border-dashed py-8">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Store className="size-6" />
							</EmptyMedia>
							<EmptyTitle>Nenhuma compra registrada ainda</EmptyTitle>
							<EmptyDescription>
								Cadastre um mercado e registre suas compras para ver estatísticas.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Link href="/mercados/novo" className="inline-flex">
								<span className="text-blue-600 hover:text-blue-800">Cadastre seu primeiro mercado</span>
							</Link>
						</EmptyContent>
					</Empty>
				) : (
					<div className="space-y-3">
						{marketComparison
							.sort((a: MarketComparison, b: MarketComparison) => b.totalPurchases - a.totalPurchases)
							.map((market: MarketComparison, index: number) => {
								const totalSpent = market.averagePrice * market.totalPurchases

								return (
									<div
										key={market.marketId}
										className="border border-border bg-card rounded-sm p-3 hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors shadow-xs"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-start gap-3 flex-1 min-w-0">
												<div className="size-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold shrink-0">
													{index + 1}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">{market.marketName}</div>
													<div className="text-sm text-muted-foreground mt-1 space-y-1">
														<div className="flex items-center gap-4">
															<span>
																🛒 {market.totalPurchases} {market.totalPurchases === 1 ? "compra" : "compras"}
															</span>
															<span>💰 R$ {totalSpent.toFixed(2)} total</span>
														</div>
														<div className="text-xs text-muted-foreground/75">
															Ticket médio: R$ {market.averagePrice.toFixed(2)}
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								)
							})}
					</div>
				)}
			</CardContent>
		</Card>
	)
}