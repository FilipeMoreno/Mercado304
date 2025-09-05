// src/app/api/recipes/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(recipes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, description, prepTime, mealType, ingredients, instructions, chefTip
    } = body;

    if (!name || !ingredients || !instructions) {
      return NextResponse.json({ error: "Dados da receita incompletos." }, { status: 400 });
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
    });

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}