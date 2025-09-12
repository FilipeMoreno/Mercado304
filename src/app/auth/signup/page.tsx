"use client";

import {
	Check,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	ShoppingCart,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { AuthQuote } from "@/components/auth-quote";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const router = useRouter();

	const passwordRequirements = [
		{ regex: /.{8,}/, text: "Pelo menos 8 caracteres" },
		{ regex: /[A-Z]/, text: "Uma letra maiúscula" },
		{ regex: /[a-z]/, text: "Uma letra minúscula" },
		{ regex: /\d/, text: "Um número" },
		{ regex: /[^A-Za-z0-9]/, text: "Um caractere especial" },
	];

	const validatePassword = (pwd: string) => {
		return passwordRequirements.every((req) => req.regex.test(pwd));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!acceptTerms) {
			toast.error("Você deve aceitar os termos e condições");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("As senhas não coincidem");
			return;
		}

		if (!validatePassword(password)) {
			toast.error("A senha não atende aos requisitos de segurança");
			return;
		}

		setIsLoading(true);

		try {
			const result = await signUp.email({
				name,
				email,
				password,
			});

			if (result.error) {
				if (result.error.code === "PASSWORD_COMPROMISED") {
					toast.error(
						"Essa senha já foi comprometida em vazamentos! " +
						"Por segurança, escolha uma senha única que você não use em outros sites. " +
						"Dica: use uma combinação de letras, números e símbolos.",
						{
							duration: 8000,
						}
					);
				} else {
					toast.error(result.error.message || "Erro ao criar conta");
				}
				return;
			}

			toast.success("Conta criada com sucesso!");
			router.push("/");
		} catch (error: any) {
			toast.error(error.message || "Erro ao criar conta");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/",
			});
		} catch (_error) {
			toast.error("Erro ao criar conta com Google");
		} finally {
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			<AuthQuote />
			<div className="flex items-center justify-center p-8">
				<div className="w-full max-w-[400px]">
					<div className="flex flex-col space-y-2 text-center mb-6">
						<div className="flex items-center justify-center mb-4">
							<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
							<h1 className="text-2xl font-semibold text-blue-600">
								Mercado304
							</h1>
						</div>
					</div>

					<Card>
						<CardHeader className="text-center">
							<CardTitle>Crie sua conta</CardTitle>
							<CardDescription>
								Preencha os dados abaixo para criar sua conta
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button
								variant="outline"
								className="w-full"
								onClick={handleGoogleSignIn}
								disabled={isGoogleLoading || isLoading}
							>
								{isGoogleLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
										<path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											fill="#FBBC05"
										/>
										<path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											fill="#EA4335"
										/>
									</svg>
								)}
								Continuar com Google
							</Button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<Separator className="w-full" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-background px-2 text-muted-foreground">
										Ou cadastre-se com email
									</span>
								</div>
							</div>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nome completo</Label>
									<div className="relative">
										<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="name"
											type="text"
											placeholder="Seu nome completo"
											value={name}
											onChange={(e) => setName(e.target.value)}
											className="pl-9"
											required
											disabled={isLoading}
										/>
									</div>
								</div>

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

								<div className="space-y-2">
									<Label htmlFor="password">Senha</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="Crie uma senha segura"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="pl-9 pr-9"
											required
											disabled={isLoading}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() => setShowPassword(!showPassword)}
											disabled={isLoading}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
									{password && (
										<div className="space-y-1 text-xs">
											{passwordRequirements.map((req, index) => (
												<div
													key={index}
													className="flex items-center space-x-2"
												>
													<div
														className={`w-4 h-4 rounded-full flex items-center justify-center ${
															req.regex.test(password)
																? "bg-green-500"
																: "bg-gray-300"
														}`}
													>
														{req.regex.test(password) && (
															<Check className="w-2 h-2 text-white" />
														)}
													</div>
													<span
														className={
															req.regex.test(password)
																? "text-green-600"
																: "text-gray-500"
														}
													>
														{req.text}
													</span>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirmar senha</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Digite a senha novamente"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											className="pl-9 pr-9"
											required
											disabled={isLoading}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
											disabled={isLoading}
										>
											{showConfirmPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
									{confirmPassword && password !== confirmPassword && (
										<p className="text-xs text-red-500">
											As senhas não coincidem
										</p>
									)}
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="terms"
										checked={acceptTerms}
										onCheckedChange={(checked) => setAcceptTerms(!!checked)}
										disabled={isLoading}
									/>
									<Label htmlFor="terms" className="text-sm">
										Aceito os{" "}
										<Link href="#" className="underline hover:text-primary">
											termos de uso
										</Link>{" "}
										e{" "}
										<Link href="#" className="underline hover:text-primary">
											política de privacidade
										</Link>
									</Label>
								</div>

								<Button
									type="submit"
									className="w-full"
									disabled={isLoading || !acceptTerms}
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Criando conta...
										</>
									) : (
										"Criar conta"
									)}
								</Button>
							</form>
						</CardContent>
						<CardFooter>
							<p className="text-center text-sm text-muted-foreground w-full">
								Já tem uma conta?{" "}
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
			</div>
		</div>
	);
}
