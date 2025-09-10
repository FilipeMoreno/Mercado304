import { Frown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Offline() {
	return (
		<div className="flex flex-col w-full items-center justify-center p-4 gap-4">
			<Frown className="mx-auto h-32 w-32 text-gray-400" />
			<div className="space-y-2 flex flex-col justify-center items-center">
				<h1 className="text-4xl font-bold">Você está offline</h1>
				<h2 className="text-xl font-semibold">Sem conexão com a internet</h2>
				<p className="text-gray-600">
					Parece que você está sem internet. Tente se conectar novamente para
					acessar o conteúdo.
				</p>
			</div>
			<Link href="/">
				<Button>Tentar Novamente</Button>
			</Link>
		</div>
	);
}
