import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/all
 * Retorna todos os produtos sem paginação (para selects e autocompletes)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const excludeKits = searchParams.get("excludeKits") === "true";

    const where: any = {};

    // Filtro de busca
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search } },
      ];
    }

    // Excluir kits (útil para não adicionar kit dentro de kit)
    if (excludeKits) {
      where.isKit = false;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 1000, // Limite razoável
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar produtos",
      },
      { status: 500 }
    );
  }
}

