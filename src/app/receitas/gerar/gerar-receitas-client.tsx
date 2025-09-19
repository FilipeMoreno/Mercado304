"use client"

import { useQuery } from "@tanstack/react-query"
import { ChefHat, Eye, Loader2, Save, Sparkles, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { RecipeSearch } from "@/components/recipe-search"
import { RecipeGenerationSkeleton, RecipeCardsSkeleton } from "@/components/skeletons/recipe-generation-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TempStorage } from "@/lib/temp-storage"

interface Recipe {
	id: string
	name: string
	mealType: string
	description?: string
	ingredients: string[]
	ingredientes_disponiveis?: string[]
	ingredientes_faltantes?: string[]
	custo_estimado?: string
}

async function fetchProducts(): Promise<{ id: string; name: string }[]> {
	const res = await fetch("/api/products")
	if (!res.ok) throw new Error("Erro ao buscar produtos")
	const data = await res.json()
	return data.products || []
}

export function GerarReceitasClient() {
	const router = useRouter()
	const [aiRecipes, setAiRecipes] = useState<Recipe[]>([])
	const [aiLoading, setAiLoading] = useState(false)

	// Restaurar receitas do localStorage na inicialização
	useEffect(() => {
		const savedRecipes = localStorage.getItem('mercado304_generated_recipes')
		if (savedRecipes) {
			try {
				const recipes = JSON.parse(savedRecipes)
				setAiRecipes(recipes)
			} catch (error) {
				console.error('Erro ao carregar receitas salvas:', error)
			}
		}
	}, [])

	// Função para salvar receitas no localStorage
	const saveRecipesToStorage = (recipes: Recipe[]) => {
		try {
			localStorage.setItem('mercado304_generated_recipes', JSON.stringify(recipes))
			setAiRecipes(recipes)
		} catch (error) {
			console.error('Erro ao salvar receitas:', error)
			setAiRecipes(recipes) // Set state anyway
		}
	}

	const {
		data: products,
		isLoading: loadingProducts,
		error: errorProducts,
	} = useQuery({ queryKey: ["products"], queryFn: fetchProducts })

	const handleAISearch = async (search: string, ingredients: string[], mealTypes?: string[]) => {
		setAiLoading(true)

		try {
			const response = await fetch("/api/ai/search-recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ search, ingredients, mealTypes }),
			})

			if (response.ok) {
				const data = await response.json()
				console.log("🧑‍🍳 Dados da API:", data)
				const formattedRecipes =
					data.sugestoes?.map((recipe: any, index: number) => {
						console.log(`🍽️ Receita ${index + 1}:`, recipe)
						return {
							id: `ai-${Date.now()}-${index}`,
							name: recipe.prato,
							mealType: recipe.refeicao,
							description: recipe.descricao,
							ingredients: recipe.ingredientes || [],
							...recipe,
						}
					}) || []

				saveRecipesToStorage(formattedRecipes)
				toast.success(`${formattedRecipes.length} receitas geradas pela IA!`)
			} else {
				toast.error("Erro ao gerar receitas com IA")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao conectar com a IA")
		} finally {
			setAiLoading(false)
		}
	}

	const handleSurpriseMe = async (mealTypes: string[]) => {
		setAiLoading(true)

		try {
			const productNames = products?.map((p) => p.name) || []
			const response = await fetch("/api/ai/surprise-recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mealTypes, ingredients: productNames }),
			})

			if (response.ok) {
				const data = await response.json()
				console.log("🎉 Dados da API Surprise:", data)
				const formattedRecipes =
					data.sugestoes?.map((recipe: any, index: number) => {
						console.log(`🌟 Receita surpresa ${index + 1}:`, recipe)
						return {
							id: `surprise-${Date.now()}-${index}`,
							name: recipe.prato,
							mealType: recipe.refeicao,
							description: recipe.descricao,
							ingredients: recipe.ingredientes || [],
							...recipe,
						}
					}) || []

				saveRecipesToStorage(formattedRecipes)
				toast.success(`Surprise! ${formattedRecipes.length} receitas criativas geradas! ✨`)
			} else {
				toast.error("Erro ao gerar receitas surpresa")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao conectar com a IA")
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
					chefTip: recipe.dica_chef || "",
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

	const addToShoppingList = async (ingredients: string[]) => {
		try {
			// Primeiro, buscar ou criar uma lista de compras padrão
			const listsResponse = await fetch("/api/shopping-lists")
			if (!listsResponse.ok) throw new Error("Erro ao buscar listas")
			
			const lists = await listsResponse.json()
			let targetList = lists.find((list: any) => list.name === "Lista de Receitas") || lists[0]
			
			if (!targetList) {
				// Criar uma nova lista se não existir nenhuma
				const createResponse = await fetch("/api/shopping-lists", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Lista de Receitas",
						description: "Ingredientes para receitas geradas pela IA"
					}),
				})
				if (!createResponse.ok) throw new Error("Erro ao criar lista")
				targetList = await createResponse.json()
			}

			// Adicionar ingredientes à lista
			const addPromises = ingredients.map(ingredient => 
				fetch(`/api/shopping-lists/${targetList.id}/items`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: ingredient,
						quantity: 1,
						unit: "un",
						isTemporary: true
					}),
				})
			)

			await Promise.all(addPromises)
			toast.success(`${ingredients.length} ingredientes adicionados à lista de compras!`)
		} catch (error) {
			console.error("Erro ao adicionar à lista:", error)
			toast.error("Erro ao adicionar ingredientes à lista de compras")
		}
	}

	if (loadingProducts) {
		return <RecipeGenerationSkeleton />
	}

	if (errorProducts) {
		return <p className="text-red-500">Erro ao carregar produtos.</p>
	}

	const productNames = products?.map((p) => p.name) || []

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Sparkles className="h-8 w-8 text-yellow-500" />
						Gerar Receitas
					</h1>
					<p className="text-gray-600 mt-2">
						Use a inteligência artificial para criar receitas personalizadas com seus ingredientes.
					</p>
				</div>
				<Button variant="outline" onClick={() => router.push("/receitas")}>
					← Ver Receitas Salvas
				</Button>
			</div>

			{/* Componente de pesquisa */}
			<RecipeSearch
				onSearch={() => {}} // Não usamos busca normal nesta página
				onAISearch={handleAISearch}
				onSurpriseMe={handleSurpriseMe}
				availableIngredients={productNames}
				hideNormalSearch={true}
			/>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ChefHat className="h-5 w-5" />
						Receitas Geradas pela IA
					</CardTitle>
					<CardDescription>
						{aiRecipes.length > 0
							? `${aiRecipes.length} receita(s) criada(s) pela IA`
							: "Use os campos acima para gerar receitas personalizadas"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{aiLoading ? (
						<RecipeCardsSkeleton count={3} />
					) : aiRecipes.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<ChefHat className="h-12 w-12 mx-auto mb-4" />
							<p className="text-lg font-medium mb-2">Pronto para criar receitas incríveis!</p>
							<p className="text-gray-600 mb-4">Digite ingredientes ou use o "Me Surpreenda" para começar.</p>
							<div className="flex justify-center gap-2 text-sm text-gray-500">
								<span>💡 Dica:</span>
								<span>Quanto mais específico, melhor o resultado!</span>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{aiRecipes.map((recipe) => (
								<Card key={recipe.id} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="text-lg">{recipe.name}</CardTitle>
										<CardDescription>{recipe.mealType}</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<p className="text-sm text-gray-600 h-10 overflow-hidden">{recipe.description}</p>

											{/* Custo Estimado */}
											{recipe.custo_estimado && (
												<div className="flex items-center gap-2">
													<span className="text-xs font-medium text-gray-500">Custo:</span>
													<span className={`text-xs px-2 py-1 rounded ${
														recipe.custo_estimado === 'baixo' ? 'bg-green-50 text-green-700' :
														recipe.custo_estimado === 'médio' ? 'bg-yellow-50 text-yellow-700' :
														'bg-red-50 text-red-700'
													}`}>
														{recipe.custo_estimado.charAt(0).toUpperCase() + recipe.custo_estimado.slice(1)}
													</span>
												</div>
											)}

											{/* Ingredientes Disponíveis */}
											{recipe.ingredientes_disponiveis && recipe.ingredientes_disponiveis.length > 0 && (
												<div>
													<p className="text-xs font-medium text-green-600 mb-1">✅ Você já tem:</p>
													<div className="flex flex-wrap gap-1">
														{recipe.ingredientes_disponiveis.slice(0, 3).map((ingredient, index) => (
															<span
																key={index}
																className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded border border-green-200"
															>
																{ingredient}
															</span>
														))}
														{recipe.ingredientes_disponiveis.length > 3 && (
															<span className="inline-block px-2 py-1 text-xs bg-green-50 text-green-600 rounded">
																+{recipe.ingredientes_disponiveis.length - 3} mais
															</span>
														)}
													</div>
												</div>
											)}

											{/* Ingredientes Faltantes */}
											{recipe.ingredientes_faltantes && recipe.ingredientes_faltantes.length > 0 && (
												<div>
													<p className="text-xs font-medium text-orange-600 mb-1">🛒 Precisa comprar:</p>
													<div className="flex flex-wrap gap-1">
														{recipe.ingredientes_faltantes.slice(0, 3).map((ingredient, index) => (
															<span
																key={index}
																className="inline-block px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded border border-orange-200"
															>
																{ingredient}
															</span>
														))}
														{recipe.ingredientes_faltantes.length > 3 && (
															<span className="inline-block px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded">
																+{recipe.ingredientes_faltantes.length - 3} mais
															</span>
														)}
													</div>
												</div>
											)}

											{/* Fallback para ingredientes normais (se não tiver a separação) */}
											{(!recipe.ingredientes_disponiveis && !recipe.ingredientes_faltantes) && recipe.ingredients && recipe.ingredients.length > 0 && (
												<div>
													<p className="text-xs font-medium text-gray-500 mb-1">Ingredientes:</p>
													<div className="flex flex-wrap gap-1">
														{recipe.ingredients.slice(0, 3).map((ingredient, index) => (
															<span
																key={index}
																className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
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
										</div>

										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => viewRecipe(recipe)} className="flex-1">
												<Eye className="h-4 w-4 mr-1" />
												Ver
											</Button>
											<Button variant="default" size="sm" onClick={() => saveRecipe(recipe)}>
												<Save className="h-4 w-4 mr-1" />
												Salvar
											</Button>
											{recipe.ingredientes_faltantes && recipe.ingredientes_faltantes.length > 0 && (
												<Button 
													variant="outline" 
													size="sm" 
													onClick={() => addToShoppingList(recipe.ingredientes_faltantes || [])}
													className="text-orange-600 border-orange-200 hover:bg-orange-50"
													title="Adicionar ingredientes faltantes à lista de compras"
												>
													<ShoppingCart className="h-4 w-4" />
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
