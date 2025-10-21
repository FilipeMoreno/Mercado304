// src/app/api/ocr/fiscal-receipt/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Função auxiliar para converter a imagem de Base64 para o formato da API do Gemini
function dataUrlToGoogleGenerativeAIContent(dataUrl: string) {
	const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
	if (!match) {
		throw new Error("Formato de Data URL inválido")
	}
	return {
		inlineData: { mimeType: match[1], data: match[2] },
	}
}

export async function POST(request: Request) {
	try {
		const { imageUrl } = await request.json()
		const apiKey = process.env.GEMINI_API_KEY

		if (!apiKey) {
			console.error("Chave da API do Gemini não configurada.")
			return NextResponse.json({ error: "Configuração de IA ausente no servidor." }, { status: 500 })
		}

		if (!imageUrl) {
			return NextResponse.json({ error: "Nenhuma imagem fornecida." }, { status: 400 })
		}

		// Inicializa o cliente da IA com a sua chave
		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash", // Modelo com capacidade multimodal para análise de imagens
		})

		// Prompt específico para cupons fiscais brasileiros
		const prompt = `
      Analise a imagem de um cupom fiscal brasileiro (NFC-e ou CF-e SAT).
      Extraia as seguintes informações e retorne-as ESTRITAMENTE em formato JSON.
      Se um valor não for encontrado na imagem, omita a chave ou use o valor null.
      Os valores numéricos devem ser extraídos como números (number), usando ponto como separador decimal.

      A estrutura do JSON de saída deve ser:
      {
        "estabelecimento": {
          "nome": "string",
          "cnpj": "string (formato: XX.XXX.XXX/XXXX-XX)",
          "endereco": "string"
        },
        "compra": {
          "dataHoraAutorizacao": "string (formato ISO: YYYY-MM-DDTHH:mm:ss)",
          "totalItens": number,
          "valorTotalPagar": number,
          "formaPagamento": "string"
        },
        "itens": [
          {
            "item": number,
            "codigo": "string",
            "descricao": "string",
            "quantidade": number,
            "unidade": "string",
            "valorUnitario": number,
            "valorTotal": number
          }
        ],
        "nfc_e": {
          "chaveAcesso": "string (44 dígitos)",
          "urlConsulta": "string"
        }
      }

      Instruções detalhadas para extração:

      ESTABELECIMENTO:
      - "nome": Nome da empresa/estabelecimento (geralmente no topo do cupom)
      - "cnpj": CNPJ no formato XX.XXX.XXX/XXXX-XX
      - "endereco": Endereço completo do estabelecimento

      COMPRA:
      - "dataHoraAutorizacao": Data e hora da autorização da NFC-e (formato ISO)
      - "totalItens": Quantidade total de itens comprados
      - "valorTotalPagar": Valor total a pagar (valor final da compra)
      - "formaPagamento": Forma de pagamento utilizada (Dinheiro, Cartão de Crédito, Cartão de Débito, PIX, etc.)

      ITENS:
      Para cada item no cupom, extraia:
      - "item": Número sequencial do item
      - "codigo": Código de barras/EAN do produto
      - "descricao": Descrição do produto
      - "quantidade": Quantidade comprada (pode ser decimal para produtos pesados)
      - "unidade": Unidade de medida (UN, Kg, Lt, etc.)
      - "valorUnitario": Valor unitário do produto
      - "valorTotal": Valor total do item (quantidade × valor unitário)
      - "desconto": Valor de desconto aplicado ao item (se houver)

      NFC-E:
      - "chaveAcesso": Chave de acesso da NFC-e (44 dígitos)
      - "urlConsulta": URL para consulta da NFC-e (geralmente do site da Receita Estadual)

      REGRAS IMPORTANTES:
      1. Para produtos pesados (Kg), a quantidade pode ser decimal (ex: 1.189, 0.592)
      2. Alguns itens podem ter quantidade null se não estiver claramente visível
      3. Valores monetários devem usar ponto como separador decimal
      4. Datas devem estar no formato ISO (YYYY-MM-DDTHH:mm:ss)
      5. CNPJ deve manter a formatação com pontos, barras e hífen
      6. Se algum campo não estiver visível ou legível, use null
      7. Mantenha as descrições dos produtos exatamente como aparecem no cupom
      8. Para códigos de barras, extraia todos os dígitos visíveis
      9. Identifique corretamente as unidades de medida (UN, Kg, Lt, etc.)
      10. O valor total da compra geralmente aparece como "TOTAL A PAGAR" ou similar

      ATENÇÃO ESPECIAL:
      - Cupons fiscais brasileiros podem ter formatação variada dependendo do estado
      - Procure por seções como "DADOS DO ESTABELECIMENTO", "ITENS", "TOTAIS", "DADOS DA NFC-E"
      - A chave de acesso geralmente aparece no final do cupom
      - URLs de consulta são específicas de cada estado (ex: fazenda.pr.gov.br, nfce.fazenda.sp.gov.br)
    `

		const imagePart = dataUrlToGoogleGenerativeAIContent(imageUrl)

		// Envia o prompt e a imagem para o Gemini
		const result = await model.generateContent([prompt, imagePart])
		const responseText = result.response.text()

		// O Gemini pode retornar o JSON dentro de um bloco de código. Esta limpeza remove isso.
		const jsonString = responseText.replace(/```json\n?|```/g, "").trim()
		const parsedJson = JSON.parse(jsonString)

		return NextResponse.json(parsedJson)
	} catch (error) {
		console.error("Erro na chamada da API Gemini para cupom fiscal:", error)
		return NextResponse.json({ error: "Erro ao processar o cupom fiscal com a IA." }, { status: 500 })
	}
}
