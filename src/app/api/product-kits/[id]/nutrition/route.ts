import { NextRequest, NextResponse } from "next/server";
import * as productKitService from "@/services/productKitService";

/**
 * GET /api/product-kits/[id]/nutrition
 * Calcula as informações nutricionais agregadas de um kit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nutritionalInfo = await productKitService.calculateKitNutritionalInfo(
      params.id
    );

    if (!nutritionalInfo) {
      return NextResponse.json(
        {
          success: false,
          error: "Kit não encontrado ou sem informações nutricionais",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: nutritionalInfo,
    });
  } catch (error) {
    console.error("Error calculating kit nutrition:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao calcular informações nutricionais",
      },
      { status: 500 }
    );
  }
}

