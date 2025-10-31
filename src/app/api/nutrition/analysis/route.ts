import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const period = searchParams.get("period") || "30" // últimos X dias
		const categoryId = searchParams.get("categoryId")

		const days = parseInt(period)
		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		// Buscar produtos com informações nutricionais que foram comprados no período
		const nutritionalData = await prisma.purchaseItem.findMany({
			where: {
				purchase: {
					purchaseDate: {
						gte: startDate,
					},
				},
				product: {
					nutritionalInfo: {
						isNot: null,
					},
					...(categoryId ? { categoryId } : {}),
				},
			},
			include: {
				product: {
					include: {
						nutritionalInfo: true,
						category: true,
						brand: true,
					},
				},
				purchase: true,
			},
		})

		// Calcular estatísticas nutricionais
		const totalItems = nutritionalData.length
		let totalCalories = 0
		let totalProteins = 0
		let totalCarbs = 0
		let totalFat = 0
		let totalSaturatedFat = 0
		let totalTransFat = 0
		let totalFiber = 0
		let totalSodium = 0

		// Contadores para análise de qualidade
		let highSodiumProducts = 0
		let highSugarProducts = 0
		let highSaturatedFatProducts = 0
		let highTransFatProducts = 0
		let highFiberProducts = 0
		let highProteinProducts = 0

		// Alérgenos mais comuns
		const allergenCount: Record<string, number> = {}

		// Produtos por categoria nutricional
		const categoryAnalysis: Record<
			string,
			{
				name: string
				icon: string
				color: string
				totalCalories: number
				avgCalories: number
				count: number
				healthScore: number
			}
		> = {}

		nutritionalData.forEach((item) => {
			if (!item.product?.nutritionalInfo) return

			const nutrition = item.product.nutritionalInfo
			const quantity = item.quantity

			// Calcular valores baseados na quantidade comprada
			const caloriesPerUnit = nutrition.calories || 0
			const proteinsPerUnit = nutrition.proteins || 0
			const carbsPerUnit = nutrition.carbohydrates || 0
			const fatPerUnit = nutrition.totalFat || 0
			const saturatedFatPerUnit = nutrition.saturatedFat || 0
			const transFatPerUnit = nutrition.transFat || 0
			const fiberPerUnit = nutrition.fiber || 0
			const sodiumPerUnit = nutrition.sodium || 0

			totalCalories += caloriesPerUnit * quantity
			totalProteins += proteinsPerUnit * quantity
			totalCarbs += carbsPerUnit * quantity
			totalFat += fatPerUnit * quantity
			totalSaturatedFat += saturatedFatPerUnit * quantity
			totalTransFat += transFatPerUnit * quantity
			totalFiber += fiberPerUnit * quantity
			totalSodium += sodiumPerUnit * quantity

			// Análise de qualidade nutricional (por 100g/ml)
			if (sodiumPerUnit > 400) highSodiumProducts++
			if (nutrition.totalSugars && nutrition.totalSugars > 15) highSugarProducts++
			if (saturatedFatPerUnit > 5) highSaturatedFatProducts++
			if (transFatPerUnit > 0.5) highTransFatProducts++
			if (fiberPerUnit > 6) highFiberProducts++
			if (proteinsPerUnit > 12) highProteinProducts++

			// Contar alérgenos
			nutrition.allergensContains.forEach((allergen) => {
				allergenCount[allergen] = (allergenCount[allergen] || 0) + 1
			})

			// Análise por categoria
			if (item.product?.category) {
				const categoryKey = item.product.category.id
				if (!categoryAnalysis[categoryKey]) {
					categoryAnalysis[categoryKey] = {
						name: item.product.category.name,
						icon: item.product.category.icon || "📦",
						color: item.product.category.color || "#gray",
						totalCalories: 0,
						avgCalories: 0,
						count: 0,
						healthScore: 0,
					}
				}

				categoryAnalysis[categoryKey].totalCalories += caloriesPerUnit * quantity
				categoryAnalysis[categoryKey].count++
			}
		})

		// Calcular médias e scores por categoria
		Object.keys(categoryAnalysis).forEach((categoryKey) => {
			const category = categoryAnalysis[categoryKey]
			category.avgCalories = category.totalCalories / category.count

			// Score de saúde simplificado (0-100)
			// Baseado em densidade calórica, sódio, gorduras trans, etc.
			const avgCaloriesPer100g = category.avgCalories
			let healthScore = 100

			if (avgCaloriesPer100g > 400) healthScore -= 20
			if (avgCaloriesPer100g > 500) healthScore -= 20

			category.healthScore = Math.max(0, healthScore)
		})

		// Top alérgenos
		const topAllergens = Object.entries(allergenCount)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([allergen, count]) => ({ allergen, count }))

		// Produtos mais e menos saudáveis
		const productsWithScores = nutritionalData
			.filter((item) => item.product?.nutritionalInfo)
			.map((item) => {
				const nutrition = item.product!.nutritionalInfo!
				let healthScore = 100

				// Penalidades
				if (nutrition.sodium && nutrition.sodium > 400) healthScore -= 15
				if (nutrition.totalSugars && nutrition.totalSugars > 15) healthScore -= 15
				if (nutrition.saturatedFat && nutrition.saturatedFat > 5) healthScore -= 15
				if (nutrition.transFat && nutrition.transFat > 0) healthScore -= 25
				if (nutrition.calories && nutrition.calories > 400) healthScore -= 10

				// Bônus
				if (nutrition.fiber && nutrition.fiber > 6) healthScore += 10
				if (nutrition.proteins && nutrition.proteins > 12) healthScore += 10

				return {
					...item,
					healthScore: Math.max(0, healthScore),
				}
			})

		const healthiestProducts = productsWithScores.sort((a, b) => b.healthScore - a.healthScore).slice(0, 5)

		const leastHealthyProducts = productsWithScores.sort((a, b) => a.healthScore - b.healthScore).slice(0, 5)

		// Resumo nutricional
		const summary = {
			totalProducts: totalItems,
			averageCaloriesPerProduct: totalItems > 0 ? totalCalories / totalItems : 0,
			averageProteinsPerProduct: totalItems > 0 ? totalProteins / totalItems : 0,
			averageCarbsPerProduct: totalItems > 0 ? totalCarbs / totalItems : 0,
			averageFatPerProduct: totalItems > 0 ? totalFat / totalItems : 0,

			// Indicadores de qualidade
			qualityIndicators: {
				highSodiumPercentage: totalItems > 0 ? (highSodiumProducts / totalItems) * 100 : 0,
				highSugarPercentage: totalItems > 0 ? (highSugarProducts / totalItems) * 100 : 0,
				highSaturatedFatPercentage: totalItems > 0 ? (highSaturatedFatProducts / totalItems) * 100 : 0,
				highTransFatPercentage: totalItems > 0 ? (highTransFatProducts / totalItems) * 100 : 0,
				highFiberPercentage: totalItems > 0 ? (highFiberProducts / totalItems) * 100 : 0,
				highProteinPercentage: totalItems > 0 ? (highProteinProducts / totalItems) * 100 : 0,
			},
		}

		return NextResponse.json({
			period: days,
			summary,
			categoryAnalysis: Object.values(categoryAnalysis),
			topAllergens,
			healthiestProducts,
			leastHealthyProducts,
			totals: {
				calories: totalCalories,
				proteins: totalProteins,
				carbohydrates: totalCarbs,
				totalFat,
				saturatedFat: totalSaturatedFat,
				transFat: totalTransFat,
				fiber: totalFiber,
				sodium: totalSodium,
			},
		})
	} catch (error) {
		console.error("[Nutrition Analysis API]", error)
		return handleApiError(error)
	}
}
