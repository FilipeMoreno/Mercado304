"use client"

import { memo, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardFooter } from "../shared/card-footer"

interface RecipeCardMemoProps {
	recipe: any
	onDelete: (recipe: any) => void
	onEdit?: (recipe: any) => void
	onView?: (recipe: any) => void
}

export const RecipeCardMemo = memo<RecipeCardMemoProps>(
	({ recipe, onDelete, onEdit, onView }) => {
		const handleDelete = useCallback(() => {
			onDelete(recipe)
		}, [recipe, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(recipe)
		}, [recipe, onEdit])

		const handleCardClick = useCallback(() => {
			if (onView) {
				onView(recipe)
			} else {
				window.location.href = `/receitas/${recipe.id}`
			}
		}, [recipe, onView])

		const recipeName = useMemo(() => {
			return recipe.name || "Receita sem nome"
		}, [recipe.name])

		const ingredientCount = useMemo(() => {
			return recipe.ingredients?.length || 0
		}, [recipe.ingredients?.length])

		const prepTime = useMemo(() => {
			return recipe.prepTime || 0
		}, [recipe.prepTime])

		const cookTime = useMemo(() => {
			return recipe.cookTime || 0
		}, [recipe.cookTime])

		const totalTime = useMemo(() => {
			return prepTime + cookTime
		}, [prepTime, cookTime])

		const difficulty = useMemo(() => {
			const levels: Record<string, { label: string; color: string }> = {
				FACIL: { label: "Fácil", color: "green" },
				MEDIO: { label: "Médio", color: "yellow" },
				DIFICIL: { label: "Difícil", color: "red" },
			}
			return (
				levels[recipe.difficulty] || {
					label: "Não definido",
					color: "gray",
				}
			)
		}, [recipe.difficulty])

		const servings = useMemo(() => {
			return recipe.servings || 0
		}, [recipe.servings])

		return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10">
					<div className="absolute inset-0 flex items-center justify-center opacity-5">
						<span className="text-9xl">🍳</span>
					</div>

					<div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
						<div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center border-4 border-orange-500/30 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
							<span className="text-4xl">🍳</span>
						</div>

						{totalTime > 0 && (
							<div className="flex items-center gap-2 text-sm">
								<div className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
									⏱️ {totalTime} min
								</div>
							</div>
						)}
					</div>

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Receita" />

					{recipe.difficulty && (
						<div className="absolute bottom-3 left-3">
							<div
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg text-xs font-medium border ${
									difficulty.color === "green"
										? "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400"
										: difficulty.color === "yellow"
											? "bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-400"
											: "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-400"
								}`}
							>
								{difficulty.label}
							</div>
						</div>
					)}
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">
						{recipeName}
					</h3>

					<div className="flex flex-wrap gap-2 mb-3">
						{ingredientCount > 0 && (
							<Badge variant="outline" className="text-xs">
								🥘 {ingredientCount} ingrediente
								{ingredientCount !== 1 ? "s" : ""}
							</Badge>
						)}
						{servings > 0 && (
							<Badge variant="secondary" className="text-xs">
								👥 {servings} porção{servings !== 1 ? "ões" : "ão"}
							</Badge>
						)}
					</div>

					<CardFooter text="Ver receita" />
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.recipe.id === nextProps.recipe.id &&
			prevProps.recipe.name === nextProps.recipe.name &&
			prevProps.recipe.ingredients?.length === nextProps.recipe.ingredients?.length &&
			prevProps.recipe.prepTime === nextProps.recipe.prepTime &&
			prevProps.recipe.updatedAt === nextProps.recipe.updatedAt
		)
	},
)

RecipeCardMemo.displayName = "RecipeCardMemo"
