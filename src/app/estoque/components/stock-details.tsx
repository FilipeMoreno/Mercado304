"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

interface StockDetailsProps {
	item: StockItem
}

export function StockDetails({ item }: StockDetailsProps) {
	const getExpirationStatus = (expirationDate?: string) => {
		if (!expirationDate) return null

		const today = new Date()
		const expDate = new Date(expirationDate)
		const diffTime = expDate.getTime() - today.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays < 0) return { status: "expired", label: "Vencido", color: "destructive" }
		if (diffDays <= 7) return { status: "expiring", label: "Vencendo", color: "secondary" }
		return { status: "valid", label: "Válido", color: "default" }
	}

	const expirationStatus = getExpirationStatus(item.expirationDate)

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h4 className="font-medium text-gray-900 mb-2">Informações do Produto</h4>
					<div className="space-y-2 text-sm">
						<p>
							<span className="font-semibold">Nome:</span> {item.product.name}
						</p>
						<p>
							<span className="font-semibold">Quantidade:</span> {item.quantity} {item.product.unit}
						</p>
						{item.product.category && (
							<p>
								<span className="font-semibold">Categoria:</span> {item.product.category.name}
							</p>
						)}
						{item.product.brand && (
							<p>
								<span className="font-semibold">Marca:</span> {item.product.brand.name}
							</p>
						)}
					</div>
				</div>

				<div>
					<h4 className="font-medium text-gray-900 mb-2">Detalhes do Estoque</h4>
					<div className="space-y-2 text-sm">
						<p>
							<span className="font-semibold">Localização:</span> {item.location}
						</p>
						{item.expirationDate && (
							<p className="flex items-center gap-2">
								<span className="font-semibold">Data de Validade:</span>
								<span>{format(new Date(item.expirationDate), "dd/MM/yyyy", { locale: ptBR })}</span>
								{expirationStatus && (
									<Badge variant={expirationStatus.color as any} className="text-xs">
										{expirationStatus.label}
									</Badge>
								)}
							</p>
						)}
						{item.unitCost && (
							<p>
								<span className="font-semibold">Custo Unitário:</span> R$ {item.unitCost.toFixed(2)}
							</p>
						)}
						{item.totalValue && (
							<p>
								<span className="font-semibold">Valor Total:</span> R$ {item.totalValue.toFixed(2)}
							</p>
						)}
					</div>
				</div>
			</div>

			{item.notes && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Observações</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-700">{item.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
