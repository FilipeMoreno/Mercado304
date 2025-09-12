import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json(
				{ error: 'Email é obrigatório' },
				{ status: 400 }
			);
		}

		// Usar Better Auth para reenviar email de verificação
		const result = await auth.api.sendEmailVerificationRequest({
			body: { email }
		});

		if (result.error) {
			return NextResponse.json(
				{ error: result.error.message || 'Erro ao reenviar email' },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ message: 'Email de verificação reenviado com sucesso' },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Erro ao reenviar email de verificação:', error);
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		);
	}
}