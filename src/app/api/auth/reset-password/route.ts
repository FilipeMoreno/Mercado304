import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }


    // Busca token de verificação
    const verificationToken = await prisma.verification.findFirst({
      where: { value: token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      )
    }

    // Verifica se o token expirou
    if (new Date() > verificationToken.expiresAt) {
      // Remove token expirado
      await prisma.verification.delete({
        where: { id: verificationToken.id },
      })
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 400 }
      )
    }

    // Busca usuário pelo email (identifier do token)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }


    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualiza senha na tabela Account (credential provider)
    await prisma.account.updateMany({
      where: {
        userId: user.id,
        providerId: "credential",
      },
      data: {
        password: hashedPassword,
      },
    })


    // Remove token usado
    await prisma.verification.delete({
      where: { id: verificationToken.id },
    })


    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error: any) {
    console.error("[ResetPassword] Erro:", error)
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    )
  }
}

