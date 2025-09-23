"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import React from "react"
import { Button } from "@/components/ui/button"

interface ProductPaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

export function ProductPagination({ currentPage, totalPages, onPageChange }: ProductPaginationProps) {
	if (totalPages <= 1) return null

	return (
		<div className="flex justify-center items-center gap-2 pt-6">
			<Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
				<ChevronLeft className="h-4 w-4" />
				Anterior
			</Button>

			<div className="flex gap-1">
				{Array.from({ length: totalPages }, (_, i) => i + 1)
					.filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
					.map((page, index, array) => (
						<React.Fragment key={page}>
							{index > 0 && array[index - 1] !== page - 1 && <span className="px-2 py-1 text-gray-400">...</span>}
							<Button
								variant={currentPage === page ? "default" : "outline"}
								size="sm"
								onClick={() => onPageChange(page)}
								className="w-8 h-8 p-0"
							>
								{page}
							</Button>
						</React.Fragment>
					))}
			</div>

			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
			>
				Próxima
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	)
}
