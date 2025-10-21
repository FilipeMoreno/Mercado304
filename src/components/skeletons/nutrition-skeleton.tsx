import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function NutritionSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Principal */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div className="flex items-center gap-4">
					<Skeleton className="size-8" />
					<div>
						<Skeleton className="h-8 w-48 mb-2" />
						<Skeleton className="h-5 w-64" />
					</div>
				</div>
			</div>

			{/* Controles */}
			<div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
				<Skeleton className="h-10 w-full sm:w-32" />
				<Skeleton className="size-10" />
			</div>

			{/* Cards de Resumo */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center gap-3">
								<Skeleton className="size-10 rounded-lg" />
								<div className="flex-1">
									<Skeleton className="h-6 w-16 mb-1" />
									<Skeleton className="h-4 w-20" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Gráficos Principais */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Distribuição de Macronutrientes */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent>
						<div className="h-[300px] flex items-center justify-center">
							<Skeleton className="h-48 w-48 rounded-full" />
						</div>
					</CardContent>
				</Card>

				{/* Indicadores de Qualidade */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40 mb-2" />
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent className="space-y-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Skeleton className="size-4" />
										<Skeleton className="h-4 w-24" />
									</div>
									<Skeleton className="h-4 w-8" />
								</div>
								<Skeleton className="h-2 w-full" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Análise por Categoria */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40 mb-2" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="p-4 rounded-lg border">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<Skeleton className="size-5" />
										<Skeleton className="h-5 w-20" />
									</div>
									<div className="flex items-center gap-1">
										<Skeleton className="size-4" />
										<Skeleton className="h-4 w-6" />
									</div>
								</div>
								<div className="space-y-1">
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-3 w-18" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Produtos Mais e Menos Saudáveis */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Produtos Mais Saudáveis */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="size-5" />
							<Skeleton className="h-6 w-48" />
						</div>
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
							>
								<div className="flex items-center gap-3">
									<Skeleton className="size-6 rounded-full" />
									<div>
										<Skeleton className="h-4 w-32 mb-1" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
								<Skeleton className="h-6 w-8" />
							</div>
						))}
					</CardContent>
				</Card>

				{/* Produtos Menos Saudáveis */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="size-5" />
							<Skeleton className="h-6 w-48" />
						</div>
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
								<div className="flex items-center gap-3">
									<Skeleton className="size-6 rounded-full" />
									<div>
										<Skeleton className="h-4 w-32 mb-1" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
								<Skeleton className="h-6 w-8" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Top Alérgenos */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="size-5" />
						<Skeleton className="h-6 w-40" />
					</div>
					<Skeleton className="h-4 w-56" />
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} className="h-6 w-16" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
