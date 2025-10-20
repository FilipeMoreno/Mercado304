import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MarketsSkeleton() {
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

			{/* Estatísticas de Mercados */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-5 w-32" />
			</div>

			{/* Grid de Mercados */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 9 }).map((_, i) => (
					<Card key={i} className="h-full flex flex-col hover:shadow-lg transition-shadow-sm duration-200">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<Skeleton className="h-6 w-3/4 mb-2" />
									<Skeleton className="h-4 w-5/6" />
								</div>
								<Skeleton className="size-8" />
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<Skeleton className="h-8 w-full" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Paginação */}
			<div className="flex justify-center items-center gap-2 pt-6">
				<Skeleton className="h-8 w-20" />
				<div className="flex gap-1">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="size-8" />
					))}
				</div>
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	)
}
