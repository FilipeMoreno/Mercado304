"use client"

import { FileText, ShoppingCart, Store, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuoteStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	DRAFT: { label: "Rascunho", variant: "secondary" },
	FINALIZED: { label: "Finalizado", variant: "default" },
	APPROVED: { label: "Aprovado", variant: "default" },
	CONVERTED: { label: "Convertido", variant: "outline" },
	EXPIRED: { label: "Expirado", variant: "destructive" },
	CANCELLED: { label: "Cancelado", variant: "destructive" },
}

export function QuoteTopQuotesWidget() {
	const router = useRouter()
	const { data, isLoading, error } = useQuoteStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error || !data || !data.topBudgets || data.topBudgets.length === 0) return null

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="h-5 w-5" />
					Maiores Cotações
				</CardTitle>
				<CardDescription>Top 5 cotações por valor total</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{data.topBudgets.map((budget, index) => {
						const statusInfo = statusConfig[budget.status] || statusConfig.DRAFT

						return (
							<div
								key={budget.id}
								className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
								onClick={() => router.push(`/orcamentos/${budget.id}`)}
							>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
										{index + 1}
									</div>
									<div>
										<div className="font-medium">{budget.name}</div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											{budget.marketName && (
												<span className="flex items-center gap-1">
													<Store className="h-3 w-3" />
													{budget.marketName}
												</span>
											)}
											<span className="flex items-center gap-1">
												<ShoppingCart className="h-3 w-3" />
												{budget.itemCount} itens
											</span>
										</div>
									</div>
								</div>
								<div className="text-right space-y-1">
									<div className="text-lg font-bold">{formatCurrency(budget.value)}</div>
									<Badge variant={statusInfo.variant} className="text-xs">
										{statusInfo.label}
									</Badge>
								</div>
							</div>
						)
					})}
				</div>

				<Button variant="outline" className="w-full mt-4" onClick={() => router.push("/orcamentos")}>
					<FileText className="mr-2 h-4 w-4" />
					Ver Todos os Orçamentos
				</Button>
			</CardContent>
		</Card>
	)
}
