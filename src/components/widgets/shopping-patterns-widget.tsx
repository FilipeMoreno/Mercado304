"use client"

import { Calendar, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ShoppingPatternsWidgetProps {
	patterns?: {
		favoriteDay: string
		favoriteTime: string
		favoriteMarket: string
		averageItemsPerPurchase: number
		averageTimeBetweenPurchases: number
		mostBoughtCategory: string
		weekdayVsWeekend: {
			weekday: { purchases: number; amount: number }
			weekend: { purchases: number; amount: number }
		}
	}
}

export function ShoppingPatternsWidget({ patterns }: ShoppingPatternsWidgetProps) {
	if (!patterns) return null

	const weekdayPercentage = patterns.weekdayVsWeekend.weekday.purchases + patterns.weekdayVsWeekend.weekend.purchases > 0
		? (patterns.weekdayVsWeekend.weekday.purchases / (patterns.weekdayVsWeekend.weekday.purchases + patterns.weekdayVsWeekend.weekend.purchases)) * 100
		: 0

	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-4 w-4 text-purple-500" />
					Padrões de Compras
				</CardTitle>
				<CardDescription>Análise dos seus hábitos de compra</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Preferências principais */}
					<div className="grid grid-cols-1 gap-3">
						<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">Dia favorito</span>
							</div>
							<Badge variant="secondary">{patterns.favoriteDay}</Badge>
						</div>

						<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">Horário favorito</span>
							</div>
							<Badge variant="secondary">{patterns.favoriteTime}</Badge>
						</div>

						<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">Mercado favorito</span>
							</div>
							<Badge variant="secondary" className="max-w-24 truncate">
								{patterns.favoriteMarket}
							</Badge>
						</div>
					</div>

					{/* Estatísticas */}
					<div className="grid grid-cols-2 gap-4 pt-4 border-t">
						<div className="text-center">
							<p className="text-lg font-bold text-blue-600">{patterns.averageItemsPerPurchase.toFixed(1)}</p>
							<p className="text-xs text-muted-foreground">Itens por compra</p>
						</div>
						<div className="text-center">
							<p className="text-lg font-bold text-green-600">{patterns.averageTimeBetweenPurchases}</p>
							<p className="text-xs text-muted-foreground">Dias entre compras</p>
						</div>
					</div>

					{/* Weekday vs Weekend */}
					<div className="pt-4 border-t">
						<p className="text-sm font-medium mb-2">Distribuição Semanal</p>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">Dias úteis</span>
								<div className="flex items-center gap-2">
									<div className="w-20 bg-gray-200 rounded-full h-2">
										<div 
											className="bg-blue-600 h-2 rounded-full" 
											style={{ width: `${weekdayPercentage}%` }}
										/>
									</div>
									<span className="text-xs text-muted-foreground">{weekdayPercentage.toFixed(0)}%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Fins de semana</span>
								<div className="flex items-center gap-2">
									<div className="w-20 bg-gray-200 rounded-full h-2">
										<div 
											className="bg-purple-600 h-2 rounded-full" 
											style={{ width: `${100 - weekdayPercentage}%` }}
										/>
									</div>
									<span className="text-xs text-muted-foreground">{(100 - weekdayPercentage).toFixed(0)}%</span>
								</div>
							</div>
						</div>
					</div>

					{/* Categoria mais comprada */}
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground">
							Categoria mais comprada: <span className="font-medium text-foreground">{patterns.mostBoughtCategory}</span>
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}