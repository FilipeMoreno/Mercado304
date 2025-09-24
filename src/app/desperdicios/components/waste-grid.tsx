"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

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

interface WasteGridProps {
	records: WasteRecord[]
	isLoading: boolean
	pageSize: number
	onViewDetails: (record: WasteRecord) => void
	onEdit: (record: WasteRecord) => void
	onDelete: (record: WasteRecord) => void
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

export function WasteGrid({ records, isLoading, pageSize, onViewDetails, onEdit, onDelete }: WasteGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: pageSize }).map((_, i) => (
					<Card key={`waste-skeleton-${i}`}>
						<CardContent className="p-4">
							<div className="space-y-3">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-3 w-2/3" />
								<div className="flex gap-2">
									<Skeleton className="h-5 w-16" />
									<Skeleton className="h-5 w-12" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (records.length === 0) {
		return (
			<Card>
				<CardContent className="p-12 text-center">
					<div className="text-gray-400 mb-4">
						<svg
							className="mx-auto h-12 w-12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-label="Ícone de lixeira vazia"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium mb-2 text-gray-600">Nenhum desperdício registrado</h3>
					<p className="text-gray-500">Comece registrando seus primeiros desperdícios para acompanhar as perdas.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{records.map((record: WasteRecord) => (
				<Card key={record.id} className="hover:shadow-md transition-shadow">
					<CardContent className="p-4">
						<div className="space-y-3">
							<div className="flex items-start justify-between">
								<h3 className="font-semibold text-base text-gray-900 line-clamp-2">{record.productName}</h3>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => onViewDetails(record)}>
											<Eye className="mr-2 h-4 w-4" />
											Ver Detalhes
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onEdit(record)}>
											<Edit className="mr-2 h-4 w-4" />
											Editar
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600">
											<Trash2 className="mr-2 h-4 w-4" />
											Remover
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-600">Quantidade:</span>
									<span className="font-medium">
										{record.quantity} {record.unit}
									</span>
								</div>

								{record.totalValue && (
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Valor:</span>
										<span className="font-medium text-red-600">R$ {record.totalValue.toFixed(2)}</span>
									</div>
								)}

								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-600">Data:</span>
									<span className="font-medium">
										{format(new Date(record.wasteDate), "dd/MM/yyyy", { locale: ptBR })}
									</span>
								</div>

								{record.location && (
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Local:</span>
										<span className="font-medium">📍 {record.location}</span>
									</div>
								)}
							</div>

							<div className="flex items-center gap-2 flex-wrap">
								<Badge
									variant={
										wasteReasonColors[record.wasteReason as keyof typeof wasteReasonColors] as
											| "default"
											| "secondary"
											| "destructive"
											| "outline"
									}
									className="text-xs"
								>
									{wasteReasonLabels[record.wasteReason as keyof typeof wasteReasonLabels]}
								</Badge>
								{record.category && (
									<Badge variant="outline" className="text-xs">
										{record.category}
									</Badge>
								)}
								{record.brand && (
									<Badge variant="outline" className="text-xs">
										{record.brand}
									</Badge>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
