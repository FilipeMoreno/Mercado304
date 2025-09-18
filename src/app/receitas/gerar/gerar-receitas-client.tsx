"use client"

import { useQuery } from "@tanstack/react-query"
import { ChefHat, Eye, Loader2, Save, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { RecipeSearch } from "@/components/recipe-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TempStorage } from "@/lib/temp-storage"

interface Recipe {
	id: string
	name: string
	mealType: string
	description?: string
	ingredients: string[]
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
				const formattedRecipes =
					data.sugestoes?.map((recipe: any, index: number) => ({
						id: `ai-${Date.now()}-${index}`,
						name: recipe.prato,
						mealType: recipe.refeicao,
						description: recipe.descricao,
						ingredients: recipe.ingredientes || [],
						...recipe,
					})) || []

				setAiRecipes(formattedRecipes)
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
				const formattedRecipes =
					data.sugestoes?.map((recipe: any, index: number) => ({
						id: `surprise-${Date.now()}-${index}`,
						name: recipe.prato,
						mealType: recipe.refeicao,
						description: recipe.descricao,
						ingredients: recipe.ingredientes || [],
						...recipe,
					})) || []

				setAiRecipes(formattedRecipes)
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

	if (loadingProducts) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">Gerar Receitas</h1>
						<p className="text-gray-600 mt-2">Carregando produtos...</p>
					</div>
				</div>
			</div>
		)
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
						<div className="text-center py-12">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
							<p className="text-gray-500">Gerando receitas com IA...</p>
						</div>
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
										<p className="text-sm text-gray-600 mb-3 h-10 overflow-hidden">{recipe.description}</p>

										{/* Ingredientes */}
										{recipe.ingredients && recipe.ingredients.length > 0 && (
											<div className="mb-3">
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

										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => viewRecipe(recipe)}>
												<Eye className="h-4 w-4 mr-1" />
												Ver
											</Button>
											<Button variant="default" size="sm" onClick={() => saveRecipe(recipe)}>
												<Save className="h-4 w-4 mr-1" />
												Salvar
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
