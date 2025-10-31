import { NextResponse } from "next/server"

const WORKER_SERVER_URL = process.env.BACKGROUND_WORKER_SERVER || "http://localhost:3100"

export async function DELETE(_request: Request, { params }: { params: Promise<{ identifier: string }> }) {
	try {
		const { identifier } = await params

		if (!identifier) {
			return NextResponse.json(
				{
					success: false,
					error: "Identificador do snapshot não fornecido",
				},
				{ status: 400 },
			)
		}

		console.log(`[RDS Snapshot Delete] Deletando snapshot: ${identifier}`)

		const response = await fetch(`${WORKER_SERVER_URL}/api/rds/snapshots/${identifier}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const error = await response.json()
			console.error("[RDS Snapshot Delete] Erro do worker:", error)

			return NextResponse.json(
				{
					success: false,
					error: error.error || "Erro ao deletar snapshot",
					details: error.details || "Servidor worker retornou erro",
				},
				{ status: response.status },
			)
		}

		const data = await response.json()

		console.log(`[RDS Snapshot Delete] Snapshot deletado: ${identifier}`)

		return NextResponse.json(data)
	} catch (error) {
		console.error("[RDS Snapshot Delete] Erro:", error)

		const errorMessage = error instanceof Error ? error.message : String(error)
		const isConnectionError = errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed")

		return NextResponse.json(
			{
				success: false,
				error: isConnectionError
					? "Não foi possível conectar ao servidor worker"
					: "Erro ao deletar snapshot",
				details: errorMessage,
				hint: isConnectionError
					? "Verifique se o servidor worker está rodando em " + WORKER_SERVER_URL
					: "Verifique os logs do servidor para mais detalhes",
			},
			{ status: 500 },
		)
	}
}

