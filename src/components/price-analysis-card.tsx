"use client";

import {
	Activity,
	AlertTriangle,
	Calendar,
	CheckCircle,
	DollarSign,
	Info,
	Minus,
	Package,
	RefreshCw,
	Store,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceAnalysisProps {
	productId?: string;
	marketId?: string;
	className?: string;
}

export function PriceAnalysisCard({
	productId,
	marketId,
	className,
}: PriceAnalysisProps) {
	const [analysis, setAnalysis] = useState<any>(null);
	const [insights, setInsights] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const loadAnalysis = async () => {
		if (!productId && !marketId) return;

		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (productId) params.append("productId", productId);
			if (marketId) params.append("marketId", marketId);
			params.append("days", "90");

			const response = await fetch(`/api/prices/analysis?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				setAnalysis(data.analysis);
				setInsights(data.insights);
			} else {
				toast.error("Erro ao carregar análise de preços");
			}
		} catch (error) {
			toast.error("Erro ao conectar com o servidor");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAnalysis();
	}, [productId, marketId]);

	if (loading) {
		return (
			<Card className={className}>
				<CardContent className="p-6">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						<p className="text-muted-foreground mt-2">Analisando preços...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!analysis || analysis.totalRecords === 0) {
		return (
			<Card className={className}>
				<CardContent className="p-6">
					<div className="text-center text-muted-foreground">
						<Activity className="h-8 w-8 mx-auto mb-2" />
						<p>Registre alguns preços para ver análises</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "up":
				return <TrendingUp className="h-4 w-4 text-red-500" />;
			case "down":
				return <TrendingDown className="h-4 w-4 text-green-500" />;
			default:
				return <Minus className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getTrendColor = (trend: string) => {
		switch (trend) {
			case "up":
				return "text-red-600";
			case "down":
				return "text-green-600";
			default:
				return "text-muted-foreground";
		}
	};

	const getInsightIcon = (type: string) => {
		switch (type) {
			case "warning":
				return <AlertTriangle className="h-4 w-4 text-orange-500" />;
			case "success":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			default:
				return <Info className="h-4 w-4 text-blue-500" />;
		}
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Análise de Preços
					<Button
						variant="ghost"
						size="icon"
						onClick={loadAnalysis}
						disabled={loading}
						className="ml-auto h-6 w-6"
					>
						<RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Estatísticas Gerais */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center">
						<p className="text-2xl font-bold">{analysis.totalRecords}</p>
						<p className="text-xs text-muted-foreground">Total de dados</p>
					</div>
					<div className="text-center">
						<p className="text-2xl font-bold">
							R$ {analysis.trends.avgPrice?.toFixed(2)}
						</p>
						<p className="text-xs text-muted-foreground">Preço médio</p>
					</div>
					<div className="text-center">
						<p className="text-2xl font-bold">
							R$ {analysis.trends.priceRange?.toFixed(2)}
						</p>
						<p className="text-xs text-muted-foreground">Variação</p>
					</div>
					<div className="text-center flex items-center justify-center">
						{getTrendIcon(analysis.trends.recentTrend)}
						<span
							className={`ml-1 text-sm font-medium ${getTrendColor(analysis.trends.recentTrend)}`}
						>
							{analysis.trends.recentTrend === "up"
								? "Subindo"
								: analysis.trends.recentTrend === "down"
									? "Descendo"
									: "Estável"}
						</span>
					</div>
				</div>

				{/* Composição dos dados */}
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							📝 {analysis.priceRecordsCount} registros
						</Badge>
						<Badge variant="outline" className="text-xs">
							🛒 {analysis.purchasesCount} compras
						</Badge>
					</div>
				</div>

				{/* Insights */}
				{insights.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Insights</h4>
						{insights.map((insight, index) => (
							<div
								key={index}
								className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
							>
								{getInsightIcon(insight.type)}
								<div className="flex-1">
									<p className="font-medium text-sm">{insight.title}</p>
									<p className="text-xs text-muted-foreground">
										{insight.message}
									</p>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Top mercados e produtos se disponível */}
				{analysis.trends.mostCommonMarket && (
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Mais Frequentes</h4>
						<div className="grid grid-cols-1 gap-2">
							{analysis.trends.mostCommonMarket && (
								<div className="flex items-center gap-2 text-sm">
									<Store className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">
										{analysis.trends.mostCommonMarket}
									</span>
									<Badge variant="outline" className="text-xs">
										Mercado
									</Badge>
								</div>
							)}
							{analysis.trends.mostCommonProduct && (
								<div className="flex items-center gap-2 text-sm">
									<Package className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">
										{analysis.trends.mostCommonProduct}
									</span>
									<Badge variant="outline" className="text-xs">
										Produto
									</Badge>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Faixa de preços */}
				<div className="space-y-2">
					<h4 className="font-medium text-sm">Faixa de Preços</h4>
					<div className="flex items-center justify-between text-sm">
						<span className="text-green-600 font-medium">
							R$ {analysis.trends.minPrice?.toFixed(2)}
						</span>
						<div className="flex-1 mx-2 h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded"></div>
						<span className="text-red-600 font-medium">
							R$ {analysis.trends.maxPrice?.toFixed(2)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
