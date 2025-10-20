import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function WasteSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Principal */}
			<div className="space-y-2">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-5 w-64" />
			</div>

			{/* Cartões de Estatísticas */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="size-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-24 mb-1" />
							<Skeleton className="h-3 w-16" />
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

			{/* Estatísticas de Desperdícios */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-5 w-32" />
			</div>

			{/* Lista de Registros de Desperdício */}
			<div className="space-y-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-start gap-4">
										<div className="flex-1">
											<Skeleton className="h-6 w-48 mb-2" />
											<div className="flex items-center gap-4 mb-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-4 w-20" />
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-4 w-32" />
											</div>
											<div className="flex items-center gap-2">
												<Skeleton className="h-6 w-20" />
												<Skeleton className="h-6 w-16" />
												<Skeleton className="h-6 w-24" />
											</div>
										</div>
									</div>
								</div>
								<Skeleton className="size-8" />
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
