// src/app/api/ocr/scan/route.ts

import { NextResponse } from 'next/server';
// Para usar o SDK oficial, seria necessário instalar com: npm install @google/generative-ai
import { GoogleGenerativeAI } from '@google/generative-ai';

// Função auxiliar para converter a imagem de Base64 para o formato da API do Gemini
function dataUrlToGoogleGenerativeAIContent(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Formato de Data URL inválido");
  }
  return {
    inlineData: { mimeType: match[1], data: match[2] },
  };
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('Chave da API do Gemini não configurada.');
      return NextResponse.json(
        { error: 'Configuração de IA ausente no servidor.' },
        { status: 500 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida.' }, { status: 400 });
    }

    // Inicializa o cliente da IA com a sua chave
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Modelo rápido e com boa capacidade multimodal
    });

    // Este é o "coração" da nossa lógica: o prompt.
    // Damos instruções claras ao Gemini sobre o que fazer e como formatar a resposta.
    const prompt = `
      Analise a imagem de uma tabela nutricional de um produto alimentício, possivelmente em português do Brasil.
      Extraia as seguintes informações e retorne-as ESTRITAMENTE em formato JSON.
      Se um valor não for encontrado na imagem, omita a chave ou use o valor null.
      Os valores numéricos devem ser extraídos como números (number), usando ponto como separador decimal.

      A estrutura do JSON de saída deve ser:
      {
        "servingSize": "string (ex: '100g', '200ml', '1 unidade')",
        "calories": number,
        "carbohydrates": number,
        "totalSugars": number,
        "addedSugars": number,
        "proteins": number,
        "totalFat": number,
        "saturatedFat": number,
        "transFat": number,
        "fiber": number,
        "sodium": number,
        "allergensContains": ["string"],
        "allergensMayContain": ["string"]
      }

      Instruções detalhadas para extração:
      - "Valor energético" corresponde a "calories". Extraia o valor em kcal.
      - "Carboidratos" ou "Carboidratos totais" corresponde a "carbohydrates".
      - "Açúcares totais" corresponde a "totalSugars".
      - "Açúcares adicionados" corresponde a "addedSugars".
      - "Proteínas" corresponde a "proteins".
      - "Gorduras totais" corresponde a "totalFat".
      - "Gorduras saturadas" corresponde a "saturatedFat".
      - "Gorduras trans" corresponde a "transFat".
      - "Fibra alimentar" corresponde a "fiber".
      - "Sódio" corresponde a "sodium" (extrair em mg).
      - Para "allergensContains", procure por textos como "ALÉRGICOS: CONTÉM...".
      - Para "allergensMayContain", procure por textos como "PODE CONTER...".
      - PRIORIZE os valores da coluna "100 g" ou "100 ml". Se essa coluna não existir, use os valores da coluna "por porção".
    `;

    const imagePart = dataUrlToGoogleGenerativeAIContent(imageUrl);

    // Envia o prompt e a imagem para o Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // O Gemini pode retornar o JSON dentro de um bloco de código. Esta limpeza remove isso.
    const jsonString = responseText.replace(/```json\n?|```/g, "").trim();
    const parsedJson = JSON.parse(jsonString);

    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('Erro na chamada da API Gemini:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a imagem com a IA.' },
      { status: 500 }
    );
  }
}