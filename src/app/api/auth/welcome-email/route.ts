import { type NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email"

// Enviar email de boas-vindas após verificação de email
export async function POST(request: NextRequest) {
	try {
		const { email, name } = await request.json()

		if (!email) {
			return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
		}

		await sendWelcomeEmail({
			user: {
				email,
				name: name || undefined,
			},
		})

		return NextResponse.json({
			success: true,
			message: "Email de boas-vindas enviado com sucesso",
		})
	} catch (error) {
		console.error("Erro ao enviar email de boas-vindas:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
