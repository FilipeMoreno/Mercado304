"use client"

import { MapPin, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SavingsOpportunity {
	product: {
		name: string
		brand?: { name: string }
		category?: { name: string }
	}
	purchaseFrequency: number
	avgPrice: number
	cheapestMarket: {
		market: { name: string }
		avgPrice: number
	}
	mostExpensiveMarket: {
		market: { name: string }
		avgPrice: number
	}
	potentialSaving: number
	potentialSavingPercent: number
}

interface SavingsData {
	topSavingsOpportunities: SavingsOpportunity[]
	totalMonthlySavings: number
	analyzedProducts: number
}

interface SavingsCardProps {
	savingsData: SavingsData | null
	loading: boolean
}

export function SavingsCard({ savingsData, loading }: SavingsCardProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingDown className="size-5" />
						Oportunidades de Economia
					</CardTitle>
					<CardDescription>Comparação de preços entre mercados</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3 animate-pulse">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-16 bg-gray-200 rounded-sm"></div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!savingsData || !savingsData.topSavingsOpportunities || savingsData.topSavingsOpportunities.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingDown className="size-5" />
						Oportunidades de Economia
					</CardTitle>
					<CardDescription>Comparação de preços entre mercados</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-gray-500 py-4">Não há dados suficientes para análise de economia</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingDown className="size-5" />
					Oportunidades de Economia
				</CardTitle>
				<CardDescription>
					Economia mensal estimada: R$ {(savingsData.totalMonthlySavings || 0).toFixed(2)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{(savingsData.topSavingsOpportunities || []).slice(0, 3).map((opportunity, index) => (
						<div key={index} className="border rounded-lg p-4 space-y-3">
							<div className="flex items-start justify-between">
								<div>
									<h4 className="font-medium">{opportunity.product.name}</h4>
									{opportunity.product.brand && (
										<p className="text-sm text-gray-500">{opportunity.product.brand.name}</p>
									)}
								</div>
								<Badge variant="destructive" className="ml-2">
									-{opportunity.potentialSavingPercent.toFixed(1)}%
								</Badge>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
								<div className="space-y-1">
									<div className="flex items-center gap-1 text-green-600">
										<MapPin className="h-3 w-3" />
										<span className="font-medium">{opportunity.cheapestMarket.market.name}</span>
									</div>
									<p className="text-green-600 font-bold">R$ {opportunity.cheapestMarket.avgPrice.toFixed(2)}</p>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-1 text-red-600">
										<MapPin className="h-3 w-3" />
										<span className="font-medium">{opportunity.mostExpensiveMarket.market.name}</span>
									</div>
									<p className="text-red-600 font-bold">R$ {opportunity.mostExpensiveMarket.avgPrice.toFixed(2)}</p>
								</div>
							</div>

						<div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-sm">
							<p className="text-sm text-green-700 dark:text-green-300">
								Economia de <span className="font-bold">R$ {opportunity.potentialSaving.toFixed(2)}</span> por unidade
							</p>
						</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
