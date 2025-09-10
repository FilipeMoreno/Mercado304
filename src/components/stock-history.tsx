"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	AlertTriangle,
	ArrowUpDown,
	Calendar,
	Download,
	Filter,
	History,
	Package,
	RefreshCw,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface StockMovement {
	id: string;
	type: "ENTRADA" | "SAIDA" | "AJUSTE" | "VENCIMENTO" | "PERDA" | "DESPERDICIO";
	quantity: number;
	reason?: string;
	date: string;
	notes?: string;
	isWaste: boolean;
	wasteReason?: string;
	wasteValue?: number;
	stockItem: {
		id: string;
		product: {
			id: string;
			name: string;
			unit: string;
			brand?: { name: string };
			category?: { name: string };
		};
	};
}

interface StockHistoryProps {
	productId?: string;
	stockItemId?: string;
	productName?: string;
}

const movementTypeColors = {
	ENTRADA: "bg-green-100 text-green-800 border-green-200",
	SAIDA: "bg-blue-100 text-blue-800 border-blue-200",
	AJUSTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
	VENCIMENTO: "bg-orange-100 text-orange-800 border-orange-200",
	PERDA: "bg-red-100 text-red-800 border-red-200",
	DESPERDICIO: "bg-red-100 text-red-800 border-red-200",
};

const movementTypeLabels = {
	ENTRADA: "Entrada",
	SAIDA: "Saída",
	AJUSTE: "Ajuste",
	VENCIMENTO: "Vencimento",
	PERDA: "Perda",
	DESPERDICIO: "Desperdício",
};

