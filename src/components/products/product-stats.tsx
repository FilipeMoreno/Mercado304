"use client"

import { motion } from "framer-motion"

interface ProductStatsProps {
	currentCount: number
	totalCount: number
	currentPage: number
	totalPages: number
}

export function ProductStats({ currentCount, totalCount, currentPage, totalPages }: ProductStatsProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="flex justify-between items-center text-sm text-gray-600"
		>
			<span>
				Mostrando {currentCount} de {totalCount} produtos
			</span>
			<span>
				Página {currentPage} de {totalPages}
			</span>
		</motion.div>
	)
}
