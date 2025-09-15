"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="flex flex-col h-full items-center justify-center text-center p-6">
			<AlertTriangle className="h-16 w-16 text-destructive mb-4" />
			<h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2>
			<p className="text-muted-foreground mb-6 max-w-md">
				Algo deu errado e não conseguimos carregar esta parte da aplicação. Você pode tentar novamente ou voltar para a
				página inicial.
			</p>
			<div className="flex gap-4">
				<Button
					onClick={
						// Tenta recarregar o segmento da rota
						() => reset()
					}
				>
					Tentar Novamente
				</Button>
				<Link href="/">
					<Button variant="outline">Voltar para a Página Inicial</Button>
				</Link>
			</div>
		</div>
	)
}
