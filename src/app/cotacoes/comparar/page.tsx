"use client"

import { AlertCircle, ArrowLeft, TrendingDown, TrendingUp } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { QuotesSkeleton } from "@/components/skeletons/quotes-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useBudgetComparisonQuery, useBudgetsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

export default function CompareBudgetsPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const initialIds = searchParams.get("ids")?.split(",") || []
	const [selectedBudgets, setSelectedBudgets] = useState<string[]>(initialIds)

	const { data: budgetsData, isLoading: budgetsLoading } = useBudgetsQuery(
		new URLSearchParams({ status: "FINALIZED", limit: "50" }),
	)
	const { data: comparison, isLoading: comparisonLoading } = useBudgetComparisonQuery(selectedBudgets)

	const budgets = budgetsData?.budgets || []
	const canCompare = selectedBudgets.length >= 2

	const toggleBudget = (id: string) => {
		setSelectedBudgets((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))
	}

	if (budgetsLoading) return <QuotesSkeleton />

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<h1 className="text-3xl font-bold">Comparar Orçamentos</h1>
					<p className="text-muted-foreground">Selecione 2 ou mais orçamentos finalizados para comparar preços</p>
				</div>
			</div>

			{/* Budget Selection */}
			<Card>
				<CardHeader>
					<CardTitle>Selecione os Orçamentos</CardTitle>
					<CardDescription>
						{selectedBudgets.length} orçamento(s) selecionado(s)
						{canCompare && " - Pronto para comparar"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{budgets.length === 0 ? (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								Nenhum orçamento finalizado disponível para comparação. Finalize ao menos 2 orçamentos para poder
								compará-los.
							</AlertDescription>
						</Alert>
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{budgets.map((budget: any) => (
								<Card
									key={budget.id}
									className={`cursor-pointer transition-colors ${
										selectedBudgets.includes(budget.id) ? "border-primary" : ""
									}`}
									onClick={() => toggleBudget(budget.id)}
								>
									<CardHeader>
										<div className="flex items-start gap-3">
											<Checkbox
												checked={selectedBudgets.includes(budget.id)}
												onCheckedChange={() => toggleBudget(budget.id)}
											/>
											<div className="flex-1">
												<CardTitle className="text-base">{budget.name}</CardTitle>
												{budget.market && <CardDescription>{budget.market.name}</CardDescription>}
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-1 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Total:</span>
												<span className="font-medium">{formatCurrency(budget.finalEstimated)}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Itens:</span>
												<span className="font-medium">{budget._count?.items || 0}</span>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Comparison Results */}
			{canCompare && comparison && !comparisonLoading && (
				<>
					{/* Summary */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium text-muted-foreground">Orçamento Mais Barato</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="text-lg font-bold">{comparison.comparison.cheapest.name}</div>
									<div className="text-2xl font-bold text-green-600">
										{formatCurrency(comparison.comparison.cheapest.finalEstimated)}
									</div>
									{comparison.comparison.cheapest.market && (
										<div className="text-sm text-muted-foreground">{comparison.comparison.cheapest.market.name}</div>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium text-muted-foreground">Economia Potencial</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<TrendingDown className="h-6 w-6 text-green-600" />
										<div className="text-2xl font-bold text-green-600">
											{formatCurrency(comparison.comparison.savings)}
										</div>
									</div>
									<div className="text-sm text-muted-foreground">
										{comparison.comparison.savingsPercentage.toFixed(1)}% de economia
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium text-muted-foreground">Orçamento Mais Caro</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="text-lg font-bold">{comparison.comparison.mostExpensive.name}</div>
									<div className="text-2xl font-bold text-red-600">
										{formatCurrency(comparison.comparison.mostExpensive.finalEstimated)}
									</div>
									{comparison.comparison.mostExpensive.market && (
										<div className="text-sm text-muted-foreground">
											{comparison.comparison.mostExpensive.market.name}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Item by Item Comparison */}
					<Card>
						<CardHeader>
							<CardTitle>Comparação Item por Item</CardTitle>
							<CardDescription>Veja onde você pode economizar mais em cada produto</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Produto</TableHead>
										{comparison.budgets.map((budget: any) => (
											<TableHead key={budget.id} className="text-right">
												{budget.name}
											</TableHead>
										))}
										<TableHead className="text-right">Diferença</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{comparison.comparison.itemComparison.map((item: any, index: number) => {
										const priceDiff = item.mostExpensive.price - item.cheapest.price
										const hasPriceDiff = priceDiff > 0

										return (
											<TableRow key={index}>
												<TableCell className="font-medium">{item.productName}</TableCell>
												{comparison.budgets.map((budget: any) => {
													const price = item.prices.find((p: any) => p.budgetId === budget.id)
													const isCheapest = price && price.budgetId === item.cheapest.budgetId
													const isMostExpensive = price && price.budgetId === item.mostExpensive.budgetId

													return (
														<TableCell
															key={budget.id}
															className={`text-right ${
																isCheapest ? "text-green-600 font-bold" : isMostExpensive ? "text-red-600" : ""
															}`}
														>
															{price ? (
																<div className="flex items-center justify-end gap-1">
																	{formatCurrency(price.price)}
																	{isCheapest && hasPriceDiff && <TrendingDown className="h-3 w-3" />}
																	{isMostExpensive && hasPriceDiff && <TrendingUp className="h-3 w-3" />}
																</div>
															) : (
																<span className="text-muted-foreground">-</span>
															)}
														</TableCell>
													)
												})}
												<TableCell className="text-right">
													{hasPriceDiff ? (
														<Badge variant="outline" className="text-orange-600">
															{formatCurrency(priceDiff)}
														</Badge>
													) : (
														<span className="text-muted-foreground text-sm">Igual</span>
													)}
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</>
			)}

			{canCompare && comparisonLoading && (
				<Card>
					<CardContent className="py-12 text-center">
						<div className="text-muted-foreground">Comparando orçamentos...</div>
					</CardContent>
				</Card>
			)}

			{!canCompare && budgets.length > 0 && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>Selecione ao menos 2 orçamentos para visualizar a comparação.</AlertDescription>
				</Alert>
			)}
		</div>
	)
}
