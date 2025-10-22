"use client"

import { Package } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { TopProduct } from "@/types"

interface TopProductsWidgetProps {
	topProducts?: TopProduct[]
}

export function TopProductsWidget({ topProducts }: TopProductsWidgetProps) {
	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle>Produtos Mais Comprados</CardTitle>
				<CardDescription>Top 5 produtos mais frequentes</CardDescription>
			</CardHeader>
			<CardContent>
				{!topProducts || topProducts.length === 0 ? (
					<Empty className="border border-dashed py-8">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Package className="size-6" />
							</EmptyMedia>
							<EmptyTitle>Nenhuma compra registrada ainda</EmptyTitle>
							<EmptyDescription>
								Registre sua primeira compra para ver os produtos mais comprados.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Link href="/compras/nova" className="inline-flex">
								<span className="text-primary hover:text-primary/80">Registre sua primeira compra</span>
							</Link>
						</EmptyContent>
					</Empty>
				) : (
					<div className="space-y-3">
						{topProducts.slice(0, 5).map((product: TopProduct, index: number) => (
							<div key={product.productId || index} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
										{index + 1}
									</div>
									<div>
										<div className="font-medium">{product.productName}</div>
										<div className="text-sm text-muted-foreground">
											{product.totalQuantity?.toFixed(1) || 0} {product.unit || "unidades"}
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="font-medium">R$ {(product.averagePrice || 0).toFixed(2)}</div>
									<div className="text-sm text-muted-foreground">{product.totalPurchases || 0} compras</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}