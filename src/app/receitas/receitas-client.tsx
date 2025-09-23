"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ChefHat, Eye, Search, Sparkles, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { LazyWrapper } from "@/components/ui/lazy-wrapper"
import { usePerformanceMonitor } from "@/hooks/use-performance"
import { useOptimizedQuery } from "@/hooks/use-optimized-queries"

import { toast } from "sonner"
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

	const viewRecipe = (recipe: any) => {
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
				{/* Header with search and generate button */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-2 mb-6"
				>
					<div className="relative flex-1">
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
						className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
					>
						<Sparkles className="h-4 w-4 mr-2" />
						<span className="hidden sm:inline">Gerar Receitas</span>
						<span className="sm:hidden">Gerar</span>
					</Button>
				</motion.div>
				<RecipesSkeleton />
			</div>
		)
	}

	if (errorRecipes) {
		return <p className="text-red-500">Erro ao carregar receitas.</p>
	}

	return (
		<div className="space-y-6">
			{/* Header with search and generate button */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center gap-2 mb-6"
			>
				<div className="relative flex-1">
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
					className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
				>
					<Sparkles className="h-4 w-4 mr-2" />
					<span className="hidden sm:inline">Gerar Receitas</span>
					<span className="sm:hidden">Gerar</span>
				</Button>
			</motion.div>

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
						<div className="text-center py-12 text-gray-500">
							<ChefHat className="h-12 w-12 mx-auto mb-4" />
							{searchTerm ? (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita encontrada</p>
									<p className="text-gray-600">Tente ajustar os termos de pesquisa.</p>
								</>
							) : (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita salva</p>
									<p className="text-gray-600 mb-4">
										Você ainda não tem receitas salvas. Use a IA para criar suas primeiras receitas!
									</p>
									<Button
										onClick={() => router.push("/receitas/gerar")}
										className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
									>
										<Sparkles className="h-4 w-4 mr-2" />
										Gerar Primeira Receita
									</Button>
								</>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{recipes?.map((recipe) => (
								<Card key={recipe.id} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="text-lg">{recipe.name}</CardTitle>
										<CardDescription className="flex items-center gap-1">
											<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{recipe.mealType}</span>
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-600 mb-3 h-10 overflow-hidden">{recipe.description}</p>

										{/* Ingredientes */}
										{recipe.ingredients && recipe.ingredients.length > 0 && (
											<div className="mb-3">
												<p className="text-xs font-medium text-gray-500 mb-1">Ingredientes:</p>
												<div className="flex flex-wrap gap-1">
													{recipe.ingredients.slice(0, 3).map((ingredient, index) => (
														<span
															key={`${recipe.id}-ingredient-${index}`}
															className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded"
														>
															{ingredient}
														</span>
													))}
													{recipe.ingredients.length > 3 && (
														<span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
															+{recipe.ingredients.length - 3} mais
														</span>
													)}
												</div>
											</div>
										)}

										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => viewRecipe(recipe)} className="flex-1">
												<Eye className="h-4 w-4 mr-1" />
												Ver Receita
											</Button>
											<Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(recipe)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
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
