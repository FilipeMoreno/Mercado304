// src/app/api/brands/all/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
	try {
		const brands = await prisma.brand.findMany({
			orderBy: {
				name: "asc",
			},
		})

		return NextResponse.json(brands)
	} catch (error) {
		console.error("Erro ao buscar todas as marcas:", error)
		return NextResponse.json({ error: "Erro ao buscar todas as marcas" }, { status: 500 })
	}
}