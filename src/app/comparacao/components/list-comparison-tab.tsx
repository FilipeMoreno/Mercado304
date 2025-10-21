"use client"

import { ChevronDown, ChevronUp, Loader2, MapPin, ShoppingCart, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ShoppingListSelect } from "@/components/selects/shopping-list-select"
import { ShoppingListSelectDialog } from "@/components/selects/shopping-list-select-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useUIPreferences } from "@/hooks"
import { cn } from "@/lib/utils"

interface ListComparison {
	listId: string
	listName: string
	markets: {
		marketId: string
		marketName: string
		location?: string
		totalPrice: number
		availableItems: number
		missingItems: number
		savings: number
		items: {
			listItemId: string
			productId: string
			productName: string
			quantity: number
			unitPrice: number | null
			totalPrice: number
			available: boolean
		}[]
	}[]
	analysis: {
		bestMarket: {
			marketId: string
		} | null
	}
}

interface ListComparisonTabProps {
	selectedListId: string
	onListChange: (listId: string) => void
}

export function ListComparisonTab({ selectedListId, onListChange }: ListComparisonTabProps) {
	const { selectStyle } = useUIPreferences()
	const [listComparison, setListComparison] = useState<ListComparison | null>(null)
	const [loadingList, setLoadingList] = useState(false)
	const [expandedMarket, setExpandedMarket] = useState<string | null>(null)

	const compareList = async () => {
		if (!selectedListId) {
			toast.error("Selecione uma lista para comparar")
			return
		}
		setLoadingList(true)
		try {
			const response = await fetch("/api/price-comparison/list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ listId: selectedListId }),
			})
			if (response.ok) {
				const data = await response.json()
				setListComparison(data)
			} else {
				toast.error("Erro ao buscar comparação de lista")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao comparar lista")
		} finally {
			setLoadingList(false)
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShoppingCart className="size-5" />
						Comparar Lista de Compras
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<Label>Selecione uma Lista</Label>
							{selectStyle === "dialog" ? (
								<ShoppingListSelectDialog
									value={selectedListId}
									onValueChange={onListChange}
									placeholder="Selecionar lista..."
								/>
							) : (
								<ShoppingListSelect
									value={selectedListId}
									onValueChange={onListChange}
									placeholder="Selecionar lista..."
								/>
							)}
						</div>
						<div className="flex items-end">
							<Button onClick={compareList} disabled={loadingList} className="w-full sm:w-auto">
								{loadingList ? <Loader2 className="size-4 animate-spin" /> : "Comparar"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{listComparison && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingCart className="size-5" />
								{listComparison.listName}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{(() => {
									const cheapestTotal = listComparison.markets
										.filter((m) => m.availableItems > 0)
										.reduce(
											(min, curr) => (curr.totalPrice < min.totalPrice ? curr : min),
											listComparison.markets.find((m) => m.availableItems > 0) || {
												totalPrice: Infinity,
												marketId: "",
												marketName: "",
												availableItems: 0,
												missingItems: 0,
												savings: 0,
												items: [],
											},
										)

									return listComparison.markets
										.sort((a, b) => {
											if (a.availableItems === 0 && b.availableItems > 0) return 1
											if (a.availableItems > 0 && b.availableItems === 0) return -1
											return a.totalPrice - b.totalPrice
										})
										.map((market) => {
											const isExpanded = expandedMarket === market.marketId
											const isCheapest = market.marketId === cheapestTotal.marketId && market.availableItems > 0
											return (
												<div
													key={market.marketId}
													className={cn(
														"p-4 rounded-lg border transition-colors cursor-pointer",
														isCheapest ? "bg-green-50 border-green-200" : "bg-gray-50",
													)}
													onClick={() => setExpandedMarket(isExpanded ? null : market.marketId)}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault()
															setExpandedMarket(isExpanded ? null : market.marketId)
														}
													}}
													role="button"
													tabIndex={0}
													aria-expanded={isExpanded}
													aria-label={`Expandir detalhes do mercado ${market.marketName}`}
												>
													<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 flex-wrap">
																<h4 className="font-medium truncate">{market.marketName}</h4>
																{isCheapest && <Badge className="bg-green-500 text-xs">Mais Barato</Badge>}
															</div>
															<div className="text-sm text-gray-600 mt-1 space-y-1">
																{market.location && (
																	<div className="flex items-center gap-1">
																		<MapPin className="h-3 w-3 shrink-0" />
																		<span className="truncate">{market.location}</span>
																	</div>
																)}
																<div className="text-xs sm:text-sm">
																	{market.availableItems} itens disponíveis • {market.missingItems} não encontrados
																</div>
															</div>
														</div>
														<div className="text-right shrink-0">
															<div className="text-lg sm:text-xl font-bold">R$ {market.totalPrice.toFixed(2)}</div>
															{market.savings > 0 && (
																<div className="text-sm text-green-600">Economiza R$ {market.savings.toFixed(2)}</div>
															)}
															<Button variant="ghost" size="icon" className="h-auto w-auto mt-2">
																{isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
															</Button>
														</div>
													</div>

													{isExpanded && (
														<div className="mt-4 pt-4 border-t">
															<h5 className="text-sm font-medium mb-2">Produtos da Lista</h5>
															<div className="space-y-2">
																{market.items.map((item) => (
																	<div
																		key={item.listItemId}
																		className={cn(
																			"flex flex-col sm:flex-row sm:justify-between p-2 rounded-lg text-sm gap-2",
																			item.available ? "bg-white border" : "bg-gray-200 text-gray-600",
																		)}
																	>
																		<div className="flex items-center gap-2 flex-1 min-w-0">
																			{item.available ? (
																				<ShoppingCart className="size-4 text-green-500 shrink-0" />
																			) : (
																				<X className="size-4 text-red-500 shrink-0" />
																			)}
																			<div className="min-w-0 flex-1">
																				<div className="font-medium truncate">{item.productName}</div>
																				{item.unitPrice && (
																					<div className="text-xs text-muted-foreground">
																						{item.quantity} x R$ {item.unitPrice.toFixed(2)}
																					</div>
																				)}
																			</div>
																		</div>
																		<div className="text-right shrink-0">
																			<div className="font-semibold">
																				{item.unitPrice ? `R$ ${item.totalPrice.toFixed(2)}` : "Não Encontrado"}
																			</div>
																		</div>
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											)
										})
								})()}
								{(() => {
									const cheapestTotal = listComparison.markets
										.filter((m) => m.availableItems > 0)
										.reduce(
											(min, curr) => (curr.totalPrice < min.totalPrice ? curr : min),
											listComparison.markets.find((m) => m.availableItems > 0) || {
												totalPrice: Infinity,
												marketId: "",
												marketName: "",
												availableItems: 0,
												missingItems: 0,
												savings: 0,
												items: [],
											},
										)

									return (
										listComparison.markets.length > 1 && (
											<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
												<h4 className="font-medium text-blue-800 mb-2">💡 Recomendação</h4>
												<p className="text-blue-600 text-sm">
													Comprando no <strong>{cheapestTotal.marketName}</strong>, você economiza{" "}
													<strong>
														R${" "}
														{(
															Math.max(...listComparison.markets.map((m) => m.totalPrice)) -
															Math.min(...listComparison.markets.map((m) => m.totalPrice))
														).toFixed(2)}
													</strong>{" "}
													comparado ao mercado mais caro.
												</p>
											</div>
										)
									)
								})()}
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
