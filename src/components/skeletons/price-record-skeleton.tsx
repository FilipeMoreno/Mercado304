import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PriceRecordSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header com título e botão */}
			<div className="flex justify-between items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Tabs */}
			<div className="space-y-4">
				<div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-8 w-32" />
				</div>

				{/* Formulário de Registro */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-20 w-full" />
						</div>
						<div className="flex gap-2">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-32" />
						</div>
					</CardContent>
				</Card>

				{/* Cards de Análise */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-36" />
						</CardHeader>
						<CardContent className="py-8">
							<div className="space-y-4">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-44" />
						</CardHeader>
						<CardContent className="py-8">
							<div className="space-y-4">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="size-4/5" />
								<Skeleton className="h-4 w-2/3" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Histórico de Registros */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{/* Filtros */}
							<div className="flex gap-2 mb-4">
								<Skeleton className="h-10 w-full max-w-md" />
								<Skeleton className="h-10 w-24" />
							</div>
							
							{/* Lista de registros */}
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
									<div className="space-y-2 flex-1">
										<Skeleton className="h-5 w-48" />
										<div className="flex items-center gap-4">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-4 w-20" />
											<Skeleton className="h-4 w-16" />
										</div>
									</div>
									<div className="flex gap-2">
										<Skeleton className="size-8" />
										<Skeleton className="size-8" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}