"use client"

import { Check, ChevronDown, ChevronUp, LinkIcon, Plus, Save, X } from "lucide-react"
import { useState } from "react"
import { UnitSelectDialog } from "@/components/selects/unit-select-dialog"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUIPreferences } from "@/hooks"
import { cn } from "@/lib/utils"

const units = ["unidade", "kg", "g", "litro", "ml", "pacote", "caixa", "garrafa", "lata", "saco"]

interface NewItem {
	productId?: string
	productName: string
	quantity: number
	estimatedPrice?: number
	productUnit: string
	brand?: string
	category?: string
	notes?: string
}

interface AddItemDialogProps {
	isOpen: boolean
	onClose: () => void
	newItem: NewItem
	onNewItemChange: (newItem: NewItem) => void
	products: any[]
	onAdd: () => Promise<void>
	adding: boolean
	onCreateQuickProduct: () => void
	preserveFormData?: any
}

export function AddItemDialog({
	isOpen,
	onClose,
	newItem,
	onNewItemChange,
	products,
	onAdd,
	adding,
	onCreateQuickProduct,
	preserveFormData,
}: AddItemDialogProps) {
	const { selectStyle } = useUIPreferences()
	const [showAdvanced, setShowAdvanced] = useState(false)
	const [openProductPopover, setOpenProductPopover] = useState(false)
	const [openProductDialog, setOpenProductDialog] = useState(false)

	const handleProductSelected = (product: any) => {
		onNewItemChange({
			...newItem,
			productId: product.id,
			productName: product.name,
			productUnit: product.unit || "unidade",
			brand: product.brand?.name || "",
			category: product.category?.name || "",
		})
		setOpenProductPopover(false)
		setOpenProductDialog(false)
	}

	const handleProductNameChange = (name: string) => {
		onNewItemChange({
			...newItem,
			productName: name,
			// Remove vínculo se editar manualmente
			productId: undefined,
		})
	}

	const handleUnlinkProduct = () => {
		onNewItemChange({
			...newItem,
			productId: undefined,
		})
	}

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={onClose} title="Adicionar Item à Lista" maxWidth="xl">
			<div className="space-y-4 max-h-[70vh] overflow-y-auto">
				{/* Input híbrido: texto livre + busca de produtos */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label>Nome do Produto *</Label>
						<Button type="button" variant="outline" size="sm" onClick={onCreateQuickProduct}>
							<Plus className="h-3 w-3 mr-1" />
							Novo Produto
						</Button>
					</div>
					<div className="flex gap-2">
						<div className="flex-1 relative">
							<Input
								value={newItem.productName}
								onChange={(e) => handleProductNameChange(e.target.value)}
								placeholder="Digite o nome ou busque um produto..."
								autoFocus
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
						{newItem.productId && (
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
					{newItem.productId && <p className="text-xs text-green-600">✓ Vinculado a produto cadastrado</p>}

					{/* Dialog ou Popover separado */}
					{selectStyle === "dialog" ? (
						<ResponsiveSelectDialog
							open={openProductDialog}
							onOpenChange={setOpenProductDialog}
							value={newItem.productId || ""}
							onValueChange={(productId) => {
								const product = products.find((p) => p.id === productId)
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
													className={cn("mr-2 h-4 w-4", newItem.productId === product.id ? "opacity-100" : "opacity-0")}
												/>
												<div className="flex-1">
													<div className="font-medium">{product.name}</div>
													{product.brand && <div className="text-xs text-muted-foreground">{product.brand.name}</div>}
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								</Command>
							</PopoverContent>
						</Popover>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Quantidade *</Label>
						<Input
							type="number"
							step="0.01"
							min="0.01"
							value={newItem.quantity}
							onChange={(e) =>
								onNewItemChange({
									...newItem,
									quantity: parseFloat(e.target.value) || 1,
								})
							}
							placeholder="1.00"
						/>
					</div>

					<div className="space-y-2">
						<Label>Unidade *</Label>
						{selectStyle === "dialog" ? (
							<UnitSelectDialog
								value={newItem.productUnit}
								onValueChange={(value) => onNewItemChange({ ...newItem, productUnit: value })}
							/>
						) : (
							<Select
								value={newItem.productUnit}
								onValueChange={(value) => onNewItemChange({ ...newItem, productUnit: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{units.map((unit) => (
										<SelectItem key={unit} value={unit}>
											{unit}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<Label>Preço Estimado (opcional)</Label>
					<Input
						type="number"
						step="0.01"
						min="0"
						value={newItem.estimatedPrice || ""}
						onChange={(e) =>
							onNewItemChange({
								...newItem,
								estimatedPrice: parseFloat(e.target.value) || undefined,
							})
						}
						placeholder="0.00"
					/>
				</div>

				{/* Informações adicionais (colapsável) - Apenas para itens de texto livre */}
				{!newItem.productId && (
					<div className="space-y-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="w-full justify-between"
						>
							<span>Informações Adicionais (opcional)</span>
							{showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
						</Button>

						{showAdvanced && (
							<div className="space-y-3 pt-2 border-t">
								<div className="space-y-2">
									<Label>Marca</Label>
									<Input
										value={newItem.brand || ""}
										onChange={(e) =>
											onNewItemChange({
												...newItem,
												brand: e.target.value,
											})
										}
										placeholder="Ex: Tio João, Camil..."
									/>
								</div>

								<div className="space-y-2">
									<Label>Categoria</Label>
									<Input
										value={newItem.category || ""}
										onChange={(e) =>
											onNewItemChange({
												...newItem,
												category: e.target.value,
											})
										}
										placeholder="Ex: Grãos, Bebidas..."
									/>
								</div>

								<div className="space-y-2">
									<Label>Observações</Label>
									<Input
										value={newItem.notes || ""}
										onChange={(e) =>
											onNewItemChange({
												...newItem,
												notes: e.target.value,
											})
										}
										placeholder="Notas sobre o item..."
									/>
								</div>
							</div>
						)}
					</div>
				)}

				<div className="flex gap-2 pt-4">
					<Button onClick={onAdd} disabled={adding || !newItem.productName.trim()} className="flex-1">
						<Save className="size-4 mr-2" />
						{adding ? "Adicionando..." : "Adicionar"}
					</Button>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
