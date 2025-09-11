"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	AlertTriangle,
	BarChart3,
	Calendar,
	Edit,
	Eye,
	Filter,
	MoreHorizontal,
	PieChart,
	Plus,
	Search,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	useWasteQuery,
	useCreateWasteMutation,
	useUpdateWasteMutation,
	useDeleteWasteMutation,
} from "@/hooks";
import WasteSkeleton from "@/components/skeletons/waste-skeleton";

interface WasteRecord {
	id: string;
	productName: string;
	quantity: number;
	unit: string;
	wasteReason: string;
	wasteDate: string;
	totalValue?: number;
	category?: string;
	brand?: string;
	notes?: string;
	expirationDate?: string;
	location?: string;
	batchNumber?: string;
	productId?: string;
	stockItemId?: string;
	userName?: string;
}

interface WasteStats {
	totalValue: number;
	totalQuantity: number;
	totalCount: number;
	reasonStats: Array<{
		wasteReason: string;
		_count: { wasteReason: number };
	}>;
}

interface WasteResponse {
	wasteRecords: WasteRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	stats: WasteStats;
}

const wasteReasonLabels = {
	EXPIRED: "Vencido",
	SPOILED: "Estragado",
	DAMAGED: "Danificado",
	CONTAMINATED: "Contaminado",
	EXCESS: "Excesso",
	FREEZER_BURN: "Queimadura do freezer",
	MOLDY: "Com mofo",
	PEST_DAMAGE: "Danificado por pragas",
	POWER_OUTAGE: "Falta de energia",
	FORGOTTEN: "Esquecido",
	OTHER: "Outros",
};

const wasteReasonColors = {
	EXPIRED: "destructive",
	SPOILED: "destructive",
	DAMAGED: "secondary",
	CONTAMINATED: "destructive",
	EXCESS: "default",
	FREEZER_BURN: "secondary",
	MOLDY: "destructive",
	PEST_DAMAGE: "secondary",
	POWER_OUTAGE: "destructive",
	FORGOTTEN: "default",
	OTHER: "secondary",
};

