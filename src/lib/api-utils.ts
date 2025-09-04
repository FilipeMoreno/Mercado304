import { NextResponse } from 'next/server';
import { AppError, ERROR_CODES } from './errors';
import { Prisma } from '@prisma/client';

/**
 * Manipulador de erros centralizado para rotas da API.
 * @param error O erro capturado no bloco catch.
 * @returns Uma resposta JSON padronizada.
 */
export function handleApiError(error: unknown): NextResponse {
  // Se o erro já for um AppError, usamos suas propriedades
  if (error instanceof AppError) {
    console.error(`[AppError: ${error.errorCode}]`, error.message);
    return NextResponse.json(
      {
        error: {
          code: error.errorCode,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  // Tratamento para erros específicos do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Erro de restrição única (ex: email já existe)
    if (error.code === 'P2002') {
      const fields = (error.meta?.target as string[])?.join(', ');
      const message = `O valor para ${fields} já está em uso.`;
      return handleApiError(new AppError('GEN_003', message)); // Pode criar um código específico
    }
    // Recurso não encontrado em uma operação (ex: update em um ID que não existe)
    if (error.code === 'P2025') {
      return handleApiError(new AppError('GEN_003'));
    }
  }

  // Para todos os outros erros, usamos um erro genérico
  console.error('[Unhandled API Error]', error);
  const genericError = ERROR_CODES['GEN_001'];
  return NextResponse.json(
    {
      error: {
        code: 'GEN_001',
        message: genericError.message,
      },
    },
    { status: genericError.statusCode }
  );
}