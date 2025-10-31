import { NextResponse } from "next/server"

const WORKER_SERVER_URL = process.env.BACKGROUND_WORKER_SERVER || "http://localhost:3100"

export async function GET() {
	try {
		console.log("[RDS Snapshots] Buscando lista do servidor worker...")

		const response = await fetch(`${WORKER_SERVER_URL}/api/rds/snapshots/list`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const error = await response.json()
			console.error("[RDS Snapshots] Erro do worker:", error)
			
			return NextResponse.json(
				{
					success: false,
					error: error.error || "Erro ao listar snapshots RDS",
					details: error.details || "Servidor worker retornou erro",
				},
				{ status: response.status },
			)
		}

		const data = await response.json()

		console.log(`[RDS Snapshots] ${data.snapshots?.length || 0} snapshots encontrados`)

		return NextResponse.json(data)
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao buscar snapshots:", error)

		const errorMessage = error instanceof Error ? error.message : String(error)
		const isConnectionError = errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed")

		return NextResponse.json(
			{
				success: false,
				error: isConnectionError
					? "Não foi possível conectar ao servidor worker"
					: "Erro ao listar snapshots RDS",
				details: errorMessage,
				hint: isConnectionError
					? "Verifique se o servidor worker está rodando em " + WORKER_SERVER_URL
					: "Verifique os logs do servidor para mais detalhes",
			},
			{ status: 500 },
		)
	}
}

