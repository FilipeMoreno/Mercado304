"use client"

import { Package, Plus, ShoppingCart } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import type * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { OptimizedShoppingRoute } from "@/components/optimized-shopping-route"
import { TemporaryItemForm } from "@/components/temporary-item-form"
import { TemporaryItemCard } from "@/components/temporary-item-card"
import {
	AddItemDialog,
	DeleteItemDialog,
	DeleteListDialog,
	EditItemDialog,
	EditListDialog,
	ProgressBar,
	QuickProductDialog,
	ShoppingListHeader,
	ShoppingListItemComponent,
	ShoppingMode,
	ShoppingSummary,
} from "@/components/shopping-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TempStorage } from "@/lib/temp-storage"
import { useProactiveAiStore } from "@/store/useProactiveAiStore"

interface ShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number
	isChecked: boolean
	bestPriceAlert?: any
	productName?: string
	productUnit?: string
	// Campos para itens temporários
	isTemporary?: boolean
	tempDescription?: string
	tempBarcode?: string
	tempBrand?: string
	tempCategory?: string
	tempNotes?: string
	product?: {
		id: string
		name: string
		unit: string
		brand?: {
			name: string
		}
		category?: {
			id: string
			name: string
			icon?: string
		}
	}
}

interface ShoppingListDetails {
	id: string
	name: string
	isActive: boolean
	createdAt: string
	items: ShoppingListItem[]
}

