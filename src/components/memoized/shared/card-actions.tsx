"use client"

import { Edit, MoreHorizontal, Trash2 } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CardActionsProps {
	onEdit?: () => void
	onDelete: () => void
	entityName: string
}

export const CardActions = ({ onEdit, onDelete, entityName }: CardActionsProps) => {
	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation()
		onEdit?.()
	}

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation()
		onDelete()
	}

	return (
		<div
			className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
			onClick={(e) => e.stopPropagation()}
		>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="secondary"
						size="icon"
						className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					{onEdit && (
						<DropdownMenuItem onClick={handleEdit}>
							<Edit className="h-4 w-4 mr-2" />
							Editar {entityName}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
						<Trash2 className="h-4 w-4 mr-2" />
						Excluir
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

CardActions.displayName = "CardActions"
