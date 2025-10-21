import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Mesmos padrões da análise
const PATTERNS = [
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*l(?:itros?)?\b/gi, unit: "L", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*lt?\b/gi, unit: "L", confidence: "medium" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*ml\b/gi, unit: "ml", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*mililitros?\b/gi, unit: "ml", confidence: "medium" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*kg\b/gi, unit: "kg", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*quilos?\b/gi, unit: "kg", confidence: "medium" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*kilos?\b/gi, unit: "kg", confidence: "medium" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*g\b/gi, unit: "g", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*gr(?:amas?)?\b/gi, unit: "g", confidence: "medium" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*mg\b/gi, unit: "mg", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*cx\b/gi, unit: "cx", confidence: "low" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*pct\b/gi, unit: "pct", confidence: "low" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*un(?:idades?)?\b/gi, unit: "un", confidence: "low" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*pc(?:s|ç)?\b/gi, unit: "un", confidence: "low" },
]

function analyzeProductName(name: string): { proposedName: string; packageSize: string } | null {
	let bestMatch: {
		value: string
		unit: string
		matchText: string
	} | null = null

	for (const pattern of PATTERNS) {
		const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
		const matches = Array.from(name.matchAll(regex))

		if (matches.length > 0) {
			const match = matches[matches.length - 1]
			const value = match[1].replace(",", ".")
			const matchText = match[0]

			if (!bestMatch || pattern.confidence === "high") {
				bestMatch = {
					value,
					unit: pattern.unit,
					matchText,
				}
				if (pattern.confidence === "high") break
			}
		}
	}

	if (!bestMatch) return null

	const packageSize = `${bestMatch.value}${bestMatch.unit}`
	let proposedName = name.replace(bestMatch.matchText, "").replace(/\s+/g, " ").trim()

	proposedName = proposedName.replace(/[\s\-_|]+$/, "").trim()

	return {
		proposedName,
		packageSize,
	}
}

export async function POST(request: Request) {
	try {
		const { productIds } = await request.json()

		if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
			return NextResponse.json({ error: "IDs de produtos são obrigatórios" }, { status: 400 })
		}

		// Buscar os produtos
		const products = await prisma.product.findMany({
			where: {
				id: { in: productIds },
			},
			select: {
				id: true,
				name: true,
			},
		})

		// Aplicar mudanças em cada produto
		const results = []
		for (const product of products) {
			const analysis = analyzeProductName(product.name)

			if (analysis) {
				await prisma.product.update({
					where: { id: product.id },
					data: {
						name: analysis.proposedName,
						packageSize: analysis.packageSize,
					},
				})

				results.push({
					id: product.id,
					success: true,
					oldName: product.name,
					newName: analysis.proposedName,
					packageSize: analysis.packageSize,
				})
			}
		}

		return NextResponse.json({
			success: true,
			updated: results.length,
			results,
		})
	} catch (error) {
		console.error("Erro ao aplicar mudanças:", error)
		return NextResponse.json({ error: "Erro ao aplicar mudanças" }, { status: 500 })
	}
}
