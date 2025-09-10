"use client";

import {
	CheckCircle2,
	Clock,
	DollarSign,
	Loader2,
	MapPin,
	Navigation,
	Package,
	Route,
	ShoppingCart,
	Store,
	TrendingDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface OptimizedRouteItem {
	itemId: string;
	productId: string;
	productName: string;
	quantity: number;
	bestPrice: number;
	estimatedTotal: number;
	averagePrice?: number;
	savings?: number;
}

interface OptimizedMarket {
	marketId: string;
	marketName: string;
	marketLocation?: string | null;
	items: OptimizedRouteItem[];
	totalCost: number;
	estimatedSavings: number;
	itemCount: number;
}

interface OptimizedRouteData {
	listName: string;
	optimizedRoute: OptimizedMarket[];
	totalEstimatedSavings: number;
	summary: {
		totalMarkets: number;
		totalItems: number;
		itemsDistributed: number;
	};
}

interface OptimizedShoppingRouteProps {
	listId: string;
	listName: string;
	isOpen: boolean;
	onClose: () => void;
}

export function OptimizedShoppingRoute({
	listId,
	listName,
	isOpen,
	onClose,
}: OptimizedShoppingRouteProps) {
	const [loading, setLoading] = useState(false);
	const [routeData, setRouteData] = useState<OptimizedRouteData | null>(null);
	const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

	useEffect(() => {
		if (isOpen && listId) {
			fetchOptimizedRoute();
		}
	}, [isOpen, listId]);

	const fetchOptimizedRoute = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/shopping-lists/${listId}/optimize-route`,
			);

			if (!response.ok) {
				throw new Error("Erro ao otimizar roteiro");
			}

			const data = await response.json();
			setRouteData(data);

			// Inicialmente, selecionar todos os mercados
			setSelectedMarkets(
				data.optimizedRoute.map((market: OptimizedMarket) => market.marketId),
			);
		} catch (error) {
			console.error("Erro ao buscar roteiro otimizado:", error);
			toast.error("Erro ao calcular roteiro otimizado");
		} finally {
			setLoading(false);
		}
	};

	const toggleMarketSelection = (marketId: string) => {
		setSelectedMarkets((prev) =>
			prev.includes(marketId)
				? prev.filter((id) => id !== marketId)
				: [...prev, marketId],
		);
	};

	const getSelectedSummary = () => {
		if (!routeData) return { totalCost: 0, totalSavings: 0, totalItems: 0 };

		const selectedMarketData = routeData.optimizedRoute.filter((market) =>
			selectedMarkets.includes(market.marketId),
		);

		return {
			totalCost: selectedMarketData.reduce(
				(sum, market) => sum + market.totalCost,
				0,
			),
			totalSavings: selectedMarketData.reduce(
				(sum, market) => sum + market.estimatedSavings,
				0,
			),
			totalItems: selectedMarketData.reduce(
				(sum, market) => sum + market.itemCount,
				0,
			),
		};
	};

	const selectedSummary = getSelectedSummary();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
				<div className="p-6 border-b">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold flex items-center gap-2">
								<Route className="h-6 w-6 text-blue-600" />
								Roteiro Otimizado
							</h2>
							<p className="text-gray-600 mt-1">{listName}</p>
						</div>
						<Button variant="outline" onClick={onClose}>
							Fechar
						</Button>
					</div>
				</div>

				<div className="overflow-y-auto max-h-[calc(90vh-140px)]">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2 text-lg">Calculando melhor roteiro...</span>
						</div>
					) : routeData ? (
						<div className="p-6 space-y-6">
							{/* Resumo Geral */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<Card>
									<CardContent className="pt-6">
										<div className="flex items-center gap-2">
											<Store className="h-5 w-5 text-blue-600" />
											<div>
												<div className="text-2xl font-bold">
													{routeData.summary.totalMarkets}
												</div>
												<div className="text-sm text-gray-600">Mercados</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="pt-6">
										<div className="flex items-center gap-2">
											<Package className="h-5 w-5 text-green-600" />
											<div>
												<div className="text-2xl font-bold">
													{selectedSummary.totalItems}
												</div>
												<div className="text-sm text-gray-600">Itens</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="pt-6">
										<div className="flex items-center gap-2">
											<DollarSign className="h-5 w-5 text-purple-600" />
											<div>
												<div className="text-2xl font-bold">
													R$ {selectedSummary.totalCost.toFixed(2)}
												</div>
												<div className="text-sm text-gray-600">Custo Total</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="pt-6">
										<div className="flex items-center gap-2">
											<TrendingDown className="h-5 w-5 text-green-600" />
											<div>
												<div className="text-2xl font-bold text-green-600">
													R$ {selectedSummary.totalSavings.toFixed(2)}
												</div>
												<div className="text-sm text-gray-600">Economia</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Instruções */}
							<Card className="bg-blue-50">
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										<Navigation className="h-5 w-5 text-blue-600 mt-0.5" />
										<div>
											<h3 className="font-semibold text-blue-900">
												Como funciona
											</h3>
											<p className="text-blue-700 text-sm mt-1">
												Analisamos o histórico de preços e sugerimos em quais
												mercados comprar cada item para obter o melhor preço.
												Você pode selecionar/desselecionar mercados conforme sua
												preferência.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Lista de Mercados Otimizados */}
							<div className="space-y-4">
								<h3 className="text-lg font-semibold flex items-center gap-2">
									<MapPin className="h-5 w-5" />
									Roteiro Sugerido
								</h3>

								{routeData.optimizedRoute.map((market, index) => (
									<Card
										key={market.marketId}
										className={`transition-all duration-200 ${
											selectedMarkets.includes(market.marketId)
												? "ring-2 ring-blue-500 bg-blue-50"
												: "opacity-60"
										}`}
									>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="flex items-center gap-2">
														<div
															className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                              ${selectedMarkets.includes(market.marketId) ? "bg-blue-600" : "bg-gray-400"}
                            `}
														>
															{index + 1}
														</div>
														<div>
															<CardTitle className="text-lg">
																{market.marketName}
															</CardTitle>
															{market.marketLocation && (
																<p className="text-sm text-gray-600">
																	{market.marketLocation}
																</p>
															)}
														</div>
													</div>
												</div>

												<div className="flex items-center gap-4">
													<div className="text-right">
														<div className="text-lg font-bold">
															R$ {market.totalCost.toFixed(2)}
														</div>
														<div className="text-sm text-green-600 flex items-center gap-1">
															<TrendingDown className="h-3 w-3" />
															Economia: R$ {market.estimatedSavings.toFixed(2)}
														</div>
													</div>

													<Button
														variant={
															selectedMarkets.includes(market.marketId)
																? "default"
																: "outline"
														}
														size="sm"
														onClick={() =>
															toggleMarketSelection(market.marketId)
														}
													>
														{selectedMarkets.includes(market.marketId) ? (
															<>
																<CheckCircle2 className="h-4 w-4 mr-2" />
																Selecionado
															</>
														) : (
															<>
																<Clock className="h-4 w-4 mr-2" />
																Selecionar
															</>
														)}
													</Button>
												</div>
											</div>
										</CardHeader>

										<CardContent>
											<div className="space-y-3">
												<div className="flex items-center gap-4 text-sm text-gray-600">
													<Badge variant="secondary">
														{market.itemCount}{" "}
														{market.itemCount === 1 ? "item" : "itens"}
													</Badge>
													<span>
														Total estimado: R$ {market.totalCost.toFixed(2)}
													</span>
													<span className="text-green-600">
														Economia: R$ {market.estimatedSavings.toFixed(2)}
													</span>
												</div>

												<Separator />

												<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
													{market.items.map((item) => (
														<div
															key={item.itemId}
															className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
														>
															<div>
																<div className="font-medium">
																	{item.productName}
																</div>
																<div className="text-sm text-gray-600">
																	{item.quantity} unidades × R${" "}
																	{item.bestPrice.toFixed(2)}
																</div>
															</div>
															<div className="text-right">
																<div className="font-medium">
																	R$ {item.estimatedTotal.toFixed(2)}
																</div>
																{item.savings && item.savings > 0 && (
																	<div className="text-xs text-green-600">
																		-R$ {item.savings.toFixed(2)}
																	</div>
																)}
															</div>
														</div>
													))}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>

							{/* Resumo Final */}
							<Card className="bg-green-50">
								<CardContent className="pt-6">
									<div className="text-center space-y-2">
										<h3 className="text-lg font-semibold text-green-900">
											Economia Total Estimada
										</h3>
										<div className="text-3xl font-bold text-green-600">
											R$ {selectedSummary.totalSavings.toFixed(2)}
										</div>
										<p className="text-green-700 text-sm">
											Comprando {selectedSummary.totalItems} itens em{" "}
											{selectedMarkets.length} mercado(s) selecionado(s)
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="p-6 text-center">
							<p className="text-gray-600">
								Erro ao carregar dados do roteiro.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
