import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
	try {
		const session = await getSession();

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		const { name, email } = await request.json();

		if (!name || !email) {
			return NextResponse.json(
				{ error: "Nome e email são obrigatórios" },
				{ status: 400 },
			);
		}

		// Verificar se o email já está sendo usado por outro usuário
		if (email !== session.user.email) {
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser && existingUser.id !== session.user.id) {
				return NextResponse.json(
					{ error: "Email já está sendo usado por outra conta" },
					{ status: 400 },
				);
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id: session.user.id },
			data: {
				name,
				email,
			},
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
			},
		});

		return NextResponse.json({
			message: "Perfil atualizado com sucesso",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Error updating profile:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
