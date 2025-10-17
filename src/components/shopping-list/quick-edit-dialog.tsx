"use client"

import { useState, useEffect } from "react"
import { Check, LinkIcon, Minus, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useUIPreferences } from "@/hooks"
import { cn } from "@/lib/utils"

interface ShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number
	isChecked: boolean
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

interface QuickEditDialogProps {
	item: ShoppingListItem | null
	isOpen: boolean
	onClose: () => void
	onUpdate: (itemId: string, updates: { productId?: string; productName?: string; productUnit?: string; quantity: number; estimatedPrice?: number }) => void
	onDelete: (item: ShoppingListItem) => void
}

export function QuickEditDialog({ item, isOpen, onClose, onUpdate, onDelete }: QuickEditDialogProps) {
	const { selectStyle } = useUIPreferences()
	const [productName, setProductName] = useState("")
	const [productId, setProductId] = useState<string | undefined>(undefined)
	const [quantity, setQuantity] = useState("")
	const [estimatedPrice, setEstimatedPrice] = useState("")
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

	// Atualizar valores quando o item mudar
	useEffect(() => {
		if (item) {
			setProductName(item.product?.name || item.productName || "")
			setProductId(item.product?.id)
			setQuantity(item.quantity.toString())
			setEstimatedPrice(item.estimatedPrice?.toString() || "")
		}
	}, [item])

	if (!item) return null

	const handleSave = () => {
		const price = estimatedPrice ? parseFloat(estimatedPrice) : undefined
		const qty = parseFloat(quantity) || 0
		if (qty <= 0) {
			toast.error("Quantidade deve ser maior que zero")
			return
		}
		if (!productName.trim()) {
			toast.error("Nome do produto é obrigatório")
			return
		}
		onUpdate(item.id, {
			productId,
			productName: productName.trim(),
			productUnit: item.productUnit,
			quantity: qty,
			estimatedPrice: price
		})
		onClose()
	}

	const handleProductNameChange = (name: string) => {
		setProductName(name)
		// Remove vínculo se editar manualmente
		setProductId(undefined)
	}

	const handleProductSelected = (product: any) => {
		setProductId(product.id)
		setProductName(product.name)
		setOpenProductPopover(false)
		setOpenProductDialog(false)
		toast.success(`Produto vinculado: "${product.name}"`)
	}

	const handleUnlinkProduct = () => {
		setProductId(undefined)
		toast.info('Produto desvinculado, permanecerá como texto livre')
	}

	const handleQuantityChange = (newQuantity: string) => {
		// Permitir campo vazio
		if (newQuantity === "") {
			setQuantity("")
			return
		}

		// Normalizar vírgula para ponto
		const normalized = newQuantity.replace(',', '.')

		// Validar se é um número válido (incluindo decimais)
		const numberRegex = /^\d*\.?\d*$/
		if (numberRegex.test(normalized)) {
			const parsed = parseFloat(normalized)
			if (!isNaN(parsed) && parsed >= 0) {
				setQuantity(normalized)
			}
		}
	}

	const handleQuantityIncrement = () => {
		const current = parseFloat(quantity) || 0
		setQuantity((current + 1).toString())
	}

	const handleQuantityDecrement = () => {
		const current = parseFloat(quantity) || 0
		if (current > 0.001) {
			setQuantity(Math.max(0.001, current - 1).toString())
		}
	}

	const totalPrice = (parseFloat(quantity) || 0) * (parseFloat(estimatedPrice) || 0)
	const productUnit = item.product?.unit || item.productUnit || "unidade"

	return (
		<ResponsiveFormDialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			title="Editar Item"
			description={`Edite o produto, quantidade e preço`}
		>
			<div className="space-y-6">
				{/* Nome do produto editável */}
				<div className="space-y-2">
					<Label>Nome do Produto *</Label>
					<div className="flex gap-2">
						<div className="flex-1 relative">
							<Input
								value={productName}
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
								<LinkIcon className="h-4 w-4" />
							</Button>
						</div>
						{productId && (
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={handleUnlinkProduct}
								title="Desvincular produto"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
					{productId && (
						<p className="text-xs text-green-600">
							✓ Vinculado a produto cadastrado
						</p>
					)}

					{/* Dialog ou Popover separado */}
					{selectStyle === "dialog" ? (
						<ResponsiveSelectDialog
							open={openProductDialog}
							onOpenChange={setOpenProductDialog}
							value={productId || ""}
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
														productId === product.id ? "opacity-100" : "opacity-0"
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

				{/* Quantidade */}
				<div className="space-y-2">
					<Label htmlFor="quantity">Quantidade</Label>
					<div className="flex items-center gap-3">
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleQuantityDecrement}
							disabled={parseFloat(quantity) <= 0.001}
							className="h-12 w-12"
						>
							<Minus className="h-4 w-4" />
						</Button>
						<div className="flex-1 text-center">
							<Input
								id="quantity"
								type="text"
								inputMode="decimal"
								value={quantity}
								onChange={(e) => handleQuantityChange(e.target.value)}
								className="text-center text-lg font-medium h-12"
								placeholder="0,000"
							/>
							<p className="text-sm text-gray-500 mt-1">{productUnit}</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleQuantityIncrement}
							className="h-12 w-12"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Preço unitário */}
				<div className="space-y-2">
					<Label htmlFor="price">Preço unitário (R$)</Label>
					<Input
						id="price"
						type="number"
						step="0.01"
						placeholder="0,00"
						value={estimatedPrice}
						onChange={(e) => setEstimatedPrice(e.target.value)}
						className="text-lg"
					/>
				</div>

				{/* Valor total */}
				{totalPrice > 0 && (
					<div className="p-4 bg-blue-50 rounded-lg">
						<div className="flex justify-between items-center">
							<span className="font-medium text-blue-900">Valor Total:</span>
							<span className="text-xl font-bold text-blue-900">
								R$ {totalPrice.toFixed(2)}
							</span>
						</div>
						{parseFloat(quantity) > 1 && (
							<p className="text-sm text-blue-700 mt-1">
								{parseFloat(quantity)} × R$ {(parseFloat(estimatedPrice) || 0).toFixed(2)}
							</p>
						)}
					</div>
				)}

				{/* Botões de ação */}
				<div className="flex gap-3 pt-4">
					<Button
						type="button"
						variant="destructive"
						onClick={() => {
							onDelete(item)
							onClose()
						}}
						className="flex-1"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Remover
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						className="flex-2"
					>
						Salvar Alterações
					</Button>
				</div>
			</div>
		</ResponsiveFormDialog>
	)
}
