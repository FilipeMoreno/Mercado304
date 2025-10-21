import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

/**
 * ENDPOINT DE DEBUG - Testa envio de email via Resend
 * Acesse: GET /api/debug/test-email?to=seu-email@exemplo.com
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const to = searchParams.get("to") || "teste@example.com"

		console.log(`[TestEmail] Testando envio de email para: ${to}`)

		const result = await sendEmail({
			to,
			subject: "Email de Teste - Mercado304",
			html: `
				<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
					<h1 style="color: #2563eb;">✅ Email de Teste!</h1>
					<p>Este é um email de teste do sistema Mercado304.</p>
					<p>Se você recebeu este email, significa que o Resend está configurado corretamente!</p>
					<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
					<p style="font-size: 12px; color: #6b7280;">
						Enviado em: ${new Date().toLocaleString("pt-BR")}
					</p>
				</div>
			`,
		})

		return NextResponse.json({
			success: true,
			message: "Email de teste enviado com sucesso!",
			to,
			emailId: result.data?.id,
			result,
		})
	} catch (error: any) {
		console.error("[TestEmail] Erro ao enviar email de teste:", error)
		return NextResponse.json(
			{
				success: false,
				error: error.message || "Erro ao enviar email",
				details: error,
			},
			{ status: 500 },
		)
	}
}
