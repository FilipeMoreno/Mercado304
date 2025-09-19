"use client"

import { useQuery } from "@tanstack/react-query"
import { ChefHat, Eye, Plus, Sparkles, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

	const deleteRecipe = async (recipeId: string) => {
		try {
			const response = await fetch(`/api/recipes/${recipeId}`, {
				method: "DELETE",
			})

			if (response.ok) {
				toast.success("Receita excluída com sucesso!")
				// Revalidar a query para atualizar a lista
			} else {
				toast.error("Erro ao excluir receita")
			}
		} catch (error) {
			console.error("Erro ao excluir receita:", error)
			toast.error("Erro ao excluir receita")
		}
	}

	if (loadingRecipes) {
		return (
			<div className="space-y-6">
				{/* Header */}
				<div className="flex justify-between items-center">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<ChefHat className="h-8 w-8 text-orange-500" />
							<h1 className="text-3xl font-bold">Minhas Receitas</h1>
						</div>
						<p className="text-gray-600">Suas receitas favoritas guardadas para consulta.</p>
					</div>
					<Button 
						onClick={() => router.push("/receitas/gerar")}
						className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
					>
						<Sparkles className="h-4 w-4 mr-2" />
						Gerar Novas Receitas
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
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<ChefHat className="h-8 w-8 text-orange-500" />
						Minhas Receitas
					</h1>
					<p className="text-gray-600 mt-2">Suas receitas favoritas guardadas para consulta.</p>
				</div>
				<Button
					onClick={() => router.push("/receitas/gerar")}
					className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
				>
					<Sparkles className="h-4 w-4 mr-2" />
					Gerar Novas Receitas
				</Button>
			</div>

			{/* Busca simples */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Input
							placeholder="Buscar receitas por nome ou descrição..."
							value={searchTerm}
							onChange={(e) => handleSearch(e.target.value)}
							className="w-full"
						/>
					</div>
				</CardContent>
			</Card>

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
															key={index}
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
											<Button variant="destructive" size="sm" onClick={() => deleteRecipe(recipe.id)}>
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
		</div>
	)
}
