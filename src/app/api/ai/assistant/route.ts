import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { isBlockedQuery } from "@/lib/ai-assistant/security"
import { handleSelection } from "@/lib/ai-assistant/selection-handler"
import { SYSTEM_INSTRUCTIONS } from "@/lib/ai-assistant/system-instructions"
import { tools } from "@/lib/ai-assistant/tool-definitions"
import { toolFunctions } from "@/lib/ai-assistant/tool-functions/index"
import { getErrorMessage, retryWithBackoff } from "@/lib/ai-assistant/utils"

interface HistoryMessage {
	role: "user" | "model"
	parts: string | { text: string }[]
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request): Promise<Response> {
	// Timeout de 30 segundos para toda a requisição
	const timeoutPromise = new Promise<Response>((_, reject) => {
		setTimeout(() => reject(new Error("Request timeout")), 30000)
	})

	try {
		return await Promise.race([timeoutPromise, processRequest(request)])
	} catch (error) {
		console.error("Erro na API do assistente:", error)

		const errorMessage =
			error instanceof Error ? getErrorMessage(error) : "Desculpe, ocorreu um erro inesperado. Tente novamente."

		return NextResponse.json(
			{
				reply: errorMessage,
				error: true,
			},
			{ status: 200 },
		)
	}
}

async function processRequest(request: Request): Promise<Response> {
	try {
		const { message, history } = await request.json()

		console.log("Mensagem recebida:", { message: message?.substring?.(0, 100), historyLength: history?.length })

		// Validação básica da mensagem
		if (!message || typeof message !== "string" || message.trim() === "") {
			return NextResponse.json({
				reply: "Por favor, envie uma mensagem válida. Como posso ajudá-lo?",
				error: false,
			})
		}

		// Verifica se é uma mensagem de seleção
		if (message.startsWith("SELEÇÃO_FEITA:")) {
			const selectionData = JSON.parse(message.replace("SELEÇÃO_FEITA:", "").trim())
			return await handleSelection(selectionData, history)
		}

		// Verifica se é uma mensagem de cálculo de churrasco direto
		if (message.startsWith("CALCULATE_CHURRASCO:")) {
			const churrascoData = JSON.parse(message.replace("CALCULATE_CHURRASCO:", "").trim())
			const result = await toolFunctions.calculateChurrasco(churrascoData)
			return NextResponse.json({
				reply: result.message || "Churrasco calculado com sucesso!",
				error: !result.success,
			})
		}

		// Verifica se a mensagem é bloqueada por segurança
		const securityCheck = isBlockedQuery(message)
		if (securityCheck.blocked) {
			const securityMessage = `${securityCheck.reason}\n\nEu só posso ajudar com questões relacionadas ao gerenciamento de compras, produtos, listas, estoque e funcionalidades do Mercado304. Como posso ajudá-lo com suas compras hoje?`
			return NextResponse.json(
				{
					reply: securityMessage,
					error: true,
				},
				{ status: 200 },
			)
		}

		// Valida e limpa histórico
		const validHistory =
			history && Array.isArray(history)
				? history.filter((msg: HistoryMessage) => {
						return msg.role && msg.parts && (msg.role === "user" || msg.role === "model")
					})
				: []

		// Se histórico existe mas não começa com user, limpa
		if (validHistory.length > 0 && validHistory[0].role !== "user") {
			validHistory.length = 0
		}

		// Configura o modelo AI
		if (!process.env.GEMINI_API_KEY) {
			throw new Error("GEMINI_API_KEY não configurada")
		}

		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			tools,
			systemInstruction: SYSTEM_INSTRUCTIONS,
			generationConfig: {
				temperature: 0.1,
				maxOutputTokens: 2048,
			},
		})

		const chat = model.startChat({ history: validHistory })

		// Envia mensagem com retry (sem stream)
		const result = await retryWithBackoff(() => chat.sendMessage(message), 3, 1000)

		const functionCalls = result.response.functionCalls()

		// Se há function calls, executa elas
		if (functionCalls && functionCalls.length > 0) {
			console.log(
				"IA solicitou chamadas de função:",
				functionCalls.map((call) => call.name),
			)

			// Executa todas as chamadas de função
			const functionResponses = await Promise.all(
				functionCalls.map(async (call) => {
					try {
						// @ts-expect-error
						const apiResponse = await toolFunctions[call.name](call.args)
						return {
							functionResponse: {
								name: call.name,
								response: apiResponse,
							},
						}
					} catch (error) {
						console.error(`Erro na função ${call.name}:`, error)
						return {
							functionResponse: {
								name: call.name,
								response: {
									success: false,
									message: `Erro ao executar ${call.name}`,
								},
							},
						}
					}
				}),
			)

			// Verifica se alguma função retornou dados de seleção
			let selectionData = null
			for (const response of functionResponses) {
				if (response.functionResponse.response.showCards) {
					selectionData = response.functionResponse.response
					break
				}
			}

			// Se encontrou dados de seleção, retorna para o frontend mostrar cards
			if (selectionData) {
				return NextResponse.json({
					reply: selectionData.message,
					selectionData,
				})
			}

			// Envia todas as respostas de volta para a IA com retry
			const result2 = await retryWithBackoff(() => chat.sendMessage(functionResponses), 3, 1000)

			const reply = result2.response.text()

			// Valida se a resposta não está vazia
			if (!reply || reply.trim() === "") {
				return NextResponse.json({
					reply: "Operação realizada com sucesso!",
				})
			}

			return NextResponse.json({ reply })
		}

		// Se não houver chamada de função, responde diretamente
		const reply = result.response.text()

		// Valida se a resposta não está vazia
		if (!reply || reply.trim() === "") {
			return NextResponse.json({
				reply: "Desculpe, não consegui processar sua solicitação. Pode repetir de outra forma?",
			})
		}

		return NextResponse.json({ reply })
	} catch (error) {
		console.error("Erro ao processar requisição:", error)

		const errorMessage =
			error instanceof Error ? getErrorMessage(error) : "Desculpe, ocorreu um erro inesperado. Tente novamente."

		return NextResponse.json(
			{
				reply: errorMessage,
				error: true,
			},
			{ status: 200 },
		)
	}
}
