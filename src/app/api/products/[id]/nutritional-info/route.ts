import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const productId = params.id
		const body = await request.json()

		// Verificar se o produto existe
		const product = await prisma.product.findUnique({
			where: {
				id: productId,
			},
		})

		if (!product) {
			return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
		}

		// Verificar se já existe informação nutricional para este produto
		const existingNutritionalInfo = await prisma.nutritionalInfo.findUnique({
			where: {
				productId: productId,
			},
		})

		let nutritionalInfo

		if (existingNutritionalInfo) {
			// Build the update data object conditionally
			const updateData: any = {}
			
			// Basic fields
			if (body.servingSize !== undefined) updateData.servingSize = body.servingSize
			if (body.servingsPerPackage !== undefined) updateData.servingsPerPackage = body.servingsPerPackage ? Number(body.servingsPerPackage) : null
			if (body.calories !== undefined) updateData.calories = body.calories ? Number(body.calories) : null
			if (body.proteins !== undefined) updateData.proteins = body.proteins ? Number(body.proteins) : null
			if (body.totalFat !== undefined) updateData.totalFat = body.totalFat ? Number(body.totalFat) : null
			if (body.saturatedFat !== undefined) updateData.saturatedFat = body.saturatedFat ? Number(body.saturatedFat) : null
			if (body.transFat !== undefined) updateData.transFat = body.transFat ? Number(body.transFat) : null
			if (body.carbohydrates !== undefined) updateData.carbohydrates = body.carbohydrates ? Number(body.carbohydrates) : null
			if (body.totalSugars !== undefined) updateData.totalSugars = body.totalSugars ? Number(body.totalSugars) : null
			if (body.addedSugars !== undefined) updateData.addedSugars = body.addedSugars ? Number(body.addedSugars) : null
			if (body.lactose !== undefined) updateData.lactose = body.lactose ? Number(body.lactose) : null
			if (body.galactose !== undefined) updateData.galactose = body.galactose ? Number(body.galactose) : null
			if (body.fiber !== undefined) updateData.fiber = body.fiber ? Number(body.fiber) : null
			if (body.sodium !== undefined) updateData.sodium = body.sodium ? Number(body.sodium) : null
			
			// Vitaminas
			if (body.vitaminA !== undefined) updateData.vitaminA = body.vitaminA ? Number(body.vitaminA) : null
			if (body.vitaminC !== undefined) updateData.vitaminC = body.vitaminC ? Number(body.vitaminC) : null
			if (body.vitaminD !== undefined) updateData.vitaminD = body.vitaminD ? Number(body.vitaminD) : null
			if (body.vitaminE !== undefined) updateData.vitaminE = body.vitaminE ? Number(body.vitaminE) : null
			if (body.vitaminK !== undefined) updateData.vitaminK = body.vitaminK ? Number(body.vitaminK) : null
			if (body.thiamine !== undefined) updateData.thiamine = body.thiamine ? Number(body.thiamine) : null
			if (body.riboflavin !== undefined) updateData.riboflavin = body.riboflavin ? Number(body.riboflavin) : null
			if (body.niacin !== undefined) updateData.niacin = body.niacin ? Number(body.niacin) : null
			if (body.vitaminB6 !== undefined) updateData.vitaminB6 = body.vitaminB6 ? Number(body.vitaminB6) : null
			if (body.folate !== undefined) updateData.folate = body.folate ? Number(body.folate) : null
			if (body.vitaminB12 !== undefined) updateData.vitaminB12 = body.vitaminB12 ? Number(body.vitaminB12) : null
			if (body.biotin !== undefined) updateData.biotin = body.biotin ? Number(body.biotin) : null
			if (body.pantothenicAcid !== undefined) updateData.pantothenicAcid = body.pantothenicAcid ? Number(body.pantothenicAcid) : null
			
			// Minerais
			if (body.calcium !== undefined) updateData.calcium = body.calcium ? Number(body.calcium) : null
			if (body.iron !== undefined) updateData.iron = body.iron ? Number(body.iron) : null
			if (body.magnesium !== undefined) updateData.magnesium = body.magnesium ? Number(body.magnesium) : null
			if (body.phosphorus !== undefined) updateData.phosphorus = body.phosphorus ? Number(body.phosphorus) : null
			if (body.potassium !== undefined) updateData.potassium = body.potassium ? Number(body.potassium) : null
			if (body.zinc !== undefined) updateData.zinc = body.zinc ? Number(body.zinc) : null
			if (body.copper !== undefined) updateData.copper = body.copper ? Number(body.copper) : null
			if (body.manganese !== undefined) updateData.manganese = body.manganese ? Number(body.manganese) : null
			if (body.selenium !== undefined) updateData.selenium = body.selenium ? Number(body.selenium) : null
			if (body.iodine !== undefined) updateData.iodine = body.iodine ? Number(body.iodine) : null
			if (body.chromium !== undefined) updateData.chromium = body.chromium ? Number(body.chromium) : null
			if (body.molybdenum !== undefined) updateData.molybdenum = body.molybdenum ? Number(body.molybdenum) : null
			
			// Outros nutrientes
			if (body.taurine !== undefined) updateData.taurine = body.taurine ? Number(body.taurine) : null
			if (body.caffeine !== undefined) updateData.caffeine = body.caffeine ? Number(body.caffeine) : null
			if (body.alcoholContent !== undefined) updateData.alcoholContent = body.alcoholContent ? Number(body.alcoholContent) : null
			if (body.omega3 !== undefined) updateData.omega3 = body.omega3 ? Number(body.omega3) : null
			if (body.omega6 !== undefined) updateData.omega6 = body.omega6 ? Number(body.omega6) : null
			if (body.monounsaturatedFat !== undefined) updateData.monounsaturatedFat = body.monounsaturatedFat ? Number(body.monounsaturatedFat) : null
			if (body.polyunsaturatedFat !== undefined) updateData.polyunsaturatedFat = body.polyunsaturatedFat ? Number(body.polyunsaturatedFat) : null
			if (body.cholesterol !== undefined) updateData.cholesterol = body.cholesterol ? Number(body.cholesterol) : null
			if (body.epa !== undefined) updateData.epa = body.epa ? Number(body.epa) : null
			if (body.dha !== undefined) updateData.dha = body.dha ? Number(body.dha) : null
			if (body.linolenicAcid !== undefined) updateData.linolenicAcid = body.linolenicAcid ? Number(body.linolenicAcid) : null
			
			// Alérgenos
			if (body.allergensContains !== undefined) updateData.allergensContains = body.allergensContains || []
			if (body.allergensMayContain !== undefined) updateData.allergensMayContain = body.allergensMayContain || []

			// Atualizar informação nutricional existente
			nutritionalInfo = await prisma.nutritionalInfo.update({
				where: {
					productId: productId,
				},
				data: updateData,
			})
		} else {
			// Build the create data object conditionally
			const createData: any = {
				productId: productId,
				servingSize: body.servingSize,
			}
			
			// Only include fields that are explicitly provided
			if (body.servingsPerPackage !== undefined) createData.servingsPerPackage = body.servingsPerPackage ? Number(body.servingsPerPackage) : null
			if (body.calories !== undefined) createData.calories = body.calories ? Number(body.calories) : null
			if (body.proteins !== undefined) createData.proteins = body.proteins ? Number(body.proteins) : null
			if (body.totalFat !== undefined) createData.totalFat = body.totalFat ? Number(body.totalFat) : null
			if (body.saturatedFat !== undefined) createData.saturatedFat = body.saturatedFat ? Number(body.saturatedFat) : null
			if (body.transFat !== undefined) createData.transFat = body.transFat ? Number(body.transFat) : null
			if (body.carbohydrates !== undefined) createData.carbohydrates = body.carbohydrates ? Number(body.carbohydrates) : null
			if (body.totalSugars !== undefined) createData.totalSugars = body.totalSugars ? Number(body.totalSugars) : null
			if (body.addedSugars !== undefined) createData.addedSugars = body.addedSugars ? Number(body.addedSugars) : null
			if (body.lactose !== undefined) createData.lactose = body.lactose ? Number(body.lactose) : null
			if (body.galactose !== undefined) createData.galactose = body.galactose ? Number(body.galactose) : null
			if (body.fiber !== undefined) createData.fiber = body.fiber ? Number(body.fiber) : null
			if (body.sodium !== undefined) createData.sodium = body.sodium ? Number(body.sodium) : null
			
			// Vitaminas
			if (body.vitaminA !== undefined) createData.vitaminA = body.vitaminA ? Number(body.vitaminA) : null
			if (body.vitaminC !== undefined) createData.vitaminC = body.vitaminC ? Number(body.vitaminC) : null
			if (body.vitaminD !== undefined) createData.vitaminD = body.vitaminD ? Number(body.vitaminD) : null
			if (body.vitaminE !== undefined) createData.vitaminE = body.vitaminE ? Number(body.vitaminE) : null
			if (body.vitaminK !== undefined) createData.vitaminK = body.vitaminK ? Number(body.vitaminK) : null
			if (body.thiamine !== undefined) createData.thiamine = body.thiamine ? Number(body.thiamine) : null
			if (body.riboflavin !== undefined) createData.riboflavin = body.riboflavin ? Number(body.riboflavin) : null
			if (body.niacin !== undefined) createData.niacin = body.niacin ? Number(body.niacin) : null
			if (body.vitaminB6 !== undefined) createData.vitaminB6 = body.vitaminB6 ? Number(body.vitaminB6) : null
			if (body.folate !== undefined) createData.folate = body.folate ? Number(body.folate) : null
			if (body.vitaminB12 !== undefined) createData.vitaminB12 = body.vitaminB12 ? Number(body.vitaminB12) : null
			if (body.biotin !== undefined) createData.biotin = body.biotin ? Number(body.biotin) : null
			if (body.pantothenicAcid !== undefined) createData.pantothenicAcid = body.pantothenicAcid ? Number(body.pantothenicAcid) : null
			
			// Minerais
			if (body.calcium !== undefined) createData.calcium = body.calcium ? Number(body.calcium) : null
			if (body.iron !== undefined) createData.iron = body.iron ? Number(body.iron) : null
			if (body.magnesium !== undefined) createData.magnesium = body.magnesium ? Number(body.magnesium) : null
			if (body.phosphorus !== undefined) createData.phosphorus = body.phosphorus ? Number(body.phosphorus) : null
			if (body.potassium !== undefined) createData.potassium = body.potassium ? Number(body.potassium) : null
			if (body.zinc !== undefined) createData.zinc = body.zinc ? Number(body.zinc) : null
			if (body.copper !== undefined) createData.copper = body.copper ? Number(body.copper) : null
			if (body.manganese !== undefined) createData.manganese = body.manganese ? Number(body.manganese) : null
			if (body.selenium !== undefined) createData.selenium = body.selenium ? Number(body.selenium) : null
			if (body.iodine !== undefined) createData.iodine = body.iodine ? Number(body.iodine) : null
			if (body.chromium !== undefined) createData.chromium = body.chromium ? Number(body.chromium) : null
			if (body.molybdenum !== undefined) createData.molybdenum = body.molybdenum ? Number(body.molybdenum) : null
			
			// Outros nutrientes
			if (body.taurine !== undefined) createData.taurine = body.taurine ? Number(body.taurine) : null
			if (body.caffeine !== undefined) createData.caffeine = body.caffeine ? Number(body.caffeine) : null
			if (body.alcoholContent !== undefined) createData.alcoholContent = body.alcoholContent ? Number(body.alcoholContent) : null
			if (body.omega3 !== undefined) createData.omega3 = body.omega3 ? Number(body.omega3) : null
			if (body.omega6 !== undefined) createData.omega6 = body.omega6 ? Number(body.omega6) : null
			if (body.monounsaturatedFat !== undefined) createData.monounsaturatedFat = body.monounsaturatedFat ? Number(body.monounsaturatedFat) : null
			if (body.polyunsaturatedFat !== undefined) createData.polyunsaturatedFat = body.polyunsaturatedFat ? Number(body.polyunsaturatedFat) : null
			if (body.cholesterol !== undefined) createData.cholesterol = body.cholesterol ? Number(body.cholesterol) : null
			if (body.epa !== undefined) createData.epa = body.epa ? Number(body.epa) : null
			if (body.dha !== undefined) createData.dha = body.dha ? Number(body.dha) : null
			if (body.linolenicAcid !== undefined) createData.linolenicAcid = body.linolenicAcid ? Number(body.linolenicAcid) : null
			
			// Alérgenos
			if (body.allergensContains !== undefined) createData.allergensContains = body.allergensContains || []
			if (body.allergensMayContain !== undefined) createData.allergensMayContain = body.allergensMayContain || []

			// Criar nova informação nutricional
			nutritionalInfo = await prisma.nutritionalInfo.create({
				data: createData,
			})
		}

		return NextResponse.json(nutritionalInfo)
	} catch (error) {
		console.error("Error saving nutritional info:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}