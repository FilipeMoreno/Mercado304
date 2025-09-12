import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const token = searchParams.token as string;

	if (!token) {
		return redirect("/auth/signin");
	}

	const verificationToken = await prisma.verificationToken.findUnique({
		where: { token },
	});

	if (!verificationToken) {
		return (
			<div className="flex flex-col space-y-2 text-center mb-6">
				<div className="flex items-center justify-center mb-4">
					<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
					<h1 className="text-2xl font-semibold text-blue-600">
						Mercado304
					</h1>
				</div>
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Token inválido</CardTitle>
						<CardDescription>
							O token de verificação é inválido ou não foi encontrado.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (new Date() > verificationToken.expires) {
		return (
			<div className="flex flex-col space-y-2 text-center mb-6">
				<div className="flex items-center justify-center mb-4">
					<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
					<h1 className="text-2xl font-semibold text-blue-600">
						Mercado304
					</h1>
				</div>
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Token expirado</CardTitle>
						<CardDescription>
							O token de verificação expirou. Por favor, solicite um novo.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	await prisma.user.update({
		where: { email: verificationToken.identifier },
		data: { emailVerified: new Date() },
	});

	await prisma.verificationToken.delete({
		where: { token },
	});

	return (
		<div className="flex flex-col space-y-2 text-center mb-6">
			<div className="flex items-center justify-center mb-4">
				<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
				<h1 className="text-2xl font-semibold text-blue-600">
					Mercado304
				</h1>
			</div>
			<Card>
				<CardHeader className="text-center">
					<CardTitle>Email verificado</CardTitle>
					<CardDescription>
						Seu email foi verificado com sucesso.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-sm text-muted-foreground">
						Agora você pode fazer login na sua conta.
					</p>
					<Button asChild className="mt-4 w-full">
						<Link href="/auth/signin">Fazer login</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
