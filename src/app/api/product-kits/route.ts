import { NextRequest, NextResponse } from "next/server";
import * as productKitService from "@/services/productKitService";

/**
 * GET /api/product-kits
 * Lista todos os kits de produtos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const kits = await productKitService.listProductKits(includeInactive);

    return NextResponse.json({
      success: true,
      data: kits,
    });
  } catch (error) {
    console.error("Error listing product kits:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao listar kits",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-kits
 * Cria um novo kit de produtos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    if (!body.kitProductId) {
      return NextResponse.json(
        {
          success: false,
          error: "kitProductId é obrigatório",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "items deve ser um array com pelo menos 1 item",
        },
        { status: 400 }
      );
    }

    // Validar cada item
    for (const item of body.items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Cada item deve ter productId e quantity válidos",
          },
          { status: 400 }
        );
      }
    }

    const kit = await productKitService.createProductKit({
      kitProductId: body.kitProductId,
      description: body.description,
      items: body.items,
    });

    return NextResponse.json(
      {
        success: true,
        data: kit,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product kit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar kit",
      },
      { status: 500 }
    );
  }
}

