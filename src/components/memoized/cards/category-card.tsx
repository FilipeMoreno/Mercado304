"use client"

import { memo, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardBadge } from "../shared/card-badge"
import { CardFooter } from "../shared/card-footer"

interface CategoryCardMemoProps {
	category: any
	onDelete: (category: any) => void
	onEdit?: (category: any) => void
}

export const CategoryCardMemo = memo<CategoryCardMemoProps>(
	({ category, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(category)
		}, [category, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(category)
		}, [category, onEdit])

		const handleCardClick = useCallback(() => {
			window.location.href = `/categorias/${category.id}`
		}, [category.id])

		const categoryName = useMemo(() => {
			return category.name || "Categoria sem nome"
		}, [category.name])

		const categoryIcon = useMemo(() => {
			return category.icon || "📦"
		}, [category.icon])

		const categoryColor = useMemo(() => {
			return category.color || "#6366f1"
		}, [category.color])

		return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div
					className="relative h-48 w-full overflow-hidden flex items-center justify-center"
					style={{
						background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}30 100%)`,
					}}
				>
					<div className="text-8xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
						{categoryIcon}
					</div>

					<div className="absolute inset-0 opacity-5">
						<div className="absolute top-4 right-4 text-6xl">{categoryIcon}</div>
						<div className="absolute bottom-4 left-4 text-4xl">{categoryIcon}</div>
					</div>

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Categoria" />

					{category.isFood !== undefined && (
						<div className="absolute bottom-3 left-3">
							{category.isFood && (	<CardBadge color={categoryColor}>🍽️ Alimento</CardBadge>)}
						</div>
					)}
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<div className="flex items-center gap-2 mb-2">
						<span className="text-2xl">{categoryIcon}</span>
						<h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
							{categoryName}
						</h3>
					</div>

					<div className="flex items-center gap-2 mb-3">
						<div
							className="w-3 h-3 rounded-full border-2 border-background shadow-sm"
							style={{ backgroundColor: categoryColor }}
						/>
						<span className="text-xs text-muted-foreground font-mono">{categoryColor}</span>
					</div>

					<CardFooter />
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.category.id === nextProps.category.id &&
			prevProps.category.name === nextProps.category.name &&
			prevProps.category.icon === nextProps.category.icon &&
			prevProps.category.updatedAt === nextProps.category.updatedAt
		)
	},
)

CategoryCardMemo.displayName = "CategoryCardMemo"
