"use client";

import {
	ArrowLeft,
	Check,
	ChevronLeft,
	DollarSign,
	Edit,
	LayoutList,
	List,
	Minus,
	Package,
	Plus,
	Save,
	Settings2,
	ShoppingCart,
	SortAsc,
	Tag,
	Trash2,
	Undo2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BestPriceAlert } from "@/components/best-price-alert";
import { OptimizedShoppingRoute } from "@/components/optimized-shopping-route";
import { BrandSelect } from "@/components/selects/brand-select";
import { CategorySelect } from "@/components/selects/category-select";
import { ProductSelect } from "@/components/selects/product-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TempStorage } from "@/lib/temp-storage";
import { Product } from "@/types";

interface ShoppingListItem {
	id: string;
	quantity: number;
	estimatedPrice?: number;
	isChecked: boolean;
	bestPriceAlert?: any;
	productName?: string;
	productUnit?: string;
	product?: {
		id: string;
		name: string;
		unit: string;
		brand?: {
			name: string;
		};
		category?: {
			id: string;
			name: string;
			icon?: string;
		};
	};
}

interface ShoppingListDetails {
	id: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	items: ShoppingListItem[];
}

export default function ListaDetalhesPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [products, setProducts] = useState<any[]>([]);
	const listId = params.id as string;

	const [list, setList] = useState<ShoppingListDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [isShoppingMode, setIsShoppingMode] = useState(false);
	const [sortOrder, setSortOrder] = useState<"default" | "category">("default");

	const [editingList, setEditingList] = useState(false);
	const [editName, setEditName] = useState("");
	const [saving, setSaving] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Estados para adicionar item
	const [showAddItem, setShowAddItem] = useState(false);
	const [newItem, setNewItem] = useState({
		productId: "",
		quantity: 1,
		estimatedPrice: 0,
	});
	const [addingItem, setAddingItem] = useState(false);

	// Estados para editar item
	const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
	const [editItemData, setEditItemData] = useState({
		quantity: 1,
		estimatedPrice: 0,
	});
	const [updatingItem, setUpdatingItem] = useState(false);

	// Estados para excluir item
	const [deleteItemConfirm, setDeleteItemConfirm] =
		useState<ShoppingListItem | null>(null);
	const [deletingItem, setDeletingItem] = useState(false);

	// Estados para produto rápido
	const [showQuickProduct, setShowQuickProduct] = useState(false);
	const [quickProduct, setQuickProduct] = useState({
		name: "",
		categoryId: "",
		unit: "unidade",
		brandId: "",
	});
	const [savingQuickProduct, setSavingQuickProduct] = useState(false);

	// Estados para roteiro otimizado
	const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);

	useEffect(() => {
		if (listId) {
			fetchListDetails();
		}
	}, [listId]);

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			const response = await fetch("/api/products");
			if (response.ok) {
				setProducts(await response.json());
			}
		} catch (error) {
			console.error("Erro ao carregar produtos:", error);
		}
	};

	useEffect(() => {
		// Restaurar dados preservados após criação de produto
		const storageKey = searchParams.get("storageKey");
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey);
			if (preservedData) {
				try {
					// Restaurar dados do item novo
					if (preservedData.newItem) {
						setNewItem(preservedData.newItem);
					}

					// Se um novo produto foi criado, selecionar e reabrir dialog
					if (preservedData.newProductId) {
						setTimeout(() => {
							setNewItem((prev) => ({
								...prev,
								productId: preservedData.newProductId,
							}));
							setShowAddItem(true); // Reabrir dialog
						}, 1000); // Aguardar produtos carregarem
					}

					// Limpar localStorage e URL
					TempStorage.remove(storageKey);
					window.history.replaceState({}, "", `/lista/${listId}`);
				} catch (error) {
					console.error("Erro ao restaurar dados:", error);
					TempStorage.remove(storageKey);
				}
			}
		}
	}, [searchParams]);

	const fetchListDetails = async () => {
		try {
			const response = await fetch(`/api/shopping-lists/${listId}`);

			if (!response.ok) {
				if (response.status === 404) {
					toast.error("Lista não encontrada");
					router.push("/lista");
					return;
				}
				throw new Error("Erro ao buscar lista");
			}

			const data = await response.json();
			setList(data);
		} catch (error) {
			console.error("Erro ao buscar lista:", error);
			toast.error("Erro ao carregar lista");
			router.push("/lista");
		} finally {
			setLoading(false);
		}
	};

	const updateItemInServer = async (itemId: string, updatedData: any) => {
		try {
			const response = await fetch(
				`/api/shopping-lists/${listId}/items/${itemId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedData),
				},
			);
			if (!response.ok) {
				throw new Error("Falha ao atualizar item no servidor");
			}
		} catch (error) {
			console.error("Erro ao atualizar item:", error);
			toast.error("Erro ao salvar a alteração. Tente novamente.");
		}
	};

	const toggleItem = async (itemId: string, currentStatus: boolean) => {
		if (!list) return;

		// Atualização otimista
		setList((prev) =>
			prev
				? {
						...prev,
						items: prev.items.map((item) =>
							item.id === itemId
								? { ...item, isChecked: !currentStatus }
								: item,
						),
					}
				: null,
		);

		await updateItemInServer(itemId, { isChecked: !currentStatus });
	};

	const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
		if (!list) return;
		setList((prev) =>
			prev
				? {
						...prev,
						items: prev.items.map((item) =>
							item.id === itemId ? { ...item, quantity: newQuantity } : item,
						),
					}
				: null,
		);
		updateItemInServer(itemId, { quantity: newQuantity });
	};

	const handleUpdateEstimatedPrice = (itemId: string, newPrice: number) => {
		if (!list) return;

		const item = list.items.find((item) => item.id === itemId);
		if (item?.product?.id && newPrice > 0) {
			setTimeout(() => {
				checkBestPrice(itemId, item.product!.id, newPrice);
			}, 1000);
		}

		setList((prev) =>
			prev
				? {
						...prev,
						items: prev.items.map((item) =>
							item.id === itemId ? { ...item, estimatedPrice: newPrice } : item,
						),
					}
				: null,
		);
		updateItemInServer(itemId, { estimatedPrice: newPrice });
	};

	const checkBestPrice = async (
		itemId: string,
		productId: string,
		unitPrice: number,
	) => {
		if (!productId || !unitPrice) return;

		try {
			const response = await fetch("/api/best-price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId,
					currentPrice: unitPrice,
				}),
			});

			const bestPriceData = await response.json();

			setList((prev) =>
				prev
					? {
							...prev,
							items: prev.items.map((item) =>
								item.id === itemId
									? { ...item, bestPriceAlert: bestPriceData }
									: item,
							),
						}
					: null,
			);
		} catch (error) {
			console.error("Erro ao verificar melhor preço:", error);
		}
	};

	const openEditDialog = () => {
		setEditingList(true);
		setEditName(list?.name || "");
	};

	const closeEditDialog = () => {
		setEditingList(false);
		setEditName("");
	};

	const updateList = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!list || !editName.trim()) return;

		setSaving(true);
		try {
			const response = await fetch(`/api/shopping-lists/${list.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName.trim() }),
			});

			if (response.ok) {
				const updatedList = await response.json();
				setList((prev) => (prev ? { ...prev, name: updatedList.name } : null));
				closeEditDialog();
				toast.success("Lista atualizada com sucesso");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao atualizar lista");
			}
		} catch (error) {
			console.error("Erro ao atualizar lista:", error);
			toast.error("Erro ao atualizar lista");
		} finally {
			setSaving(false);
		}
	};

	const deleteList = async () => {
		if (!list) return;

		setDeleting(true);
		try {
			const response = await fetch(`/api/shopping-lists/${list.id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Lista excluída com sucesso");
				router.push("/lista");
			} else {
				toast.error("Erro ao excluir lista");
			}
		} catch (error) {
			console.error("Erro ao excluir lista:", error);
			toast.error("Erro ao excluir lista");
		} finally {
			setDeleting(false);
			setDeleteConfirm(false);
		}
	};

	const openAddItem = () => {
		setNewItem({ productId: "", quantity: 1, estimatedPrice: 0 });
		setShowAddItem(true);
	};

	const addItem = async () => {
		if (!newItem.productId || newItem.quantity <= 0) {
			toast.error("Selecione um produto e informe a quantidade");
			return;
		}

		setAddingItem(true);
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId: newItem.productId,
					quantity: newItem.quantity,
				}),
			});

			if (response.ok) {
				setShowAddItem(false);
				fetchListDetails();
				toast.success("Item adicionado com sucesso");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao adicionar item");
			}
		} catch (error) {
			console.error("Erro ao adicionar item:", error);
			toast.error("Erro ao adicionar item");
		} finally {
			setAddingItem(false);
		}
	};

	const openEditItem = (item: ShoppingListItem) => {
		setEditingItem(item);
		setEditItemData({
			quantity: item.quantity,
			estimatedPrice: item.estimatedPrice || 0,
		});
	};

	const updateItem = async () => {
		if (!editingItem) return;

		setUpdatingItem(true);
		try {
			const response = await fetch(
				`/api/shopping-lists/${listId}/items/${editingItem.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						quantity: editItemData.quantity,
						estimatedPrice: editItemData.estimatedPrice,
					}),
				},
			);

			if (response.ok) {
				setEditingItem(null);
				fetchListDetails();
				toast.success("Item atualizado com sucesso");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao atualizar item");
			}
		} catch (error) {
			console.error("Erro ao atualizar item:", error);
			toast.error("Erro ao atualizar item");
		} finally {
			setUpdatingItem(false);
		}
	};

	const confirmDeleteItem = (item: ShoppingListItem) => {
		setDeleteItemConfirm(item);
	};

	const deleteItem = async () => {
		if (!deleteItemConfirm) return;

		setDeletingItem(true);
		try {
			const response = await fetch(
				`/api/shopping-lists/${listId}/items/${deleteItemConfirm.id}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				setDeleteItemConfirm(null);
				fetchListDetails();
				toast.success("Item removido com sucesso");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao remover item");
			}
		} catch (error) {
			console.error("Erro ao remover item:", error);
			toast.error("Erro ao remover item");
		} finally {
			setDeletingItem(false);
		}
	};

	const createQuickProduct = async () => {
		if (!quickProduct.name.trim()) {
			toast.error("Nome do produto é obrigatório");
			return;
		}

		setSavingQuickProduct(true);

		try {
			const response = await fetch("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: quickProduct.name,
					categoryId: quickProduct.categoryId || null,
					unit: quickProduct.unit,
					brandId: quickProduct.brandId || null,
				}),
			});

			if (response.ok) {
				const newProduct = await response.json();
				setProducts((prev) => [...prev, newProduct]);
				setNewItem((prev) => ({ ...prev, productId: newProduct.id }));
				setShowQuickProduct(false);
				toast.success("Produto criado com sucesso");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao criar produto");
			}
		} catch (error) {
			console.error("Erro ao criar produto:", error);
			toast.error("Erro ao criar produto");
		} finally {
			setSavingQuickProduct(false);
		}
	};

	const handleFinalizePurchase = () => {
		if (!list) return;

		// Filtrar apenas itens marcados como comprados
		const checkedItems = list.items.filter((item) => item.isChecked);

		if (checkedItems.length === 0) {
			toast.info("Marque os itens comprados na lista para finalizar a compra.");
			return;
		}

		const purchaseItems = checkedItems.map((item) => ({
			productId: item.product?.id || "",
			quantity: item.quantity,
			unitPrice: item.estimatedPrice || 0,
		}));

		// Salvar dados temporariamente
		const storageKey = TempStorage.save({
			items: purchaseItems,
		});

		// Redirecionar para a página de nova compra
		router.push(`/compras/nova?storageKey=${storageKey}`);
	};

	const completedItems =
		list?.items.filter((item) => item.isChecked).length || 0;
	const totalItems = list?.items.length || 0;
	const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

	const getSortedItems = () => {
		if (!list) return [];
		if (sortOrder === "default") {
			return [...list.items].sort((a, b) => {
				if (a.isChecked && !b.isChecked) return 1;
				if (!a.isChecked && b.isChecked) return -1;
				return 0;
			});
		}
		if (sortOrder === "category") {
			return [...list.items].sort((a, b) => {
				const categoryA = a.product?.category?.name || "Sem Categoria";
				const categoryB = b.product?.category?.name || "Sem Categoria";
				return categoryA.localeCompare(categoryB);
			});
		}
		return list.items;
	};

	const sortedItems = getSortedItems();

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
					<div className="animate-pulse h-8 w-60 bg-gray-200 rounded"></div>
				</div>
				<div className="animate-pulse h-40 bg-gray-200 rounded"></div>
			</div>
		);
	}

	if (!list) {
		return null;
	}

	// --- MODO DE COMPRA FOCADO ---
	if (isShoppingMode) {
		const itemsByCategory = sortedItems.reduce((acc: any, item) => {
			const categoryName = item.product?.category?.name || "Sem Categoria";
			if (!acc[categoryName]) {
				acc[categoryName] = {
					icon: item.product?.category?.icon || "📦",
					items: [],
				};
			}
			acc[categoryName].items.push(item);
			return acc;
		}, {});

		return (
			<div className="space-y-4">
				{/* Header do Modo de Compra */}
				<div className="flex justify-between items-center bg-background p-4 md:p-6 sticky top-0 z-10 border-b">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsShoppingMode(false)}
					>
						<ChevronLeft className="h-5 w-5" />
					</Button>
					<div className="text-lg font-bold flex-1 text-center">
						{list.name}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<Settings2 className="h-5 w-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuRadioGroup
								value={sortOrder}
								onValueChange={(value) =>
									setSortOrder(value as "default" | "category")
								}
							>
								<DropdownMenuRadioItem value="default">
									<SortAsc className="h-4 w-4 mr-2" />
									Padrão
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="category">
									<LayoutList className="h-4 w-4 mr-2" />
									Por Categoria
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="px-4 md:px-6 space-y-4">
					{/* Botão de Finalizar Compra */}
					<Button
						onClick={handleFinalizePurchase}
						disabled={completedItems === 0}
						className="w-full"
					>
						<Save className="h-4 w-4 mr-2" />
						Finalizar Compra ({completedItems} itens)
					</Button>
				</div>

				{/* Itens da Lista no Modo de Compra */}
				<div className="px-4 md:px-6 space-y-6">
					{Object.entries(itemsByCategory).map(([category, data]: any) => (
						<div key={category} className="space-y-2">
							<div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
								<span className="text-xl">{data.icon}</span>
								<h3 className="font-semibold text-lg">{category}</h3>
							</div>

							<div className="space-y-2">
								{data.items.map((item: ShoppingListItem) => (
									<div
										key={item.id}
										className={`
                      p-4 rounded-lg cursor-pointer transition-all duration-200
                      ${
												item.isChecked
													? "bg-green-100 text-gray-500 line-through"
													: "bg-card shadow-sm"
											}
                    `}
									>
										<div className="flex items-center gap-4">
											<button
												onClick={() => toggleItem(item.id, item.isChecked)}
												className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
													item.isChecked
														? "bg-green-500 border-green-500 text-white"
														: "border-gray-300"
												}`}
											>
												{item.isChecked && <Check className="h-5 w-5" />}
											</button>

											<div className="flex-1">
												<p
													className={`font-medium text-lg ${item.isChecked ? "line-through text-gray-500" : "text-gray-900"}`}
												>
													{item.product?.name || item.productName}
												</p>
												<p className="text-sm text-gray-600">
													{item.product?.brand?.name &&
														`(${item.product.brand.name}) `}
													{item.product?.category?.name &&
														`• ${item.product.category.name}`}
												</p>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4 mt-4">
											{/* Campo de Quantidade */}
											<div className="space-y-1">
												<Label>Quantidade</Label>
												<div className="flex items-center gap-2">
													<Button
														type="button"
														variant="outline"
														size="icon"
														onClick={() =>
															handleUpdateQuantity(
																item.id,
																Math.max(1, item.quantity - 1),
															)
														}
														className="h-8 w-8"
													>
														<Minus className="h-4 w-4" />
													</Button>
													<Input
														type="number"
														step="0.01"
														min="0.01"
														value={item.quantity}
														onChange={(e) =>
															handleUpdateQuantity(
																item.id,
																parseFloat(e.target.value) || 1,
															)
														}
														className="text-center"
													/>
													<Button
														type="button"
														variant="outline"
														size="icon"
														onClick={() =>
															handleUpdateQuantity(item.id, item.quantity + 1)
														}
														className="h-8 w-8"
													>
														<Plus className="h-4 w-4" />
													</Button>
												</div>
											</div>

											{/* Campo de Preço Unitário */}
											<div className="space-y-1">
												<Label>Preço Estimado</Label>
												<Input
													type="number"
													step="0.01"
													min="0"
													value={item.estimatedPrice || ""}
													onChange={(e) =>
														handleUpdateEstimatedPrice(
															item.id,
															parseFloat(e.target.value) || 0,
														)
													}
													placeholder="0.00"
												/>
											</div>
										</div>

										{/* Alert de Menor Preço */}
										{item.bestPriceAlert &&
											item.bestPriceAlert.isBestPrice &&
											!item.bestPriceAlert.isFirstRecord && (
												<BestPriceAlert
													productName={
														item.product?.name || item.productName || "Produto"
													}
													currentPrice={item.estimatedPrice || 0}
													previousBestPrice={
														item.bestPriceAlert.previousBestPrice
													}
													totalRecords={item.bestPriceAlert.totalRecords}
													onClose={() => {
														setList((prev) =>
															prev
																? {
																		...prev,
																		items: prev.items.map((listItem) =>
																			listItem.id === item.id
																				? { ...listItem, bestPriceAlert: null }
																				: listItem,
																		),
																	}
																: null,
														);
													}}
												/>
											)}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// --- VISUALIZAÇÃO PADRÃO ---
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/lista">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div className="flex-1">
					<h1 className="text-3xl font-bold">{list.name}</h1>
					<p className="text-gray-600 mt-1">
						{totalItems} itens • {completedItems} concluídos (
						{progress.toFixed(0)}%)
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="default"
						size="sm"
						onClick={() => setIsShoppingMode(true)}
					>
						<ShoppingCart className="h-4 w-4 mr-2" />
						Iniciar Compras
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowOptimizedRoute(true)}
					>
						<DollarSign className="h-4 w-4 mr-2" />
						Otimizar Roteiro
					</Button>
					<Link href={`/comparacao?lista=${listId}`}>
						<Button variant="outline" size="sm">
							<DollarSign className="h-4 w-4 mr-2" />
							Comparar Preços
						</Button>
					</Link>
					<Button variant="outline" size="sm" onClick={openEditDialog}>
						<Edit className="h-4 w-4 mr-2" />
						Editar
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setDeleteConfirm(true)}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Excluir
					</Button>
				</div>
			</div>

			{/* Barra de Progresso */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">Progresso da Lista</span>
						<span className="text-sm text-gray-600">
							{completedItems}/{totalItems}
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-green-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						></div>
					</div>
				</CardContent>
			</Card>

			{/* Lista de Itens */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Itens da Lista
						</CardTitle>
						<Button onClick={openAddItem} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Adicionar Item
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{list.items.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<Package className="h-12 w-12 mx-auto mb-4" />
							<p className="text-lg font-medium mb-2">Lista vazia</p>
							<p className="text-gray-600">
								Adicione itens para começar suas compras
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{list.items.map((item) => (
								<div
									key={item.id}
									className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 ${
										item.isChecked
											? "bg-green-50 border-green-200"
											: "bg-white hover:bg-gray-50"
									}`}
								>
									<button
										onClick={() => toggleItem(item.id, item.isChecked)}
										className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
											item.isChecked
												? "bg-green-500 border-green-500 text-white"
												: "border-gray-300 hover:border-green-400"
										}`}
									>
										{item.isChecked && <Check className="h-4 w-4" />}
									</button>

									<div className="flex-1">
										<div
											className={`font-medium transition-all duration-200 ${
												item.isChecked
													? "line-through text-gray-500"
													: "text-gray-900"
											}`}
										>
											{item.product?.name || item.productName}
											{item.product?.brand && (
												<span className="text-gray-500 font-normal ml-2">
													- {item.product.brand.name}
												</span>
											)}
										</div>
										<div className="text-sm text-gray-600">
											{item.quantity}{" "}
											{item.product?.unit || item.productUnit || "unidades"}
											{item.estimatedPrice && (
												<span className="ml-2">
													• R${" "}
													{(item.quantity * item.estimatedPrice).toFixed(2)}
												</span>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2">
										{item.estimatedPrice && (
											<div className="text-sm font-medium mr-2">
												R$ {item.estimatedPrice.toFixed(2)}
											</div>
										)}
										<Button
											variant="outline"
											size="sm"
											onClick={() => openEditItem(item)}
											title="Editar item"
										>
											<Edit className="h-3 w-3" />
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => confirmDeleteItem(item)}
											title="Remover item"
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Resumo */}
			{list.items.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Resumo</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
							<div>
								<div className="text-2xl font-bold text-blue-600">
									{totalItems}
								</div>
								<div className="text-sm text-gray-600">Total de Itens</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">
									{completedItems}
								</div>
								<div className="text-sm text-gray-600">Concluídos</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-yellow-600">
									{totalItems - completedItems}
								</div>
								<div className="text-sm text-gray-600">Pendentes</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-purple-600">
									R${" "}
									{list.items
										.reduce(
											(sum, item) =>
												sum + item.quantity * (item.estimatedPrice || 0),
											0,
										)
										.toFixed(2)}
								</div>
								<div className="text-sm text-gray-600">Total Estimado</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">
									R${" "}
									{list.items
										.filter((item) => item.isChecked)
										.reduce(
											(sum, item) =>
												sum + item.quantity * (item.estimatedPrice || 0),
											0,
										)
										.toFixed(2)}
								</div>
								<div className="text-sm text-gray-600">Total Concluído</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Dialog de Edição */}
			<Dialog
				open={editingList}
				onOpenChange={(open) => !open && closeEditDialog()}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5" />
							Editar Lista
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={updateList} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="editListName">Nome da Lista *</Label>
							<Input
								id="editListName"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								placeholder="Ex: Compras da Semana"
								required
							/>
						</div>
						<div className="flex gap-2 pt-4">
							<Button type="submit" disabled={saving} className="flex-1">
								{saving ? "Salvando..." : "Salvar"}
							</Button>
							<Button type="button" variant="outline" onClick={closeEditDialog}>
								Cancelar
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog de Confirmação de Exclusão */}
			<Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p>
							Tem certeza que deseja excluir a lista{" "}
							<strong>{list.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita e todos os itens da lista serão
							perdidos.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteList}
								disabled={deleting}
								className="flex-1"
							>
								{deleting ? "Excluindo..." : "Sim, Excluir"}
							</Button>
							<Button variant="outline" onClick={() => setDeleteConfirm(false)}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog para Adicionar Item */}
			<Dialog open={showAddItem} onOpenChange={setShowAddItem}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Plus className="h-5 w-5" />
							Adicionar Item à Lista
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label>Produto *</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setQuickProduct({
											name: "",
											categoryId: "",
											unit: "unidade",
											brandId: "",
										});
										setShowQuickProduct(true);
									}}
								>
									<Plus className="h-3 w-3 mr-1" />
									Novo Produto
								</Button>
							</div>
							<ProductSelect
								value={newItem.productId}
								products={products}
								onValueChange={(value) =>
									setNewItem((prev) => ({ ...prev, productId: value }))
								}
								preserveFormData={{
									listData: { id: listId, name: list?.name },
									newItem,
									returnContext: "listDetails",
								}}
							/>
						</div>

						<div className="space-y-2">
							<Label>Quantidade *</Label>
							<Input
								type="number"
								step="0.01"
								min="0.01"
								value={newItem.quantity}
								onChange={(e) =>
									setNewItem((prev) => ({
										...prev,
										quantity: parseFloat(e.target.value) || 1,
									}))
								}
								placeholder="1.00"
							/>
						</div>

						<div className="space-y-2">
							<Label>Preço Estimado (opcional)</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={newItem.estimatedPrice || ""}
								onChange={(e) =>
									setNewItem((prev) => ({
										...prev,
										estimatedPrice: parseFloat(e.target.value) || 0,
									}))
								}
								placeholder="0.00"
							/>
						</div>

						<div className="flex gap-2 pt-4">
							<Button
								onClick={addItem}
								disabled={addingItem}
								className="flex-1"
							>
								<Save className="h-4 w-4 mr-2" />
								{addingItem ? "Adicionando..." : "Adicionar"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowAddItem(false)}
							>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog para Editar Item */}
			<Dialog
				open={!!editingItem}
				onOpenChange={(open) => !open && setEditingItem(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Edit className="h-5 w-5" />
							Editar Item
						</DialogTitle>
					</DialogHeader>
					{editingItem && (
						<div className="space-y-4">
							<div className="p-3 bg-gray-50 rounded">
								<p className="font-medium">
									{editingItem.product?.name || editingItem.productName}
								</p>
								{editingItem.product?.brand && (
									<p className="text-sm text-gray-600">
										{editingItem.product.brand.name}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>Quantidade *</Label>
								<Input
									type="number"
									step="0.01"
									min="0.01"
									value={editItemData.quantity}
									onChange={(e) =>
										setEditItemData((prev) => ({
											...prev,
											quantity: parseFloat(e.target.value) || 1,
										}))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Preço Estimado (opcional)</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={editItemData.estimatedPrice || ""}
									onChange={(e) => {
										const newPrice = parseFloat(e.target.value) || 0;
										setEditItemData((prev) => ({
											...prev,
											estimatedPrice: newPrice,
										}));

										if (editingItem?.product?.id && newPrice > 0) {
											setTimeout(() => {
												checkBestPrice(
													editingItem.id,
													editingItem.product!.id,
													newPrice,
												);
											}, 1000);
										}
									}}
									placeholder="0.00"
								/>
							</div>

							{/* Alert de Menor Preço no Dialog de Edição */}
							{editingItem?.bestPriceAlert &&
								editingItem.bestPriceAlert.isBestPrice &&
								!editingItem.bestPriceAlert.isFirstRecord && (
									<BestPriceAlert
										productName={
											editingItem.product?.name ||
											editingItem.productName ||
											"Produto"
										}
										currentPrice={editItemData.estimatedPrice || 0}
										previousBestPrice={
											editingItem.bestPriceAlert.previousBestPrice
										}
										totalRecords={editingItem.bestPriceAlert.totalRecords}
										onClose={() => {
											setList((prev) =>
												prev
													? {
															...prev,
															items: prev.items.map((item) =>
																item.id === editingItem.id
																	? { ...item, bestPriceAlert: null }
																	: item,
															),
														}
													: null,
											);
											setEditingItem((prev) =>
												prev ? { ...prev, bestPriceAlert: null } : null,
											);
										}}
									/>
								)}

							<div className="flex gap-2 pt-4">
								<Button
									onClick={updateItem}
									disabled={updatingItem}
									className="flex-1"
								>
									<Save className="h-4 w-4 mr-2" />
									{updatingItem ? "Salvando..." : "Salvar"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setEditingItem(null)}
								>
									Cancelar
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de Confirmação para Excluir Item */}
			<Dialog
				open={!!deleteItemConfirm}
				onOpenChange={(open) => !open && setDeleteItemConfirm(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Remover Item
						</DialogTitle>
					</DialogHeader>
					{deleteItemConfirm && (
						<div className="space-y-4">
							<p>
								Tem certeza que deseja remover{" "}
								<strong>
									{deleteItemConfirm.product?.name ||
										deleteItemConfirm.productName}
								</strong>{" "}
								da lista?
							</p>
							<p className="text-sm text-gray-600">
								Esta ação não pode ser desfeita.
							</p>
							<div className="flex gap-2 pt-4">
								<Button
									variant="destructive"
									onClick={deleteItem}
									disabled={deletingItem}
									className="flex-1"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									{deletingItem ? "Removendo..." : "Sim, Remover"}
								</Button>
								<Button
									variant="outline"
									onClick={() => setDeleteItemConfirm(null)}
								>
									Cancelar
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog para Criar Produto Rápido */}
			<Dialog open={showQuickProduct} onOpenChange={setShowQuickProduct}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Plus className="h-5 w-5" />
							Adicionar Produto Rápido
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="quickProductName">Nome do Produto *</Label>
							<Input
								id="quickProductName"
								value={quickProduct.name}
								onChange={(e) =>
									setQuickProduct((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="Ex: Leite Integral"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="quickProductCategory">Categoria</Label>
							<CategorySelect
								value={quickProduct.categoryId}
								onValueChange={(value) =>
									setQuickProduct((prev) => ({ ...prev, categoryId: value }))
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="quickProductUnit">Unidade</Label>
								<Select
									value={quickProduct.unit}
									onValueChange={(value) =>
										setQuickProduct((prev) => ({ ...prev, unit: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unidade">Unidade</SelectItem>
										<SelectItem value="kg">Kg</SelectItem>
										<SelectItem value="g">Gramas</SelectItem>
										<SelectItem value="l">Litros</SelectItem>
										<SelectItem value="ml">ML</SelectItem>
										<SelectItem value="pacote">Pacote</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="quickProductBrand">Marca</Label>
								<BrandSelect
									value={quickProduct.brandId || ""}
									onValueChange={(value) =>
										setQuickProduct((prev) => ({ ...prev, brandId: value }))
									}
								/>
							</div>
						</div>

						<div className="flex gap-2 pt-4">
							<Button
								onClick={createQuickProduct}
								disabled={savingQuickProduct}
								className="flex-1"
							>
								<Save className="h-4 w-4 mr-2" />
								{savingQuickProduct ? "Criando..." : "Criar e Usar"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowQuickProduct(false)}
							>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Componente de Roteiro Otimizado */}
			<OptimizedShoppingRoute
				listId={listId}
				listName={list.name}
				isOpen={showOptimizedRoute}
				onClose={() => setShowOptimizedRoute(false)}
			/>
		</div>
	);
}
