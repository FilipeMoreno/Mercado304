import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const productId = params.id
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada." }, { status: 500 })
    }

    // Buscar produto com informações nutricionais
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        nutritionalInfo: true,
        category: true,
        brand: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Gerar análise com IA
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `Você é um nutricionista especializado. Analise o seguinte produto e forneça informações detalhadas em português brasileiro.

Produto: ${product.name}
Marca: ${product.brand?.name || "Não especificada"}
Categoria: ${product.category?.name || "Não especificada"}

${product.nutritionalInfo
        ? `Informações Nutricionais (por 100g/ml):
- Calorias: ${product.nutritionalInfo.calories || "N/A"} kcal
- Proteínas: ${product.nutritionalInfo.proteins || "N/A"}g
- Carboidratos: ${product.nutritionalInfo.carbohydrates || "N/A"}g
- Gorduras Totais: ${product.nutritionalInfo.totalFat || "N/A"}g
- Gorduras Saturadas: ${product.nutritionalInfo.saturatedFat || "N/A"}g
- Gorduras Trans: ${product.nutritionalInfo.transFat || "N/A"}g
- Fibras: ${product.nutritionalInfo.fiber || "N/A"}g
- Sódio: ${product.nutritionalInfo.sodium || "N/A"}mg
- Açúcares Totais: ${product.nutritionalInfo.totalSugars || "N/A"}g
- Açúcares Adicionados: ${product.nutritionalInfo.addedSugars || "N/A"}g`
        : "Informações nutricionais não disponíveis."
      }

Forneça uma análise completa no seguinte formato JSON:

{
  "summary": "Resumo breve do produto em 2-3 linhas",
  "nutritionalAdvice": [
    "Conselho nutricional 1",
    "Conselho nutricional 2",
    "Conselho nutricional 3"
  ],
  "healthBenefits": [
    "Benefício para a saúde 1",
    "Benefício para a saúde 2",
    "Benefício para a saúde 3"
  ],
  "healthRisks": [
    "Risco para a saúde 1 (se houver)",
    "Risco para a saúde 2 (se houver)"
  ],
  "similarProducts": [
    "Produto similar 1",
    "Produto similar 2",
    "Produto similar 3"
  ],
  "buyingTips": [
    "Dica de compra 1",
    "Dica de compra 2",
    "Dica de compra 3"
  ],
  "storageTips": [
    "Dica de armazenamento 1",
    "Dica de armazenamento 2",
    "Dica de armazenamento 3"
  ],
  "shelfLife": "Tempo de duração após aberto (ex: '3-5 dias na geladeira')",
  "leftoversIdeas": [
    "Ideia para sobras 1",
    "Ideia para sobras 2",
    "Ideia para sobras 3"
  ]
}

Seja específico, prático e baseado em evidências científicas. Se não houver informações nutricionais, baseie-se no tipo de produto.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta da IA")
    }

    const aiAnalysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand?.name,
        category: product.category?.name,
        unit: product.unit,
      },
      nutritionalInfo: product.nutritionalInfo,
      aiAnalysis,
    })
  } catch (error) {
    console.error("Erro ao gerar análise nutricional:", error)
    return NextResponse.json(
      { error: "Erro ao gerar análise nutricional" },
      { status: 500 }
    )
  }
}
