import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está sendo usado' },
        { status: 400 }
      );
    }

    // Validação de senha
    const passwordRequirements = [
      { regex: /.{8,}/, message: 'Senha deve ter pelo menos 8 caracteres' },
      { regex: /[A-Z]/, message: 'Senha deve ter pelo menos uma letra maiúscula' },
      { regex: /[a-z]/, message: 'Senha deve ter pelo menos uma letra minúscula' },
      { regex: /\d/, message: 'Senha deve ter pelo menos um número' },
      { regex: /[^A-Za-z0-9]/, message: 'Senha deve ter pelo menos um caractere especial' }
    ];

    for (const requirement of passwordRequirements) {
      if (!requirement.regex.test(password)) {
        return NextResponse.json(
          { error: requirement.message },
          { status: 400 }
        );
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}