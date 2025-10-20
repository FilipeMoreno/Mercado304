import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Principal */}
			<div className="space-y-2">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-5 w-64" />
			</div>

			{/* Header Fixo com Controles */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="size-10" />
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-36" />
				</div>
			</div>

			{/* Estatísticas de Produtos */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-5 w-32" />
			</div>

			{/* Grid de Produtos */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<Card key={i} className="h-full flex flex-col hover:shadow-lg transition-shadow-sm duration-200">
						<CardContent className="flex-1 flex flex-col p-4">
							<div className="flex-1">
								{/* Nome do produto e dropdown */}
								<div className="flex items-start justify-between mb-2">
									<Skeleton className="h-5 w-3/4 mr-2" />
									<Skeleton className="size-8" />
								</div>

								{/* Badges para marca e unidade */}
								<div className="mb-2">
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-16" />
										<Skeleton className="h-5 w-12" />
									</div>
								</div>
							</div>

							{/* Botão Ver Detalhes */}
							<div className="mt-auto">
								<Skeleton className="h-8 w-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Paginação */}
			<div className="flex justify-center items-center gap-2 pt-6">
				<Skeleton className="h-8 w-20" />
				<div className="flex gap-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="size-8" />
					))}
				</div>
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	)
}
