"use client";

import { ArrowLeft, DollarSign, Edit, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ShoppingListHeaderProps {
	listName: string;
	totalItems: number;
	completedItems: number;
	progress: number;
	listId: string;
	onStartShopping: () => void;
	onOpenOptimizedRoute: () => void;
	onEditList: () => void;
	onDeleteList: () => void;
}

export function ShoppingListHeader({
	listName,
	totalItems,
	completedItems,
	progress,
	listId,
	onStartShopping,
	onOpenOptimizedRoute,
	onEditList,
	onDeleteList,
}: ShoppingListHeaderProps) {
	return (
		<div className="flex items-center gap-4">
			<Link href="/lista">
				<Button variant="outline" size="sm">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Voltar
				</Button>
			</Link>
			<div className="flex-1">
				<h1 className="text-3xl font-bold">{listName}</h1>
				<p className="text-gray-600 mt-1">
					{totalItems} itens • {completedItems} concluídos (
					{progress.toFixed(0)}%)
				</p>
			</div>
			<div className="flex gap-2">
				<Button
					variant="default"
					size="sm"
					onClick={onStartShopping}
				>
					<ShoppingCart className="h-4 w-4 mr-2" />
					Iniciar Compras
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onOpenOptimizedRoute}
				>
					<DollarSign className="h-4 w-4 mr-2" />
					Otimizar Roteiro
				</Button>
				<Link href={`/comparacao?lista=${listId}`}>
					<Button variant="outline" size="sm">
						<DollarSign className="h-4 w-4 mr-2" />
						Comparar Preços
					</Button>
				</Link>
				<Button variant="outline" size="sm" onClick={onEditList}>
					<Edit className="h-4 w-4 mr-2" />
					Editar
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={onDeleteList}
				>
					<Trash2 className="h-4 w-4 mr-2" />
					Excluir
				</Button>
			</div>
		</div>
	);
}