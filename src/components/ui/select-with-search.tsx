"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SelectWithSearchProps {
	options: { value: string; label: string; icon?: string }[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	emptyMessage?: string;
	searchPlaceholder?: string;
	disabled?: boolean;
}

export function SelectWithSearch({
	options,
	value,
	onValueChange,
	placeholder = "Selecione uma opção...",
	label,
	emptyMessage = "Nenhuma opção encontrada.",
	searchPlaceholder = "Buscar...",
	disabled = false,
}: SelectWithSearchProps) {
	const [open, setOpen] = React.useState(false);

	const selectedOption = options.find((option) => option.value === value);

	return (
		<div className="space-y-2">
			{label && <Label>{label}</Label>}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled}
					>
						{selectedOption ? (
							<span className="flex items-center gap-2">
								{selectedOption.icon && <span>{selectedOption.icon}</span>}
								{selectedOption.label}
							</span>
						) : (
							placeholder
						)}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
					<Command>
						<CommandInput placeholder={searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{emptyMessage}</CommandEmpty>
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.value}
										value={option.label} // Use label for search matching
										onSelect={(currentValue) => {
											const selected = options.find(
												(opt) =>
													opt.label.toLowerCase() ===
													currentValue.toLowerCase(),
											);
											onValueChange(
												selected?.value === value ? "" : selected?.value || "",
											);
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === option.value ? "opacity-100" : "opacity-0",
											)}
										/>
										<span className="flex items-center gap-2">
											{option.icon && <span>{option.icon}</span>}
											{option.label}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
