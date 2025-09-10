import { AuthQuote } from "@/components/auth-quote";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function VerifyRequestPage() {
	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			<AuthQuote />
			<div className="flex items-center justify-center p-8">
				<div className="w-full max-w-[400px]">
					<Card>
						<CardHeader className="text-center">
							<CardTitle>Verifique seu email</CardTitle>
							<CardDescription>
								Um link de verificação foi enviado para o seu endereço de email.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-center text-sm text-muted-foreground">
								Por favor, verifique sua caixa de entrada e siga as instruções
								para completar o seu cadastro.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
