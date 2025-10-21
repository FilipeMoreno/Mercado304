"use client"

import { Button } from "@/components/ui/button"

interface WastePaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

export function WastePagination({ currentPage, totalPages, onPageChange }: WastePaginationProps) {
	if (totalPages <= 1) {
		return null
	}

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
				{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
					const page = i + 1
					return (
						<Button
							key={page}
							variant={currentPage === page ? "default" : "outline"}
							size="sm"
							onClick={() => onPageChange(page)}
							className="size-8 p-0"
						>
							{page}
						</Button>
					)
				})}
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
