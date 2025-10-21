"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Edit, Eye, MoreHorizontal, Package, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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
	hasFilters?: boolean
	onCreateNew?: () => void
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

export function WasteGrid({
	records,
	isLoading,
	pageSize,
	onViewDetails,
	onEdit,
	onDelete,
	hasFilters,
	onCreateNew,
}: WasteGridProps) {
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
		// Empty state diferente quando há filtros aplicados
		if (hasFilters) {
			return (
				<Card className="border-dashed">
					<CardContent className="py-16">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Search className="size-12" />
								</EmptyMedia>
								<EmptyTitle>Nenhum desperdício encontrado</EmptyTitle>
								<EmptyDescription>
									Não há registros de desperdício que correspondam aos filtros aplicados.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<p className="text-sm text-muted-foreground mb-4">
									Tente ajustar os filtros de busca ou motivo para encontrar registros.
								</p>
							</EmptyContent>
						</Empty>
					</CardContent>
				</Card>
			)
		}

		// Empty state quando não há nenhum registro
		return (
			<Card className="border-dashed">
				<CardContent className="py-16">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Trash2 className="size-12" />
							</EmptyMedia>
							<EmptyTitle>Nenhum desperdício registrado</EmptyTitle>
							<EmptyDescription>Ótimas notícias! Você ainda não registrou nenhum desperdício.</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<div className="space-y-4">
								<p className="text-sm text-muted-foreground max-w-md mx-auto">
									O controle de desperdícios ajuda você a identificar padrões de perda e reduzir custos. Registre
									desperdícios quando ocorrerem para acompanhar e melhorar.
								</p>
								<div className="flex flex-col sm:flex-row gap-3 justify-center">
									{onCreateNew && (
										<Button onClick={onCreateNew} size="lg">
											<Plus className="size-4 mr-2" />
											Registrar Primeiro Desperdício
										</Button>
									)}
									<Link href="/estoque">
										<Button variant="outline" size="lg">
											<Package className="size-4 mr-2" />
											Ir para Estoque
										</Button>
									</Link>
								</div>
								<div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
									<h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
										💡 Dica: Quando registrar desperdícios?
									</h4>
									<ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
										<li>• Produtos vencidos ou estragados</li>
										<li>• Itens danificados durante o armazenamento</li>
										<li>• Sobras de receitas que foram descartadas</li>
										<li>• Produtos esquecidos que não puderam ser aproveitados</li>
									</ul>
								</div>
							</div>
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{records.map((record: WasteRecord) => (
				<Card key={record.id} className="hover:shadow-md transition-shadow-sm">
					<CardContent className="p-4">
						<div className="space-y-3">
							<div className="flex items-start justify-between">
								<h3 className="font-semibold text-base text-gray-900 line-clamp-2">{record.productName}</h3>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="size-8 p-0">
											<MoreHorizontal className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => onViewDetails(record)}>
											<Eye className="mr-2 size-4" />
											Ver Detalhes
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onEdit(record)}>
											<Edit className="mr-2 size-4" />
											Editar
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600">
											<Trash2 className="mr-2 size-4" />
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
