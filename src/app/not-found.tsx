import { Frown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export default function NotFound() {
	return (
		<div className="flex flex-col w-full items-center justify-center p-4 min-h-[60vh]">
			<Empty className="border border-dashed py-16">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Frown className="size-8" />
					</EmptyMedia>
					<EmptyTitle className="text-4xl font-bold mb-2">404</EmptyTitle>
					<EmptyTitle>Página não encontrada</EmptyTitle>
					<EmptyDescription>Desculpe, não conseguimos encontrar a página que procura.</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Link href="/">
						<Button>Voltar para a página inicial</Button>
					</Link>
				</EmptyContent>
			</Empty>
		</div>
	)
}
