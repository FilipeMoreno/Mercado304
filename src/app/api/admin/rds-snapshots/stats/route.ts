import { NextResponse } from "next/server"

const WORKER_SERVER_URL = process.env.BACKGROUND_WORKER_SERVER || "http://localhost:3100"

export async function GET() {
	try {
		console.log("[RDS Stats] Buscando estatísticas...")

		const response = await fetch(`${WORKER_SERVER_URL}/api/rds/snapshots/stats`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const error = await response.json()
			console.error("[RDS Stats] Erro do worker:", error)

			return NextResponse.json(
				{
					success: false,
					error: error.error || "Erro ao buscar estatísticas",
					details: error.details || "Servidor worker retornou erro",
				},
				{ status: response.status },
			)
		}

		const data = await response.json()

		return NextResponse.json(data)
	} catch (error) {
		console.error("[RDS Stats] Erro:", error)

		const errorMessage = error instanceof Error ? error.message : String(error)
		const isConnectionError = errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed")

		return NextResponse.json(
			{
				success: false,
				error: isConnectionError
					? "Não foi possível conectar ao servidor worker"
					: "Erro ao buscar estatísticas",
				details: errorMessage,
				hint: isConnectionError
					? "Verifique se o servidor worker está rodando em " + WORKER_SERVER_URL
					: "Verifique os logs do servidor para mais detalhes",
			},
			{ status: 500 },
		)
	}
}

