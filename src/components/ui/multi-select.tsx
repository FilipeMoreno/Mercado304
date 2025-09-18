"use client"

import { Check, ChevronDown, X, XCircle } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MultiSelectOption {
	value: string
	label: string
}

interface MultiSelectProps {
	options: MultiSelectOption[]
	selected: string[]
	onSelectedChange: (selected: string[]) => void
	placeholder?: string
	className?: string
}

export function MultiSelect({
	options,
	selected,
	onSelectedChange,
	placeholder = "Selecione...",
	className,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false)

	const handleSelect = (value: string) => {
		onSelectedChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
	}

	const handleUnselect = (e: React.MouseEvent, value: string) => {
		e.stopPropagation()
		onSelectedChange(selected.filter((v) => v !== value))
	}

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation()
		onSelectedChange([])
	}

	const selectedLabels = React.useMemo(() => {
		return options.filter((option) => selected.includes(option.value))
	}, [options, selected])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between h-auto min-h-[36px]", className)}
				>
					{selected.length > 0 ? (
						<div className="flex flex-wrap items-center gap-1">
							{selectedLabels.map((option) => (
								<Badge key={option.value} variant="secondary" className="whitespace-nowrap">
									{option.label}
									<button
										className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
										onClick={(e) => handleUnselect(e, option.value)}
										aria-label={`Remover ${option.label}`}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</button>
								</Badge>
							))}
						</div>
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
					<div className="flex items-center gap-1 ml-auto pl-2">
						{selected.length > 0 && (
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground hover:text-foreground"
								onClick={handleClear}
								aria-label="Limpar seleção"
							>
								<XCircle className="h-4 w-4" />
							</Button>
						)}
						<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
				<Command>
					<CommandInput placeholder="Buscar..." />
					<CommandList>
						<CommandGroup>
							<CommandEmpty>Nenhum mercado encontrado.</CommandEmpty>
							{options.map((option) => (
								<CommandItem key={option.value} value={option.label} onSelect={() => handleSelect(option.value)}>
									<Check
										className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")}
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
