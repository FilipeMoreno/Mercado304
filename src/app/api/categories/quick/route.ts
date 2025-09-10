import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name } = body;

		if (!name || !name.trim()) {
			return NextResponse.json(
				{ error: "Nome da categoria é obrigatório" },
				{ status: 400 },
			);
		}

		// Verificar se categoria já existe
		const existing = await prisma.category.findUnique({
			where: { name: name.trim() },
		});

		if (existing) {
			return NextResponse.json(existing);
		}

		// Criar nova categoria
		const category = await prisma.category.create({
			data: {
				name: name.trim(),
			},
		});

		return NextResponse.json(category, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Erro ao criar categoria" },
			{ status: 500 },
		);
	}
}
