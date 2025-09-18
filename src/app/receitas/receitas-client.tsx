"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChefHat, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { RecipeSuggester } from "@/components/recipe-suggester"
import { RecipeSearch } from "@/components/recipe-search"
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Recipe {
	id: string
	name: string
	mealType: string
	description?: string
	ingredients: string[]
}

async function fetchRecipes(search?: string, ingredients?: string[]): Promise<Recipe[]> {
	const params = new URLSearchParams()
	if (search) params.append("search", search)
	if (ingredients && ingredients.length > 0) params.append("ingredients", ingredients.join(","))
	
	const url = `/api/recipes${params.toString() ? `?${params.toString()}` : ""}`
	const res = await fetch(url)
	if (!res.ok) throw new Error("Erro ao buscar receitas")
	return res.json()
}

async function fetchProducts(): Promise<{ id: string; name: string }[]> {
	const res = await fetch("/api/products")
	if (!res.ok) throw new Error("Erro ao buscar produtos")
	const data = await res.json()
	return data.products || []
}

export function ReceitasClient() {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])

	const {
		data: recipes,
		isLoading: loadingRecipes,
		error: errorRecipes,
	} = useQuery({ 
		queryKey: ["recipes", searchTerm, selectedIngredients], 
		queryFn: () => fetchRecipes(searchTerm || undefined, selectedIngredients.length > 0 ? selectedIngredients : undefined)
	})

	const {
		data: products,
		isLoading: loadingProducts,
		error: errorProducts,
	} = useQuery({ queryKey: ["products"], queryFn: fetchProducts })

	const handleSearch = (search: string, ingredients: string[]) => {
		setSearchTerm(search)
		setSelectedIngredients(ingredients)
	}

	if (loadingRecipes || loadingProducts) {
		return <RecipesSkeleton />
	}

	if (errorRecipes || errorProducts) {
		return <p className="text-red-500">Erro ao carregar dados.</p>
	}

	const productNames = products?.map((p) => p.name) || []

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Minhas Receitas</h1>
					<p className="text-gray-600 mt-2">Veja suas receitas salvas ou gere novas sugestões com a IA.</p>
				</div>
				<RecipeSuggester ingredientList={productNames} buttonText="Gerar Nova Receita" />
			</div>

			{/* Componente de pesquisa */}
			<RecipeSearch 
				onSearch={handleSearch}
				availableIngredients={productNames}
			/>

			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<CardTitle>
								{searchTerm || selectedIngredients.length > 0 ? "Resultados da Pesquisa" : "Receitas Salvas"}
							</CardTitle>
							<CardDescription>
								{searchTerm || selectedIngredients.length > 0 
									? `${recipes?.length || 0} receita(s) encontrada(s)`
									: "Suas receitas favoritas guardadas para consulta."
								}
							</CardDescription>
						</div>
						{(searchTerm || selectedIngredients.length > 0) && (
							<div className="text-sm text-gray-500">
								{searchTerm && <p>Buscando por: "{searchTerm}"</p>}
								{selectedIngredients.length > 0 && (
									<p>Com ingredientes: {selectedIngredients.join(", ")}</p>
								)}
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{recipes?.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<ChefHat className="h-12 w-12 mx-auto mb-4" />
							{searchTerm || selectedIngredients.length > 0 ? (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita encontrada</p>
									<p className="text-gray-600">Tente ajustar os termos de pesquisa ou ingredientes.</p>
								</>
							) : (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita salva</p>
									<p className="text-gray-600">Use o "Chefe Virtual" para gerar e salvar suas primeiras receitas.</p>
								</>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{recipes?.map((recipe) => (
								<Card key={recipe.id} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="text-lg">{recipe.name}</CardTitle>
										<CardDescription>{recipe.mealType}</CardDescription>
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
															className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
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
											<Button
												variant="outline"
												size="sm"
												onClick={() => toast.info("A página de detalhes ainda será construída.")}
											>
												<Eye className="h-4 w-4 mr-1" />
												Ver
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => toast.info("Excluir ainda não implementado.")}
											>
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
