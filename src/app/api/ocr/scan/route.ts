// src/app/api/ocr/scan/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    const ocrApiKey = process.env.OCR_SPACE_API_KEY;

    if (!ocrApiKey) {
      return NextResponse.json(
        { error: 'Chave de API do OCR não configurada no servidor.' },
        { status: 500 }
      );
    }
    
    if (!imageUrl) {
        return NextResponse.json(
          { error: 'Nenhuma imagem fornecida.' },
          { status: 400 }
        );
    }

    const formData = new FormData();
    formData.append('base64Image', imageUrl);
    formData.append('language', 'por');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2'); // <-- ADICIONADO: Pede para usar o motor de OCR nº 2

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': ocrApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API OCR.space:", errorData);
      return NextResponse.json(
        { error: 'Falha ao processar a imagem com a API externa.' },
        { status: response.status }
      );
    }

    const ocrResult = await response.json();
    
    if (ocrResult.IsErroredOnProcessing) {
        return NextResponse.json(
            { error: ocrResult.ErrorMessage.join(', ') },
            { status: 500 }
          );
    }

    const extractedText = ocrResult.ParsedResults[0]?.ParsedText || '';

    return NextResponse.json({ text: extractedText });

  } catch (error) {
    console.error('Erro no endpoint /api/ocr/scan:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}