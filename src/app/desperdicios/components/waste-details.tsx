"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WasteRecord {
	id: string
	productName: string
	quantity: number
	unit: string
	wasteReason: string
	wasteDate: string
	expirationDate?: string
	location?: string
	unitCost?: number
	totalValue?: number
	notes?: string
	category?: string
	brand?: string
	batchNumber?: string
}

interface WasteDetailsProps {
	record: WasteRecord
}

const wasteReasonLabels = {
	EXPIRED: "Vencido",
	DAMAGED: "Danificado",
	OVERSTOCK: "Excesso de Estoque",
	QUALITY: "Problema de Qualidade",
	POWER_OUTAGE: "Falta de Energia",
	FORGOTTEN: "Esquecido",
	OTHER: "Outro",
}

const wasteReasonColors = {
	EXPIRED: "destructive",
	DAMAGED: "destructive",
	OVERSTOCK: "secondary",
	QUALITY: "secondary",
	POWER_OUTAGE: "default",
	FORGOTTEN: "default",
	OTHER: "secondary",
}

export function WasteDetails({ record }: WasteDetailsProps) {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h4 className="font-medium text-gray-900 mb-2">Informações do Produto</h4>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">Nome:</span>
							<span className="font-medium">{record.productName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Quantidade:</span>
							<span className="font-medium">{record.quantity} {record.unit}</span>
						</div>
						{record.category && (
							<div className="flex justify-between">
								<span className="text-gray-600">Categoria:</span>
								<span className="font-medium">{record.category}</span>
							</div>
						)}
						{record.brand && (
							<div className="flex justify-between">
								<span className="text-gray-600">Marca:</span>
								<span className="font-medium">{record.brand}</span>
							</div>
						)}
						{record.batchNumber && (
							<div className="flex justify-between">
								<span className="text-gray-600">Lote:</span>
								<span className="font-medium">{record.batchNumber}</span>
							</div>
						)}
					</div>
				</div>

				<div>
					<h4 className="font-medium text-gray-900 mb-2">Detalhes do Desperdício</h4>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">Data:</span>
							<span className="font-medium">
								{format(new Date(record.wasteDate), "dd/MM/yyyy", { locale: ptBR })}
							</span>
						</div>
						{record.expirationDate && (
							<div className="flex justify-between">
								<span className="text-gray-600">Validade:</span>
								<span className="font-medium">
									{format(new Date(record.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
								</span>
							</div>
						)}
						<div className="flex justify-between">
							<span className="text-gray-600">Motivo:</span>
							<Badge
								variant={
									wasteReasonColors[record.wasteReason as keyof typeof wasteReasonColors] as
										| "default"
										| "secondary"
										| "destructive"
										| "outline"
								}
							>
								{wasteReasonLabels[record.wasteReason as keyof typeof wasteReasonLabels]}
							</Badge>
						</div>
						{record.location && (
							<div className="flex justify-between">
								<span className="text-gray-600">Local:</span>
								<span className="font-medium">📍 {record.location}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{(record.totalValue || record.unitCost) && (
				<Card>
					<CardHeader>
						<CardTitle>Informações Financeiras</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 text-sm">
							{record.unitCost && (
								<div className="flex justify-between">
									<span className="text-gray-600">Custo Unitário:</span>
									<span className="font-medium">R$ {record.unitCost.toFixed(2)}</span>
								</div>
							)}
							{record.totalValue && (
								<div className="flex justify-between">
									<span className="text-gray-600">Valor Total:</span>
									<span className="font-medium text-red-600">R$ {record.totalValue.toFixed(2)}</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{record.notes && (
				<Card>
					<CardHeader>
						<CardTitle>Observações</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-700">{record.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
