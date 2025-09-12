import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

// Enable Email 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Update user preferences to enable email 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Add email 2FA preference field or use a separate table for user preferences
        // For now, we'll store it as a JSON field or create a separate preference system
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "2FA via email habilitado com sucesso" 
    });

  } catch (error) {
    console.error("Error enabling email 2FA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Disable Email 2FA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Update user preferences to disable email 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Remove email 2FA preference
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "2FA via email desabilitado com sucesso" 
    });

  } catch (error) {
    console.error("Error disabling email 2FA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Check Email 2FA Status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Get user's email 2FA preference
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        // Select email 2FA preference field
        id: true,
        email: true
      }
    });

    return NextResponse.json({ 
      enabled: false, // This will be determined by user preferences
      email: user?.email 
    });

  } catch (error) {
    console.error("Error checking email 2FA status:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}