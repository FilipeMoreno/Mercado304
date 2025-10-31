"use client"

import { AlertTriangle, Plus, RotateCcw, Search, Trash2, Package } from "lucide-react"
import * as React from "react"
import { useState, Activity } from "react"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { RecipeSuggester } from "@/components/recipe-suggester"
import { Button } from "@/components/ui/button"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextConfirmDialog } from "@/components/ui/text-confirm-dialog"
import { WasteDialog } from "@/components/waste-dialog"
import {
	useCreateStockMutation,
	useDeleteConfirmation,
	useDeleteStockMutation,
	useProductsQuery,
	useResetStockMutation,
	useStockQuery,
	useUpdateStockMutation,
	useUrlState,
} from "@/hooks"
import { StockDetails } from "./components/stock-details"
import { StockForm } from "./components/stock-form"
import { StockGrid } from "./components/stock-grid"
import { StockHistory } from "./components/stock-history"
import { StockPagination } from "./components/stock-pagination"
import { StockStats } from "./components/stock-stats"

interface StockItem {
	id: string
	productId: string
	quantity: number
	location: string
	expirationDate?: string
	batchNumber?: string
	unitCost?: number
	totalValue?: number
	notes?: string
	product: {
		id: string
		name: string
		unit: string
		brand?: { name: string }
		category?: { name: string }
	}
}

interface EstoqueClientProps {
	searchParams: {
		search?: string
		location?: string
		filter?: string
		includeExpired?: string
	}
}

