"use client";

import { Loader2, Sparkles } from "lucide-react";

interface PriceAiInsightProps {
	analysis: string | null;
	loading: boolean;
}

export function PriceAiInsight({ analysis, loading }: PriceAiInsightProps) {
	if (loading) {
		return (
			<div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span>Analisando preço...</span>
			</div>
		);
	}

	if (!analysis) return null;

	return (
		<div className="mt-2 flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-2 text-sm text-blue-800">
			<Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
			<p>{analysis}</p>
		</div>
	);
}
