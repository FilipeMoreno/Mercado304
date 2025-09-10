import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDay, parseISO } from 'date-fns';
import { handleApiError } from '@/lib/api-utils';

const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada.' }, { status: 500 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
    }

    // 1. Obter os dados (lógica similar à API existente)
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: { productId },
      include: { purchase: true },
    });

    if (purchaseItems.length < 3) { // Poucos dados para uma análise útil
      return NextResponse.json({ analysis: "Ainda não tenho dados suficientes para analisar o melhor dia de compra para este item." });
    }

    const dayAnalysis = purchaseItems.reduce((acc: any, item) => {
      const dayOfWeek = getDay(parseISO(item.purchase.purchaseDate.toISOString()));
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = { prices: [] };
      }
      acc[dayOfWeek].prices.push(Number(item.unitPrice));
      return acc;
    }, {});

    const analysisData = Object.entries(dayAnalysis).map(([day, data]: any) => ({
      day: dayNames[parseInt(day)],
      averagePrice: data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length,
      purchaseCount: data.prices.length,
    }));

    const bestDay = analysisData.reduce((prev, curr) => prev.averagePrice < curr.averagePrice ? prev : curr);

    // 2. Enviar para o Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um assistente de compras especialista em economia. Analise os dados de compras de um produto e gere um insight curto e amigável (1-2 frases) sobre o melhor dia para comprá-lo. O tom deve ser de uma dica útil.

      Dados de Análise:
      - Melhor dia encontrado: ${bestDay.day}
      - Preço médio nesse dia: R$ ${bestDay.averagePrice.toFixed(2)}
      - Histórico de compras analisado: ${JSON.stringify(analysisData)}

      Exemplos de Resposta:
      - "Notei um padrão! O preço deste produto costuma ser mais baixo às ${bestDay.day}s. Tente planear a sua compra para este dia."
      - "Fique de olho nas promoções de ${bestDay.day}! Historicamente, é quando este item aparece com o melhor preço."
      - "Os preços parecem bem estáveis durante a semana, mas registei uma leve vantagem nas compras feitas às ${bestDay.day}s."

      Retorne apenas o texto do insight.
    `;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    return NextResponse.json({ analysis: analysisText });

  } catch (error) {
    return handleApiError(error);
  }
}