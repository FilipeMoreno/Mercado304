"use client"

import { Button } from "@/components/ui/button"

interface StockPaginationProps {
	totalPages: number
	currentPage: number
	onPageChange: (page: number) => void
}

export function StockPagination({ totalPages, currentPage, onPageChange }: StockPaginationProps) {
	if (totalPages <= 1) {
		return null
	}

	const pagesToShow = Math.min(5, totalPages)
	const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2))
	const endPage = Math.min(totalPages, startPage + pagesToShow - 1)

	const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

	return (
		<div className="flex items-center justify-center gap-2 mt-6">
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
			>
				Anterior
			</Button>

			<div className="flex items-center gap-1">
				{pageNumbers.map((page) => (
					<Button
						key={page}
						variant={currentPage === page ? "default" : "outline"}
						size="sm"
						onClick={() => onPageChange(page)}
						className="size-8 p-0"
					>
						{page}
					</Button>
				))}
			</div>

			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
			>
				Próximo
			</Button>
		</div>
	)
}
