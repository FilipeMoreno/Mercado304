"use client"

import { Plus, Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveSelectDialog, type SelectOption } from "@/components/ui/responsive-select-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useUIPreferences } from "@/hooks"
import { useAllProductsQuery } from "@/hooks/use-react-query"

export interface SelectedProduct {
	productId: string
	productName: string
	quantity: number
	unit?: string
	brand?: string
}

interface ProductSelectorProps {
	selectedProducts: SelectedProduct[]
	onChange: (products: SelectedProduct[]) => void
	excludeProductIds?: string[]
}

export function ProductSelector({ selectedProducts, onChange, excludeProductIds = [] }: ProductSelectorProps) {
	const [open, setOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState("")
	const { selectStyle } = useUIPreferences()

	// Excluir kits da seleção (não faz sentido kit dentro de kit)
	const { data: productsData, isLoading } = useAllProductsQuery({ excludeKits: true })

	// Filter available products
	const availableProducts = useMemo(() => {
		if (!productsData?.data) return []

		const selectedIds = selectedProducts.map((p) => p.productId)
		const excludedIds = [...selectedIds, ...excludeProductIds]

		return productsData.data.filter((product: any) => !excludedIds.includes(product.id))
	}, [productsData, selectedProducts, excludeProductIds])

	// Filtered by search
	const filteredProducts = useMemo(() => {
		if (!searchTerm) return availableProducts

		const search = searchTerm.toLowerCase()
		return availableProducts.filter(
			(product: any) =>
				product.name.toLowerCase().includes(search) || product.brand?.name.toLowerCase().includes(search),
		)
	}, [availableProducts, searchTerm])

	// Convert to SelectOption for dialog
	const dialogOptions: SelectOption[] = useMemo(() => {
		return filteredProducts.map((product: any) => ({
			id: product.id,
			label: product.name,
			sublabel: product.brand?.name ? `${product.brand.name} • ${product.unit}` : product.unit,
		}))
	}, [filteredProducts])

	const handleAddProduct = (productId: string) => {
		// Buscar o produto nas opções de diálogo para ter acesso aos dados completos
		const product = productsData?.data?.find((p: any) => p.id === productId)

		if (!product) return

		// Verificar se já não foi adicionado
		if (selectedProducts.some((p) => p.productId === product.id)) {
			return
		}

		onChange([
			...selectedProducts,
			{
				productId: product.id,
				productName: product.name,
				quantity: 1,
				unit: product.unit,
				brand: product.brand?.name,
			},
		])
	}

	const handleDialogValueChange = (productId: string) => {
		if (productId) {
			// Adicionar imediatamente quando selecionar
			handleAddProduct(productId)
			// Fechar o dialog
			setOpen(false)
			setSearchTerm("")
		}
	}

	const handleDialogOpenChange = (isOpen: boolean) => {
		setOpen(isOpen)
		if (!isOpen) {
			// Resetar busca ao fechar
			setSearchTerm("")
		}
	}

	const handleRemoveProduct = (productId: string) => {
		onChange(selectedProducts.filter((p) => p.productId !== productId))
	}

	const handleQuantityChange = (productId: string, quantity: number) => {
		onChange(selectedProducts.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p)))
	}

	return (
		<div className="space-y-4">
			{/* Selected Products List */}
			{selectedProducts.length > 0 && (
				<div className="space-y-2">
					{selectedProducts.map((product) => (
						<Card key={product.productId}>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="flex-1">
										<p className="font-medium">{product.productName}</p>
										{product.brand && (
											<Badge variant="outline" className="text-xs mt-1">
												{product.brand}
											</Badge>
										)}
									</div>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleQuantityChange(product.productId, product.quantity - 1)}
											disabled={product.quantity <= 1}
										>
											-
										</Button>

										<Input
											type="number"
											value={product.quantity}
											onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value, 10) || 1)}
											className="w-16 text-center"
											min={1}
										/>

										<Button
											variant="outline"
											size="sm"
											onClick={() => handleQuantityChange(product.productId, product.quantity + 1)}
										>
											+
										</Button>

										<Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(product.productId)}>
											<X className="size-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Add Product Button */}
			{selectStyle === "dialog" ? (
				<>
					<Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
						<Plus className="size-4 mr-2" />
						Adicionar Produto
					</Button>

					<ResponsiveSelectDialog
						open={open}
						onOpenChange={handleDialogOpenChange}
						value=""
						onValueChange={handleDialogValueChange}
						options={dialogOptions}
						title="Selecionar Produto"
						placeholder="Selecione um produto"
						searchPlaceholder="Buscar produtos..."
						emptyText="Nenhum produto encontrado."
						isLoading={isLoading}
						onSearchChange={setSearchTerm}
						showCreateNew={false}
						renderTrigger={false}
					/>
				</>
			) : (
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button type="button" variant="outline" className="w-full">
							<Plus className="size-4 mr-2" />
							Adicionar Produto
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[400px] p-0" align="start">
						<Command>
							<div className="flex items-center border-b px-3">
								<Search className="mr-2 size-4 shrink-0 opacity-50" />
								<input
									placeholder="Buscar produtos..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>

							<CommandList>
								{isLoading ? (
									<div className="p-4 space-y-2">
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-10 w-full" />
									</div>
								) : filteredProducts.length === 0 ? (
									<CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
								) : (
									<CommandGroup>
										{filteredProducts.map((product: any) => (
											<CommandItem
												key={product.id}
												value={product.id}
												onSelect={() => handleAddProduct(product.id)}
												className="cursor-pointer"
											>
												<div className="flex items-center justify-between w-full">
													<div>
														<p className="font-medium">{product.name}</p>
														<p className="text-xs text-muted-foreground">{product.brand?.name}</p>
													</div>
													<Badge variant="outline" className="text-xs">
														{product.unit}
													</Badge>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								)}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			)}

			{selectedProducts.length === 0 && (
				<p className="text-sm text-muted-foreground text-center py-4">
					Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
				</p>
			)}
		</div>
	)
}
