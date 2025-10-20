import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MarcaDetalhesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header da Página */}
			<div className="flex flex-col md:flex-row md:items-center gap-4">
				<Skeleton className="h-9 w-20" />
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<Skeleton className="size-10 rounded-lg" />
						<div>
							<Skeleton className="h-8 md:h-9 w-64 mb-2" />
							<Skeleton className="h-5 w-40" />
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>

			{/* Cards de Estatísticas */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="size-4" />
							</div>
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-20" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Tabs */}
			<div className="space-y-6">
				{/* TabsList Skeleton */}
				<div className="grid grid-cols-4 gap-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full" />
					))}
				</div>

				{/* Tab Content Skeleton */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="size-5" />
							<Skeleton className="h-6 w-48" />
						</div>
						<Skeleton className="h-4 w-64 mt-2" />
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<Card key={i}>
									<CardHeader className="pb-3">
										<div className="flex items-center gap-2">
											<Skeleton className="size-5" />
											<Skeleton className="h-6 w-32" />
										</div>
										<div className="space-y-1 mt-2">
											<Skeleton className="h-4 w-40" />
											<Skeleton className="h-4 w-24" />
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<Skeleton className="h-9 w-full" />
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
