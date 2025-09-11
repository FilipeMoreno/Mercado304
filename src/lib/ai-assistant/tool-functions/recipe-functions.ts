import { prisma } from "@/lib/prisma";

export const recipeFunctions = {
	// Recipes & AI Features
	suggestRecipes: async ({ ingredients, mealType }: any) => {
		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/ai/suggest-recipes`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ingredients, mealType }),
			},
		);
		const data = await response.json();
		return { success: true, recipes: data.recipes };
	},

	getRecipes: async () => {
		const recipes = await prisma.recipe.findMany({
			orderBy: { createdAt: "desc" },
			take: 10,
		});
		return { success: true, recipes };
	},

	analyzeNutrition: async ({ productNames }: { productNames: string[] }) => {
		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/nutrition/analysis`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productNames }),
			},
		);
		const data = await response.json();
		return { success: true, nutritionAnalysis: data };
	},
};