import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Usar transação para garantir que tudo seja deletado ou nada seja
    await prisma.$transaction(async (tx) => {
      // Deletar dados relacionados em ordem (devido às foreign keys)
      
      // 1. Shopping list items
      await tx.shoppingListItem.deleteMany({
        where: {
          shoppingList: {
            userId: userId
          }
        }
      });

      // 2. Shopping lists
      await tx.shoppingList.deleteMany({
        where: { userId: userId }
      });

      // 3. Purchase items
      await tx.purchaseItem.deleteMany({
        where: {
          purchase: {
            userId: userId
          }
        }
      });

      // 4. Purchases
      await tx.purchase.deleteMany({
        where: { userId: userId }
      });

      // 5. Stock movements
      await tx.stockMovement.deleteMany({
        where: {
          stockItem: {
            userId: userId
          }
        }
      });

      // 6. Stock items
      await tx.stockItem.deleteMany({
        where: { userId: userId }
      });

      // 7. Expiration alerts
      await tx.expirationAlert.deleteMany({
        where: { userId: userId }
      });

      // 8. Recipes
      await tx.recipe.deleteMany({
        where: { userId: userId }
      });

      // 9. Products created by user
      await tx.product.deleteMany({
        where: { userId: userId }
      });

      // 10. Markets created by user
      await tx.market.deleteMany({
        where: { userId: userId }
      });

      // 11. Categories created by user
      await tx.category.deleteMany({
        where: { userId: userId }
      });

      // 12. Brands created by user
      await tx.brand.deleteMany({
        where: { userId: userId }
      });

      // 13. Accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId: userId }
      });

      // 14. Sessions
      await tx.session.deleteMany({
        where: { userId: userId }
      });

      // 15. Verification tokens
      await tx.verificationToken.deleteMany({
        where: { identifier: session.user.email }
      });

      // 16. Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({
      message: 'Conta excluída com sucesso',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}