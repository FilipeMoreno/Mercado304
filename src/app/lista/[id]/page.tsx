"use client"

import { motion } from "framer-motion"
import { Eye, EyeOff, Package, Plus, } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { OptimizedShoppingRoute } from "@/components/optimized-shopping-route"
import {
	AddItemDialog,
	DeleteItemDialog,
	DeleteListDialog,
	EditItemDialog,
	EditListDialog,
	ProgressBar,
	QuickEditDialog,
	QuickProductDialog,
	ShoppingListHeader,
	ShoppingListItemComponent,
	ShoppingMode,
	ShoppingSummary,
} from "@/components/shopping-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { TempStorage } from "@/lib/temp-storage"
import { useProactiveAiStore } from "@/store/useProactiveAiStore"

interface ExtendedShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number
	isChecked: boolean
	productId?: string
	productName?: string
	productUnit?: string
	brand?: string
	category?: string
	notes?: string
	bestPriceAlert?: {
		isBestPrice: boolean
		previousBestPrice?: number
		totalRecords?: number
		isFirstRecord?: boolean
	}
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

interface EditItemData {
	productId?: string
	productName: string
	productUnit: string
	quantity: number
	estimatedPrice: number
}

interface ShoppingListDetails {
	id: string
	name: string
	isActive: boolean
	createdAt: string
	items: ExtendedShoppingListItem[]
}

