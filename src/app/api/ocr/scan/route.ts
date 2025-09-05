import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    // 1. Obter credenciais do ambiente
    const clientId = process.env.VERYFI_CLIENT_ID;
    const authToken = process.env.VERYFI_AUTHORIZATION_TOKEN;

    if (!clientId || !authToken) {
      console.error('Credenciais da Veryfi não configuradas no servidor.');
      return NextResponse.json(
        { error: 'Configuração de OCR ausente no servidor.' },
        { status: 500 }
      );
    }
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Nenhuma imagem fornecida.' },
        { status: 400 }
      );
    }
    
    // 2. Preparar a requisição para a Veryfi
    const headers = {
      'CLIENT-ID': clientId,
      'AUTHORIZATION': authToken,
      'Content-Type': 'application/json',
    };

    const payload = {
      // Usamos 'file_data' para enviar a imagem em base64
      // A string base64 já vem com o cabeçalho "data:image/png;base64,"
      file_data: imageUrl,
      // Habilitamos o extrator de tabelas nutricionais
      document_types: ["nutrition_label"]
    };

    // 3. Chamar a API da Veryfi
    const response = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API Veryfi:", errorData);
      return NextResponse.json(
        { error: 'Falha ao processar a imagem com a API externa.' },
        { status: response.status }
      );
    }

    const veryfiResult = await response.json();

    // 4. Retornar o resultado completo da Veryfi para o frontend
    return NextResponse.json(veryfiResult);

  } catch (error) {
    console.error('Erro no endpoint /api/ocr/scan:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}