"use client"

import { Barcode, Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
	hasNextPage?: boolean
	fetchNextPage?: () => void
	isFetchingNextPage?: boolean
	isLoading?: boolean
	onSearchChange?: (search: string) => void
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
	hasNextPage = false,
	fetchNextPage,
	isFetchingNextPage = false,
	isLoading = false,
	onSearchChange,
}: ProductComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")
	const scrollRef = React.useRef<HTMLDivElement>(null)

	// Notificar mudanças de search imediatamente (debounce é feito no ProductSelect)
	React.useEffect(() => {
		onSearchChange?.(searchTerm)
	}, [searchTerm, onSearchChange])

	// Handler para scroll com melhor detecção
	const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget
		const { scrollTop, scrollHeight, clientHeight } = target
		
		// Carregar mais quando chegar perto do final (85% do scroll)
		const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
		if (scrollPercentage > 0.85 && hasNextPage && !isFetchingNextPage) {
			fetchNextPage?.()
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	// Para infinite scroll, usar os produtos diretamente sem filtrar no cliente
	// O filtro é feito no servidor através do useInfiniteProductsQuery
	const options: ProductComboboxOption[] = React.useMemo(() => {
		return products.map((product) => ({
			value: product.id,
			label: `${product.name} ${product.brand ? `- ${product.brand.name}` : ""} (${product.unit})`,
			barcode: product.barcode,
			product,
		}))
	}, [products])

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
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" sideOffset={4}>
				<Command shouldFilter={false}>
					<CommandInput placeholder={searchPlaceholder} value={searchTerm} onValueChange={setSearchTerm} />
					<CommandList 
						ref={scrollRef}
						className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
						onScroll={handleScroll}
					>
						{isLoading && options.length === 0 ? (
							<div className="py-6 text-center text-sm">
								<Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
								<p className="text-muted-foreground">Carregando produtos...</p>
							</div>
						) : (
							<>
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
									{isFetchingNextPage && (
										<div className="py-2 text-center">
											<Loader2 className="h-4 w-4 animate-spin mx-auto" />
											<p className="text-xs text-muted-foreground mt-1">Carregando mais produtos...</p>
										</div>
									)}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
