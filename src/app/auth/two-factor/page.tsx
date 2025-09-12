"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { twoFactor } from "@/lib/auth-client";
import { handleAuthError, showAuthSuccess } from "@/lib/auth-errors";
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
import { Loader2, ShieldCheck, Key } from "lucide-react";

export default function TwoFactorPage() {
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [useBackupCode, setUseBackupCode] = useState(false); // Estado para alternar entre TOTP e backup
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			let result;
			if (useBackupCode) {
				// Lógica para verificar o código de backup
				if (!code.trim()) {
					toast.error("Por favor, insira um código de backup.");
					setIsLoading(false);
					return;
				}
				result = await twoFactor.verifyBackupCode({ code });
			} else {
				// Lógica para verificar o código TOTP
				if (code.length !== 6) {
					toast.error("O código do autenticador deve ter 6 dígitos.");
					setIsLoading(false);
					return;
				}
				result = await twoFactor.verifyTotp({ code });
			}

			if (result.error) {
				handleAuthError(result.error, 'general');
				return;
			}

			showAuthSuccess('signin');
			router.push("/");
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao verificar o código" }, 'general');
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
							<CardTitle>Verificação de Dois Fatores</CardTitle>
							<CardDescription>
								{useBackupCode 
									? "Digite um dos seus códigos de backup para continuar."
									: "Digite o código de 6 dígitos do seu aplicativo autenticador."
								}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="2fa-code">
										{useBackupCode ? "Código de Backup" : "Código de 6 dígitos"}
									</Label>
									<div className="relative">
										{useBackupCode ? (
											<Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										) : (
											<ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										)}
										<Input
											id="2fa-code"
											type="text"
											inputMode={useBackupCode ? "text" : "numeric"}
											pattern={useBackupCode ? undefined : "[0-9]{6}"}
											maxLength={useBackupCode ? undefined : 6}
											placeholder={useBackupCode ? "xxxx-xxxx" : "_ _ _ _ _ _"}
											value={code}
											onChange={(e) => setCode(e.target.value)}
											className={`pl-9 ${!useBackupCode && 'text-center tracking-[0.5em]'}`}
											required
											disabled={isLoading}
										/>
									</div>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Verificando...
										</>
									) : (
										"Verificar Código"
									)}
								</Button>
							</form>
						</CardContent>
					<CardFooter>
							<Button 
								variant="link" 
								className="w-full"
								onClick={() => {
									setUseBackupCode(!useBackupCode);
									setCode(""); // Limpa o campo ao alternar
								}}
							>
								{useBackupCode ? "Usar código do aplicativo" : "Usar um código de backup"}
							</Button>
						</CardFooter>
					</Card>
		</div>
	);
}