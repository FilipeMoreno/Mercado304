"use client";

import { ChefHat, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecipeSuggester } from "@/components/recipe-suggester";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useDataMutation, useDeleteConfirmation } from "@/hooks";

interface Recipe {
	id: string;
	name: string;
	mealType: string;
	description?: string;
}

interface ReceitasClientProps {
	initialRecipes: Recipe[];
	allProducts: { id: string; name: string }[];
}

export function ReceitasClient({
	initialRecipes,
	allProducts,
}: ReceitasClientProps) {
	const _router = useRouter();
	const { remove, loading } = useDataMutation();
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } =
		useDeleteConfirmation<Recipe>();

	const productNames = allProducts.map((p) => p.name);

	const viewRecipe = (recipe: Recipe) => {
		// Para receitas salvas, vamos precisar de uma página de detalhes que busca pelo ID.
		// Por enquanto, vamos apenas logar no console para mostrar o conceito.
		// router.push(`/receitas/${recipe.id}`)
		console.log("Visualizar receita salva:", recipe.id);
		toast.info("A página de detalhes da receita salva ainda será construída.");
	};

	const _deleteRecipe = async () => {
		if (!deleteState.item) return;
		await remove(`/api/recipes/${deleteState.item.id}`, {
			successMessage: "Receita excluída com sucesso!",
			onSuccess: closeDeleteConfirm,
		});
	};

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
					{initialRecipes.length === 0 ? (
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
							{initialRecipes.map((recipe) => (
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
												onClick={() => viewRecipe(recipe)}
											>
												<Eye className="h-4 w-4 mr-1" />
												Ver
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => openDeleteConfirm(recipe)}
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
