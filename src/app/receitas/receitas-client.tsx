"use client";

import { useQuery } from "@tanstack/react-query";
import { ChefHat, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RecipeSuggester } from "@/components/recipe-suggester";
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface Recipe {
	id: string;
	name: string;
	mealType: string;
	description?: string;
}

async function fetchRecipes(): Promise<Recipe[]> {
	const res = await fetch("/api/recipes");
	if (!res.ok) throw new Error("Erro ao buscar receitas");
	return res.json();
}

async function fetchProducts(): Promise<{ id: string; name: string }[]> {
	const res = await fetch("/api/products");
	if (!res.ok) throw new Error("Erro ao buscar produtos");
	const data = await res.json();
	return data.products || [];
}

export function ReceitasClient() {
	const {
		data: recipes,
		isLoading: loadingRecipes,
		error: errorRecipes,
	} = useQuery({ queryKey: ["recipes"], queryFn: fetchRecipes });

	const {
		data: products,
		isLoading: loadingProducts,
		error: errorProducts,
	} = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

	if (loadingRecipes || loadingProducts) {
		return <RecipesSkeleton />;
	}

	if (errorRecipes || errorProducts) {
		return <p className="text-red-500">Erro ao carregar dados.</p>;
	}

	const productNames = products?.map((p) => p.name) || [];

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Minhas Receitas</h1>
					<p className="text-gray-600 mt-2">
						Veja suas receitas salvas ou gere novas sugestões com a IA.
					</p>
				</div>
				<RecipeSuggester
					ingredientList={productNames}
					buttonText="Gerar Nova Receita"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Receitas Salvas</CardTitle>
					<CardDescription>
						Suas receitas favoritas guardadas para consulta.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{recipes?.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<ChefHat className="h-12 w-12 mx-auto mb-4" />
							<p className="text-lg font-medium mb-2">Nenhuma receita salva</p>
							<p className="text-gray-600">
								Use o "Chefe Virtual" para gerar e salvar suas primeiras
								receitas.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{recipes?.map((recipe) => (
								<Card
									key={recipe.id}
									className="hover:shadow-md transition-shadow"
								>
									<CardHeader>
										<CardTitle className="text-lg">{recipe.name}</CardTitle>
										<CardDescription>{recipe.mealType}</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden">
											{recipe.description}
										</p>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													toast.info(
														"A página de detalhes ainda será construída.",
													)
												}
											>
												<Eye className="h-4 w-4 mr-1" />
												Ver
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() =>
													toast.info("Excluir ainda não implementado.")
												}
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
	);
}
