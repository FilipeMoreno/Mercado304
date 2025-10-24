"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Componente de skeleton para um card de produto individual
function ProductCardSkeleton() {
	return (
		<Card className="h-full flex flex-col">
			<CardContent className="flex-1 flex flex-col p-0">
		{/* Layout horizontal com imagem e informações */}
		<div className="flex h-full p-4">
			{/* Área da imagem */}
			<div className="w-24 h-24 flex-shrink-0">
				<Skeleton className="w-full h-full rounded-lg" />
			</div>

			{/* Área das informações */}
			<div className="flex-1 flex flex-col pl-4">
						{/* Header com título e menu */}
						<div className="flex items-start justify-between mb-3">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-8 w-8 rounded" />
						</div>

						{/* Informações do produto */}
						<div className="flex-1 space-y-2">
							{/* Marca */}
							<div className="flex items-center gap-2">
								<Skeleton className="h-3 w-12" />
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>

							{/* Categoria */}
							<div className="flex items-center gap-2">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-5 w-20 rounded-full" />
							</div>

							{/* Tamanho e Unidade */}
							<div className="flex items-center gap-2">
								<Skeleton className="h-3 w-14" />
								<div className="flex gap-1">
									<Skeleton className="h-5 w-12 rounded-full" />
									<Skeleton className="h-5 w-10 rounded-full" />
								</div>
							</div>

							{/* Código de barras */}
							<div className="flex items-center gap-2">
								<Skeleton className="h-3 w-12" />
								<Skeleton className="h-5 w-24 rounded-full" />
							</div>
						</div>

			</div>
		</div>

		{/* Botão de ação - agora ocupa toda a largura */}
		<div className="px-4 pb-4">
			<Skeleton className="h-9 w-full rounded" />
		</div>
	</CardContent>
</Card>
	)
}

// Componente de skeleton para as estatísticas
function ProductStatsSkeleton() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="flex justify-between items-center text-sm"
		>
			<Skeleton className="h-4 w-48" />
			<Skeleton className="h-4 w-32" />
		</motion.div>
	)
}

// Componente principal do skeleton
export function ProductsListSkeleton() {
	return (
		<motion.div 
			initial={{ opacity: 0 }} 
			animate={{ opacity: 1 }} 
			transition={{ delay: 0.1 }} 
			className="space-y-4"
		>
			{/* Skeleton das estatísticas */}
			<ProductStatsSkeleton />

			{/* Grid de produtos */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => {
					const uniqueKey = `product-skeleton-${i}-${Math.random().toString(36).substr(2, 9)}`
					return (
						<motion.div
							key={uniqueKey}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.05 }}
						>
							<ProductCardSkeleton />
						</motion.div>
					)
				})}
			</div>

			{/* Skeleton da paginação */}
			<div className="flex justify-center items-center gap-2 mt-6">
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-9 w-9 rounded" />
				<Skeleton className="h-9 w-9 rounded" />
			</div>
		</motion.div>
	)
}
