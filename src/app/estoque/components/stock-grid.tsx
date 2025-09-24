"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, Edit, Eye, MoreHorizontal, Package, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface StockItem {
	id: string
	productId: string
	product: {
		id: string
		name: string
		unit: string
		brand?: { name: string }
		category?: { name: string }
	}
	quantity: number
	location: string
	expirationDate?: string
	batchNumber?: string
	unitCost?: number
	totalValue?: number
	notes?: string
}

interface StockGridProps {
	items: StockItem[]
	isLoading: boolean
	onView: (item: StockItem) => void
	onEdit: (item: StockItem) => void
	onDelete: (item: StockItem) => void
	onUse: (item: StockItem) => void
	onWaste: (item: StockItem) => void
}

export function StockGrid({ items, isLoading, onView, onEdit, onDelete, onUse, onWaste }: StockGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<Card key={`stock-skeleton-${i}`} className="p-4">
						<div className="space-y-3">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
							<Skeleton className="h-3 w-2/3" />
							<div className="flex gap-2">
								<Skeleton className="h-5 w-16" />
								<Skeleton className="h-5 w-12" />
							</div>
						</div>
					</Card>
				))}
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<Card>
				<CardContent className="p-12 text-center">
					<div className="text-gray-400 mb-4">
						<svg
							className="mx-auto h-12 w-12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-label="Ícone de estoque vazio"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium mb-2 text-gray-600">Nenhum item em estoque</h3>
					<p className="text-gray-500">Comece adicionando produtos ao seu estoque.</p>
				</CardContent>
			</Card>
		)
	}

	const getExpirationStatus = (expirationDate?: string) => {
		if (!expirationDate) return null

		const today = new Date()
		const expDate = new Date(expirationDate)
		const diffTime = expDate.getTime() - today.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays < 0) return { status: "expired", label: "Vencido", color: "destructive" }
		if (diffDays <= 7) return { status: "expiring", label: "Vencendo", color: "secondary" }
		return null
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{items.map((item) => {
				const expirationStatus = getExpirationStatus(item.expirationDate)

				return (
					<Card key={item.id} className="hover:shadow-md transition-shadow">
						<CardContent className="p-4">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-start gap-4">
										<div className="flex-1">
											<h3 className="font-semibold text-lg text-gray-900">{item.product.name}</h3>
											<div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
												<span>
													{item.quantity} {item.product.unit}
												</span>
												{item.totalValue && (
													<span className="font-medium text-green-600">R$ {item.totalValue.toFixed(2)}</span>
												)}
												<span>📍 {item.location}</span>
											</div>
											{item.expirationDate && (
												<div className="flex items-center gap-2 mt-2">
													<span className="text-sm text-gray-600">
														{format(new Date(item.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
													</span>
													{expirationStatus && (
														<Badge variant={expirationStatus.color as any} className="text-xs">
															{expirationStatus.label}
														</Badge>
													)}
												</div>
											)}
											<div className="flex items-center gap-2 mt-2">
												{item.product.category && (
													<Badge variant="outline" className="text-xs">
														{item.product.category.name}
													</Badge>
												)}
												{item.product.brand && (
													<Badge variant="outline" className="text-xs">
														{item.product.brand.name}
													</Badge>
												)}
											</div>
										</div>
									</div>
								</div>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => onView(item)}>
											<Eye className="mr-2 h-4 w-4" />
											Ver detalhes
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onEdit(item)}>
											<Edit className="mr-2 h-4 w-4" />
											Editar
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onUse(item)}>
											<Package className="mr-2 h-4 w-4" />
											Usar produto
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onWaste(item)}>
											<AlertTriangle className="mr-2 h-4 w-4" />
											Registrar desperdício
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
											<Trash2 className="mr-2 h-4 w-4" />
											Remover
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
