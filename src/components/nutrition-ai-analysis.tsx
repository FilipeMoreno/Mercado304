"use client";

import { AlertTriangle, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface NutritionAiAnalysisProps {
	productId: string;
}

export function NutritionAiAnalysis({ productId }: NutritionAiAnalysisProps) {
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchAnalysis() {
			if (!productId) return;
			setLoading(true);
			try {
				const response = await fetch(`/api/products/${productId}/ai-analysis`);
				if (response.ok) {
					const data = await response.json();
					setAnalysis(data.analysis);
				} else {
					setAnalysis(null);
				}
			} catch (error) {
				console.error("Erro ao buscar análise da IA:", error);
				setAnalysis(null);
			} finally {
				setLoading(false);
			}
		}
		fetchAnalysis();
	}, [productId]);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wand2 className="h-5 w-5 text-purple-500" />
						Análise da IA
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 animate-pulse">
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!analysis) {
		return null; // Não renderiza nada se não houver análise
	}

	return (
		<Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
					<Wand2 className="h-5 w-5" />
					Opinião do Nutricionista Virtual
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-purple-800 dark:text-purple-300">
					{analysis}
				</p>
			</CardContent>
		</Card>
	);
}