export default function DesperdiciosClient() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterReason, setFilterReason] = useState<string>("all");
	const [selectedRecord, setSelectedRecord] = useState<WasteRecord | null>(
		null,
	);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);

	// Build URLSearchParams for the waste query
	const wasteParams = useMemo(() => {
		const params = new URLSearchParams({
			page: "1",
			limit: "50",
		});
		if (searchTerm) params.append("search", searchTerm);
		if (filterReason !== "all") params.append("reason", filterReason);
		return params;
	}, [searchTerm, filterReason]);

	// React Query hooks
	const { data: wasteData, isLoading, error } = useWasteQuery(wasteParams);
	const createWasteMutation = useCreateWasteMutation();
	const updateWasteMutation = useUpdateWasteMutation();
	const deleteWasteMutation = useDeleteWasteMutation();

	// Extract data from React Query
	const wasteRecords = wasteData?.wasteRecords || [];
	const stats = wasteData?.stats || null;

	const handleDeleteRecord = async (id: string) => {
		try {
			await deleteWasteMutation.mutateAsync(id);
		} catch (error) {
			console.error("Erro ao remover registro:", error);
		}
	};

	const handleCreateRecord = async (newRecordData: any) => {
		try {
			await createWasteMutation.mutateAsync(newRecordData);
			setShowCreateDialog(false);
		} catch (error) {
			console.error("Erro ao criar registro:", error);
		}
	};

	const handleUpdateRecord = async (updatedRecordData: any) => {
		try {
			if (!selectedRecord) return;

			await updateWasteMutation.mutateAsync({
				id: selectedRecord.id,
				data: updatedRecordData,
			});
			setShowEditDialog(false);
			setSelectedRecord(null);
		} catch (error) {
			console.error("Erro ao atualizar registro:", error);
		}
	};

	// Handle error states
	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">
						Erro ao carregar desperdícios
					</h3>
					<p className="text-gray-600 mb-4">
						Ocorreu um erro ao buscar os dados. Tente recarregar a página.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">
						Controle de Desperdícios
					</h1>
					<p className="text-gray-600 mt-1">
						Gerencie e monitore os desperdícios de alimentos
					</p>
				</div>
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Registrar Desperdício
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Registrar Novo Desperdício</DialogTitle>
						</DialogHeader>
						<WasteForm
							onSubmit={handleCreateRecord}
							onCancel={() => setShowCreateDialog(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Estatísticas Principais */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
				{isLoading ? (
					<>
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-4" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-16" />
								</CardContent>
							</Card>
						))}
					</>
				) : (
					<>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Desperdiçado
								</CardTitle>
								<TrendingUp className="h-4 w-4 text-red-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									R$ {stats?.totalValue.toFixed(2) || "0.00"}
								</div>
								<p className="text-xs text-muted-foreground">
									Em {stats?.totalCount || 0} registros
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Itens Desperdiçados
								</CardTitle>
								<AlertTriangle className="h-4 w-4 text-orange-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stats?.totalCount || 0}</div>
								<p className="text-xs text-muted-foreground">Total de itens</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Principal Motivo
								</CardTitle>
								<Calendar className="h-4 w-4 text-blue-600" />
							</CardHeader>
							<CardContent>
								<div className="text-lg font-bold">
									{stats?.reasonStats?.[0]
										? wasteReasonLabels[
												stats.reasonStats[0]
													.wasteReason as keyof typeof wasteReasonLabels
											]
										: "N/A"}
								</div>
								<p className="text-xs text-muted-foreground">
									Mais frequente ({stats?.reasonStats?.[0]?._count.wasteReason || 0}{" "}
									vezes)
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Quantidade Total
								</CardTitle>
								<TrendingDown className="h-4 w-4 text-gray-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats?.totalQuantity.toFixed(1) || "0"}
								</div>
								<p className="text-xs text-muted-foreground">
									kg/litros desperdiçados
								</p>
							</CardContent>
						</Card>
				</>
				)}
			</div>

			{/* Estatísticas Detalhadas */}
			{stats && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					{/* Gráfico de Motivos */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PieChart className="h-5 w-5" />
								Motivos de Desperdício
							</CardTitle>
							<CardDescription>
								Distribuição dos principais motivos
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{stats.reasonStats.slice(0, 5).map((stat, index) => {
									const percentage = (
										(stat._count.wasteReason / stats.totalCount) *
										100
									).toFixed(1);
									const colors = [
										"bg-red-500",
										"bg-orange-500",
										"bg-yellow-500",
										"bg-blue-500",
										"bg-gray-500",
									];
									return (
										<div
											key={stat.wasteReason}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-3">
												<div
													className={`w-3 h-3 rounded-full ${colors[index]}`}
												/>
												<span className="text-sm font-medium">
													{
														wasteReasonLabels[
															stat.wasteReason as keyof typeof wasteReasonLabels
														]
													}
												</span>
											</div>
											<div className="text-right">
												<div className="text-sm font-bold">
													{stat._count.wasteReason}
												</div>
												<div className="text-xs text-gray-500">
													{percentage}%
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* Resumo por Valor */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								Análise Financeira
							</CardTitle>
							<CardDescription>
								Impacto financeiro do desperdício
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
									<span className="text-sm font-medium text-red-800">
										Valor Total
									</span>
									<span className="text-lg font-bold text-red-600">
										R$ {stats.totalValue.toFixed(2)}
									</span>
								</div>
								<div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
									<span className="text-sm font-medium text-orange-800">
										Valor Médio por Item
									</span>
									<span className="text-lg font-bold text-orange-600">
										R${" "}
										{stats.totalCount > 0
											? (stats.totalValue / stats.totalCount).toFixed(2)
											: "0.00"}
									</span>
								</div>
								<div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
									<span className="text-sm font-medium text-yellow-800">
										Economia Potencial
									</span>
									<span className="text-lg font-bold text-yellow-600">
										-R$ {stats.totalValue.toFixed(2)}
									</span>
								</div>
								{stats.totalCount > 0 && (
									<div className="mt-4 p-4 bg-gray-50 rounded-lg">
										<h4 className="text-sm font-medium text-gray-700 mb-2">
											Dicas para Reduzir
										</h4>
										<ul className="text-xs text-gray-600 space-y-1">
											<li>• Monitore datas de validade regularmente</li>
											<li>
												• Use o sistema PEPS (Primeiro que Entra, Primeiro que
												Sai)
											</li>
											<li>• Planeje compras baseadas no consumo</li>
											<li>• Configure alertas de expiração</li>
										</ul>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filtros */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Buscar por produto..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select value={filterReason} onValueChange={setFilterReason}>
					<SelectTrigger className="w-full sm:w-[200px]">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Filtrar por motivo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os motivos</SelectItem>
						{Object.entries(wasteReasonLabels).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Lista de desperdícios */}
			<div className="space-y-4">
				{isLoading ? (
					// Loading skeleton for waste records list
					<div className="space-y-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i}>
								<CardContent className="p-6">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-start gap-4">
												<div className="flex-1">
													<Skeleton className="h-6 w-48 mb-2" />
													<div className="flex items-center gap-4 mb-2">
														<Skeleton className="h-4 w-16" />
														<Skeleton className="h-4 w-20" />
														<Skeleton className="h-4 w-24" />
														<Skeleton className="h-4 w-32" />
													</div>
													<div className="flex items-center gap-2">
														<Skeleton className="h-6 w-20" />
														<Skeleton className="h-6 w-16" />
														<Skeleton className="h-6 w-24" />
													</div>
												</div>
											</div>
										</div>
										<Skeleton className="h-8 w-8" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					wasteRecords.map((record) => (
						<Card key={record.id}>
							<CardContent className="p-6">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-start gap-4">
											<div className="flex-1">
												<h3 className="font-semibold text-lg text-gray-900">
													{record.productName}
												</h3>
												<div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
													<span>
														{record.quantity} {record.unit}
													</span>
													{record.totalValue && (
														<span className="font-medium text-red-600">
															R$ {record.totalValue.toFixed(2)}
														</span>
													)}
													<span>
														{format(new Date(record.wasteDate), "dd/MM/yyyy", {
															locale: ptBR,
														})}
													</span>
													{record.location && <span>📍 {record.location}</span>}
												</div>
												<div className="flex items-center gap-2 mt-2">
													<Badge
														variant={
															wasteReasonColors[
																record.wasteReason as keyof typeof wasteReasonColors
															] as any
														}
													>
														{
															wasteReasonLabels[
																record.wasteReason as keyof typeof wasteReasonLabels
															]
														}
													</Badge>
													{record.category && (
														<Badge variant="outline">{record.category}</Badge>
													)}
													{record.brand && (
														<Badge variant="outline">{record.brand}</Badge>
													)}
												</div>
											</div>
										</div>
									</div>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => {
													setSelectedRecord(record);
													setShowDetailsDialog(true);
												}}
											>
												<Eye className="mr-2 h-4 w-4" />
												Ver detalhes
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setSelectedRecord(record);
													setShowEditDialog(true);
												}}
											>
												<Edit className="mr-2 h-4 w-4" />
												Editar
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleDeleteRecord(record.id)}
												className="text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Remover
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardContent>
						</Card>
					))
				)}

				{!isLoading && wasteRecords.length === 0 && (
					<Card>
						<CardContent className="p-12 text-center">
							<AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Nenhum registro encontrado
							</h3>
							<p className="text-gray-600 mb-4">
								{searchTerm || filterReason !== "all"
									? "Tente ajustar os filtros de busca."
									: "Registre o primeiro desperdício para começar o controle."}
							</p>
							{!(searchTerm || filterReason !== "all") && (
								<Button onClick={() => setShowCreateDialog(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Registrar Desperdício
								</Button>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Dialog de detalhes */}
			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Detalhes do Desperdício</DialogTitle>
					</DialogHeader>
					{selectedRecord && <WasteDetails record={selectedRecord} />}
				</DialogContent>
			</Dialog>

			{/* Dialog de edição */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Editar Desperdício</DialogTitle>
					</DialogHeader>
					{selectedRecord && (
						<WasteForm
							initialData={selectedRecord}
							onSubmit={handleUpdateRecord}
							onCancel={() => {
								setShowEditDialog(false);
								setSelectedRecord(null);
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

interface WasteFormProps {
	initialData?: WasteRecord;
	onSubmit: (data: any) => void;
	onCancel: () => void;
}

function WasteForm({ initialData, onSubmit, onCancel }: WasteFormProps) {
	const [formData, setFormData] = useState({
		productName: initialData?.productName || "",
		quantity: initialData?.quantity || 0,
		unit: initialData?.unit || "unidade",
		wasteReason: initialData?.wasteReason || "EXPIRED",
		wasteDate: initialData?.wasteDate
			? new Date(initialData.wasteDate).toISOString().split("T")[0]
			: new Date().toISOString().split("T")[0],
		expirationDate: initialData?.expirationDate
			? new Date(initialData.expirationDate).toISOString().split("T")[0]
			: "",
		location: initialData?.location || "",
		totalValue: initialData?.totalValue || 0,
		category: initialData?.category || "",
		brand: initialData?.brand || "",
		notes: initialData?.notes || "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			...formData,
			wasteDate: new Date(formData.wasteDate).toISOString(),
			expirationDate: formData.expirationDate
				? new Date(formData.expirationDate).toISOString()
				: undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium mb-2">
						Nome do Produto *
					</label>
					<Input
						value={formData.productName}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, productName: e.target.value }))
						}
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">Categoria</label>
					<Input
						value={formData.category}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, category: e.target.value }))
						}
					/>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div>
					<label className="block text-sm font-medium mb-2">Quantidade *</label>
					<Input
						type="number"
						step="0.01"
						value={formData.quantity}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								quantity: parseFloat(e.target.value) || 0,
							}))
						}
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">Unidade *</label>
					<Select
						value={formData.unit}
						onValueChange={(value) =>
							setFormData((prev) => ({ ...prev, unit: value }))
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="unidade">Unidade</SelectItem>
							<SelectItem value="kg">kg</SelectItem>
							<SelectItem value="g">g</SelectItem>
							<SelectItem value="litro">Litro</SelectItem>
							<SelectItem value="ml">ml</SelectItem>
							<SelectItem value="pacote">Pacote</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">Valor Total</label>
					<Input
						type="number"
						step="0.01"
						value={formData.totalValue}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								totalValue: parseFloat(e.target.value) || 0,
							}))
						}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium mb-2">Motivo *</label>
					<Select
						value={formData.wasteReason}
						onValueChange={(value) =>
							setFormData((prev) => ({ ...prev, wasteReason: value }))
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(wasteReasonLabels).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">Localização</label>
					<Input
						value={formData.location}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, location: e.target.value }))
						}
						placeholder="Ex: Geladeira, Despensa"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium mb-2">
						Data do Desperdício *
					</label>
					<Input
						type="date"
						value={formData.wasteDate}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, wasteDate: e.target.value }))
						}
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">
						Data de Vencimento
					</label>
					<Input
						type="date"
						value={formData.expirationDate}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								expirationDate: e.target.value,
							}))
						}
					/>
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium mb-2">Observações</label>
				<Textarea
					value={formData.notes}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, notes: e.target.value }))
					}
					placeholder="Detalhes adicionais sobre o desperdício..."
					rows={3}
				/>
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit">{initialData ? "Atualizar" : "Registrar"}</Button>
			</div>
		</form>
	);
}

