import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header com título e botão customizer */}
			<div className="flex justify-between items-start">
				<div>
					<Skeleton className="h-9 w-64 mb-2" />
					<Skeleton className="h-5 w-96" />
				</div>
				<Skeleton className="h-10 w-10" />
			</div>

			{/* Card de Resumo AI */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
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
			<div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Gráfico de Gastos Mensais */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-72" />
				</CardHeader>
				<CardContent>
					<div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
				</CardContent>
			</Card>

			{/* Alertas de Reposição e Expiração */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-44" />
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
									<Skeleton className="h-8 w-20" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
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

			{/* Card de Comparação Temporal */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="h-5 w-24" />
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-6 w-20" />
									</div>
									<div className="flex items-center justify-between">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-6 w-16" />
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Cards de Análise (3 cards) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-36" />
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

			{/* Estatísticas de Métodos de Pagamento */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-52" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="text-center space-y-2">
								<Skeleton className="h-8 w-8 mx-auto" />
								<Skeleton className="h-4 w-16 mx-auto" />
								<Skeleton className="h-6 w-20 mx-auto" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Gastos por Categoria */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-44" />
					<Skeleton className="h-4 w-56" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="h-6 w-6 rounded-full" />
									<Skeleton className="h-6 w-6" />
									<div>
										<Skeleton className="h-4 w-32 mb-1" />
										<Skeleton className="h-3 w-24" />
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
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-44" />
						<Skeleton className="h-4 w-40" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Skeleton className="h-6 w-6 rounded-full" />
										<div>
											<Skeleton className="h-4 w-32 mb-1" />
											<Skeleton className="h-3 w-20" />
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
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Skeleton className="h-6 w-6 rounded-full" />
										<div>
											<div className="flex items-center gap-2">
												<Skeleton className="h-4 w-24" />
												{i === 0 && <Skeleton className="h-5 w-16" />}
											</div>
											<Skeleton className="h-3 w-16 mt-1" />
										</div>
									</div>
									<Skeleton className="h-4 w-20" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Compras Recentes */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<Skeleton className="h-6 w-36" />
						<Skeleton className="h-4 w-48" />
					</div>
					<Skeleton className="h-8 w-24" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
								<div className="flex items-center gap-4">
									<Skeleton className="h-10 w-10" />
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
		</div>
	)
}
