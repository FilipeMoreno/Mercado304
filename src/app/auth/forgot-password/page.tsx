"use client";

import { Loader2, Mail, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (res.ok) {
				toast.success(
					"Um email com as instruções para resetar sua senha foi enviado.",
				);
			} else {
				toast.error("Erro ao enviar email de recuperação.");
			}
		} catch (error) {
			toast.error("Erro ao enviar email de recuperação.");
		} finally {
			setIsLoading(false);
		}
	};

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
							<CardTitle>Esqueceu sua senha?</CardTitle>
							<CardDescription>
								Digite seu email para receber um link de recuperação.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											placeholder="seu@email.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-9"
											required
											disabled={isLoading}
										/>
									</div>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Enviando...
										</>
									) : (
										"Enviar email de recuperação"
									)}
								</Button>
							</form>
						</CardContent>
						<CardFooter>
							<p className="text-center text-sm text-muted-foreground w-full">
								Lembrou da senha?{" "}
								<Link
									href="/auth/signin"
									className="underline underline-offset-4 hover:text-primary"
								>
									Fazer login
								</Link>
							</p>
						</CardFooter>
					</Card>
		</div>
	);
}
