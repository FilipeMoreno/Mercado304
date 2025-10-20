import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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
			// Atualizar informação nutricional existente
			nutritionalInfo = await prisma.nutritionalInfo.update({
				where: {
					productId: productId,
				},
				data: {
					servingSize: body.servingSize,
					servingsPerPackage: body.servingsPerPackage ? Number(body.servingsPerPackage) : undefined,
					calories: body.calories ? Number(body.calories) : undefined,
					proteins: body.proteins ? Number(body.proteins) : undefined,
					totalFat: body.totalFat ? Number(body.totalFat) : undefined,
					saturatedFat: body.saturatedFat ? Number(body.saturatedFat) : undefined,
					transFat: body.transFat ? Number(body.transFat) : undefined,
					carbohydrates: body.carbohydrates ? Number(body.carbohydrates) : undefined,
					totalSugars: body.totalSugars ? Number(body.totalSugars) : undefined,
					addedSugars: body.addedSugars ? Number(body.addedSugars) : undefined,
					lactose: body.lactose ? Number(body.lactose) : undefined,
					galactose: body.galactose ? Number(body.galactose) : undefined,
					fiber: body.fiber ? Number(body.fiber) : undefined,
					sodium: body.sodium ? Number(body.sodium) : undefined,
					// Vitaminas
					vitaminA: body.vitaminA ? Number(body.vitaminA) : undefined,
					vitaminC: body.vitaminC ? Number(body.vitaminC) : undefined,
					vitaminD: body.vitaminD ? Number(body.vitaminD) : undefined,
					vitaminE: body.vitaminE ? Number(body.vitaminE) : undefined,
					vitaminK: body.vitaminK ? Number(body.vitaminK) : undefined,
					thiamine: body.thiamine ? Number(body.thiamine) : undefined,
					riboflavin: body.riboflavin ? Number(body.riboflavin) : undefined,
					niacin: body.niacin ? Number(body.niacin) : undefined,
					vitaminB6: body.vitaminB6 ? Number(body.vitaminB6) : undefined,
					folate: body.folate ? Number(body.folate) : undefined,
					vitaminB12: body.vitaminB12 ? Number(body.vitaminB12) : undefined,
					biotin: body.biotin ? Number(body.biotin) : undefined,
					pantothenicAcid: body.pantothenicAcid ? Number(body.pantothenicAcid) : undefined,
					// Minerais
					calcium: body.calcium ? Number(body.calcium) : undefined,
					iron: body.iron ? Number(body.iron) : undefined,
					magnesium: body.magnesium ? Number(body.magnesium) : undefined,
					phosphorus: body.phosphorus ? Number(body.phosphorus) : undefined,
					potassium: body.potassium ? Number(body.potassium) : undefined,
					zinc: body.zinc ? Number(body.zinc) : undefined,
					copper: body.copper ? Number(body.copper) : undefined,
					manganese: body.manganese ? Number(body.manganese) : undefined,
					selenium: body.selenium ? Number(body.selenium) : undefined,
					iodine: body.iodine ? Number(body.iodine) : undefined,
					chromium: body.chromium ? Number(body.chromium) : undefined,
					molybdenum: body.molybdenum ? Number(body.molybdenum) : undefined,
					// Outros nutrientes
					taurine: body.taurine ? Number(body.taurine) : undefined,
					caffeine: body.caffeine ? Number(body.caffeine) : undefined,
					alcoholContent: body.alcoholContent ? Number(body.alcoholContent) : undefined,
					omega3: body.omega3 ? Number(body.omega3) : undefined,
					omega6: body.omega6 ? Number(body.omega6) : undefined,
					monounsaturatedFat: body.monounsaturatedFat ? Number(body.monounsaturatedFat) : undefined,
					polyunsaturatedFat: body.polyunsaturatedFat ? Number(body.polyunsaturatedFat) : undefined,
					cholesterol: body.cholesterol ? Number(body.cholesterol) : undefined,
					epa: body.epa ? Number(body.epa) : undefined,
					dha: body.dha ? Number(body.dha) : undefined,
					linolenicAcid: body.linolenicAcid ? Number(body.linolenicAcid) : undefined,
					// Alérgenos
					allergensContains: body.allergensContains || [],
					allergensMayContain: body.allergensMayContain || [],
				},
			})
		} else {
			// Criar nova informação nutricional
			nutritionalInfo = await prisma.nutritionalInfo.create({
				data: {
					productId: productId,
					servingSize: body.servingSize,
					servingsPerPackage: body.servingsPerPackage ? Number(body.servingsPerPackage) : undefined,
					calories: body.calories ? Number(body.calories) : undefined,
					proteins: body.proteins ? Number(body.proteins) : undefined,
					totalFat: body.totalFat ? Number(body.totalFat) : undefined,
					saturatedFat: body.saturatedFat ? Number(body.saturatedFat) : undefined,
					transFat: body.transFat ? Number(body.transFat) : undefined,
					carbohydrates: body.carbohydrates ? Number(body.carbohydrates) : undefined,
					totalSugars: body.totalSugars ? Number(body.totalSugars) : undefined,
					addedSugars: body.addedSugars ? Number(body.addedSugars) : undefined,
					lactose: body.lactose ? Number(body.lactose) : undefined,
					galactose: body.galactose ? Number(body.galactose) : undefined,
					fiber: body.fiber ? Number(body.fiber) : undefined,
					sodium: body.sodium ? Number(body.sodium) : undefined,
					// Vitaminas
					vitaminA: body.vitaminA ? Number(body.vitaminA) : undefined,
					vitaminC: body.vitaminC ? Number(body.vitaminC) : undefined,
					vitaminD: body.vitaminD ? Number(body.vitaminD) : undefined,
					vitaminE: body.vitaminE ? Number(body.vitaminE) : undefined,
					vitaminK: body.vitaminK ? Number(body.vitaminK) : undefined,
					thiamine: body.thiamine ? Number(body.thiamine) : undefined,
					riboflavin: body.riboflavin ? Number(body.riboflavin) : undefined,
					niacin: body.niacin ? Number(body.niacin) : undefined,
					vitaminB6: body.vitaminB6 ? Number(body.vitaminB6) : undefined,
					folate: body.folate ? Number(body.folate) : undefined,
					vitaminB12: body.vitaminB12 ? Number(body.vitaminB12) : undefined,
					biotin: body.biotin ? Number(body.biotin) : undefined,
					pantothenicAcid: body.pantothenicAcid ? Number(body.pantothenicAcid) : undefined,
					// Minerais
					calcium: body.calcium ? Number(body.calcium) : undefined,
					iron: body.iron ? Number(body.iron) : undefined,
					magnesium: body.magnesium ? Number(body.magnesium) : undefined,
					phosphorus: body.phosphorus ? Number(body.phosphorus) : undefined,
					potassium: body.potassium ? Number(body.potassium) : undefined,
					zinc: body.zinc ? Number(body.zinc) : undefined,
					copper: body.copper ? Number(body.copper) : undefined,
					manganese: body.manganese ? Number(body.manganese) : undefined,
					selenium: body.selenium ? Number(body.selenium) : undefined,
					iodine: body.iodine ? Number(body.iodine) : undefined,
					chromium: body.chromium ? Number(body.chromium) : undefined,
					molybdenum: body.molybdenum ? Number(body.molybdenum) : undefined,
					// Outros nutrientes
					taurine: body.taurine ? Number(body.taurine) : undefined,
					caffeine: body.caffeine ? Number(body.caffeine) : undefined,
					alcoholContent: body.alcoholContent ? Number(body.alcoholContent) : undefined,
					omega3: body.omega3 ? Number(body.omega3) : undefined,
					omega6: body.omega6 ? Number(body.omega6) : undefined,
					monounsaturatedFat: body.monounsaturatedFat ? Number(body.monounsaturatedFat) : undefined,
					polyunsaturatedFat: body.polyunsaturatedFat ? Number(body.polyunsaturatedFat) : undefined,
					cholesterol: body.cholesterol ? Number(body.cholesterol) : undefined,
					epa: body.epa ? Number(body.epa) : undefined,
					dha: body.dha ? Number(body.dha) : undefined,
					linolenicAcid: body.linolenicAcid ? Number(body.linolenicAcid) : undefined,
					// Alérgenos
					allergensContains: body.allergensContains || [],
					allergensMayContain: body.allergensMayContain || [],
				},
			})
		}

		return NextResponse.json(nutritionalInfo)
	} catch (error) {
		console.error("Error saving nutritional info:", error)
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		)
	}
}
