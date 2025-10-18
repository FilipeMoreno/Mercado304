"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, ChevronLeft, Eye, EyeOff, LayoutList, Save, Settings2, SortAsc } from "lucide-react"
import { useState } from "react"
import { BestPriceAlert } from "@/components/best-price-alert"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { QuickEditDialog } from "./quick-edit-dialog"

interface ShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number
	isChecked: boolean
	bestPriceAlert?: any
	productName?: string
	productUnit?: string
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

interface ShoppingSummary {
	totalItems: number
	completedItems: number
}

interface ShoppingModeProps {
	listName: string
	items: ShoppingListItem[]
	sortOrder: "default" | "category"
	onBack: () => void
	onSortChange: (value: "default" | "category") => void
	onToggleItem: (itemId: string, currentStatus: boolean) => void
	onFinalizePurchase: () => void
	onUpdateQuantity: (itemId: string, newQuantity: number) => void
	onUpdateEstimatedPrice: (itemId: string, newPrice: number) => void
	onCloseBestPriceAlert: (itemId: string) => void
	onDeleteItem?: (item: ShoppingListItem) => void
}

export function ShoppingMode({
	listName,
	items,
	sortOrder,
	onBack,
	onSortChange,
	onToggleItem,
	onFinalizePurchase,
	onUpdateQuantity,
	onUpdateEstimatedPrice,
	onCloseBestPriceAlert,
	onDeleteItem,
}: ShoppingModeProps) {
	const [showCompleted, setShowCompleted] = useState(false)
	const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null)
	// Separar itens por status
	const getSortedItems = () => {
		if (sortOrder === "default") {
			return [...items].sort((a, b) => {
				if (a.isChecked && !b.isChecked) return 1
				if (!a.isChecked && b.isChecked) return -1
				return 0
			})
		}
		if (sortOrder === "category") {
			return [...items].sort((a, b) => {
				const categoryA = a.product?.category?.name || "Sem Categoria"
				const categoryB = b.product?.category?.name || "Sem Categoria"
				return categoryA.localeCompare(categoryB)
			})
		}
		return items
	}

	const sortedItems = getSortedItems()
	const uncheckedItems = sortedItems.filter((item) => !item.isChecked)
	const checkedItems = sortedItems.filter((item) => item.isChecked)
	const completedItems = checkedItems.length

	const itemsByCategory = uncheckedItems.reduce((acc: any, item) => {
		const categoryName = item.product?.category?.name || "Sem Categoria"
		if (!acc[categoryName]) {
			acc[categoryName] = {
				icon: item.product?.category?.icon || "📦",
				items: [],
			}
		}
		acc[categoryName].items.push(item)
		return acc
	}, {})

	const checkedItemsByCategory = checkedItems.reduce((acc: any, item) => {
		const categoryName = item.product?.category?.name || "Sem Categoria"
		if (!acc[categoryName]) {
			acc[categoryName] = {
				icon: item.product?.category?.icon || "📦",
				items: [],
			}
		}
		acc[categoryName].items.push(item)
		return acc
	}, {})

	return (
		<div className="space-y-4">
			{/* Header do Modo de Compra */}
			<div className="flex justify-between items-center bg-background p-4 md:p-6 sticky top-0 z-10 border-b">
				<Button variant="ghost" size="icon" onClick={onBack}>
					<ChevronLeft className="h-5 w-5" />
				</Button>
				<div className="text-lg font-bold flex-1 text-center">{listName}</div>
				<div className="flex items-center gap-2">
					{/* Toggle para mostrar itens concluídos */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowCompleted(!showCompleted)}
						className="flex items-center gap-2"
					>
						{showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						<span className="hidden sm:inline">{showCompleted ? "Ocultar" : "Mostrar"} Concluídos</span>
						{checkedItems.length > 0 && (
							<span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{checkedItems.length}</span>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<Settings2 className="h-5 w-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuRadioGroup
								value={sortOrder}
								onValueChange={(value) => onSortChange(value as "default" | "category")}
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
			</div>

			<div className="px-4 md:px-6 space-y-4">
				{/* Botão de Finalizar Compra */}
				<Button onClick={onFinalizePurchase} disabled={completedItems === 0} className="w-full">
					<Save className="h-4 w-4 mr-2" />
					Finalizar Compra ({completedItems} itens)
				</Button>
			</div>

			{/* Itens não-checkados */}
			<div className="px-4 md:px-6 space-y-6">
				{Object.entries(itemsByCategory).map(([category, data]: any) => (
					<div key={category} className="space-y-2">
						<div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
							<span className="text-xl">{data.icon}</span>
							<h3 className="font-semibold text-lg">{category}</h3>
						</div>

						<div className="space-y-2">
							<AnimatePresence>
								{data.items.map((item: ShoppingListItem) => (
									<motion.div
										key={item.id}
										layout
										initial={{ opacity: 1, y: 0 }}
										exit={{
											opacity: 0,
											y: 20,
											scale: 0.95,
											transition: {
												duration: 0.3,
												ease: "easeOut",
											},
										}}
										transition={{
											duration: 0.3,
											ease: "easeInOut",
										}}
										className="p-4 rounded-lg cursor-pointer bg-card shadow-sm"
										onClick={() => setEditingItem(item)}
									>
										<div className="flex items-center gap-4">
											<motion.button
												onClick={(e) => {
													e.stopPropagation()
													onToggleItem(item.id, item.isChecked)
												}}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.95 }}
												className="w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 border-gray-300 hover:border-green-400"
											>
												<Check className="h-5 w-5 opacity-0" />
											</motion.button>

											<div className="flex-1">
												<p
													className={`font-medium text-lg ${item.isChecked ? "line-through text-gray-500" : "text-gray-900"}`}
												>
													{item.product?.name || item.productName}
													{item.product?.brand && (
														<span className="text-gray-500 font-normal ml-2">- {item.product.brand.name}</span>
													)}
												</p>
												<div className="text-sm text-gray-600">
													{item.quantity} {item.product?.unit || item.productUnit || "unidades"}
													{item.estimatedPrice && (
														<span className="ml-2">
															• R$ {item.estimatedPrice.toFixed(2)}
															{item.quantity > 1 && ` (Total: R$ ${(item.quantity * item.estimatedPrice).toFixed(2)})`}
														</span>
													)}
												</div>
											</div>

											{/* Valor total no lado direito */}
											{item.estimatedPrice && item.quantity > 0 && (
												<div className="text-right">
													<div className="text-lg font-bold text-gray-900">
														R$ {(item.quantity * item.estimatedPrice).toFixed(2)}
													</div>
													{item.quantity > 1 && (
														<div className="text-xs text-gray-500">
															{item.quantity}x R$ {item.estimatedPrice.toFixed(2)}
														</div>
													)}
												</div>
											)}
										</div>

										{/* Alert de Menor Preço */}
										{item.bestPriceAlert?.isBestPrice && !item.bestPriceAlert.isFirstRecord && (
											<BestPriceAlert
												productName={item.product?.name || item.productName || "Produto"}
												currentPrice={item.estimatedPrice || 0}
												previousBestPrice={item.bestPriceAlert.previousBestPrice}
												totalRecords={item.bestPriceAlert.totalRecords}
												onClose={() => onCloseBestPriceAlert(item.id)}
											/>
										)}
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					</div>
				))}
			</div>

			{checkedItems.length > 0 && showCompleted && (
				<div className="px-4 md:px-6 space-y-4">
					<div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
						<div className="flex items-center gap-2">
							<Check className="h-5 w-5 text-green-600" />
							<h2 className="font-semibold text-green-700 dark:text-green-300">
								Itens Coletados ({checkedItems.length})
							</h2>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowCompleted(false)}
							className="text-green-600 hover:text-green-700"
						>
							<ChevronDown className="h-4 w-4" />
						</Button>
					</div>

					{Object.entries(checkedItemsByCategory).map(([category, data]: any) => (
						<div key={`checked-${category}`} className="space-y-2">
							<div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
								<span className="text-lg opacity-75">{data.icon}</span>
								<h4 className="font-medium text-gray-600 dark:text-gray-400">{category}</h4>
							</div>

							<div className="space-y-2">
								<AnimatePresence>
									{data.items.map((item: ShoppingListItem) => (
										<motion.div
											key={`checked-${item.id}`}
											layout
											initial={{ opacity: 0, y: -20, scale: 0.95 }}
											animate={{
												opacity: 1,
												y: 0,
												scale: 1,
												transition: {
													duration: 0.4,
													ease: "easeOut",
												},
											}}
											className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
										>
											<div className="flex items-center gap-3">
												<motion.button
													onClick={() => onToggleItem(item.id, item.isChecked)}
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className="w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-green-500 border-green-500 text-white"
												>
													<Check className="h-4 w-4" />
												</motion.button>

												<div className="flex-1">
													<p className="font-medium text-gray-600 dark:text-gray-300 line-through">
														{item.product?.name || item.productName}
													</p>
													<div className="flex items-center gap-2 text-sm text-gray-500">
														<span>Qtd: {item.quantity}</span>
														{item.estimatedPrice && <span>• R$ {item.estimatedPrice.toFixed(2)}</span>}
													</div>
												</div>
											</div>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Dialog de Edição Rápida */}
			<QuickEditDialog
				item={editingItem}
				isOpen={!!editingItem}
				onClose={() => setEditingItem(null)}
				onUpdate={(itemId, updates, options) => {
					if (updates.quantity !== undefined) {
						onUpdateQuantity(itemId, updates.quantity)
					}
					if (updates.estimatedPrice !== undefined) {
						onUpdateEstimatedPrice(itemId, updates.estimatedPrice)
					}

					// Fechar dialog apenas se closeDialog não for false (auto-save envia false)
					if (options?.closeDialog !== false) {
						setEditingItem(null)
					}
				}}
				onDelete={(item) => {
					onDeleteItem?.(item)
					setEditingItem(null)
				}}
			/>
		</div>
	)
}
