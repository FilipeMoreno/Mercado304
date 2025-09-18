// src/app/api/recipes/route.ts

import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const search = searchParams.get("search")
		const ingredients = searchParams.get("ingredients")
		
		const whereClause: any = {}
		
		// Busca por nome ou descrição
		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } }
			]
		}
		
		// Busca por ingredientes
		if (ingredients) {
			const ingredientList = ingredients.split(",").map(i => i.trim()).filter(Boolean)
			if (ingredientList.length > 0) {
				whereClause.ingredients = {
					hasSome: ingredientList
				}
			}
		}
		
		const recipes = await prisma.recipe.findMany({
			where: whereClause,
			orderBy: {
				createdAt: "desc",
			},
		})
		return NextResponse.json(recipes)
	} catch (error) {
		return handleApiError(error)
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { name, description, prepTime, mealType, ingredients, instructions, chefTip } = body

		if (!name || !ingredients || !instructions) {
			return NextResponse.json({ error: "Dados da receita incompletos." }, { status: 400 })
		}

		const newRecipe = await prisma.recipe.create({
			data: {
				name,
				description,
				prepTime,
				mealType,
				ingredients,
				instructions,
				chefTip,
			},
		})

		return NextResponse.json(newRecipe, { status: 201 })
	} catch (error) {
		return handleApiError(error)
	}
}