interface WasteDetailsProps {
	record: WasteRecord;
}

function WasteDetails({ record }: WasteDetailsProps) {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h4 className="font-medium text-gray-900 mb-2">
						Informações do Produto
					</h4>
					<div className="space-y-2 text-sm">
						<div>
							<span className="text-gray-600">Nome: </span>
							<span className="font-medium">{record.productName}</span>
						</div>
						{record.category && (
							<div>
								<span className="text-gray-600">Categoria: </span>
								<span>{record.category}</span>
							</div>
						)}
						{record.brand && (
							<div>
								<span className="text-gray-600">Marca: </span>
								<span>{record.brand}</span>
							</div>
						)}
						<div>
							<span className="text-gray-600">Quantidade: </span>
							<span>
								{record.quantity} {record.unit}
							</span>
						</div>
						{record.totalValue && (
							<div>
								<span className="text-gray-600">Valor: </span>
								<span className="font-medium text-red-600">
									R$ {record.totalValue.toFixed(2)}
								</span>
							</div>
						)}
					</div>
				</div>

				<div>
					<h4 className="font-medium text-gray-900 mb-2">
						Informações do Desperdício
					</h4>
					<div className="space-y-2 text-sm">
						<div>
							<span className="text-gray-600">Motivo: </span>
							<Badge
								variant={
									wasteReasonColors[
										record.wasteReason as keyof typeof wasteReasonColors
									] as any
								}
							>
								{
									wasteReasonLabels[
										record.wasteReason as keyof typeof wasteReasonLabels
									]
								}
							</Badge>
						</div>
						<div>
							<span className="text-gray-600">Data: </span>
							<span>
								{format(new Date(record.wasteDate), "dd/MM/yyyy 'às' HH:mm", {
									locale: ptBR,
								})}
							</span>
						</div>
						{record.expirationDate && (
							<div>
								<span className="text-gray-600">Vencimento: </span>
								<span>
									{format(new Date(record.expirationDate), "dd/MM/yyyy", {
										locale: ptBR,
									})}
								</span>
							</div>
						)}
						{record.location && (
							<div>
								<span className="text-gray-600">Localização: </span>
								<span>{record.location}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{record.notes && (
				<div>
					<h4 className="font-medium text-gray-900 mb-2">Observações</h4>
					<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
						{record.notes}
					</p>
				</div>
			)}
		</div>
	);
}