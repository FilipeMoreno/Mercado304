import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductDetailsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Simplificado */}
			<div className="space-y-4">
				{/* Título e Badges */}
				<div className="flex items-start gap-3">
					<div className="flex-1 min-w-0">
						<Skeleton className="h-8 md:h-10 w-full max-w-md mb-3" />
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton className="h-6 w-20" />
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-6 w-16" />
							<Skeleton className="h-6 w-12" />
						</div>
					</div>
				</div>

				{/* Botões de Ação */}
				<div className="flex flex-row gap-3">
					<Skeleton className="h-10 flex-1" />
					<Skeleton className="h-10 w-10" />
				</div>

				{/* Avisos ANVISA e Ícones de Alérgenos */}
				<div className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-8 w-36" />
					</div>
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-6 w-6 rounded-full" />
						<Skeleton className="h-6 w-6 rounded-full" />
						<Skeleton className="h-6 w-6 rounded-full" />
					</div>
				</div>
			</div>

			{/* Grid: Imagem + Stats + Info + Estoque */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Coluna Esquerda: Imagem do Produto */}
				<Card className="flex flex-col">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
						</div>
					</CardHeader>
					<CardContent className="flex-1 flex items-center justify-center">
						<Skeleton className="h-[400px] w-full rounded-lg" />
					</CardContent>
				</Card>

				{/* Coluna Direita: Stats + Informações + Estoque */}
				<div className="space-y-4">
					{/* Cards de Estatísticas Compactos */}
					<div className="grid grid-cols-2 gap-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i}>
								<CardContent className="p-4">
									<div className="flex items-center gap-2">
										<Skeleton className="h-7 w-7 rounded" />
										<div className="flex-1 min-w-0">
											<Skeleton className="h-5 w-12 mb-1" />
											<Skeleton className="h-3 w-16" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Informações Gerais Compactas */}
					<Card>
						<CardHeader className="pb-3">
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i}>
										<Skeleton className="h-3 w-20 mb-1" />
										<Skeleton className="h-4 w-24" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Status do Estoque e Desperdícios/Usos */}
					<div className="space-y-4">
						{/* Status do Estoque Compacto */}
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-4 w-28" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-3">
									{Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="flex flex-col items-center text-center">
											<Skeleton className="h-10 w-10 rounded-lg mb-1" />
											<Skeleton className="h-5 w-8 mb-1" />
											<Skeleton className="h-3 w-12" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Desperdícios e Usos */}
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-4 w-32" />
								</div>
								<Skeleton className="h-3 w-48" />
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="grid grid-cols-2 gap-3">
										{Array.from({ length: 2 }).map((_, i) => (
											<div key={i} className="p-3 border rounded-lg">
												<div className="flex items-center gap-2 mb-2">
													<Skeleton className="h-4 w-4" />
													<Skeleton className="h-3 w-16" />
												</div>
												<Skeleton className="h-6 w-12 mb-1" />
												<Skeleton className="h-3 w-20" />
											</div>
										))}
									</div>
									<div className="space-y-2">
										{Array.from({ length: 3 }).map((_, i) => (
											<div key={i} className="flex items-center justify-between p-2 border rounded text-xs">
												<div className="flex-1">
													<Skeleton className="h-3 w-16 mb-1" />
													<Skeleton className="h-3 w-24" />
												</div>
												<div className="text-right">
													<Skeleton className="h-3 w-12 mb-1" />
													<Skeleton className="h-3 w-16" />
												</div>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* Grid: Gráficos lado a lado */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Gráfico de Evolução de Preços */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-5" />
							<Skeleton className="h-6 w-40" />
						</div>
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-[300px] w-full rounded-lg" />
					</CardContent>
				</Card>

				{/* Análise do melhor dia */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-5" />
							<Skeleton className="h-6 w-48" />
						</div>
						<Skeleton className="h-4 w-56" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Skeleton className="h-[200px] w-full rounded-lg" />
							<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<Skeleton className="h-4 w-full mb-2" />
								<Skeleton className="h-4 w-3/4" />
							</div>
							<div className="p-4 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 rounded-lg">
								<div className="flex items-start gap-3">
									<Skeleton className="h-8 w-8 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-48" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-2/3" />
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Comparação entre Mercados */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-48" />
					</div>
					<Skeleton className="h-4 w-56" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="p-4 rounded-lg border">
								<div className="flex justify-between items-start mb-2">
									<div>
										<Skeleton className="h-5 w-32 mb-1" />
										<Skeleton className="h-4 w-20" />
									</div>
									{i === 0 && <Skeleton className="h-5 w-20 rounded-full" />}
								</div>
								<Skeleton className="h-6 w-24" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Compras Recentes */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<Skeleton className="h-5 w-5" />
								<Skeleton className="h-6 w-32" />
							</div>
							<Skeleton className="h-4 w-48" />
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-20" />
							<div className="flex gap-1">
								<Skeleton className="h-8 w-8 rounded" />
								<Skeleton className="h-8 w-8 rounded" />
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-3 border rounded-lg">
								<div className="flex items-center gap-3">
									<Skeleton className="h-4 w-4 rounded" />
									<div>
										<Skeleton className="h-4 w-24 mb-1" />
										<Skeleton className="h-3 w-32" />
									</div>
								</div>
								<div className="text-right">
									<Skeleton className="h-4 w-16 mb-1" />
									<Skeleton className="h-3 w-12" />
								</div>
							</div>
						))}
					</div>
					
					{/* Botão Adicionar à Lista */}
					<div className="mt-4 pt-4 border-t">
						<Skeleton className="h-10 w-full rounded" />
					</div>
				</CardContent>
			</Card>

			{/* Informações Nutricionais Completas */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-56" />
					</div>
					<Skeleton className="h-4 w-48 mt-2" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Tabs */}
						<div className="flex gap-2 border-b">
							<Skeleton className="h-10 w-24 rounded-md" />
							<Skeleton className="h-10 w-24 rounded-md" />
							<Skeleton className="h-10 w-32 rounded-md" />
						</div>

						{/* Conteúdo Nutricional */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className="p-4 border rounded-xl">
									<Skeleton className="h-4 w-16 mb-2" />
									<Skeleton className="h-8 w-20 mb-1" />
									<Skeleton className="h-3 w-12" />
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Análise Nutricional do Zé (AI) - apenas para alimentos */}
			<div className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 rounded-lg">
				<CardContent className="relative p-6">
					<div className="flex items-start gap-4">
						<Skeleton className="h-12 w-12 rounded-xl" />
						<div className="flex-1 space-y-3">
							<div className="flex items-center justify-between gap-2">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-6 w-12 rounded-full" />
							</div>
							<Skeleton className="h-4 w-64" />
							<div className="space-y-2 mt-4">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
								<Skeleton className="h-4 w-5/6" />
							</div>
						</div>
					</div>
				</CardContent>
			</div>

			{/* Informações sobre Alérgenos */}
			<Card className="border-2 overflow-hidden">
				<CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-b">
					<div className="flex items-center gap-2.5">
						<Skeleton className="h-9 w-9 rounded-lg" />
						<Skeleton className="h-6 w-48" />
					</div>
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent className="pt-6">
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{Array.from({ length: 8 }).map((_, i) => (
								<Skeleton key={i} className="h-8 w-20 rounded-full" />
							))}
						</div>
						<div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
							<Skeleton className="h-4 w-full mb-2" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
