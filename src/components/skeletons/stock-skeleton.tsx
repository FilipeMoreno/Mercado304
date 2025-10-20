import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StockSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Principal */}
			<div className="space-y-2">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-5 w-64" />
			</div>

			{/* Cartões de Estatísticas */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
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

			{/* Filtros Avançados */}
			<Card>
				<CardContent className="pt-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-9 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-9 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<div className="flex gap-2">
								<Skeleton className="h-9 w-24" />
								<Skeleton className="h-9 w-24" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Estatísticas de Estoque */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-5 w-32" />
			</div>

			{/* Grid de Itens de Estoque */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 9 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<Skeleton className="h-6 w-3/4 mb-1" />
									<Skeleton className="h-4 w-1/2" />
								</div>
								<div className="flex gap-1">
									<Skeleton className="size-8" />
									<Skeleton className="size-8" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between items-center">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-16" />
							</div>
							<div className="flex justify-between items-center">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-20" />
							</div>
							<div className="flex gap-2 pt-2">
								<Skeleton className="h-8 flex-1" />
								<Skeleton className="h-8 flex-1" />
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
						<Skeleton key={i} className="size-8" />
					))}
				</div>
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	)
}