export function StockHistory({
	productId,
	stockItemId,
	productName,
}: StockHistoryProps) {
	const [movements, setMovements] = useState<StockMovement[]>([]);
	const [stats, setStats] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [filters, setFilters] = useState({
		type: "all",
		startDate: "",
		endDate: "",
		page: 1,
		limit: 50,
	});

	const loadHistory = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				...(productId && { productId }),
				...(stockItemId && { stockItemId }),
				...(filters.type !== "all" && { type: filters.type }),
				...(filters.startDate && { startDate: filters.startDate }),
				...(filters.endDate && { endDate: filters.endDate }),
				page: filters.page.toString(),
				limit: filters.limit.toString(),
			});

			const response = await fetch(`/api/stock/history?${params}`);
			if (response.ok) {
				const data = await response.json();
				setMovements(data.movements);
				setStats(data.stats);
			}
		} catch (error) {
			console.error("Erro ao carregar histórico:", error);
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		if (open) {
			loadHistory();
		}
	}, [open, filters]);

	const getMovementIcon = (type: string) => {
		switch (type) {
			case "ENTRADA":
				return <TrendingUp className="h-4 w-4" />;
			case "SAIDA":
				return <TrendingDown className="h-4 w-4" />;
			case "AJUSTE":
				return <ArrowUpDown className="h-4 w-4" />;
			case "VENCIMENTO":
				return <Calendar className="h-4 w-4" />;
			case "PERDA":
				return <AlertTriangle className="h-4 w-4" />;
			case "DESPERDICIO":
				return <Trash2 className="h-4 w-4" />;
			default:
				return <Package className="h-4 w-4" />;
		}
	};

	const formatQuantity = (quantity: number, unit: string) => {
		return `${quantity} ${unit}`;
	};

	const exportHistory = async () => {
		try {
			const params = new URLSearchParams({
				...(productId && { productId }),
				...(stockItemId && { stockItemId }),
				...(filters.type !== "all" && { type: filters.type }),
				...(filters.startDate && { startDate: filters.startDate }),
				...(filters.endDate && { endDate: filters.endDate }),
				export: "csv",
			});

			window.open(`/api/stock/history?${params}`, "_blank");
		} catch (error) {
			console.error("Erro ao exportar histórico:", error);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2 mb-6">
				<History className="h-5 w-5" />
				<h2 className="text-2xl font-bold">Histórico de Movimentações</h2>
				{productName && (
					<span className="text-lg text-gray-600">- {productName}</span>
				)}
			</div>

			{/* Filtros */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
				<div className="space-y-2">
					<Label>Tipo de Movimento</Label>
					<Select
						value={filters.type}
						onValueChange={(value) =>
							setFilters((prev) => ({ ...prev, type: value, page: 1 }))
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos</SelectItem>
							<SelectItem value="ENTRADA">Entrada</SelectItem>
							<SelectItem value="SAIDA">Saída</SelectItem>
							<SelectItem value="AJUSTE">Ajuste</SelectItem>
							<SelectItem value="VENCIMENTO">Vencimento</SelectItem>
							<SelectItem value="PERDA">Perda</SelectItem>
							<SelectItem value="DESPERDICIO">Desperdício</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Data Inicial</Label>
					<Input
						type="date"
						value={filters.startDate}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								startDate: e.target.value,
								page: 1,
							}))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label>Data Final</Label>
					<Input
						type="date"
						value={filters.endDate}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								endDate: e.target.value,
								page: 1,
							}))
						}
					/>
				</div>

				<div className="flex items-end gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setFilters({
								type: "all",
								startDate: "",
								endDate: "",
								page: 1,
								limit: 50,
							})
						}
					>
						<Filter className="h-4 w-4 mr-1" />
						Limpar
					</Button>
					<Button variant="outline" size="sm" onClick={exportHistory}>
						<Download className="h-4 w-4 mr-1" />
						Exportar
					</Button>
				</div>
			</div>

			{/* Estatísticas */}
			{stats && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">
								Total de Movimentos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">
								Quantidade Total
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.totalQuantity.toFixed(1)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">
								Desperdícios
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								{stats.waste.count}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">
								Valor Desperdiçado
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								R$ {stats.waste.value?.toFixed(2) || "0.00"}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Lista de Movimentos */}
			<div className="flex-1 overflow-auto space-y-3">
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<RefreshCw className="h-6 w-6 animate-spin mr-2" />
						Carregando histórico...
					</div>
				) : movements.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
						<p>Nenhum movimento encontrado</p>
					</div>
				) : (
					movements.map((movement) => (
						<Card
							key={movement.id}
							className={`${movement.isWaste ? "border-red-200 bg-red-50" : ""}`}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<div className="p-2 rounded-lg bg-gray-100">
											{getMovementIcon(movement.type)}
										</div>
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<Badge
													className={movementTypeColors[movement.type]}
												>
													{movementTypeLabels[movement.type]}
												</Badge>
												<span className="text-sm text-gray-600">
													{formatQuantity(
														movement.quantity,
														movement.stockItem.product.unit,
													)}
												</span>
												{movement.isWaste && (
													<Badge
														variant="destructive"
														className="text-xs"
													>
														Desperdício
													</Badge>
												)}
											</div>
											<div className="text-sm font-medium">
												{movement.stockItem.product.name}
												{movement.stockItem.product.brand && (
													<span className="text-gray-500 ml-1">
														- {movement.stockItem.product.brand.name}
													</span>
												)}
											</div>
											{movement.reason && (
												<div className="text-sm text-gray-600">
													{movement.reason}
												</div>
											)}
											{movement.wasteReason && (
												<div className="text-sm text-red-600">
													Motivo: {movement.wasteReason}
												</div>
											)}
											{movement.notes && (
												<div className="text-xs text-gray-500">
													{movement.notes}
												</div>
											)}
										</div>
									</div>
									<div className="text-right">
										<div className="text-sm text-gray-500">
											{format(
												new Date(movement.date),
												"dd/MM/yyyy 'às' HH:mm",
												{ locale: ptBR },
											)}
										</div>
										{movement.wasteValue && (
											<div className="text-sm text-red-600 font-medium">
												-R$ {movement.wasteValue.toFixed(2)}
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}