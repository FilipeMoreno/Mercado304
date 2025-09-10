import { Frown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex flex-col w-full items-center justify-center p-4 gap-4">
			<Frown className="mx-auto h-32 w-32 text-gray-400" />
			<div className="space-y-2 flex flex-col justify-center items-center">
				<h1 className="text-4xl font-bold">404</h1>
				<h2 className="text-xl font-semibold">Página não encontrada</h2>
				<p className="text-gray-600">
					Desculpe, não conseguimos encontrar a página que procura.
				</p>
			</div>
			<Link href="/">
				<Button>Voltar para a página inicial</Button>
			</Link>
		</div>
	);
}
