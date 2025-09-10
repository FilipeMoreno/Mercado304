import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarcaDetalhesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header da Página */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-9 w-20" />
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<Skeleton className="h-8 w-8 rounded-full" />
						<div>
							<Skeleton className="h-8 w-64 mb-2" />
							<Skeleton className="h-5 w-80" />
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-20" />
				</div>
			</div>

			{/* Cards de Estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<Skeleton className="h-4 w-24" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-12" />
					</CardContent>
				</Card>
			</div>

			{/* Lista de Produtos */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-48" />
					</div>
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-5" />
										<Skeleton className="h-6 w-32" />
									</div>
									<div className="space-y-1 mt-2">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-4 w-24" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex gap-2">
										<Skeleton className="h-8 w-24" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
