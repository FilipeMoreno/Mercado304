import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao buscar todas as categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar todas as categorias' },
      { status: 500 }
    );
  }
}