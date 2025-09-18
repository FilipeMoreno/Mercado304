"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChefHat, Eye, Trash2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { RecipeSearch } from "@/components/recipe-search"
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TempStorage } from "@/lib/temp-storage"
import { useRouter } from "next/navigation"

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
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
	const [aiRecipes, setAiRecipes] = useState<Recipe[]>([])
	const [showingAiResults, setShowingAiResults] = useState(false)
	const [aiLoading, setAiLoading] = useState(false)

	const {
		data: recipes,
		isLoading: loadingRecipes,
		error: errorRecipes,
	} = useQuery({ 
		queryKey: ["recipes", searchTerm, selectedIngredients], 
		queryFn: () => fetchRecipes(searchTerm || undefined, selectedIngredients.length > 0 ? selectedIngredients : undefined),
		enabled: !showingAiResults
	})

	const {
		data: products,
		isLoading: loadingProducts,
		error: errorProducts,
	} = useQuery({ queryKey: ["products"], queryFn: fetchProducts })

	const handleSearch = (search: string, ingredients: string[]) => {
		setSearchTerm(search)
		setSelectedIngredients(ingredients)
		setShowingAiResults(false)
	}

	const handleAISearch = async (search: string, ingredients: string[], mealTypes?: string[]) => {
		setAiLoading(true)
		setShowingAiResults(true)
		
		try {
			const response = await fetch("/api/ai/search-recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ search, ingredients, mealTypes }),
			})

			if (response.ok) {
				const data = await response.json()
				const formattedRecipes = data.sugestoes?.map((recipe: any, index: number) => ({
					id: `ai-${Date.now()}-${index}`,
					name: recipe.prato,
					mealType: recipe.refeicao,
					description: recipe.descricao,
					ingredients: recipe.ingredientes || [],
					...recipe
				})) || []
				
				setAiRecipes(formattedRecipes)
				toast.success(`${formattedRecipes.length} receitas geradas pela IA!`)
			} else {
				toast.error("Erro ao gerar receitas com IA")
				setShowingAiResults(false)
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao conectar com a IA")
			setShowingAiResults(false)
		} finally {
			setAiLoading(false)
		}
	}

	const handleSurpriseMe = async (mealTypes: string[]) => {
		setAiLoading(true)
		setShowingAiResults(true)
		
		try {
			const productNames = products?.map((p) => p.name) || []
			const response = await fetch("/api/ai/surprise-recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mealTypes, ingredients: productNames }),
			})

			if (response.ok) {
				const data = await response.json()
				const formattedRecipes = data.sugestoes?.map((recipe: any, index: number) => ({
					id: `surprise-${Date.now()}-${index}`,
					name: recipe.prato,
					mealType: recipe.refeicao,
					description: recipe.descricao,
					ingredients: recipe.ingredientes || [],
					...recipe
				})) || []
				
				setAiRecipes(formattedRecipes)
				toast.success(`Surprise! ${formattedRecipes.length} receitas criativas geradas! ✨`)
			} else {
				toast.error("Erro ao gerar receitas surpresa")
				setShowingAiResults(false)
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao conectar com a IA")
			setShowingAiResults(false)
		} finally {
			setAiLoading(false)
		}
	}

	const viewRecipe = (recipe: any) => {
		const storageKey = TempStorage.save({ recipe })
		router.push(`/receitas/visualizar?storageKey=${storageKey}`)
	}

	const saveRecipe = async (recipe: any) => {
		try {
			const response = await fetch("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: recipe.name || recipe.prato,
					mealType: recipe.mealType || recipe.refeicao,
					description: recipe.description || recipe.descricao,
					ingredients: recipe.ingredients || recipe.ingredientes || [],
					instructions: recipe.modo_preparo || "",
					cookingTime: recipe.tempo_preparo || "",
					chefTip: recipe.dica_chef || ""
				}),
			})

			if (response.ok) {
				toast.success("Receita salva com sucesso!")
			} else {
				toast.error("Erro ao salvar receita")
			}
		} catch (error) {
			console.error("Erro ao salvar receita:", error)
			toast.error("Erro ao salvar receita")
		}
	}

	if (loadingRecipes || loadingProducts) {
		return <RecipesSkeleton />
	}

	if (errorRecipes || errorProducts) {
		return <p className="text-red-500">Erro ao carregar dados.</p>
	}

	const productNames = products?.map((p) => p.name) || []
	const displayRecipes = showingAiResults ? aiRecipes : recipes

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Minhas Receitas</h1>
					<p className="text-gray-600 mt-2">
						{showingAiResults 
							? "Receitas geradas pela IA - salve suas favoritas!"
							: "Veja suas receitas salvas ou gere novas sugestões com a IA."
						}
					</p>
				</div>
				{showingAiResults && (
					<Button 
						variant="outline"
						onClick={() => {
							setShowingAiResults(false)
							setAiRecipes([])
						}}
					>
						← Voltar às Receitas Salvas
					</Button>
				)}
			</div>

			{/* Componente de pesquisa */}
			<RecipeSearch 
				onSearch={handleSearch}
				onAISearch={handleAISearch}
				onSurpriseMe={handleSurpriseMe}
				availableIngredients={productNames}
			/>

			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<CardTitle>
								{showingAiResults 
									? "Receitas Geradas pela IA" 
									: (searchTerm || selectedIngredients.length > 0 ? "Resultados da Pesquisa" : "Receitas Salvas")
								}
							</CardTitle>
							<CardDescription>
								{showingAiResults
									? `${aiRecipes?.length || 0} receita(s) criada(s) pela IA`
									: (searchTerm || selectedIngredients.length > 0 
										? `${recipes?.length || 0} receita(s) encontrada(s)`
										: "Suas receitas favoritas guardadas para consulta.")
								}
							</CardDescription>
						</div>
						{(searchTerm || selectedIngredients.length > 0) && !showingAiResults && (
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
					{aiLoading ? (
						<div className="text-center py-12">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
							<p className="text-gray-500">Gerando receitas com IA...</p>
						</div>
					) : displayRecipes?.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<ChefHat className="h-12 w-12 mx-auto mb-4" />
							{showingAiResults ? (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita gerada</p>
									<p className="text-gray-600">Tente ajustar os parâmetros de busca ou use o "Me Surpreenda".</p>
								</>
							) : searchTerm || selectedIngredients.length > 0 ? (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita encontrada</p>
									<p className="text-gray-600">Tente ajustar os termos de pesquisa ou use a busca por IA.</p>
								</>
							) : (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita salva</p>
									<p className="text-gray-600">Use a busca por IA para gerar e salvar suas primeiras receitas.</p>
								</>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{displayRecipes?.map((recipe) => (
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
												onClick={() => viewRecipe(recipe)}
											>
												<Eye className="h-4 w-4 mr-1" />
												Ver
											</Button>
											{showingAiResults && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => saveRecipe(recipe)}
												>
													<Save className="h-4 w-4 mr-1" />
													Salvar
												</Button>
											)}
											{!showingAiResults && (
												<Button
													variant="destructive"
													size="sm"
													onClick={() => toast.info("Excluir ainda não implementado.")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
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