export default function ListaDetalhesPage() {
	const params = useParams()
	const router = useRouter()
	const { showInsight } = useProactiveAiStore()
	const searchParams = useSearchParams()
	const [products, setProducts] = useState<{ id: string; name: string;[key: string]: unknown }[]>([])
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
	const [newItem, setNewItem] = useState<{
		productId?: string
		productName: string
		quantity: number
		estimatedPrice?: number
		productUnit: string
		brand?: string
		category?: string
		notes?: string
	}>({
		productId: undefined,
		productName: "",
		quantity: 1,
		estimatedPrice: undefined,
		productUnit: "unidade",
		brand: undefined,
		category: undefined,
		notes: undefined,
	})
	const [addingItem, setAddingItem] = useState(false)

	// Estados para editar item
	const [editingItem, setEditingItem] = useState<ExtendedShoppingListItem | null>(null)
	const [editItemData, setEditItemData] = useState<EditItemData>({
		productId: undefined,
		productName: "",
		productUnit: "unidade",
		quantity: 1,
		estimatedPrice: 0,
	})
	const [updatingItem, setUpdatingItem] = useState(false)

	// Estados para excluir item
	const [deleteItemConfirm, setDeleteItemConfirm] = useState<ExtendedShoppingListItem | null>(null)
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

	// Estados para edição rápida e toggle de itens marcados
	const [quickEditingItem, setQuickEditingItem] = useState<ExtendedShoppingListItem | null>(null)
	const [showCompletedItems, setShowCompletedItems] = useState(true)

	// Inicializar editItemData quando editingItem mudar
	useEffect(() => {
		if (editingItem) {
			setEditItemData({
				productId: editingItem.productId,
				productName: editingItem.product?.name || editingItem.productName || "",
				productUnit: editingItem.product?.unit || editingItem.productUnit || "unidade",
				quantity: editingItem.quantity,
				estimatedPrice: editingItem.estimatedPrice || 0,
			})
		}
	}, [editingItem])

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
			// Buscar TODOS os produtos sem paginação
			const response = await fetch("/api/products?limit=10000")
			if (response.ok) {
				const data = await response.json()
				setProducts(data.products || [])
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

	const updateItemInServer = useCallback(
		async (itemId: string, updatedData: { isChecked?: boolean; quantity?: number; estimatedPrice?: number }) => {
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
		},
		[listId],
	)

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
		[list, updateItemInServer],
	)

	const checkBestPrice = useCallback(async (itemId: string, productId: string, unitPrice: number) => {
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
	}, [])

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
		[list, updateItemInServer],
	)

	const handleUpdateEstimatedPrice = useCallback(
		(itemId: string, newPrice: number) => {
			if (!list) return

			const item = list.items.find((item) => item.id === itemId)
			if (item?.product?.id && newPrice > 0) {
				setTimeout(() => {
					if (item.product?.id) {
						checkBestPrice(itemId, item.product.id, newPrice)
					}
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
		[list, checkBestPrice, updateItemInServer],
	)

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
		if (!newItem.productName.trim() || newItem.quantity <= 0) {
			toast.error("Informe o nome do item e a quantidade")
			return
		}

		setAddingItem(true)
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId: newItem.productId || null,
					productName: newItem.productName.trim(),
					quantity: newItem.quantity,
					estimatedPrice: newItem.estimatedPrice || null,
					productUnit: newItem.productUnit,
					brand: newItem.brand?.trim() || null,
					category: newItem.category?.trim() || null,
					notes: newItem.notes?.trim() || null,
				}),
			})

			if (response.ok) {
				const addedItem = await response.json()
				setShowAddItem(false)
				// Resetar formulário
				setNewItem({
					productId: undefined,
					productName: "",
					quantity: 1,
					estimatedPrice: undefined,
					productUnit: "unidade",
					brand: "",
					category: "",
					notes: "",
				})
				fetchListDetails()
				toast.success("Item adicionado com sucesso")

				// Só checa sugestão de quantidade se tiver produto vinculado
				if (addedItem.productId) {
					checkQuantitySuggestion(addedItem.productId, addedItem.id)
				}
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

	// Funções de itens temporários removidas - agora todos itens funcionam da mesma forma

	const handleUpdateItem = async () => {
		if (!editingItem) return

		setUpdatingItem(true)
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/items/${editingItem.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId: editItemData.productId,
					productName: editItemData.productName,
					productUnit: editItemData.productUnit,
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
									listItem.id === itemId ? { ...listItem, bestPriceAlert: undefined } : listItem,
								),
							}
							: null,
					)
				}}
				onDeleteItem={(item) => setDeleteItemConfirm(item)}
			/>
		)
	}

	// --- VISUALIZAÇÃO PADRÃO ---
	return (
		<div className="min-h-screen bg-gray-50/50 pb-20 md:pb-6">
			{/* Header fixo para mobile */}
			<div className="sticky top-0 z-10 bg-white border-b shadow-sm md:relative md:shadow-none md:border-none">
				<div className="px-4 py-4 md:px-0">
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
						onRegisterPurchase={() => router.push(`/lista/${listId}/registrar`)}
					/>
				</div>
			</div>

			<div className="px-4 md:px-0 space-y-6">
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
					<ProgressBar completedItems={completedItems} totalItems={totalItems} progress={progress} />
				</motion.div>

				{/* Lista de Itens */}
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									Itens da Lista
								</CardTitle>
								<div className="flex gap-2">
									{/* Toggle para mostrar itens concluídos */}
									{list.items.filter(item => item.isChecked).length > 0 && (
										<Button
											onClick={() => setShowCompletedItems(!showCompletedItems)}
											variant="outline"
											size="sm"
											className="flex items-center gap-2"
										>
											{showCompletedItems ? (
												<>
													<EyeOff className="h-4 w-4" />
													<span className="hidden sm:inline">Ocultar Concluídos</span>
												</>
											) : (
												<>
													<Eye className="h-4 w-4" />
													<span className="hidden sm:inline">Mostrar Concluídos</span>
												</>
											)}
											<span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
												{list.items.filter(item => item.isChecked).length}
											</span>
										</Button>
									)}
									<Button onClick={() => setShowAddItem(true)} size="sm" className="hidden md:flex">
										<Plus className="h-4 w-4 mr-2" />
										Adicionar Item
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{list.items.length === 0 ? (
								<Empty className="border border-dashed py-10">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Package className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Lista vazia</EmptyTitle>
										<EmptyDescription>Adicione itens para começar suas compras</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<div className="flex gap-2 justify-center">
											<Button onClick={() => setShowAddItem(true)} size="sm">
												<Plus className="h-4 w-4 mr-1" />
												Adicionar Item
											</Button>
										</div>
									</EmptyContent>
								</Empty>
							) : (
								<div className="space-y-3">
									{list.items
										.filter(item => showCompletedItems || !item.isChecked)
										.map((item, index) => (
											<motion.div
												key={item.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.3 + index * 0.05 }}
											>
												<ShoppingListItemComponent
													item={item}
													onToggle={toggleItem}
													onEdit={(item) => setQuickEditingItem(item)}
													onDelete={(item) => setDeleteItemConfirm(item)}
												/>
											</motion.div>
										))}
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Resumo */}
				{list.items.length > 0 && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
						<ShoppingSummary items={list.items} totalItems={totalItems} completedItems={completedItems} />
					</motion.div>
				)}
			</div>

			{/* Barra fixa na parte inferior para mobile */}
			<div className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t shadow-lg md:hidden">
				<div className="px-4 py-3">
					{/* Botão de adicionar item */}
					<Button
						onClick={() => setShowAddItem(true)}
						className="w-full bg-primary hover:bg-primary/90"
						size="lg"
					>
						<Plus className="h-5 w-5 mr-2" />
						Adicionar Item
					</Button>
				</div>
			</div>

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
				onEditItemDataChange={(data) => setEditItemData(data)}
				onUpdate={handleUpdateItem}
				updating={updatingItem}
				onCloseBestPriceAlert={() => {
					if (editingItem) {
						setList((prev) =>
							prev
								? {
									...prev,
									items: prev.items.map((item) =>
										item.id === editingItem.id ? { ...item, bestPriceAlert: undefined } : item,
									),
								}
								: null,
						)
						setEditingItem((prev) => (prev ? { ...prev, bestPriceAlert: undefined } : null))
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

			{/* Dialog de Edição Rápida */}
			<QuickEditDialog
				item={quickEditingItem}
				isOpen={!!quickEditingItem}
				onClose={() => setQuickEditingItem(null)}
				onUpdate={(itemId, updates, options) => {
					// Atualiza todos os campos (nome, produto vinculado, quantidade, preço)
					const updateData: any = {}
					if (updates.productId !== undefined) updateData.productId = updates.productId
					if (updates.productName !== undefined) updateData.productName = updates.productName
					if (updates.productUnit !== undefined) updateData.productUnit = updates.productUnit
					if (updates.quantity !== undefined) updateData.quantity = updates.quantity
					if (updates.estimatedPrice !== undefined) updateData.estimatedPrice = updates.estimatedPrice

					// Atualizar no servidor
					updateItemInServer(itemId, updateData)

					// Atualizar estado local
					setList((prev) =>
						prev
							? {
								...prev,
								items: prev.items.map((item) =>
									item.id === itemId ? { ...item, ...updateData } : item
								),
							}
							: null,
					)

					// Fechar dialog apenas se closeDialog não for false (auto-save envia false)
					if (options?.closeDialog !== false) {
						setQuickEditingItem(null)
					}
				}}
				onDelete={(item) => {
					setDeleteItemConfirm(item)
					setQuickEditingItem(null)
				}}
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
