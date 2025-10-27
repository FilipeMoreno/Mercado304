"use client"

import { Barcode, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { isBarcode } from "@/lib/barcode-utils"
import { cn } from "@/lib/utils"

interface ProductComboboxOption {
	value: string
	label: string
	brand?: string
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
	selectedProduct?: any
	pendingProductName?: string
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
	selectedProduct,
	pendingProductName,
}: ProductComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")
	const scrollRef = React.useRef<HTMLDivElement>(null)

	// Notificar mudanças de search imediatamente (debounce é feito no ProductSelect)
	React.useEffect(() => {
		onSearchChange?.(searchTerm)
	}, [searchTerm, onSearchChange])

	// Handler para scroll com melhor detecção
	const handleScroll = React.useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const target = e.currentTarget
			const { scrollTop, scrollHeight, clientHeight } = target

			// Carregar mais quando chegar perto do final (85% do scroll)
			const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
			if (scrollPercentage > 0.85 && hasNextPage && !isFetchingNextPage) {
				fetchNextPage?.()
			}
		},
		[hasNextPage, isFetchingNextPage, fetchNextPage],
	)

	// Para infinite scroll, usar os produtos diretamente sem filtrar no cliente
	// O filtro é feito no servidor através do useInfiniteProductsQuery
	const options: ProductComboboxOption[] = React.useMemo(() => {
		return products.map((product) => {
			// Usar código de barras primário da nova tabela, ou o primeiro disponível
			const primaryBarcode = product.barcodes?.find((b: any) => b.isPrimary) || product.barcodes?.[0]
			const barcode = primaryBarcode?.barcode || product.barcode // Fallback para campo antigo

			return {
				value: product.id,
				label: product.name,
				brand: product.brand?.name || "",
				barcode,
				product,
			}
		})
	}, [products])

	// Verificar se existe correspondência exata (ignorando códigos de barras)
	const hasExactMatch = React.useMemo(() => {
		if (!searchTerm || isBarcode(searchTerm)) return false
		const normalizedSearchTerm = searchTerm.toLowerCase().trim()
		return options.some((option) => option.label.toLowerCase().trim() === normalizedSearchTerm)
	}, [options, searchTerm])

	// Verificar se deve mostrar a opção de criar novo
	const shouldShowCreateNew = React.useMemo(() => {
		return onCreateNew && searchTerm && !isBarcode(searchTerm) && !hasExactMatch
	}, [onCreateNew, searchTerm, hasExactMatch])

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
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
					disabled={disabled}
				>
					<span className="truncate flex-1 text-left font-normal">
						{value && value !== ""
							? (() => {
								// Primeiro tenta usar selectedProduct se disponível
								if (selectedProduct) {
									return `${selectedProduct.name} (${selectedProduct.unit})`
								}
								// Se não, busca na lista de produtos
								const foundProduct = products.find((p) => p.id === value)
								if (foundProduct) {
									return `${foundProduct.name} (${foundProduct.unit})`
								}
								// Se não encontrou o produto na lista, pode ser um produto recém-criado
								// Mostra o nome do produto pendente se disponível
								return pendingProductName || "Produto selecionado"
							})()
							: placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[60]" sideOffset={4}>
				<Command shouldFilter={false}>
					<CommandInput placeholder={searchPlaceholder} value={searchTerm} onValueChange={setSearchTerm} />
					<CommandList
						ref={scrollRef}
						className="max-h-[300px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
						onScroll={handleScroll}
						style={{ touchAction: "auto", overscrollBehavior: "contain" }}
					>
						{isLoading && options.length === 0 ? (
							<div className="py-6 text-center text-sm">
								<Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
								<p className="text-muted-foreground">Carregando produtos...</p>
							</div>
						) : options.length === 0 ? (
							<CommandEmpty>
								<div className="py-6 text-center text-sm">
									<p className="text-muted-foreground">{emptyText}</p>
									{isBarcode(searchTerm) && (
										<p className="text-xs text-blue-600 mt-1">🔍 Buscando por código de barras: {searchTerm}</p>
									)}
									{shouldShowCreateNew && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="mt-2 text-blue-600 hover:text-blue-700"
											onClick={() => {
												onCreateNew?.(searchTerm)
												setOpen(false)
												setSearchTerm("")
											}}
										>
											{createNewText} "{searchTerm}"
										</Button>
									)}
								</div>
							</CommandEmpty>
						) : (
							<>
								<CommandGroup>
									{options.map((option) => (
										<CommandItem
											key={option.value}
											value={option.label}
											onSelect={() => {
												// Sempre define o valor selecionado, não alterna
												onValueChange?.(option.value)
												setOpen(false)
												setSearchTerm("")
											}}
										>
											<Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<div className="truncate font-semibold">{option.label}</div>
													{option.product?.unit && (
														<span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
															{option.product.unit}
														</span>
													)}
												</div>
												{option.brand && option.barcode && (
													<div className="text-xs text-gray-500 mt-1 truncate">
														{option.brand} - {option.barcode}
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
								{shouldShowCreateNew && (
									<CommandGroup>
										<CommandItem
											value="create-new"
											onSelect={() => {
												onCreateNew?.(searchTerm)
												setOpen(false)
												setSearchTerm("")
											}}
											className="text-blue-600 hover:text-blue-700"
										>
											<div className="flex-1 truncate">
												{createNewText} "{searchTerm}"
											</div>
										</CommandItem>
									</CommandGroup>
								)}
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
