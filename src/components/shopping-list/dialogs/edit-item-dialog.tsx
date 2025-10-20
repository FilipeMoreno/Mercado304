"use client"

import { Check, Edit, LinkIcon, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BestPriceAlert } from "@/components/best-price-alert"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useUIPreferences } from "@/hooks"
import { cn } from "@/lib/utils"

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

interface EditItemData {
	productId?: string
	productName: string
	productUnit: string
	quantity: number
	estimatedPrice: number
}

interface EditItemDialogProps {
	isOpen: boolean
	onClose: () => void
	editingItem: ShoppingListItem | null
	editItemData: EditItemData
	onEditItemDataChange: (data: EditItemData) => void
	onUpdate: () => Promise<void>
	updating: boolean
	onCloseBestPriceAlert: () => void
	onCheckBestPrice?: (itemId: string, productId: string, price: number) => void
}

export function EditItemDialog({
	isOpen,
	onClose,
	editingItem,
	editItemData,
	onEditItemDataChange,
	onUpdate,
	updating,
	onCloseBestPriceAlert,
	onCheckBestPrice,
}: EditItemDialogProps) {
	const { selectStyle } = useUIPreferences()
	const [products, setProducts] = useState<any[]>([])
	const [openProductPopover, setOpenProductPopover] = useState(false)
	const [openProductDialog, setOpenProductDialog] = useState(false)

	// Buscar TODOS os produtos
	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch('/api/products?limit=10000')
				if (response.ok) {
					const data = await response.json()
					setProducts(data.products || [])
				}
			} catch (error) {
				console.error('Erro ao buscar produtos:', error)
			}
		}
		fetchProducts()
	}, [])

	const handleProductNameChange = (name: string) => {
		onEditItemDataChange({
			...editItemData,
			productName: name,
			// Remove vínculo se editar manualmente
			productId: undefined,
		})
	}

	const handleProductSelected = (product: any) => {
		onEditItemDataChange({
			...editItemData,
			productId: product.id,
			productName: product.name,
			productUnit: product.unit || 'unidade',
		})
		setOpenProductPopover(false)
		setOpenProductDialog(false)
		toast.success(`Produto vinculado: "${product.name}"`)
	}

	const handleUnlinkProduct = () => {
		onEditItemDataChange({
			...editItemData,
			productId: undefined,
		})
		toast.info('Produto desvinculado, permanecerá como texto livre')
	}

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			title="Editar Item"
			maxWidth="md"
		>
			{editingItem && (
				<div className="space-y-4">
					{/* Nome do produto editável */}
					<div className="space-y-2">
						<Label>Nome do Produto *</Label>
						<div className="flex gap-2">
							<div className="flex-1 relative">
								<Input
									value={editItemData.productName}
									onChange={(e) => handleProductNameChange(e.target.value)}
									placeholder="Digite o nome do produto..."
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 hover:bg-accent"
									onClick={() => {
										if (selectStyle === "dialog") {
											setOpenProductDialog(true)
										} else {
											setOpenProductPopover(true)
										}
									}}
									title="Buscar produto cadastrado"
								>
									<LinkIcon className="size-4" />
								</Button>
							</div>
							{editItemData.productId && (
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={handleUnlinkProduct}
									title="Desvincular produto"
								>
									<X className="size-4" />
								</Button>
							)}
						</div>
						{editItemData.productId && (
							<p className="text-xs text-green-600">
								✓ Vinculado a produto cadastrado
							</p>
						)}

						{/* Dialog ou Popover separado */}
						{selectStyle === "dialog" ? (
							<ResponsiveSelectDialog
								open={openProductDialog}
								onOpenChange={setOpenProductDialog}
								value={editItemData.productId || ""}
								onValueChange={(productId) => {
									const product = products.find(p => p.id === productId)
									if (product) {
										handleProductSelected(product)
									}
								}}
								options={products.map((product) => ({
									id: product.id,
									label: product.name,
									sublabel: product.brand?.name || undefined,
								}))}
								title="Buscar Produto"
								placeholder="Selecione um produto"
								searchPlaceholder="Buscar produto..."
								emptyText="Nenhum produto encontrado."
								showCreateNew={false}
								renderTrigger={false}
							/>
						) : (
							<Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
								<PopoverTrigger asChild>
									<div className="hidden" />
								</PopoverTrigger>
								<PopoverContent className="w-[400px] p-0" align="start">
									<Command>
										<CommandInput placeholder="Buscar produto..." />
										<CommandEmpty>Nenhum produto encontrado</CommandEmpty>
										<CommandGroup className="max-h-[300px] overflow-auto">
											{products.map((product) => (
												<CommandItem
													key={product.id}
													value={product.name}
													onSelect={() => handleProductSelected(product)}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															editItemData.productId === product.id ? "opacity-100" : "opacity-0"
														)}
													/>
													<div className="flex-1">
														<div className="font-medium">{product.name}</div>
														{product.brand && (
															<div className="text-xs text-muted-foreground">{product.brand.name}</div>
														)}
													</div>
												</CommandItem>
											))}
										</CommandGroup>
									</Command>
								</PopoverContent>
							</Popover>
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
								onEditItemDataChange({
									...editItemData,
									quantity: parseFloat(e.target.value) || 1,
								})
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
								const newPrice = parseFloat(e.target.value) || 0
								onEditItemDataChange({
									...editItemData,
									estimatedPrice: newPrice,
								})

								if (editingItem?.product?.id && newPrice > 0 && onCheckBestPrice) {
									setTimeout(() => {
										onCheckBestPrice(editingItem.id, editingItem.product?.id!, newPrice)
									}, 1000)
								}
							}}
							placeholder="0.00"
						/>
					</div>

					{/* Alert de Menor Preço no Dialog de Edição */}
					{editingItem?.bestPriceAlert?.isBestPrice && !editingItem.bestPriceAlert.isFirstRecord && (
						<BestPriceAlert
							productName={editingItem.product?.name || editingItem.productName || "Produto"}
							currentPrice={editItemData.estimatedPrice || 0}
							previousBestPrice={editingItem.bestPriceAlert.previousBestPrice}
							totalRecords={editingItem.bestPriceAlert.totalRecords}
							onClose={onCloseBestPriceAlert}
						/>
					)}

					<div className="flex gap-2 pt-4">
						<Button onClick={onUpdate} disabled={updating} className="flex-1">
							<Save className="size-4 mr-2" />
							{updating ? "Salvando..." : "Salvar"}
						</Button>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancelar
						</Button>
					</div>
				</div>
			)}
		</ResponsiveDialog>
	)
}
