import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Usar transação para garantir que tudo seja deletado ou nada seja
    await prisma.$transaction(async (tx) => {
      // Delete authentication-related data only
      // This application doesn't appear to have user-specific data yet
      
      // 1. Accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId: userId }
      });

      // 2. Sessions
      await tx.session.deleteMany({
        where: { userId: userId }
      });

      // 3. Verification tokens
      if (session.user?.email) {
        await tx.verificationToken.deleteMany({
          where: { identifier: session.user.email }
        });
      }

      // 4. Finally, delete the user
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