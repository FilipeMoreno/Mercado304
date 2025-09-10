import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const { type = "weekly" } = await request.json();
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey) {
			return NextResponse.json(
				{ error: "Chave da API do Gemini não configurada." },
				{ status: 500 },
			);
		}

		// 1. BUSCAR E PROCESSAR OS DADOS (igual a antes)
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const purchases = await prisma.purchaseItem.findMany({
			where: {
				purchase: { purchaseDate: { gte: sixMonthsAgo } },
				productId: { not: null },
			},
			include: {
				product: { include: { brand: true, category: true } },
				purchase: true,
			},
			orderBy: { purchase: { purchaseDate: "asc" } },
		});

		const productConsumption = purchases.reduce((acc: any, item) => {
			const productId = item.productId!;
			if (!acc[productId]) {
				acc[productId] = {
					product: item.product,
					purchases: [],
				};
			}
			acc[productId].purchases.push({
				date: item.purchase.purchaseDate,
				quantity: item.quantity,
			});
			return acc;
		}, {});

		const patterns = Object.values(productConsumption)
			.map((product: any) => {
				const purchases = product.purchases.sort(
					(a: any, b: any) =>
						new Date(a.date).getTime() - new Date(b.date).getTime(),
				);
				if (purchases.length < 2) return null;

				const intervals = [];
				for (let i = 1; i < purchases.length; i++) {
					const diff =
						(new Date(purchases[i].date).getTime() -
							new Date(purchases[i - 1].date).getTime()) /
						(1000 * 60 * 60 * 24);
					intervals.push(diff);
				}

				const avgIntervalDays =
					intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
				const totalQuantity = purchases.reduce(
					(sum: number, p: any) => sum + p.quantity,
					0,
				);
				const avgQuantityPerPurchase = totalQuantity / purchases.length;
				const lastPurchaseDate = new Date(purchases[purchases.length - 1].date);
				const daysSinceLastPurchase = Math.floor(
					(new Date().getTime() - lastPurchaseDate.getTime()) /
						(1000 * 60 * 60 * 24),
				);

				return {
					productId: product.product.id,
					productName: product.product.name,
					category: product.product.category?.name || "Outros",
					brandName: product.product.brand?.name,
					unit: product.product.unit,
					avgIntervalDays: Math.round(avgIntervalDays),
					avgQuantityPerPurchase: parseFloat(avgQuantityPerPurchase.toFixed(2)),
					daysSinceLastPurchase,
				};
			})
			.filter((p) => p !== null);

		if (patterns.length === 0) {
			return NextResponse.json({
				success: false,
				message: "Não há dados suficientes para gerar a lista.",
			});
		}

		// 2. CHAMAR A API DO GEMINI COM OS DADOS COMO CONTEXTO
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		const prompt = `
      Você é um assistente de compras pessoal e inteligente. Sua tarefa é analisar os padrões de consumo de um utilizador e gerar uma lista de compras ${type === "weekly" ? "semanal" : "mensal"} inteligente e útil.

      CONTEXTO (Padrões de Consumo do Utilizador):
      ${JSON.stringify(patterns, null, 2)}

      INSTRUÇÕES:
      1.  Analise cada produto no contexto. A chave é comparar "daysSinceLastPurchase" com "avgIntervalDays". Se "daysSinceLastPurchase" for próximo ou maior que "avgIntervalDays", o produto é um forte candidato para a lista.
      2.  Crie uma lista de compras priorizando os itens mais urgentes.
      3.  Para a quantidade ("suggestedQuantity"), arredonde para cima o valor de "avgQuantityPerPurchase".
      4.  Crie 1 ou 2 sugestões criativas e úteis em "suggestions". Pode ser sobre um produto que não é comprado há muito tempo, um produto sazonal (estamos em ${new Date().toLocaleString("pt-BR", { month: "long" })}) ou uma dica de economia.
      5.  Retorne a resposta ESTRITAMENTE no seguinte formato JSON. Não adicione nenhum texto ou formatação fora do JSON.

      FORMATO JSON DE SAÍDA:
      {
        "success": true,
        "listType": "${type}",
        "totalItems": <número total de itens na lista>,
        "itemsByCategory": {
          "<Nome da Categoria>": [
            {
              "productId": "<ID do produto>",
              "productName": "<Nome do produto>",
              "brandName": "<Nome da marca>",
              "unit": "<unidade>",
              "suggestedQuantity": <quantidade sugerida (número inteiro)>,
              "urgency": <um score de urgência de 0 a 100>,
              "confidence": <um score de confiança de 0 a 100>,
              "daysUntilNext": <dias até a próxima compra (pode ser negativo se estiver atrasado)>
            }
          ]
        },
        "suggestions": [
          {
            "title": "<Título da Sugestão>",
            "description": "<Descrição da Sugestão>"
          }
        ],
        "metadata": {
          "generatedAt": "${new Date().toISOString()}",
          "basedOnPurchases": ${patterns.length},
          "confidence": <score médio de confiança geral>
        }
      }
    `;

		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		const jsonString = responseText.replace(/```json\n?|```/g, "").trim();
		const parsedJson = JSON.parse(jsonString);

		return NextResponse.json(parsedJson);
	} catch (error) {
		console.error("Erro ao gerar lista automática com IA:", error);
		return NextResponse.json(
			{ error: "Erro ao gerar lista automática com IA" },
			{ status: 500 },
		);
	}
}
