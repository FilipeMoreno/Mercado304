import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Padrões para detectar peso/volume nos nomes dos produtos
const PATTERNS = [
	// Litros
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*l(?:itros?)?\b/gi, unit: "L", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*lt?\b/gi, unit: "L", confidence: "medium" },
	
	// Mililitros
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*ml\b/gi, unit: "ml", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*mililitros?\b/gi, unit: "ml", confidence: "medium" },
	
	// Quilogramas
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*kg\b/gi, unit: "kg", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*quilos?\b/gi, unit: "kg", confidence: "medium" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*kilos?\b/gi, unit: "kg", confidence: "medium" },
	
	// Gramas
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*g\b/gi, unit: "g", confidence: "high" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*gr(?:amas?)?\b/gi, unit: "g", confidence: "medium" },
	
	// Miligramas
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*mg\b/gi, unit: "mg", confidence: "high" },
	
	// Unidades especiais
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*cx\b/gi, unit: "cx", confidence: "low" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*pct\b/gi, unit: "pct", confidence: "low" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*un(?:idades?)?\b/gi, unit: "un", confidence: "low" },
	{ regex: /\b(\d+(?:[.,]\d+)?)\s*pc(?:s|ç)?\b/gi, unit: "un", confidence: "low" },
]

interface ProductAnalysis {
	id: string
	currentName: string
	proposedName: string
	packageSize: string | null
	confidence: "high" | "medium" | "low"
	pattern: string
}

function analyzeProductName(name: string): ProductAnalysis | null {
	let bestMatch: {
		value: string
		unit: string
		confidence: "high" | "medium" | "low"
		matchText: string
		startIndex: number
	} | null = null

	// Tentar cada padrão
	for (const pattern of PATTERNS) {
		const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
		const matches = Array.from(name.matchAll(regex))
		
		if (matches.length > 0) {
			// Pegar a última ocorrência (geralmente o peso/volume está no final)
			const match = matches[matches.length - 1]
			const value = match[1].replace(",", ".")
			const matchText = match[0]
			const startIndex = match.index || 0

			// Priorizar matches de alta confiança ou o primeiro encontrado
			if (!bestMatch || pattern.confidence === "high") {
				bestMatch = {
					value,
					unit: pattern.unit,
					confidence: pattern.confidence,
					matchText,
					startIndex,
				}
				if (pattern.confidence === "high") break
			}
		}
	}

	if (!bestMatch) return null

	// Montar packageSize
	const packageSize = `${bestMatch.value}${bestMatch.unit}`
	
	// Remover o peso/volume do nome
	let proposedName = name
		.replace(bestMatch.matchText, "")
		.replace(/\s+/g, " ") // Remover espaços extras
		.trim()
	
	// Limpar caracteres isolados no final (como - ou |)
	proposedName = proposedName.replace(/[\s\-_|]+$/, "").trim()

	return {
		id: "",
		currentName: name,
		proposedName,
		packageSize,
		confidence: bestMatch.confidence,
		pattern: bestMatch.matchText,
	}
}

export async function GET() {
	try {
		// Buscar todos os produtos que ainda não têm packageSize preenchido
		const products = await prisma.product.findMany({
			where: {
				packageSize: null,
			},
			select: {
				id: true,
				name: true,
				packageSize: true,
			},
			orderBy: {
				name: "asc",
			},
		})

		// Buscar total e já migrados
		const totalProducts = await prisma.product.count()
		const migratedProducts = await prisma.product.count({
			where: {
				packageSize: { not: null },
			},
		})

		// Analisar cada produto
		const analyzed: ProductAnalysis[] = []
		
		for (const product of products) {
			const analysis = analyzeProductName(product.name)
			if (analysis) {
				analyzed.push({
					...analysis,
					id: product.id,
				})
			}
		}

		// Estatísticas
		const stats = {
			total: totalProducts,
			detected: analyzed.length,
			applied: migratedProducts,
		}

		return NextResponse.json({
			products: analyzed,
			stats,
		})
	} catch (error) {
		console.error("Erro ao analisar produtos:", error)
		return NextResponse.json(
			{ error: "Erro ao analisar produtos" },
			{ status: 500 }
		)
	}
}

