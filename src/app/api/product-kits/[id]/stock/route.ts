import { NextRequest, NextResponse } from "next/server";
import * as productKitService from "@/services/productKitService";

/**
 * GET /api/product-kits/[id]/stock
 * Verifica a disponibilidade em estoque de um kit
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const stockInfo = await productKitService.checkKitStockAvailability(
      params.id
    );

    return NextResponse.json({
      success: true,
      data: stockInfo,
    });
  } catch (error) {
    console.error("Error checking kit stock:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao verificar estoque do kit",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-kits/[id]/stock/consume
 * Remove do estoque os produtos necessários para montar kits
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await request.json();

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "quantity deve ser um número maior que 0",
        },
        { status: 400 }
      );
    }

    const result = await productKitService.consumeKitFromStock(
      params.id,
      body.quantity,
      body.reason
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error consuming kit from stock:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao consumir kit do estoque",
      },
      { status: 500 }
    );
  }
}