export function EstoqueClient({ searchParams }: EstoqueClientProps) {
	const [showAddDialog, setShowAddDialog] = useState(false)
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [showDetailsDialog, setShowDetailsDialog] = useState(false)
	const [showUseDialog, setShowUseDialog] = useState(false)
	const [showWasteDialog, setShowWasteDialog] = useState(false)
	const [showResetDialog, setShowResetDialog] = useState(false)
	const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
	const [wasteItem, setWasteItem] = useState<StockItem | null>(null)
	const [consumedQuantity, setConsumedQuantity] = useState("")
	const [isQuantityExceeding, setIsQuantityExceeding] = useState(false)
	const [showNegativeStockConfirm, setShowNegativeStockConfirm] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [historyPage, setHistoryPage] = useState(1)
	const [pageSize] = useState(12) // Para grid de 3x4

	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<StockItem>()

	const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/estoque",
		initialValues: {
			search: searchParams.search || "",
			location: searchParams.location || "all",
			filter: "all",
			includeExpired: "false",
		},
	})

	// URLSearchParams para a query
	const stockParams = new URLSearchParams({
		location: String(state.location),
		search: String(state.search),
		filter: String(state.filter),
		includeExpired: String(state.includeExpired),
		page: currentPage.toString(),
		limit: pageSize.toString(),
	})

	// React Query hooks
	const {
		data: stockData,
		isLoading: stockLoading,
		refetch: refetchStock,
	} = useStockQuery(stockParams)
	const { data: productsData, isLoading: productsLoading } = useProductsQuery()
	const createStockMutation = useCreateStockMutation()
	const updateStockMutation = useUpdateStockMutation()
	const deleteStockMutation = useDeleteStockMutation()
	const resetStockMutation = useResetStockMutation()

	// Extract data from React Query
	const stockItems = stockData?.items || []
	const stats = stockData?.stats || {}
	const products = productsData?.products || []
	const isLoading = stockLoading || productsLoading

	const stockIngredients = stockItems.map((item: StockItem) => item.product.name)

	const deleteStockItem = async () => {
		if (!deleteState.item) return

		try {
			await deleteStockMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting stock item:", error)
		}
	}

	const handleViewItem = (item: StockItem) => {
		setSelectedItem(item)
		setShowDetailsDialog(true)
	}

	const handleEditItem = (item: StockItem) => {
		setSelectedItem(item)
		setShowEditDialog(true)
	}

	const handleDeleteItem = (item: StockItem) => {
		openDeleteConfirm(item)
	}

	const handleUseItem = (item: StockItem) => {
		setSelectedItem(item)
		setShowUseDialog(true)
	}

	const executeProductUse = async () => {
		if (consumedQuantity && parseFloat(consumedQuantity) > 0 && selectedItem) {
			const quantityToUse = parseFloat(consumedQuantity)
			
			try {
				await updateStockMutation.mutateAsync({
					id: selectedItem.id,
					data: {
						...selectedItem,
						quantity: selectedItem.quantity - quantityToUse,
					},
				})
				setShowUseDialog(false)
				setShowNegativeStockConfirm(false)
				setConsumedQuantity("")
				setIsQuantityExceeding(false)
				setSelectedItem(null)
			} catch (error) {
				console.error("Error using product:", error)
			}
		}
	}

	const handleWasteItem = (item: StockItem) => {
		setWasteItem(item)
		setShowWasteDialog(true)
	}

	const handleResetStock = async () => {
		try {
			await resetStockMutation.mutateAsync()
			setShowResetDialog(false)
			setCurrentPage(1)
		} catch (error) {
			console.error("Error resetting stock:", error)
		}
	}

	const handleCreateStock = async (newStockData: Omit<StockItem, "id">) => {
		try {
			await createStockMutation.mutateAsync({ data: newStockData })
			setShowAddDialog(false)
			setCurrentPage(1) // Reset to first page
		} catch (error) {
			console.error("Error creating stock item:", error)
		}
	}

	const handleUpdateStock = async (updatedStockData: Omit<StockItem, "id">) => {
		if (!selectedItem) return

		try {
			console.log("Updating stock with data:", { id: selectedItem.id, data: updatedStockData })
			await updateStockMutation.mutateAsync({ id: selectedItem.id, data: updatedStockData })
			setShowEditDialog(false)
			setSelectedItem(null)
		} catch (error) {
			console.error("Error updating stock item:", error)
		}
	}

	return (
		<div className="space-y-6">
			{/* Barra de Pesquisa e Filtros */}
			<div className="flex flex-row gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							placeholder="Buscar produtos..."
							value={state.search}
							onChange={(e) => updateSingleValue("search", e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<div className="flex gap-2">
					<FilterPopover
						onClearFilters={clearFilters}
						hasActiveFilters={hasActiveFilters}
						additionalFilters={
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium">Localização</label>
									<Select value={String(state.location)} onValueChange={(value) => updateSingleValue("location", value)}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todas</SelectItem>
											<SelectItem value="Despensa">Despensa</SelectItem>
											<SelectItem value="Geladeira">Geladeira</SelectItem>
											<SelectItem value="Freezer">Freezer</SelectItem>
											<SelectItem value="Armário">Armário</SelectItem>
											<SelectItem value="Garagem">Garagem</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-sm font-medium">Filtro</label>
									<Select value={String(state.filter)} onValueChange={(value) => updateSingleValue("filter", value)}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos</SelectItem>
											<SelectItem value="expiring_soon">Vencendo em Breve</SelectItem>
											<SelectItem value="expired">Vencidos</SelectItem>
											<SelectItem value="low_stock">Estoque Baixo</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="includeExpired"
										checked={state.includeExpired === "true"}
										onChange={(e) => updateSingleValue("includeExpired", e.target.checked.toString())}
										className="rounded"
									/>
									<label htmlFor="includeExpired" className="text-sm">
										Incluir vencidos
									</label>
								</div>
							</div>
						}
					/>
					<Button onClick={() => setShowAddDialog(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Adicionar
					</Button>
					<Button 
						variant="destructive" 
						onClick={() => setShowResetDialog(true)}
						disabled={stockItems.length === 0}
						title="Resetar todo o estoque"
					>
						<RotateCcw className="mr-2 h-4 w-4" />
						<span className="hidden sm:inline">Resetar</span>
					</Button>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="stock" className="space-y-6">
				<TabsList>
					<TabsTrigger value="stock">Estoque</TabsTrigger>
					<TabsTrigger value="history">Histórico</TabsTrigger>
					<TabsTrigger value="recipes">Receitas</TabsTrigger>
				</TabsList>

				<TabsContent value="stock" className="space-y-6">
					{/* Estatísticas */}
					<StockStats stats={stats} isLoading={isLoading} />

					{/* Grid de Produtos */}
					<StockGrid
						items={stockItems}
						isLoading={isLoading}
						onView={handleViewItem}
						onEdit={handleEditItem}
						onDelete={handleDeleteItem}
						onUse={handleUseItem}
						onWaste={handleWasteItem}
					/>

					{/* Paginação */}
					{stockData?.pagination && (
						<StockPagination
							totalPages={stockData.pagination.totalPages}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
						/>
					)}
				</TabsContent>

				<TabsContent value="history" className="space-y-6">
					<StockHistory 
						currentPage={historyPage}
						onPageChange={setHistoryPage}
					/>
				</TabsContent>

				<TabsContent value="recipes" className="space-y-6">
					<RecipeSuggester ingredientList={stockIngredients} />
				</TabsContent>
			</Tabs>

			{/* Diálogo de Adicionar */}
			<ResponsiveDialog open={showAddDialog} onOpenChange={setShowAddDialog} title="Adicionar ao Estoque" maxWidth="md">
				<StockForm
					products={products}
					onSubmit={handleCreateStock}
					onCancel={() => setShowAddDialog(false)}
				/>
			</ResponsiveDialog>

		{/* Diálogo de Editar */}
		<ResponsiveDialog open={showEditDialog} onOpenChange={setShowEditDialog} title="Editar Item do Estoque" maxWidth="md">
			<Activity mode={selectedItem ? 'visible' : 'hidden'}>
				<StockForm
					initialData={selectedItem}
					products={products}
					onSubmit={handleUpdateStock}
					onCancel={() => {
						setShowEditDialog(false)
						setSelectedItem(null)
					}}
				/>
			</Activity>
			</ResponsiveDialog>

		{/* Diálogo de Detalhes */}
		<ResponsiveDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} title="Detalhes do Item" maxWidth="lg">
			<Activity mode={selectedItem ? 'visible' : 'hidden'}>
				<StockDetails item={selectedItem} />
			</Activity>
		</ResponsiveDialog>

		{/* Diálogo de Usar Produto */}
		<ResponsiveDialog open={showUseDialog} onOpenChange={setShowUseDialog} title="Usar Produto" maxWidth="sm">
			<Activity mode={selectedItem ? 'visible' : 'hidden'}>
				<div className="space-y-4">
					<div className="text-center">
						<h3 className="text-lg font-semibold">{selectedItem.product.name}</h3>
						<p className="text-sm text-gray-600">
							Quantidade disponível: {selectedItem.quantity} {selectedItem.product.unit}
						</p>
					</div>
						<div>
							<label className="text-sm font-medium">Quantidade a usar</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={consumedQuantity}
								onChange={(e) => {
									const value = e.target.value
									setConsumedQuantity(value)
									
									// Verificar se a quantidade excede o estoque disponível
									if (value && selectedItem) {
										const quantityToUse = parseFloat(value)
										const availableQuantity = selectedItem.quantity
										setIsQuantityExceeding(quantityToUse > availableQuantity)
									} else {
										setIsQuantityExceeding(false)
									}
								}}
								className={`w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
									isQuantityExceeding 
										? "border-red-500 focus:ring-red-500 bg-red-50" 
										: "border-gray-300 focus:ring-blue-500"
								}`}
								placeholder="Digite a quantidade"
						/>
						<Activity mode={isQuantityExceeding ? 'visible' : 'hidden'}>
							<p className="text-sm text-red-600 mt-1">
								⚠️ Quantidade excede o estoque disponível ({selectedItem?.quantity} {selectedItem?.product.unit})
							</p>
						</Activity>
						</div>
						<div className="flex justify-end gap-3">
							<Button variant="outline" onClick={() => setShowUseDialog(false)}>
								Cancelar
							</Button>
							<Button
								onClick={async () => {
									if (consumedQuantity && parseFloat(consumedQuantity) > 0) {
										const quantityToUse = parseFloat(consumedQuantity)
										const availableQuantity = selectedItem.quantity
										
										// Verificar se a quantidade a ser usada é maior que a disponível
										if (quantityToUse > availableQuantity) {
											setShowNegativeStockConfirm(true)
										} else {
											await executeProductUse()
										}
									}
								}}
								disabled={!consumedQuantity || parseFloat(consumedQuantity) <= 0}
								className={isQuantityExceeding ? "bg-orange-600 hover:bg-orange-700" : ""}
							>
								{isQuantityExceeding ? "⚠️ Usar (Estoque Negativo)" : "Confirmar Uso"}
					</Button>
				</div>
			</div>
			</Activity>
		</ResponsiveDialog>

		{/* Diálogo de Desperdício */}
		<Activity mode={wasteItem ? 'visible' : 'hidden'}>
			<WasteDialog
				stockItem={wasteItem}
				open={showWasteDialog}
				onOpenChange={setShowWasteDialog}
				onSuccess={() => {
					setShowWasteDialog(false)
					setWasteItem(null)
					refetchStock()
				}}
			/>
		</Activity>

			{/* Diálogo de Confirmação de Exclusão */}
			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				onConfirm={deleteStockItem}
				onCancel={closeDeleteConfirm}
				confirmText="Sim, Remover"
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteStockMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<div className="space-y-2">
					<p className="text-sm text-gray-700">
						Tem certeza que deseja remover <strong>{deleteState.item?.product?.name}</strong> do estoque?
					</p>
					<p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
				</div>
			</ResponsiveConfirmDialog>

			{/* Dialog de confirmação para estoque negativo */}
			<ResponsiveConfirmDialog
				open={showNegativeStockConfirm}
				onOpenChange={(open) => !open && setShowNegativeStockConfirm(false)}
				title="⚠️ Atenção - Estoque Negativo"
				description="A quantidade a ser usada excede o estoque disponível"
				onConfirm={executeProductUse}
				onCancel={() => setShowNegativeStockConfirm(false)}
				confirmText="Sim, Usar Mesmo Assim"
				cancelText="Cancelar"
				confirmVariant="destructive"
				icon={<AlertTriangle className="h-8 w-8 text-orange-500" />}
			>
				<div className="space-y-3">
					<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
							<div className="space-y-2">
								<p className="text-sm font-medium text-orange-800">
									Quantidade a ser usada: <strong>{consumedQuantity && parseFloat(consumedQuantity)} {selectedItem?.product.unit}</strong>
								</p>
								<p className="text-sm text-orange-700">
									Estoque disponível: <strong>{selectedItem?.quantity} {selectedItem?.product.unit}</strong>
								</p>
								<p className="text-sm text-orange-600">
									Resultado: <strong>Estoque negativo de {consumedQuantity && parseFloat(consumedQuantity) - (selectedItem?.quantity || 0)} {selectedItem?.product.unit}</strong>
								</p>
							</div>
						</div>
					</div>
					<p className="text-sm text-gray-600">
						Esta ação resultará em um estoque negativo. Tem certeza que deseja continuar?
					</p>
				</div>
			</ResponsiveConfirmDialog>

			{/* Dialog de confirmação para resetar estoque */}
			<TextConfirmDialog
				open={showResetDialog}
				onOpenChange={setShowResetDialog}
				title="⚠️ Resetar Todo o Estoque"
				description="Esta ação irá remover TODOS os itens do estoque permanentemente. Esta ação não pode ser desfeita!"
				confirmText="RESETAR"
				confirmPlaceholder="Digite RESETAR para confirmar"
				onConfirm={handleResetStock}
				isLoading={resetStockMutation.isPending}
				variant="destructive"
			/>

			{/* Floating Action Button */}
			<FloatingActionButton
				icon={Package}
				label="Adicionar ao Estoque"
				onClick={() => setShowAddDialog(true)}
			/>
		</div>
	)
}
