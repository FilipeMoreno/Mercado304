import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-utils';
import { parseOcrResult } from '@/lib/ocr-parser';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const { text } = await request.json();

    if (!text) {
      throw new AppError('GEN_001', 'Texto não fornecido.');
    }
    
    const parsedData = parseOcrResult(text);

    const nutritionalInfo = await prisma.nutritionalInfo.upsert({
      where: { productId },
      update: parsedData,
      create: {
        productId,
        ...parsedData,
      },
    });

    return NextResponse.json(nutritionalInfo);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET - Buscar informações nutricionais existentes
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    const nutritionalInfo = await prisma.nutritionalInfo.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      }
    });

    if (!nutritionalInfo) {
      throw new AppError('GEN_003', 'Informações nutricionais não encontradas para este produto.');
    }

    return NextResponse.json(nutritionalInfo);

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Remover informações nutricionais
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    await prisma.nutritionalInfo.delete({
      where: { productId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Informações nutricionais removidas com sucesso.' 
    });

  } catch (error) {
    return handleApiError(error);
  }
}