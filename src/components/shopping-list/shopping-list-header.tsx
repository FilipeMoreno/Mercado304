"use client"

import { ArrowLeft, DollarSign, Edit, MoreVertical, Receipt, ShoppingCart, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ShoppingListHeaderProps {
	listName: string
	totalItems: number
	completedItems: number
	progress: number
	listId: string
	onStartShopping: () => void
	onOpenOptimizedRoute: () => void
	onEditList: () => void
	onDeleteList: () => void
	onRegisterPurchase?: () => void
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
	onRegisterPurchase,
}: ShoppingListHeaderProps) {
	return (
		<div className="flex flex-col md:flex-row md:items-center md:gap-4 space-y-4 md:space-y-0">
			{/* Título e Botão Voltar (Sempre visível) */}
			<div className="flex items-center gap-4">
				<Link href="/lista">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 md:mr-2" />
						<span className="hidden md:inline">Voltar</span>
					</Button>
				</Link>
				<div className="flex-1">
					<h1 className="text-2xl md:text-3xl font-bold truncate" title={listName}>
						{listName}
					</h1>
					<p className="text-gray-600 mt-1 text-sm">
						{totalItems} itens • {completedItems} concluídos ({progress.toFixed(0)}%)
					</p>
				</div>
			</div>

			{/* Botões de Ação */}
			<div className="flex items-center gap-2 justify-end md:justify-start flex-wrap">
				{/* Botões Principais sempre visíveis */}
				<Button variant="default" size="sm" onClick={onStartShopping} className="flex-1 md:flex-initial">
					<ShoppingCart className="h-4 w-4 mr-2" />
					Iniciar Compras
				</Button>

				{onRegisterPurchase && totalItems > 0 && (
					<Button
						variant="secondary"
						size="sm"
						onClick={onRegisterPurchase}
						className="flex-1 md:flex-initial"
					>
						<Receipt className="h-4 w-4 mr-2" />
						Registrar Compra
					</Button>
				)}

				{/* Botões para Desktop (md e acima) */}
				<div className="hidden md:flex gap-2">
					<Button variant="outline" size="sm" onClick={onOpenOptimizedRoute}>
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
					<Button variant="destructive" size="sm" onClick={onDeleteList}>
						<Trash2 className="h-4 w-4 mr-2" />
						Excluir
					</Button>
				</div>

				{/* Dropdown Menu para Mobile (abaixo de md) */}
				<div className="md:hidden">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{onRegisterPurchase && totalItems > 0 && (
								<>
									<DropdownMenuItem onClick={onRegisterPurchase}>
										<Receipt className="h-4 w-4 mr-2" />
										<span>Registrar Compra</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<DropdownMenuItem onClick={onOpenOptimizedRoute}>
								<DollarSign className="h-4 w-4 mr-2" />
								<span>Otimizar Roteiro</span>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href={`/comparacao?lista=${listId}`}>
									<DollarSign className="h-4 w-4 mr-2" />
									<span>Comparar Preços</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onEditList}>
								<Edit className="h-4 w-4 mr-2" />
								<span>Editar</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onDeleteList} className="text-red-600">
								<Trash2 className="h-4 w-4 mr-2" />
								<span>Excluir</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	)
}
