// src/app/estoque/estoque-client.tsx
"use client";

import { ptBR } from "date-fns/locale";
import {
	AlertCircle,
	AlertTriangle,
	DollarSign,
	Edit,
	Filter,
	History,
	MapPin,
	Package,
	Plus,
	Search,
	Trash2,
	TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { RecipeSuggester } from "@/components/recipe-suggester";
import { ProductSelect } from "@/components/selects/product-select";
import { StockHistory } from "@/components/stock-history";
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
} from "@/components/ui/dialog";
import { FilterPopover } from "@/components/ui/filter-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataMutation, useDeleteConfirmation, useUrlState } from "@/hooks";
import { formatLocalDate, toDateInputValue } from "@/lib/date-utils";
import { TempStorage } from "@/lib/temp-storage";

interface StockItem {
	id: string;
	productId: string;
	quantity: number;
	expirationDate?: string;
	batchNumber?: string;
	location?: string;
	unitCost?: number;
	notes?: string;
	addedDate: string;
	isExpired: boolean;
	isLowStock: boolean;
	expirationStatus: "ok" | "expiring_soon" | "expired";
	expirationWarning?: string;
	stockStatus: "ok" | "low";
	stockWarning?: string;
	totalValue?: number;
	product: {
		id: string;
		name: string;
		unit: string;
		hasStock: boolean;
		minStock?: number;
		maxStock?: number;
		hasExpiration: boolean;
		brand?: { name: string };
		category?: { name: string };
	};
}

interface EstoqueClientProps {
	initialStockItems: StockItem[];
	initialStats: any;
	initialProducts: any[];
	searchParams: {
		location?: string;
		search?: string;
	};
}

