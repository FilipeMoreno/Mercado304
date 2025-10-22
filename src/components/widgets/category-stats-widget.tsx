"use client"

import { motion } from "framer-motion"
import { Package } from "lucide-react"
import { DashboardStatsCardMemo } from "@/components/memoized"
import type { CategoryStats } from "@/types"

interface CategoryStatsWidgetProps {
	categoryStats?: CategoryStats[]
	totalSpent?: number
}

export function CategoryStatsWidget({ categoryStats, totalSpent }: CategoryStatsWidgetProps) {
	if (!categoryStats || categoryStats.length === 0) return null

	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
			<DashboardStatsCardMemo
				title="Gastos por Categoria"
				description="Distribuição de gastos por categoria de produtos"
				icon={<Package className="size-5" />}
			>
				<div className="space-y-3">
					{categoryStats.slice(0, 8).map((category: CategoryStats, index: number) => {
						const percentage = totalSpent && totalSpent > 0 ? (category.totalSpent / totalSpent) * 100 : 0
						return (
							<motion.div
								key={category.categoryId}
								className="flex items-center justify-between"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.7 + index * 0.05 }}
							>
								<div className="flex items-center gap-3">
									<div className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
										{index + 1}
									</div>
									<div>
										<div className="font-medium">{category.categoryName}</div>
										<div className="text-sm text-muted-foreground">
											{category.totalQuantity.toFixed(1)} itens • {category.totalPurchases} compras
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="font-medium">R$ {category.totalSpent.toFixed(2)}</div>
									<div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
								</div>
							</motion.div>
						)
					})}
				</div>
			</DashboardStatsCardMemo>
		</motion.div>
	)
}