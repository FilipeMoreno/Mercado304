"use client"

import { cn } from "@/lib/utils"

interface DetailedComparison {
	listId: string
	listName: string
	markets: {
		id: string
		name: string
		location?: string
	}[]
	products: {
		product: {
			id: string
			name: string
			brand?: { name: string }
			unit: string
		}
		comparison: {
			marketId: string
			price: number | null
			lastPurchase: string | null
			isCheapest: boolean
			saving: number
		}[]
	}[]
}

interface DetailedComparisonTableProps {
	detailedComparison: DetailedComparison
}

export function DetailedComparisonTable({ detailedComparison }: DetailedComparisonTableProps) {
	return (
		<div className="overflow-x-auto">
			{/* Desktop Table */}
			<div className="hidden lg:block">
				<table className="w-full text-left">
					<thead>
						<tr className="border-b">
							<th className="w-64 p-3 text-sm font-medium">Produto</th>
							{detailedComparison.markets.map((market) => (
								<th key={market.id} className="p-3 text-sm font-medium">
									<div className="flex flex-col">
										<span className="font-semibold">{market.name}</span>
										{market.location && (
											<span className="text-xs text-gray-500 font-normal">{market.location}</span>
										)}
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{detailedComparison.products.map((productItem) => (
							<tr key={productItem.product?.id} className="border-b last:border-b-0">
								<td className="p-3 text-sm font-medium">
									<div className="flex flex-col">
										<span className="font-semibold">{productItem.product?.name}</span>
										{productItem.product?.brand && (
											<span className="text-xs text-gray-500">{productItem.product.brand.name}</span>
										)}
									</div>
								</td>
								{productItem.comparison.map((comp) => (
									<td key={comp.marketId} className="p-3">
										{comp.price !== null ? (
											<div className="flex flex-col">
												<span
													className={cn(
														"font-semibold",
														comp.isCheapest ? "text-green-600" : "text-foreground",
													)}
												>
													R$ {comp.price.toFixed(2)}
												</span>
												{comp.saving > 0 && (
													<span className="text-xs text-red-500">
														(Economia: R$ {comp.saving.toFixed(2)})
													</span>
												)}
											</div>
										) : (
											<span className="text-sm text-gray-500">Não encontrado</span>
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Cards */}
			<div className="lg:hidden space-y-4">
				{detailedComparison.products.map((productItem) => (
					<div key={productItem.product?.id} className="border rounded-lg p-4 bg-white">
						<div className="mb-3">
							<h3 className="font-semibold text-sm">{productItem.product?.name}</h3>
							{productItem.product?.brand && (
								<p className="text-xs text-gray-500">{productItem.product.brand.name}</p>
							)}
						</div>
						
						<div className="space-y-2">
							{productItem.comparison.map((comp) => {
								const market = detailedComparison.markets.find(m => m.id === comp.marketId)
								return (
									<div key={comp.marketId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate">{market?.name}</div>
											{market?.location && (
												<div className="text-xs text-gray-500 truncate">{market.location}</div>
											)}
										</div>
										<div className="text-right flex-shrink-0 ml-2">
											{comp.price !== null ? (
												<div className="flex flex-col">
													<span
														className={cn(
															"font-semibold text-sm",
															comp.isCheapest ? "text-green-600" : "text-foreground",
														)}
													>
														R$ {comp.price.toFixed(2)}
													</span>
													{comp.saving > 0 && (
														<span className="text-xs text-red-500">
															(Economia: R$ {comp.saving.toFixed(2)})
														</span>
													)}
												</div>
											) : (
												<span className="text-sm text-gray-500">Não encontrado</span>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
