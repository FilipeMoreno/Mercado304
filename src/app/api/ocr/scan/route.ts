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

    // A API do OCR.space espera os dados como FormData
    const formData = new FormData();
    formData.append('base64Image', imageUrl);
    formData.append('language', 'por'); // Definir o idioma para Português
    formData.append('isOverlayRequired', 'false');

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
    
    // Verificar se o OCR teve sucesso
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