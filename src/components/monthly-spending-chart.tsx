"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3 } from "lucide-react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";

interface MonthlyDataPoint {
	month: string; // Formato 'YYYY-MM'
	totalSpent: number;
}

interface MonthlySpendingChartProps {
	data: MonthlyDataPoint[];
	loading: boolean;
}

export function MonthlySpendingChart({
	data,
	loading,
}: MonthlySpendingChartProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48 mb-2" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="h-64 animate-pulse rounded-lg bg-gray-200" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Evolução de Gastos Mensais
					</CardTitle>
					<CardDescription>
						Histórico de gastos dos últimos 12 meses
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-gray-500">
						<BarChart3 className="h-12 w-12 mx-auto mb-4" />
						<p>Dados insuficientes para gerar o gráfico</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Adicionar um placeholder de 'totalSpent' para o mês atual, se não houver dados ainda.
	// Isso garante que o gráfico sempre mostre o mês atual no eixo X.
	const lastMonth = new Date(data[data.length - 1].month);
	const now = new Date();
	const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

	if (data[data.length - 1].month !== currentMonthKey) {
		data.push({ month: currentMonthKey, totalSpent: 0 });
	}

	return (
		<Card className="shadow-sm hover:shadow-lg transition-shadow md:col-span-2">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					Evolução de Gastos Mensais
				</CardTitle>
				<CardDescription>
					Total gasto por mês nos últimos 12 meses
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="month"
							tickFormatter={(value) =>
								format(new Date(value), "MMM/yy", { locale: ptBR })
							}
						/>
						<YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
						<Tooltip
							formatter={(value: number) => [
								`R$ ${value.toFixed(2)}`,
								"Gasto Total",
							]}
							labelFormatter={(value) =>
								format(new Date(value), "MMMM yyyy", { locale: ptBR })
							}
						/>
						<Line
							type="monotone"
							dataKey="totalSpent"
							stroke="#8884d8"
							strokeWidth={2}
							dot={{ fill: "#8884d8" }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
