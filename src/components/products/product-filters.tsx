"use client"

import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { SelectWithSearch } from "@/components/ui/select-with-search"

interface ProductFiltersProps {
	searchValue: string
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	sortValue: string
	onSortChange: (value: string) => void
	categoryValue: string
	onCategoryChange: (value: string) => void
	brandValue: string
	onBrandChange: (value: string) => void
	sortOptions: Array<{ value: string; label: string }>
	categoryOptions: Array<{ value: string; label: string; icon?: string }>
	brandOptions: Array<{ value: string; label: string }>
	hasActiveFilters: boolean
	onClearFilters: () => void
}

export function ProductFilters({
	searchValue,
	onSearchChange,
	sortValue,
	onSortChange,
	categoryValue,
	onCategoryChange,
	brandValue,
	onBrandChange,
	sortOptions,
	categoryOptions,
	brandOptions,
	hasActiveFilters,
	onClearFilters,
}: ProductFiltersProps) {
	const additionalFilters = (
		<>
			<SelectWithSearch
				label="Categoria"
				options={categoryOptions}
				value={categoryValue}
				onValueChange={onCategoryChange}
				placeholder="Todas as categorias"
				emptyMessage="Nenhuma categoria encontrada."
				searchPlaceholder="Buscar categorias..."
			/>

			<SelectWithSearch
				label="Marca"
				options={brandOptions}
				value={brandValue}
				onValueChange={onBrandChange}
				placeholder="Todas as marcas"
				emptyMessage="Nenhuma marca encontrada."
				searchPlaceholder="Buscar marcas..."
			/>
		</>
	)

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex items-center gap-2 mb-6"
		>
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					placeholder="Nome, código ou escaneie..."
					value={searchValue}
					onChange={onSearchChange}
					className="pl-10"
				/>
			</div>
			<FilterPopover
				sortValue={sortValue}
				onSortChange={onSortChange}
				sortOptions={sortOptions}
				additionalFilters={additionalFilters}
				hasActiveFilters={hasActiveFilters}
				onClearFilters={onClearFilters}
			/>
		</motion.div>
	)
}