export default function ListaDetalhesPage() {
	const params = useParams()
	const router = useRouter()
	const { showInsight } = useProactiveAiStore()
	const searchParams = useSearchParams()
	const [products, setProducts] = useState<any[]>([])
	const listId = params.id as string

	const [list, setList] = useState<ShoppingListDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [isShoppingMode, setIsShoppingMode] = useState(false)
	const [sortOrder, setSortOrder] = useState<"default" | "category">("default")

	// Estados para modais
	const [editingList, setEditingList] = useState(false)
	const [saving, setSaving] = useState(false)
	const [deleteConfirm, setDeleteConfirm] = useState(false)
	const [deleting, setDeleting] = useState(false)

	// Estados para adicionar item
	const [showAddItem, setShowAddItem] = useState(false)
	const [newItem, setNewItem] = useState({
		productId: "",
		quantity: 1,
		estimatedPrice: 0,
	})
	const [addingItem, setAddingItem] = useState(false)

	// Estados para editar item
	const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null)
	const [editItemData, setEditItemData] = useState({
		quantity: 1,
		estimatedPrice: 0,
	})
	const [updatingItem, setUpdatingItem] = useState(false)

	// Estados para excluir item
	const [deleteItemConfirm, setDeleteItemConfirm] = useState<ShoppingListItem | null>(null)
	const [deletingItem, setDeletingItem] = useState(false)

	// Estados para produto rápido
	const [showQuickProduct, setShowQuickProduct] = useState(false)
	const [quickProduct, setQuickProduct] = useState({
		name: "",
		categoryId: "",
		unit: "unidade",
		brandId: "",
	})
	const [savingQuickProduct, setSavingQuickProduct] = useState(false)

	// Estados para roteiro otimizado
	const [showOptimizedRoute, setShowOptimizedRoute] = useState(false)

	// Estados para itens temporários
	const [showTemporaryForm, setShowTemporaryForm] = useState(false)

	const fetchListDetails = useCallback(async () => {
		try {
			const response = await fetch(`/api/shopping-lists/${listId}`)

			if (!response.ok) {
				if (response.status === 404) {
					toast.error("Lista não encontrada")
					router.push("/lista")
					return
				}
				throw new Error("Erro ao buscar lista")
			}

			const data = await response.json()
			setList(data)
		} catch (error) {
			console.error("Erro ao buscar detalhes da lista:", error)
			toast.error("Erro ao carregar lista")
		} finally {
			setLoading(false)
		}
	}, [listId, router])

	const fetchProducts = useCallback(async () => {
		try {
			const response = await fetch("/api/products")
			if (response.ok) {
				setProducts(await response.json())
			}
		} catch (error) {
			console.error("Erro ao carregar produtos:", error)
		}
	}, [])

	useEffect(() => {
		if (listId) {
			fetchListDetails()
		}
	}, [listId, fetchListDetails])

	useEffect(() => {
		fetchProducts()
	}, [fetchProducts])

	const checkQuantitySuggestion = async (productId: string, itemId: string) => {
		try {
			const response = await fetch("/api/ai/quantity-suggestion", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId, listId, itemId }),
			})
			const data = await response.json()
			if (data.suggestion) {
				showInsight({
					message: data.suggestion.message,
					actionLabel: data.suggestion.actionLabel,
					actionPayload: data.suggestion.payload,
					onAction: handleUpdateQuantityFromInsight,
				})
			}
		} catch (error) {
			console.error("Erro ao obter sugestão de quantidade:", error)
		}
	}

	const handleUpdateQuantityFromInsight = async (payload: { itemId: string; newQuantity: number }) => {
		if (!payload) return
		await updateItemInServer(payload.itemId, { quantity: payload.newQuantity })

		setList((prev) =>
			prev
				? {
						...prev,
						items: prev.items.map((item) =>
							item.id === payload.itemId ? { ...item, quantity: payload.newQuantity } : item,
						),
					}
				: null,
		)

		toast.success("Quantidade do item atualizada!")
	}

	useEffect(() => {
		// Restaurar dados preservados após criação de produto
		const storageKey = searchParams.get("storageKey")
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey)
			if (preservedData) {
				try {
					if (preservedData.newItem) {
						setNewItem(preservedData.newItem)
					}

					if (preservedData.newProductId) {
						setTimeout(() => {
							setNewItem((prev) => ({
								...prev,
								productId: preservedData.newProductId,
							}))
							setShowAddItem(true)
						}, 1000)
					}

					TempStorage.remove(storageKey)
					window.history.replaceState({}, "", `/lista/${listId}`)
				} catch (error) {
					console.error("Erro ao restaurar dados:", error)
					TempStorage.remove(storageKey)
				}
			}
		}
	}, [searchParams, listId])

	const updateItemInServer = async (itemId: string, updatedData: any) => {
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updatedData),
			})
			if (!response.ok) {
				throw new Error("Falha ao atualizar item no servidor")
			}
		} catch (error) {
			console.error("Erro ao atualizar item:", error)
			toast.error("Erro ao salvar a alteração. Tente novamente.")
		}
	}

	const toggleItem = useCallback(
		async (itemId: string, currentStatus: boolean) => {
			if (!list) return

			setList((prev) =>
				prev
					? {
							...prev,
							items: prev.items.map((item) => (item.id === itemId ? { ...item, isChecked: !currentStatus } : item)),
						}
					: null,
			)

			await updateItemInServer(itemId, { isChecked: !currentStatus })
		},
		[list],
	)

	const handleUpdateQuantity = useCallback(
		(itemId: string, newQuantity: number) => {
			if (!list) return
			setList((prev) =>
				prev
					? {
							...prev,
							items: prev.items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)),
						}
					: null,
			)
			updateItemInServer(itemId, { quantity: newQuantity })
		},
		[list],
	)

	const handleUpdateEstimatedPrice = useCallback(
		(itemId: string, newPrice: number) => {
			if (!list) return

			const item = list.items.find((item) => item.id === itemId)
			if (item?.product?.id && newPrice > 0) {
				setTimeout(() => {
					checkBestPrice(itemId, item.product!.id, newPrice)
				}, 1000)
			}

			setList((prev) =>
				prev
					? {
							...prev,
							items: prev.items.map((item) => (item.id === itemId ? { ...item, estimatedPrice: newPrice } : item)),
						}
					: null,
			)
			updateItemInServer(itemId, { estimatedPrice: newPrice })
		},
		[list],
	)

	const checkBestPrice = async (itemId: string, productId: string, unitPrice: number) => {
		if (!productId || !unitPrice) return

		try {
			const response = await fetch("/api/best-price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId,
					currentPrice: unitPrice,
				}),
			})

			const bestPriceData = await response.json()

			setList((prev) =>
				prev
					? {
							...prev,
							items: prev.items.map((item) => (item.id === itemId ? { ...item, bestPriceAlert: bestPriceData } : item)),
						}
					: null,
			)
		} catch (error) {
			console.error("Erro ao verificar melhor preço:", error)
		}
	}

	const handleSaveList = async (newName: string) => {
		if (!list) return

		setSaving(true)
		try {
			const response = await fetch(`/api/shopping-lists/${list.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newName }),
			})

			if (response.ok) {
				const updatedList = await response.json()
				setList((prev) => (prev ? { ...prev, name: updatedList.name } : null))
				toast.success("Lista atualizada com sucesso")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao atualizar lista")
			}
		} catch (error) {
			console.error("Erro ao atualizar lista:", error)
			toast.error("Erro ao atualizar lista")
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteList = async () => {
		if (!list) return

		setDeleting(true)
		try {
			const response = await fetch(`/api/shopping-lists/${list.id}`, {
				method: "DELETE",
			})

			if (response.ok) {
				toast.success("Lista excluída com sucesso")
				router.push("/lista")
			} else {
				toast.error("Erro ao excluir lista")
			}
		} catch (error) {
			console.error("Erro ao excluir lista:", error)
			toast.error("Erro ao excluir lista")
		} finally {
			setDeleting(false)
			setDeleteConfirm(false)
		}
	}

	const handleAddItem = async () => {
		if (!newItem.productId || newItem.quantity <= 0) {
			toast.error("Selecione um produto e informe a quantidade")
			return
		}

		setAddingItem(true)
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId: newItem.productId,
					quantity: newItem.quantity,
				}),
			})

			if (response.ok) {
				const addedItem = await response.json()
				setShowAddItem(false)
				fetchListDetails()
				toast.success("Item adicionado com sucesso")

				checkQuantitySuggestion(addedItem.productId, addedItem.id)
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao adicionar item")
			}
		} catch (error) {
			console.error("Erro ao adicionar item:", error)
			toast.error("Erro ao adicionar item")
		} finally {
			setAddingItem(false)
		}
	}

	const handleAddTemporaryItem = async (itemData: any) => {
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(itemData),
			})

			if (response.ok) {
				setShowTemporaryForm(false)
				fetchListDetails()
				toast.success("Item temporário adicionado com sucesso")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao adicionar item temporário")
			}
		} catch (error) {
			console.error("Erro ao adicionar item temporário:", error)
			toast.error("Erro ao adicionar item temporário")
		}
	}

	const handleUpdateTemporaryItem = async (itemId: string, updates: any) => {
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			})

			if (response.ok) {
				fetchListDetails()
				toast.success("Item atualizado com sucesso")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao atualizar item")
			}
		} catch (error) {
			console.error("Erro ao atualizar item:", error)
			toast.error("Erro ao atualizar item")
		}
	}

	const handleConvertTemporaryItem = async (itemId: string, productData: any) => {
		try {
			const response = await fetch(`/api/shopping-lists/convert-temporary`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					shoppingListItemId: itemId,
					productData: productData,
				}),
			})

			if (response.ok) {
				fetchListDetails()
				toast.success("Item convertido em produto permanente com sucesso!")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao converter item")
			}
		} catch (error) {
			console.error("Erro ao converter item:", error)
			toast.error("Erro ao converter item")
		}
	}

	const handleUpdateItem = async () => {
		if (!editingItem) return

		setUpdatingItem(true)
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items/${editingItem.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					quantity: editItemData.quantity,
					estimatedPrice: editItemData.estimatedPrice,
				}),
			})

			if (response.ok) {
				setEditingItem(null)
				fetchListDetails()
				toast.success("Item atualizado com sucesso")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao atualizar item")
			}
		} catch (error) {
			console.error("Erro ao atualizar item:", error)
			toast.error("Erro ao atualizar item")
		} finally {
			setUpdatingItem(false)
		}
	}

	const handleDeleteItem = async () => {
		if (!deleteItemConfirm) return

		setDeletingItem(true)
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items/${deleteItemConfirm.id}`, {
				method: "DELETE",
			})

			if (response.ok) {
				setDeleteItemConfirm(null)
				fetchListDetails()
				toast.success("Item removido com sucesso")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao remover item")
			}
		} catch (error) {
			console.error("Erro ao remover item:", error)
			toast.error("Erro ao remover item")
		} finally {
			setDeletingItem(false)
		}
	}

	const handleCreateQuickProduct = async () => {
		if (!quickProduct.name.trim()) {
			toast.error("Nome do produto é obrigatório")
			return
		}

		setSavingQuickProduct(true)

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
			})

			if (response.ok) {
				const newProduct = await response.json()
				setProducts((prev) => [...prev, newProduct])
				setNewItem((prev) => ({ ...prev, productId: newProduct.id }))
				setShowQuickProduct(false)
				toast.success("Produto criado com sucesso")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao criar produto")
			}
		} catch (error) {
			console.error("Erro ao criar produto:", error)
			toast.error("Erro ao criar produto")
		} finally {
			setSavingQuickProduct(false)
		}
	}

	const handleFinalizePurchase = useCallback(() => {
		if (!list) return

		const checkedItems = list.items.filter((item) => item.isChecked)

		if (checkedItems.length === 0) {
			toast.info("Marque os itens comprados na lista para finalizar a compra.")
			return
		}

		const purchaseItems = checkedItems.map((item) => ({
			productId: item.product?.id || "",
			quantity: item.quantity,
			unitPrice: item.estimatedPrice || 0,
		}))

		const storageKey = TempStorage.save({
			items: purchaseItems,
		})

		router.push(`/compras/nova?storageKey=${storageKey}`)
	}, [list, router])

	const completedItems = list?.items.filter((item) => item.isChecked).length || 0
	const totalItems = list?.items.length || 0
	const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
					<div className="animate-pulse h-8 w-60 bg-gray-200 rounded"></div>
				</div>
				<div className="animate-pulse h-40 bg-gray-200 rounded"></div>
			</div>
		)
	}

	if (!list) {
		return null
	}

	// --- MODO DE COMPRA FOCADO ---
	if (isShoppingMode) {
		return (
			<ShoppingMode
				listName={list.name}
				items={list.items}
				sortOrder={sortOrder}
				onBack={() => setIsShoppingMode(false)}
				onSortChange={setSortOrder}
				onToggleItem={toggleItem}
				onFinalizePurchase={handleFinalizePurchase}
				onUpdateQuantity={handleUpdateQuantity}
				onUpdateEstimatedPrice={handleUpdateEstimatedPrice}
				onCloseBestPriceAlert={(itemId) => {
					setList((prev) =>
						prev
							? {
									...prev,
									items: prev.items.map((listItem) =>
										listItem.id === itemId ? { ...listItem, bestPriceAlert: null } : listItem,
									),
								}
							: null,
					)
				}}
			/>
		)
	}

	// --- VISUALIZAÇÃO PADRÃO ---
	return (
		<div className="space-y-6">
			<ShoppingListHeader
				listName={list.name}
				totalItems={totalItems}
				completedItems={completedItems}
				progress={progress}
				listId={listId}
				onStartShopping={() => setIsShoppingMode(true)}
				onOpenOptimizedRoute={() => setShowOptimizedRoute(true)}
				onEditList={() => setEditingList(true)}
				onDeleteList={() => setDeleteConfirm(true)}
			/>

			<ProgressBar completedItems={completedItems} totalItems={totalItems} progress={progress} />

			{/* Lista de Itens */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Itens da Lista
						</CardTitle>
						<div className="flex gap-2">
							<Button onClick={() => setShowTemporaryForm(true)} variant="outline" size="sm">
								<ShoppingCart className="h-4 w-4 mr-2" />
								Item Temporário
							</Button>
							<Button onClick={() => setShowAddItem(true)} size="sm">
								<Plus className="h-4 w-4 mr-2" />
								Adicionar Item
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Formulário para itens temporários */}
					{showTemporaryForm && (
						<div className="mb-4">
							<TemporaryItemForm
								onAddItem={handleAddTemporaryItem}
								onCancel={() => setShowTemporaryForm(false)}
							/>
						</div>
					)}

					{list.items.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<Package className="h-12 w-12 mx-auto mb-4" />
							<p className="text-lg font-medium mb-2">Lista vazia</p>
							<p className="text-gray-600">Adicione itens para começar suas compras</p>
						</div>
					) : (
						<div className="space-y-3">
							{list.items.map((item) => (
								item.isTemporary ? (
									<TemporaryItemCard
										key={item.id}
										item={item}
										onUpdateItem={handleUpdateTemporaryItem}
										onDeleteItem={async (itemId) => {
											// Usar a mesma lógica de delete existente
											const itemToDelete = list.items.find(i => i.id === itemId)
											if (itemToDelete) {
												setDeleteItemConfirm(itemToDelete)
											}
										}}
										onConvertToProduct={handleConvertTemporaryItem}
									/>
								) : (
									<ShoppingListItemComponent
										key={item.id}
										item={item}
										onToggle={toggleItem}
										onEdit={(item) => {
											setEditingItem(item)
											setEditItemData({
												quantity: item.quantity,
												estimatedPrice: item.estimatedPrice || 0,
											})
										}}
										onDelete={(item) => setDeleteItemConfirm(item)}
									/>
								)
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Resumo */}
			{list.items.length > 0 && (
				<ShoppingSummary items={list.items} totalItems={totalItems} completedItems={completedItems} />
			)}

			{/* Dialogs */}
			<EditListDialog
				isOpen={editingList}
				onClose={() => setEditingList(false)}
				listName={list.name}
				onSave={handleSaveList}
				saving={saving}
			/>

			<DeleteListDialog
				isOpen={deleteConfirm}
				onClose={() => setDeleteConfirm(false)}
				listName={list.name}
				onDelete={handleDeleteList}
				deleting={deleting}
			/>

			<AddItemDialog
				isOpen={showAddItem}
				onClose={() => setShowAddItem(false)}
				newItem={newItem}
				onNewItemChange={setNewItem}
				products={products}
				onAdd={handleAddItem}
				adding={addingItem}
				onCreateQuickProduct={() => {
					setQuickProduct({
						name: "",
						categoryId: "",
						unit: "unidade",
						brandId: "",
					})
					setShowQuickProduct(true)
				}}
				preserveFormData={{
					listData: { id: listId, name: list?.name },
					newItem,
					returnContext: "listDetails",
				}}
			/>

			<EditItemDialog
				isOpen={!!editingItem}
				onClose={() => setEditingItem(null)}
				editingItem={editingItem}
				editItemData={editItemData}
				onEditItemDataChange={setEditItemData}
				onUpdate={handleUpdateItem}
				updating={updatingItem}
				onCloseBestPriceAlert={() => {
					if (editingItem) {
						setList((prev) =>
							prev
								? {
										...prev,
										items: prev.items.map((item) =>
											item.id === editingItem.id ? { ...item, bestPriceAlert: null } : item,
										),
									}
								: null,
						)
						setEditingItem((prev) => (prev ? { ...prev, bestPriceAlert: null } : null))
					}
				}}
				onCheckBestPrice={checkBestPrice}
			/>

			<DeleteItemDialog
				isOpen={!!deleteItemConfirm}
				onClose={() => setDeleteItemConfirm(null)}
				deleteItemConfirm={deleteItemConfirm}
				onDelete={handleDeleteItem}
				deleting={deletingItem}
			/>

			<QuickProductDialog
				isOpen={showQuickProduct}
				onClose={() => setShowQuickProduct(false)}
				quickProduct={quickProduct}
				onQuickProductChange={setQuickProduct}
				onCreateProduct={handleCreateQuickProduct}
				saving={savingQuickProduct}
			/>

			{/* Componente de Roteiro Otimizado */}
			<OptimizedShoppingRoute
				listId={listId}
				listName={list.name}
				isOpen={showOptimizedRoute}
				onClose={() => setShowOptimizedRoute(false)}
			/>
		</div>
	)
}