export function EstoqueClient({
	initialStockItems,
	initialStats,
	initialProducts,
	searchParams,
}: EstoqueClientProps) {
	const router = useRouter();
	const [stockItems, setStockItems] = useState(initialStockItems);
	const [stats, setStats] = useState(initialStats);
	const [products, setProducts] = useState(initialProducts);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showUseDialog, setShowUseDialog] = useState(false);
	const [useItem, setUseItem] = useState<StockItem | null>(null);
	const [consumedQuantity, setConsumedQuantity] = useState("");
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("stock");

	const [formData, setFormData] = useState({
		productId: "",
		quantity: 1,
		expirationDate: "",
		batchNumber: "",
		location: "Despensa",
		unitCost: 0,
		notes: "",
	});

	const { create, remove, loading } = useDataMutation();
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } =
		useDeleteConfirmation<StockItem>();

	const { state, updateSingleValue, clearFilters, hasActiveFilters } =
		useUrlState({
			basePath: "/estoque",
			initialValues: {
				search: searchParams.search || "",
				location: searchParams.location || "all",
				filter: "all",
				includeExpired: "false",
			},
		});

	const stockIngredients = React.useMemo(() => {
		return initialStockItems.map((item) => item.product.name);
	}, [initialStockItems]);

	React.useEffect(() => {
		setStockItems(initialStockItems);
		setStats(initialStats);
		setProducts(initialProducts);
	}, [initialStockItems, initialStats, initialProducts]);

	React.useEffect(() => {
		const storageKey = new URLSearchParams(window.location.search).get(
			"storageKey",
		);
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey);
			if (preservedData) {
				try {
					if (preservedData.formData) {
						setFormData(preservedData.formData);
					}
					if (preservedData.newProductId) {
						setTimeout(() => {
							setFormData((prev) => ({
								...prev,
								productId: preservedData.newProductId,
							}));
							setShowAddDialog(true);
						}, 1000);
					}
					TempStorage.remove(storageKey);
					window.history.replaceState({}, "", "/estoque");
				} catch (error) {
					console.error("Erro ao restaurar dados:", error);
					TempStorage.remove(storageKey);
				}
			}
		}
	}, []);

	const handleAddStock = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			await create("/api/stock", formData, {
				successMessage: "Item adicionado ao estoque!",
				onSuccess: () => {
					setShowAddDialog(false);
					setFormData({
						productId: "",
						quantity: 1,
						expirationDate: "",
						batchNumber: "",
						location: "Despensa",
						unitCost: 0,
						notes: "",
					});
				},
			});
		} catch (_error) {
			// Error already handled by the hook
		} finally {
			setSaving(false);
		}
	};

	const handleUseItem = (item: StockItem) => {
		setUseItem(item);
		setConsumedQuantity("");
		setShowUseDialog(true);
	};

	const handleConsumeItem = async () => {
		if (!useItem || !consumedQuantity || parseFloat(consumedQuantity) <= 0) {
			toast.error("Quantidade inválida");
			return;
		}

		const quantity = parseFloat(consumedQuantity);
		if (quantity > useItem.quantity) {
			toast.error(
				`Quantidade não pode ser maior que ${useItem.quantity} ${useItem.product.unit}`,
			);
			return;
		}

		setSaving(true);
		try {
			const response = await fetch(`/api/stock/${useItem.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ consumed: quantity }),
			});
			if (response.ok) {
				toast.success("Consumo registrado com sucesso!");
				setShowUseDialog(false);
				setUseItem(null);
				setConsumedQuantity("");
				window.location.reload();
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao registrar consumo");
			}
		} catch (error) {
			console.error("Erro ao registrar consumo:", error);
			toast.error("Erro ao registrar consumo");
		} finally {
			setSaving(false);
		}
	};

	const deleteStockItem = async () => {
		if (!deleteState.item) return;

		await remove(`/api/stock/${deleteState.item.id}`, {
			successMessage: "Item removido do estoque!",
			onSuccess: closeDeleteConfirm,
		});
	};

	const getExpirationColor = (status: string) => {
		switch (status) {
			case "expired":
				return "bg-red-100 text-red-800 border-red-200";
			case "expiring_soon":
				return "bg-orange-100 text-orange-800 border-orange-200";
			default:
				return "bg-green-100 text-green-800 border-green-200";
		}
	};

	const additionalFilters = (
		<>
			<div className="space-y-2">
				<Label>Status dos Produtos</Label>
				<Select
					value={state.filter}
					onValueChange={(value) => updateSingleValue("filter", value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Todos os produtos" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os produtos</SelectItem>
						<SelectItem value="expired">Vencidos</SelectItem>
						<SelectItem value="expiring">Vencendo em breve</SelectItem>
						<SelectItem value="low_stock">Estoque baixo</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>Localização</Label>
				<Select
					value={state.location}
					onValueChange={(value) => updateSingleValue("location", value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Todas as localizações" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as localizações</SelectItem>
						{stats?.locations?.map((loc: string) => (
							<SelectItem key={loc} value={loc}>
								{loc}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>Filtros Rápidos</Label>
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant={state.location === "Geladeira" ? "default" : "outline"}
						size="sm"
						onClick={() => updateSingleValue("location", "Geladeira")}
					>
						Geladeira
					</Button>
					<Button
						variant={state.location === "Despensa" ? "default" : "outline"}
						size="sm"
						onClick={() => updateSingleValue("location", "Despensa")}
					>
						Despensa
					</Button>
					<Button
						variant={state.filter === "expired" ? "destructive" : "outline"}
						size="sm"
						onClick={() => updateSingleValue("filter", "expired")}
					>
						<AlertCircle className="h-3 w-3 mr-1" />
						Vencidos
					</Button>
					<Button
						variant={state.filter === "low_stock" ? "destructive" : "outline"}
						size="sm"
						onClick={() => updateSingleValue("filter", "low_stock")}
					>
						<TrendingDown className="h-3 w-3 mr-1" />
						Baixo
					</Button>
				</div>
			</div>
		</>
	);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Controle de Estoque</h1>
					<p className="text-gray-600 mt-2">
						Gerencie seu estoque doméstico e validades
					</p>
				</div>
				<div className="flex items-center gap-3">
					<RecipeSuggester
						ingredientList={stockIngredients}
						buttonText="O que cozinhar?"
					/>
					<Button onClick={() => setShowAddDialog(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Adicionar ao Estoque
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="stock" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Estoque
					</TabsTrigger>
					<TabsTrigger value="history" className="flex items-center gap-2">
						<History className="h-4 w-4" />
						Histórico
					</TabsTrigger>
				</TabsList>

				<TabsContent value="stock" className="space-y-6">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm text-gray-600">
									Total de Itens
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats?.totalItems || 0}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm text-gray-600">
									Valor do Estoque
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									R$ {(stats?.totalValue || 0).toFixed(2)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm text-gray-600">
									Vencendo
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-orange-600">
									{(stats?.expiringSoon || 0) + (stats?.expiringToday || 0)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm text-gray-600">
									Estoque Baixo
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{stats?.lowStockItems || 0}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="flex items-center gap-2 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Buscar produtos..."
								value={state.search}
								onChange={(e) => updateSingleValue("search", e.target.value)}
								className="pl-10"
							/>
						</div>
						<FilterPopover
							additionalFilters={additionalFilters}
							hasActiveFilters={hasActiveFilters}
							onClearFilters={clearFilters}
						/>
					</div>

					{stockItems.length === 0 ? (
						<Card className="w-full">
							<CardContent className="text-center py-12">
								<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">
									{hasActiveFilters
										? "Nenhum item encontrado"
										: "Estoque vazio"}
								</h3>
								<p className="text-gray-600 mb-4">
									{hasActiveFilters
										? "Tente ajustar os filtros"
										: "Adicione produtos ao seu estoque para começar o controle"}
								</p>
								{hasActiveFilters && (
									<Button variant="outline" onClick={clearFilters}>
										<Filter className="h-4 w-4 mr-2" />
										Limpar Filtros
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{stockItems.map((item) => (
								<Card key={item.id} className="relative">
									<CardHeader className="pb-3">
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<CardTitle className="text-base">
													{item.product.name}
												</CardTitle>
												{item.product.brand && (
													<CardDescription>
														{item.product.brand.name}
													</CardDescription>
												)}
											</div>
											<div className="flex gap-1">
												<Button
													variant="outline"
													size="sm"
													onClick={() => router.push(`/estoque/${item.id}`)}
												>
													<Edit className="h-3 w-3" />
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => openDeleteConfirm(item)}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-600">Quantidade:</span>
											<div className="flex items-center gap-2">
												<Badge
													variant={
														item.stockStatus === "low"
															? "destructive"
															: "secondary"
													}
												>
													{item.quantity} {item.product.unit}
												</Badge>
											</div>
										</div>
										{item.location && (
											<div className="flex items-center justify-between">
												<span className="text-sm text-gray-600">Local:</span>
												<div className="flex items-center gap-1">
													<MapPin className="h-3 w-3 text-gray-400" />
													<span className="text-sm">{item.location}</span>
												</div>
											</div>
										)}
										{item.expirationDate && (
											<div className="flex items-center justify-between">
												<span className="text-sm text-gray-600">Validade:</span>
												<Badge
													className={getExpirationColor(item.expirationStatus)}
												>
													{formatLocalDate(item.expirationDate, "dd/MM/yyyy", {
														locale: ptBR,
													})}
												</Badge>
											</div>
										)}
										{(item.expirationWarning || item.stockWarning) && (
											<div className="space-y-1">
												{item.expirationWarning && (
													<div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
														<AlertTriangle className="h-3 w-3" />
														{item.expirationWarning}
													</div>
												)}
												{item.stockWarning && (
													<div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
														<TrendingDown className="h-3 w-3" />
														{item.stockWarning}
													</div>
												)}
											</div>
										)}
										{item.totalValue && (
											<div className="flex items-center justify-between pt-2 border-t">
												<span className="text-sm text-gray-600">Valor:</span>
												<div className="flex items-center gap-1">
													<DollarSign className="h-3 w-3 text-gray-400" />
													<span className="text-sm font-medium">
														R$ {item.totalValue.toFixed(2)}
													</span>
												</div>
											</div>
										)}
										<div className="flex gap-2 pt-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleUseItem(item)}
												className="flex-1"
											>
												Usar
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openDeleteConfirm(item)}
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="history" className="space-y-6">
					<StockHistory />
				</TabsContent>
			</Tabs>

			<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Plus className="h-5 w-5" />
							Adicionar ao Estoque
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleAddStock} className="space-y-4">
						<div className="space-y-2">
							<Label>Produto *</Label>
							<ProductSelect
								value={formData.productId}
								products={products}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, productId: value }))
								}
								preserveFormData={{
									formData,
									stockItems,
									returnContext: "estoque",
								}}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Quantidade *</Label>
								<Input
									type="number"
									step="0.01"
									min="0.01"
									value={formData.quantity}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											quantity: parseFloat(e.target.value) || 1,
										}))
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label>Preço Unitário</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.unitCost}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											unitCost: parseFloat(e.target.value) || 0,
										}))
									}
									placeholder="0.00"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Data de Validade</Label>
							<Input
								type="date"
								value={toDateInputValue(formData.expirationDate)}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										expirationDate: e.target.value,
									}))
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Localização</Label>
								<Select
									value={formData.location}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, location: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Despensa">Despensa</SelectItem>
										<SelectItem value="Geladeira">Geladeira</SelectItem>
										<SelectItem value="Freezer">Freezer</SelectItem>
										<SelectItem value="Área de Serviço">
											Área de Serviço
										</SelectItem>
										<SelectItem value="Outro">Outro</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Lote/Batch</Label>
								<Input
									value={formData.batchNumber}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											batchNumber: e.target.value,
										}))
									}
									placeholder="Ex: L2024001"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Observações</Label>
							<Input
								value={formData.notes}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, notes: e.target.value }))
								}
								placeholder="Observações sobre o produto..."
							/>
						</div>
						<div className="flex gap-2 pt-4">
							<Button type="submit" disabled={saving} className="flex-1">
								{saving ? "Adicionando..." : "Adicionar"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowAddDialog(false)}
							>
								Cancelar
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Package className="h-5 w-5 text-blue-500" />
							Usar Produto do Estoque
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{useItem && (
							<>
								<div className="space-y-2">
									<p className="font-medium">{useItem.product.name}</p>
									<p className="text-sm text-gray-600">
										Disponível: {useItem.quantity} {useItem.product.unit}
									</p>
								</div>
								<div className="space-y-2">
									<Label>Quantidade consumida</Label>
									<Input
										type="number"
										step="0.01"
										min="0.01"
										max={useItem.quantity}
										value={consumedQuantity}
										onChange={(e) => setConsumedQuantity(e.target.value)}
										placeholder={`Máx: ${useItem.quantity} ${useItem.product.unit}`}
										disabled={saving}
									/>
								</div>
								<div className="flex gap-2 pt-4">
									<Button
										onClick={handleConsumeItem}
										disabled={
											saving ||
											!consumedQuantity ||
											parseFloat(consumedQuantity) <= 0
										}
										className="flex-1"
									>
										{saving ? "Registrando..." : "Registrar Consumo"}
									</Button>
									<Button
										variant="outline"
										onClick={() => setShowUseDialog(false)}
										disabled={saving}
									>
										Cancelar
									</Button>
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p>
							Tem certeza que deseja remover{" "}
							<strong>{deleteState.item?.product?.name}</strong> do estoque?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteStockItem}
								disabled={loading}
								className="flex-1"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{loading ? "Removendo..." : "Sim, Remover"}
							</Button>
							<Button variant="outline" onClick={closeDeleteConfirm}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
