"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, normalizeString } from "@/lib/utils"

interface ComboboxOption {
	value: string
	label: string
}

interface ComboboxProps {
	options: ComboboxOption[]
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

export function Combobox({
	options,
	value,
	onValueChange,
	placeholder = "Selecione uma opção...",
	searchPlaceholder = "Buscar...",
	emptyText = "Nenhuma opção encontrada.",
	className,
	disabled = false,
	onCreateNew,
	createNewText = "Criar novo",
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState("")

	// Filtrar opções baseado no termo de busca normalizado
	const filteredOptions = React.useMemo(() => {
		if (!searchTerm) return options
		const normalizedSearchTerm = normalizeString(searchTerm)
		return options.filter((option) => normalizeString(option.label).includes(normalizedSearchTerm))
	}, [options, searchTerm])

	// Verificar se existe correspondência exata
	const hasExactMatch = React.useMemo(() => {
		if (!searchTerm) return false
		const normalizedSearchTerm = normalizeString(searchTerm)
		return options.some((option) => normalizeString(option.label) === normalizedSearchTerm)
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
						{value ? options.find((option) => option.value === value)?.label : placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[60]">
				<Command shouldFilter={false}>
					<CommandInput placeholder={searchPlaceholder} value={searchTerm} onValueChange={setSearchTerm} />
					<CommandList
						className="max-h-[300px] overflow-y-auto overscroll-contain"
						style={{ touchAction: "auto", overscrollBehavior: "contain" }}
					>
						{filteredOptions.length === 0 ? (
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
									{filteredOptions.map((option) => (
										<CommandItem
											key={option.value}
											value={option.label}
											onSelect={() => {
												onValueChange?.(option.value === value ? "" : option.value)
												setOpen(false)
												setSearchTerm("")
											}}
										>
											<Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
											<div className="flex-1 truncate">{option.label}</div>
										</CommandItem>
									))}
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
