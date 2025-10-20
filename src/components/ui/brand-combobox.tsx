"use client"

import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface BrandComboboxOption {
	value: string
	label: string
	brand: any
}

interface BrandComboboxProps {
	brands: any[]
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
	pendingBrandName?: string
}

export function BrandCombobox({
	brands,
	value,
	onValueChange,
	placeholder = "Selecione uma marca...",
	searchPlaceholder = "Buscar marca...",
	emptyText = "Nenhuma marca encontrada.",
	className,
	disabled = false,
	onCreateNew,
	createNewText = "Criar nova marca",
	hasNextPage = false,
	fetchNextPage,
	isFetchingNextPage = false,
	isLoading = false,
	onSearchChange,
	pendingBrandName,
}: BrandComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")
	const scrollRef = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		onSearchChange?.(searchTerm)
	}, [searchTerm, onSearchChange])

	const handleScroll = React.useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const target = e.currentTarget
			const { scrollTop, scrollHeight, clientHeight } = target

			const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
			if (scrollPercentage > 0.85 && hasNextPage && !isFetchingNextPage) {
				fetchNextPage?.()
			}
		},
		[hasNextPage, isFetchingNextPage, fetchNextPage],
	)

	const options: BrandComboboxOption[] = React.useMemo(() => {
		return brands.map((brand) => ({
			value: brand.id,
			label: brand.name,
			brand,
		}))
	}, [brands])

	// Verificar se existe correspondência exata
	const hasExactMatch = React.useMemo(() => {
		if (!searchTerm) return false
		const normalizedSearchTerm = searchTerm.toLowerCase().trim()
		return options.some((option) => option.label.toLowerCase().trim() === normalizedSearchTerm)
	}, [options, searchTerm])

	// Verificar se deve mostrar a opção de criar novo
	const shouldShowCreateNew = React.useMemo(() => {
		return onCreateNew && searchTerm && !hasExactMatch
	}, [onCreateNew, searchTerm, hasExactMatch])

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
					<span className="truncate flex-1 text-left font-normal">
						{value && value !== ""
							? (() => {
								const selectedBrand = brands.find((b) => b.id === value)
								if (!selectedBrand) {
									// Se não encontrou a marca na lista, pode ser uma marca recém-criada
									// Mostra o nome da marca pendente se disponível
									return pendingBrandName || "Marca selecionada"
								}
								return selectedBrand.name
							})()
							: placeholder}
					</span>
					<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
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
								<Loader2 className="size-4 animate-spin mx-auto mb-2" />
								<p className="text-muted-foreground">Carregando marcas...</p>
							</div>
						) : options.length === 0 ? (
							<CommandEmpty>
								<div className="py-6 text-center text-sm">
									<p className="text-muted-foreground">{emptyText}</p>
									{shouldShowCreateNew && (
										<Button
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
												console.log("[BrandCombobox] Item selected:", {
													optionValue: option.value,
													currentValue: value,
													willSet: option.value
												})
												// Sempre define o valor selecionado, não alterna
												onValueChange?.(option.value)
												setOpen(false)
												setSearchTerm("")
											}}
										>
											<Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
											<div className="flex-1 min-w-0">
												<div className="truncate">{option.label}</div>
											</div>
										</CommandItem>
									))}
									{isFetchingNextPage && (
										<div className="py-2 text-center">
											<Loader2 className="size-4 animate-spin mx-auto" />
											<p className="text-xs text-muted-foreground mt-1">Carregando mais marcas...</p>
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
