import { NextRequest, NextResponse } from "next/server";
import * as productKitService from "@/services/productKitService";

/**
 * GET /api/product-kits/[id]
 * Busca os detalhes de um kit específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kit = await productKitService.getProductKitWithDetails(params.id);

    if (!kit) {
      return NextResponse.json(
        {
          success: false,
          error: "Kit não encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: kit,
    });
  } catch (error) {
    console.error("Error getting product kit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar kit",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product-kits/[id]
 * Atualiza um kit (descrição, barcode, brand, category, status e items)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validar items se fornecidos
    if (body.items !== undefined) {
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
    }

    const kit = await productKitService.updateProductKit(params.id, {
      description: body.description,
      barcode: body.barcode,
      brandId: body.brandId,
      categoryId: body.categoryId,
      isActive: body.isActive,
      items: body.items,
    });

    return NextResponse.json({
      success: true,
      data: kit,
    });
  } catch (error) {
    console.error("Error updating product kit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar kit",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/product-kits/[id]
 * Exclui um kit (id é o kitProductId)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // params.id é o kitProductId
    const kitProductId = params.id;
    
    const kit = await productKitService.getProductKitWithDetails(kitProductId);

    if (!kit) {
      return NextResponse.json(
        {
          success: false,
          error: "Kit não encontrado",
        },
        { status: 404 }
      );
    }

    // Deletar o kit usando o ID interno (cascade irá deletar os items)
    await productKitService.deleteProductKit(kit.id);

    return NextResponse.json({
      success: true,
      message: "Kit excluído com sucesso",
    });
  } catch (error) {
    console.error("Error deleting product kit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao excluir kit",
      },
      { status: 500 }
    );
  }
}

