"use client";

import { useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import { AppToasts } from "@/lib/toasts";
import { createShoppingList } from "@/services/shoppingListService";
import { useDataStore } from "@/store/useDataStore";
import { ShoppingList } from "@/types";

interface ShoppingListSelectProps {
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function ShoppingListSelect({
	value,
	onValueChange,
	placeholder = "Selecione uma lista",
	className = "w-full",
	disabled = false,
}: ShoppingListSelectProps) {
	const { shoppingLists, loading, fetchShoppingLists } = useDataStore();

	useEffect(() => {
		fetchShoppingLists();
	}, [fetchShoppingLists]);

	const handleCreateList = async (name: string) => {
		try {
			const newList = await createShoppingList({
				name: name.trim(),
				isActive: true,
			});
			fetchShoppingLists(true); // Força a atualização da lista
			onValueChange?.(newList.id);
			AppToasts.created("Lista");
		} catch (error) {
			AppToasts.error(error, "Erro ao criar lista");
		}
	};

	if (loading.shoppingLists && shoppingLists.length === 0) {
		return (
			<div
				className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
			/>
		);
	}

	return (
		<Combobox
			options={shoppingLists.map((list) => ({
				value: list.id,
				label: `${list.name} (${list.items?.length || 0} itens)`,
			}))}
			value={value}
			onValueChange={onValueChange}
			placeholder={placeholder}
			searchPlaceholder="Buscar lista..."
			emptyText="Nenhuma lista encontrada."
			onCreateNew={handleCreateList}
			createNewText="Criar lista"
			className={className}
			disabled={disabled}
		/>
	);
}
