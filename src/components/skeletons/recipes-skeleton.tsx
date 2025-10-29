import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RecipesSkeleton() {
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
					<Skeleton className="h-10 w-10" />
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-36" />
				</div>
			</div>

			{/* Estatísticas de Receitas */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-5 w-32" />
			</div>

			{/* Grid de Receitas */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
				{Array.from({ length: 8 }).map((_, i) => (
					<Card key={i} className="h-full flex flex-col overflow-hidden border-0">
						{/* Área superior com gradiente laranja (h-48) */}
						<div className="relative h-48 w-full bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10">
							<div className="relative h-full flex flex-col items-center justify-center p-6">
								<Skeleton className="h-20 w-20 rounded-2xl mb-3" />
								{/* Badge de tempo */}
								<Skeleton className="h-7 w-24 rounded-full" />
							</div>
							{/* Badge de dificuldade */}
							<div className="absolute bottom-3 left-3">
								<Skeleton className="h-7 w-20 rounded-full" />
							</div>
						</div>
						{/* Conteúdo */}
						<CardContent className="flex-1 flex flex-col p-4">
							<Skeleton className="h-6 w-3/4 mb-3" />
							<div className="flex flex-wrap gap-2 mb-3">
								<Skeleton className="h-6 w-20 rounded-md" />
								<Skeleton className="h-6 w-16 rounded-md" />
							</div>
							<div className="mt-auto pt-3 border-t">
								<Skeleton className="h-4 w-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Paginação */}
			<div className="flex justify-center items-center gap-2 pt-6">
				<Skeleton className="h-8 w-20" />
				<div className="flex gap-1">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-8" />
					))}
				</div>
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	)
}
