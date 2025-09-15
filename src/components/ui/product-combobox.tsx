"use client"

import { Barcode, Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { filterProducts, isBarcode } from "@/lib/barcode-utils"
import { cn } from "@/lib/utils"

interface ProductComboboxOption {
	value: string
	label: string
	barcode?: string
	product: any
}

interface ProductComboboxProps {
	products: any[]
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	searchPlaceholder?: string
	emptyText?: string
	className?: string
	disabled?: boolean
	onCreateNew?: (searchTerm: string) => void
	createNewText?: string
}

export function ProductCombobox({
	products,
	value,
	onValueChange,
	placeholder = "Selecione um produto...",
	searchPlaceholder = "Buscar produto ou código...",
	emptyText = "Nenhum produto encontrado.",
	className,
	disabled = false,
	onCreateNew,
	createNewText = "Criar novo",
}: ProductComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")

	const filteredProducts = React.useMemo(() => {
		return filterProducts(products, searchTerm)
	}, [products, searchTerm])

	const options: ProductComboboxOption[] = React.useMemo(() => {
		return filteredProducts.map((product) => ({
			value: product.id,
			label: `${product.name} ${product.brand ? `- ${product.brand.name}` : ""} (${product.unit})`,
			barcode: product.barcode,
			product,
		}))
	}, [filteredProducts])

	const exactBarcodeMatch = React.useMemo(() => {
		if (isBarcode(searchTerm)) {
			return products.find((product) => product.barcode === searchTerm)
		}
		return null
	}, [products, searchTerm])

	React.useEffect(() => {
		if (exactBarcodeMatch && !value) {
			onValueChange?.(exactBarcodeMatch.id)
			setOpen(false)
			setSearchTerm("")
		}
	}, [exactBarcodeMatch, value, onValueChange])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
					disabled={disabled}
				>
					{/* --- ALTERAÇÃO APLICADA AQUI --- */}
					<span className="truncate flex-1 text-left font-normal">
						{value
							? (() => {
									const selectedProduct = products.find((p) => p.id === value)
									return selectedProduct
										? `${selectedProduct.name} ${selectedProduct.brand ? `- ${selectedProduct.brand.name}` : ""} (${selectedProduct.unit})`
										: placeholder
								})()
							: placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
				<Command shouldFilter={false}>
					<CommandInput placeholder={searchPlaceholder} value={searchTerm} onValueChange={setSearchTerm} />
					<CommandList>
						<CommandEmpty>
							<div className="py-6 text-center text-sm">
								<p className="text-muted-foreground">{emptyText}</p>
								{isBarcode(searchTerm) && (
									<p className="text-xs text-blue-600 mt-1">🔍 Buscando por código de barras: {searchTerm}</p>
								)}
								{onCreateNew && searchTerm && !isBarcode(searchTerm) && (
									<Button
										variant="ghost"
										size="sm"
										className="mt-2 text-blue-600 hover:text-blue-700"
										onClick={() => {
											onCreateNew(searchTerm)
											setOpen(false)
											setSearchTerm("")
										}}
									>
										{createNewText} "{searchTerm}"
									</Button>
								)}
							</div>
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={(currentValue) => {
										onValueChange?.(currentValue === value ? "" : currentValue)
										setOpen(false)
										setSearchTerm("")
									}}
								>
									<Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
									<div className="flex-1">
										<div>{option.label}</div>
										{option.barcode && (
											<div className="flex text-xs text-gray-500 mt-1">
												<Barcode className="h-4 w-4 mr-1" /> {option.barcode}
											</div>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
