import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
	return (
		<div className="space-y-4 md:space-y-6">
			{/* Header com título e botão customizer */}
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 md:h-9 w-64 mb-2" />
					<Skeleton className="h-4 md:h-5 w-80 md:w-96" />
				</div>
				<Skeleton className="h-10 w-10 rounded-md" />
			</div>

			{/* Card de Resumo AI */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-48" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-5/6" />
						<Skeleton className="h-4 w-4/5" />
					</div>
				</CardContent>
			</Card>

			{/* Cards de Estatísticas Principais (5 cards) */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
				{Array.from({ length: 5 }).map((_, i) => (
					<Card key={`skeleton-card-${i}`} className="shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Gráfico de Gastos Mensais */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48 mb-2" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 md:h-80 w-full rounded-lg" />
				</CardContent>
			</Card>

			{/* Alertas de Reposição e Expiração */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Alertas de Reposição */}
				<Card className="shadow-sm">
					<CardHeader>
						<Skeleton className="h-6 w-44 mb-2" />
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between p-3 border rounded-lg">
									<div className="flex items-center gap-3">
										<Skeleton className="h-8 w-8 rounded-full" />
										<div>
											<Skeleton className="h-4 w-32 mb-1" />
											<Skeleton className="h-3 w-20" />
										</div>
									</div>
									<Skeleton className="h-8 w-20 rounded-md" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Alertas de Expiração */}
				<Card className="shadow-sm">
					<CardHeader>
						<Skeleton className="h-6 w-40 mb-2" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between p-3 border rounded-lg">
									<div className="flex items-center gap-3">
										<Skeleton className="h-8 w-8 rounded-full" />
										<div>
											<Skeleton className="h-4 w-28 mb-1" />
											<Skeleton className="h-3 w-16" />
										</div>
									</div>
									<Skeleton className="h-6 w-16" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Card de Comparação Mensal */}
			<Card className="md:col-span-2">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-48" />
					</div>
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="text-center p-4 border rounded-lg">
								<Skeleton className="h-8 w-24 mx-auto mb-2" />
								<Skeleton className="h-4 w-20 mx-auto mb-1" />
								<Skeleton className="h-3 w-16 mx-auto" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Cards de Análise (Savings, Temporal, Nutrition) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i} className="shadow-sm">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5" />
								<Skeleton className="h-6 w-32" />
							</div>
							<Skeleton className="h-4 w-full mt-2" />
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Card de Estatísticas de Descontos */}
			<Card className="shadow-sm">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-52" />
					</div>
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="text-center p-4 border rounded-lg">
								<Skeleton className="h-8 w-8 mx-auto mb-2" />
								<Skeleton className="h-4 w-24 mx-auto mb-1" />
								<Skeleton className="h-6 w-20 mx-auto" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Estatísticas de Métodos de Pagamento */}
			<Card className="shadow-sm">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-64" />
					</div>
					<Skeleton className="h-4 w-56 mt-2" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="text-center space-y-2">
								<Skeleton className="h-8 w-8 mx-auto" />
								<Skeleton className="h-4 w-16 mx-auto" />
								<Skeleton className="h-6 w-20 mx-auto" />
								<Skeleton className="h-3 w-12 mx-auto" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Gastos por Categoria */}
			<Card className="shadow-sm">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-44" />
					</div>
					<Skeleton className="h-4 w-72 mt-2" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="h-6 w-6 rounded-full" />
									<div>
										<Skeleton className="h-4 w-32 mb-1" />
										<Skeleton className="h-3 w-40" />
									</div>
								</div>
								<div className="text-right">
									<Skeleton className="h-4 w-20 mb-1" />
									<Skeleton className="h-3 w-12" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Produtos e Mercados */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Produtos Mais Comprados */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-48" />
						</CardTitle>
						<CardDescription>
							<Skeleton className="h-4 w-40" />
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Skeleton className="h-6 w-6 rounded-full" />
										<div>
											<Skeleton className="h-4 w-32 mb-1" />
											<Skeleton className="h-3 w-24" />
										</div>
									</div>
									<div className="text-right">
										<Skeleton className="h-4 w-16 mb-1" />
										<Skeleton className="h-3 w-12" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Comparação de Mercados */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-44" />
						</CardTitle>
						<CardDescription>
							<Skeleton className="h-4 w-48" />
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Skeleton className="h-6 w-6 rounded-full" />
										<div>
											<div className="flex items-center gap-2 mb-1">
												<Skeleton className="h-4 w-24" />
												{i === 0 && <Skeleton className="h-5 w-20" />}
											</div>
											<Skeleton className="h-3 w-16" />
										</div>
									</div>
									<div className="text-right">
										<Skeleton className="h-4 w-20 mb-1" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Compras Recentes */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>
						<Skeleton className="h-6 w-36" />
					</CardTitle>
					<CardDescription>
						<Skeleton className="h-4 w-48" />
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-3 border rounded-lg">
								<div className="flex items-center gap-3">
									<Skeleton className="h-5 w-5" />
									<div>
										<Skeleton className="h-4 w-32 mb-1" />
										<Skeleton className="h-3 w-40" />
									</div>
								</div>
								<div className="text-right">
									<Skeleton className="h-4 w-16 mb-1" />
									<Skeleton className="h-3 w-12" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

