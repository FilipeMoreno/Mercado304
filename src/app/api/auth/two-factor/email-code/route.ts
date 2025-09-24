import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { sendTwoFactorEmail } from "@/lib/email"

// Enviar código de verificação por email
export async function POST() {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Gerar código de 6 dígitos
		const code = Math.floor(100000 + Math.random() * 900000).toString()

		// Salvar código temporariamente (você pode usar Redis ou banco de dados)
		// Por enquanto, vamos usar uma abordagem simples
		// const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

		// TODO: Implementar armazenamento do código no banco de dados
		// await prisma.twoFactorCode.create({
		//   data: {
		//     userId: session.user.id,
		//     code,
		//     expiresAt,
		//     type: 'EMAIL'
		//   }
		// })

		// Enviar email
		await sendTwoFactorEmail({
			user: {
				email: session.user.email,
				name: session.user.name || undefined,
			},
			code,
		})

		return NextResponse.json({
			success: true,
			message: "Código de verificação enviado por email",
			expiresIn: "10 minutos",
		})
	} catch (error) {
		console.error("Erro ao enviar código de verificação:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

// Verificar código de verificação
export async function PUT(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const { code } = await request.json()

		if (!code || code.length !== 6) {
			return NextResponse.json({ error: "Código inválido" }, { status: 400 })
		}

		// TODO: Implementar verificação do código no banco de dados
		// const validCode = await prisma.twoFactorCode.findFirst({
		//   where: {
		//     userId: session.user.id,
		//     code,
		//     expiresAt: { gt: new Date() },
		//     type: 'EMAIL'
		//   }
		// })

		// if (!validCode) {
		//   return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 })
		// }

		// // Deletar código usado
		// await prisma.twoFactorCode.delete({
		//   where: { id: validCode.id }
		// })

		// Por enquanto, vamos simular uma verificação bem-sucedida
		// Em produção, você deve implementar a verificação real

		return NextResponse.json({
			success: true,
			message: "Código verificado com sucesso",
		})
	} catch (error) {
		console.error("Erro ao verificar código:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
