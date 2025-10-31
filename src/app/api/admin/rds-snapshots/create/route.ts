import { NextResponse } from "next/server"

const WORKER_SERVER_URL = process.env.BACKGROUND_WORKER_SERVER || "http://localhost:3100"

export async function POST(request: Request) {
	try {
		const body = await request.json()

		console.log("[RDS Snapshot Create] Criando snapshot...")

		const response = await fetch(`${WORKER_SERVER_URL}/api/rds/snapshots/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		})

		if (!response.ok) {
			const error = await response.json()
			console.error("[RDS Snapshot Create] Erro do worker:", error)

			return NextResponse.json(
				{
					success: false,
					error: error.error || "Erro ao criar snapshot",
					details: error.details || "Servidor worker retornou erro",
				},
				{ status: response.status },
			)
		}

		const data = await response.json()

		console.log(`[RDS Snapshot Create] Snapshot criado: ${data.snapshot?.identifier}`)

		return NextResponse.json(data)
	} catch (error) {
		console.error("[RDS Snapshot Create] Erro:", error)

		const errorMessage = error instanceof Error ? error.message : String(error)
		const isConnectionError = errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed")

		return NextResponse.json(
			{
				success: false,
				error: isConnectionError ? "Não foi possível conectar ao servidor worker" : "Erro ao criar snapshot",
				details: errorMessage,
				hint: isConnectionError
					? "Verifique se o servidor worker está rodando em " + WORKER_SERVER_URL
					: "Verifique os logs do servidor para mais detalhes",
			},
			{ status: 500 },
		)
	}
}

