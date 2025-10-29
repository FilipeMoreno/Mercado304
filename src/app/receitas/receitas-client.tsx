"use client"

import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { ChefHat, Search, Sparkles, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { RecipeCardMemo } from "@/components/memoized"
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { TempStorage } from "@/lib/temp-storage"

interface Recipe {
	id: string
	name: string
	mealType: string
	description?: string
	ingredients: string[]
}

async function fetchRecipes(search?: string): Promise<Recipe[]> {
	const params = new URLSearchParams()
	if (search) params.append("search", search)

	const url = `/api/recipes${params.toString() ? `?${params.toString()}` : ""}`
	const res = await fetch(url)
	if (!res.ok) throw new Error("Erro ao buscar receitas")
	return res.json()
}

export function ReceitasClient() {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState("")
	const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	const {
		data: recipes,
		isLoading: loadingRecipes,
		error: errorRecipes,
	} = useQuery({
		queryKey: ["recipes", searchTerm],
		queryFn: () => fetchRecipes(searchTerm || undefined),
	})

	const handleSearch = (value: string) => {
		setSearchTerm(value)
	}

	const viewRecipe = (recipe: Recipe) => {
		const storageKey = TempStorage.save({ recipe })
		router.push(`/receitas/visualizar?storageKey=${storageKey}`)
	}

	const handleDeleteRecipe = async () => {
		if (!deletingRecipe) return

		setIsDeleting(true)
		try {
			const response = await fetch(`/api/recipes/${deletingRecipe.id}`, {
				method: "DELETE",
			})

			if (response.ok) {
				toast.success("Receita excluída com sucesso!")
				setDeletingRecipe(null)
				// Revalidar a query para atualizar a lista
			} else {
				toast.error("Erro ao excluir receita")
			}
		} catch (error) {
			console.error("Erro ao excluir receita:", error)
			toast.error("Erro ao excluir receita")
		} finally {
			setIsDeleting(false)
		}
	}

	const openDeleteConfirm = (recipe: Recipe) => {
		setDeletingRecipe(recipe)
	}

	if (loadingRecipes) {
		return (
			<div className="space-y-6">
				{/* Controles */}
				<div className="flex w-full gap-3">
					<div className="relative flex-1 sm:flex-none sm:w-80">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar receitas..."
							value={searchTerm}
							onChange={(e) => handleSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Button
						onClick={() => router.push("/receitas/gerar")}
						className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 w-full sm:w-auto"
					>
						<Sparkles className="h-4 w-4 mr-2" />
						<span className="hidden sm:inline">Gerar Receitas</span>
						<span className="sm:hidden">Gerar</span>
					</Button>
				</div>
				<RecipesSkeleton />
			</div>
		)
	}

	if (errorRecipes) {
		return <p className="text-red-500">Erro ao carregar receitas.</p>
	}

	return (
		<div className="space-y-6">
			{/* Controles */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex-1 w-full">
					<Input
						placeholder="Buscar receitas..."
						value={searchTerm}
						onChange={(e) => handleSearch(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button
					onClick={() => router.push("/receitas/gerar")}
					className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 w-full sm:w-auto"
				>
					<Sparkles className="h-4 w-4 mr-2" />
					<span className="hidden sm:inline">Gerar Receitas</span>
					<span className="sm:hidden">Gerar</span>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<CardTitle>{searchTerm ? "Resultados da Pesquisa" : "Receitas Salvas"}</CardTitle>
							<CardDescription>
								{searchTerm
									? `${recipes?.length || 0} receita(s) encontrada(s) para "${searchTerm}"`
									: "Suas receitas favoritas guardadas para consulta."}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{recipes?.length === 0 ? (
						searchTerm ? (
							<Empty className="border border-dashed py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<ChefHat className="h-6 w-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhuma receita encontrada</EmptyTitle>
									<EmptyDescription>Tente ajustar os termos de pesquisa.</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<Empty className="border border-dashed py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<ChefHat className="h-6 w-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhuma receita salva</EmptyTitle>
									<EmptyDescription>
										Você ainda não tem receitas salvas. Use a IA para criar suas primeiras receitas!
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button
										onClick={() => router.push("/receitas/gerar")}
										className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
									>
										<Sparkles className="h-4 w-4 mr-2" />
										Gerar Primeira Receita
									</Button>
								</EmptyContent>
							</Empty>
						)
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
							{recipes?.map((recipe, index) => (
								<motion.div
									key={recipe.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.03, duration: 0.3 }}
								>
									<RecipeCardMemo
										recipe={recipe}
										onView={() => viewRecipe(recipe)}
										onDelete={() => openDeleteConfirm(recipe)}
									/>
								</motion.div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog de confirmação de exclusão */}
			<ResponsiveConfirmDialog
				open={!!deletingRecipe}
				onOpenChange={(open) => !open && setDeletingRecipe(null)}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={handleDeleteRecipe}
				onCancel={() => setDeletingRecipe(null)}
				confirmText={isDeleting ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={isDeleting}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir a receita <strong>{deletingRecipe?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">Todos os dados da receita serão perdidos permanentemente.</p>
			</ResponsiveConfirmDialog>
		</div>
	)
}
