import { NextRequest, NextResponse } from "next/server";
import * as productKitService from "@/services/productKitService";

/**
 * GET /api/products/[id]/check-kits
 * Verifica se um produto está vinculado a algum kit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const checkResult = await productKitService.checkProductInKits(params.id);

    return NextResponse.json({
      success: true,
      data: checkResult,
    });
  } catch (error) {
    console.error("Error checking product in kits:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao verificar produto em kits",
      },
      { status: 500 }
    );
  }
}

