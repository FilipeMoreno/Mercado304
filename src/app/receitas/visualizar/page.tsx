// src/app/receitas/visualizar/page.tsx

"use client";

import {
	ArrowLeft,
	ChefHat,
	Clock,
	Save,
	Star,
	ThumbsUp,
	Utensils,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataMutation } from "@/hooks/use-data-mutation"; // <-- Importar o hook
import { TempStorage } from "@/lib/temp-storage";

interface Recipe {
	refeicao: string;
	prato: string;
	descricao: string;
	tempo_preparo: string;
	ingredientes: string[];
	modo_preparo: string;
	dica_chef: string;
}

export default function VisualizarReceitaPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const { create, loading } = useDataMutation(); // <-- Usar o hook

	useEffect(() => {
		const storageKey = searchParams.get("storageKey");
		if (storageKey) {
			const data = TempStorage.get(storageKey);
			if (data?.recipe) {
				setRecipe(data.recipe);
			} else {
				router.push("/receitas");
			}
		}
	}, [searchParams, router]);

	const handleSaveRecipe = async () => {
		if (!recipe) return;

		await create(
			"/api/recipes",
			{
				name: recipe.prato,
				description: recipe.descricao,
				prepTime: recipe.tempo_preparo,
				mealType: recipe.refeicao,
				ingredients: recipe.ingredientes,
				instructions: recipe.modo_preparo,
				chefTip: recipe.dica_chef,
			},
			{
				successMessage: "Receita salva com sucesso!",
				onSuccess: () => {
					router.push("/receitas");
				},
			},
		);
	};

	if (!recipe) {
		return <div className="text-center p-8">A carregar receita...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Voltar
				</Button>
				<div>
					<Badge>{recipe.refeicao}</Badge>
					<h1 className="text-3xl font-bold mt-1">{recipe.prato}</h1>
					<p className="text-gray-600 mt-2">{recipe.descricao}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Coluna Principal */}
				<div className="md:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Utensils />
								Ingredientes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="list-disc list-inside space-y-2">
								{recipe.ingredientes.map((ing, index) => (
									<li key={index}>{ing}</li>
								))}
							</ul>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ChefHat />
								Modo de Preparo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="prose dark:prose-invert">
								{recipe.modo_preparo
									.split(/(Passo \d+:)/)
									.filter((p) => p.trim())
									.reduce((acc, part, index) => {
										if (part.startsWith("Passo")) {
											acc.push(part);
										} else if (acc.length > 0) {
											acc[acc.length - 1] += part;
										}
										return acc;
									}, [] as string[])
									.map((step, index) => (
										<p key={index}>{step}</p>
									))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Coluna Lateral */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Detalhes</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<Clock className="h-5 w-5 text-primary" />
								<div>
									<p className="font-semibold">{recipe.tempo_preparo}</p>
									<p className="text-sm text-gray-500">Tempo de Preparo</p>
								</div>
							</div>
							<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<h4 className="font-semibold text-yellow-800 flex items-center gap-2">
									<ThumbsUp size={16} /> Dica do Chef
								</h4>
								<p className="text-sm text-yellow-700 mt-1">
									{recipe.dica_chef}
								</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Gostou da Receita?</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button
								className="w-full"
								onClick={handleSaveRecipe}
								disabled={loading}
							>
								<Save className="h-4 w-4 mr-2" />
								{loading ? "A salvar..." : "Salvar Receita"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
