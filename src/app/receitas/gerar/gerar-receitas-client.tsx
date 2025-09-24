"use client"

import { useQuery } from "@tanstack/react-query"
import { ChefHat, Eye, Save, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { RecipeSearch } from "@/components/recipe-search"
import { RecipeCardsSkeleton, RecipeGenerationSkeleton } from "@/components/skeletons/recipe-generation-skeleton"
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
	const [searchTerm, setSearchTerm] = useState("")

	// Restaurar receitas do localStorage na inicialização
	useEffect(() => {
		const savedRecipes = localStorage.getItem("mercado304_generated_recipes")
		if (savedRecipes) {
			try {
				const recipes = JSON.parse(savedRecipes)
				setAiRecipes(recipes)
			} catch (error) {
				console.error("Erro ao carregar receitas salvas:", error)
			}
		}
	}, [])

	// Função para salvar receitas no localStorage
	const saveRecipesToStorage = (recipes: Recipe[]) => {
		try {
			localStorage.setItem("mercado304_generated_recipes", JSON.stringify(recipes))
			setAiRecipes(recipes)
		} catch (error) {
			console.error("Erro ao salvar receitas:", error)
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
					data.sugestoes?.map((recipe: {
						prato: string
						refeicao: string
						descricao: string
						ingredientes: string[]
						[key: string]: unknown
					}, index: number) => {
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
					data.sugestoes?.map((recipe: {
						prato: string
						refeicao: string
						descricao: string
						ingredientes: string[]
						[key: string]: unknown
					}, index: number) => {
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

	const viewRecipe = (recipe: Recipe) => {
		const storageKey = TempStorage.save({ recipe })
		router.push(`/receitas/visualizar?storageKey=${storageKey}`)
	}

	const saveRecipe = async (recipe: Recipe) => {
		try {
			const response = await fetch("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: recipe.name || (recipe as any).prato,
					mealType: recipe.mealType || (recipe as any).refeicao,
					description: recipe.description || (recipe as any).descricao,
					ingredients: recipe.ingredients || (recipe as any).ingredientes || [],
					instructions: (recipe as any).modo_preparo || "",
					cookingTime: (recipe as any).tempo_preparo || "",
					chefTip: (recipe as any).dica_chef || "",
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
			let targetList = lists.find((list: { id: string; name: string }) => list.name === "Lista de Receitas") || lists[0]

			if (!targetList) {
				// Criar uma nova lista se não existir nenhuma
				const createResponse = await fetch("/api/shopping-lists", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Lista de Receitas",
						description: "Ingredientes para receitas geradas pela IA",
					}),
				})
				if (!createResponse.ok) throw new Error("Erro ao criar lista")
				targetList = await createResponse.json()
			}

			// Adicionar ingredientes à lista
			const addPromises = ingredients.map((ingredient) =>
				fetch(`/api/shopping-lists/${targetList.id}/items`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: ingredient,
						quantity: 1,
						unit: "un",
						isTemporary: true,
					}),
				}),
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

	// Filtrar receitas baseado no termo de busca
	const filteredRecipes = aiRecipes.filter(
		(recipe) =>
			recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(searchTerm.toLowerCase())),
	)

	return (
		<div className="space-y-6">
			{/* Controles */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex-1 w-full">
					<input
						placeholder="Buscar receitas geradas..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md  focus:border-transparent"
					/>
				</div>
				<Button variant="outline" onClick={() => router.push("/receitas")} className="w-full sm:w-auto">
					<span className="hidden sm:inline">← Ver Receitas Salvas</span>
					<span className="sm:hidden">← Receitas</span>
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
						{filteredRecipes.length > 0
							? `${filteredRecipes.length} receita(s) criada(s) pela IA${searchTerm ? " (filtradas)" : ""}`
							: aiRecipes.length > 0
								? "Nenhuma receita encontrada com o termo de busca"
								: "Use os campos acima para gerar receitas personalizadas"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{aiLoading ? (
						<RecipeCardsSkeleton count={3} />
					) : filteredRecipes.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<ChefHat className="h-12 w-12 mx-auto mb-4" />
							{aiRecipes.length === 0 ? (
								<>
									<p className="text-lg font-medium mb-2">Pronto para criar receitas incríveis!</p>
									<p className="text-gray-600 mb-4">Digite ingredientes ou use o "Me Surpreenda" para começar.</p>
									<div className="flex justify-center gap-2 text-sm text-gray-500">
										<span>💡 Dica:</span>
										<span>Quanto mais específico, melhor o resultado!</span>
									</div>
								</>
							) : (
								<>
									<p className="text-lg font-medium mb-2">Nenhuma receita encontrada</p>
									<p className="text-gray-600 mb-4">Tente ajustar o termo de busca ou limpe o filtro.</p>
									<Button variant="outline" onClick={() => setSearchTerm("")} className="mt-2">
										Limpar Busca
									</Button>
								</>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredRecipes.map((recipe) => (
								<Card
									key={recipe.id}
									className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 group"
								>
									<CardHeader className="pb-4">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
													{recipe.name}
												</CardTitle>
												<CardDescription className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit">
													{recipe.mealType}
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="space-y-4">
											{recipe.description && (
												<p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
													{recipe.description}
												</p>
											)}

											{/* Custo Estimado */}
											{recipe.custo_estimado && (
												<div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
													<span className="text-sm font-semibold text-gray-700">💰 Custo:</span>
													<span
														className={`text-sm px-3 py-1 rounded-full font-medium ${
															recipe.custo_estimado === "baixo"
																? "bg-green-100 text-green-800 border border-green-200"
																: recipe.custo_estimado === "médio"
																	? "bg-yellow-100 text-yellow-800 border border-yellow-200"
																	: "bg-red-100 text-red-800 border border-red-200"
														}`}
													>
														{recipe.custo_estimado.charAt(0).toUpperCase() + recipe.custo_estimado.slice(1)}
													</span>
												</div>
											)}

											{/* Ingredientes Disponíveis */}
											{recipe.ingredientes_disponiveis && recipe.ingredientes_disponiveis.length > 0 && (
												<div className="bg-green-50 p-4 rounded-lg border border-green-200">
													<p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
														✅ Você já tem ({recipe.ingredientes_disponiveis.length})
													</p>
													<div className="flex flex-wrap gap-2">
														{recipe.ingredientes_disponiveis.slice(0, 3).map((ingredient, index) => (
															<span
																key={`${recipe.id}-available-${index}`}
																className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full border border-green-300 font-medium"
															>
																{ingredient}
															</span>
														))}
														{recipe.ingredientes_disponiveis.length > 3 && (
															<span className="inline-block px-3 py-1 text-sm bg-green-200 text-green-700 rounded-full font-medium">
																+{recipe.ingredientes_disponiveis.length - 3} mais
															</span>
														)}
													</div>
												</div>
											)}

											{/* Ingredientes Faltantes */}
											{recipe.ingredientes_faltantes && recipe.ingredientes_faltantes.length > 0 && (
												<div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
													<p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
														🛒 Precisa comprar ({recipe.ingredientes_faltantes.length})
													</p>
													<div className="flex flex-wrap gap-2">
														{recipe.ingredientes_faltantes.slice(0, 3).map((ingredient, index) => (
															<span
																key={`${recipe.id}-missing-${index}`}
																className="inline-block px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full border border-orange-300 font-medium"
															>
																{ingredient}
															</span>
														))}
														{recipe.ingredientes_faltantes.length > 3 && (
															<span className="inline-block px-3 py-1 text-sm bg-orange-200 text-orange-700 rounded-full font-medium">
																+{recipe.ingredientes_faltantes.length - 3} mais
															</span>
														)}
													</div>
												</div>
											)}

											{/* Fallback para ingredientes normais (se não tiver a separação) */}
											{!recipe.ingredientes_disponiveis &&
												!recipe.ingredientes_faltantes &&
												recipe.ingredients &&
												recipe.ingredients.length > 0 && (
													<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
														<p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
															🥘 Ingredientes ({recipe.ingredients.length})
														</p>
														<div className="flex flex-wrap gap-2">
															{recipe.ingredients.slice(0, 3).map((ingredient, index) => (
																<span
																	key={`${recipe.id}-ingredient-${index}`}
																	className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-300 font-medium"
																>
																	{ingredient}
																</span>
															))}
															{recipe.ingredients.length > 3 && (
																<span className="inline-block px-3 py-1 text-sm bg-blue-200 text-blue-700 rounded-full font-medium">
																	+{recipe.ingredients.length - 3} mais
																</span>
															)}
														</div>
													</div>
												)}
										</div>

										<div className="flex gap-2 pt-4 border-t border-gray-100">
											<Button
												variant="outline"
												size="sm"
												onClick={() => viewRecipe(recipe)}
												className="flex-1 h-10 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
											>
												<Eye className="h-4 w-4 mr-2" />
												Ver Receita
											</Button>
											<Button
												variant="default"
												size="sm"
												onClick={() => saveRecipe(recipe)}
												className="h-10 bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
											>
												<Save className="h-4 w-4 mr-2" />
												Salvar
											</Button>
											{recipe.ingredientes_faltantes && recipe.ingredientes_faltantes.length > 0 && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => addToShoppingList(recipe.ingredientes_faltantes || [])}
													className="h-10 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
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
