"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	Archive,
	Calculator,
	CheckCircle2,
	Clock,
	Copy,
	Edit,
	Eye,
	FileText,
	Filter,
	Grid3X3,
	ListChecks,
	MoreVertical,
	Plus,
	Search,
	ShoppingCart,
	Store,
	Trash2,
	TrendingDown,
	XCircle,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { QuotesSkeleton } from "@/components/skeletons/quotes-skeleton"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDeleteQuoteMutation, useMarketsQuery, useQuotesQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"
import type { Quote, QuoteStatus, QuoteType } from "@/types"

const statusConfig: Record<
	QuoteStatus,
	{ label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
	DRAFT: { label: "Rascunho", icon: FileText, variant: "secondary" },
	FINALIZED: { label: "Finalizado", icon: CheckCircle2, variant: "default" },
	APPROVED: { label: "Aprovado", icon: CheckCircle2, variant: "default" },
	CONVERTED: { label: "Convertido", icon: ShoppingCart, variant: "outline" },
	EXPIRED: { label: "Expirado", icon: Clock, variant: "destructive" },
	CANCELLED: { label: "Cancelado", icon: XCircle, variant: "destructive" },
}

const typeConfig: Record<QuoteType, { label: string; icon: React.ElementType; color: string }> = {
	BY_ITEMS: { label: "Por Itens", icon: ListChecks, color: "text-blue-600" },
	BY_CATEGORY: { label: "Por Categoria", icon: Grid3X3, color: "text-purple-600" },
	BY_MARKET: { label: "Por Mercado", icon: Store, color: "text-green-600" },
}

export default function QuotesPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [search, setSearch] = useState(searchParams.get("search") || "")
	const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "ALL")
	const [marketFilter, setMarketFilter] = useState<string>(searchParams.get("marketId") || "ALL")
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [QuoteToDelete, setQuoteToDelete] = useState<string | null>(null)

	// Construir params para a query
	const queryParams = useMemo(() => {
		const params = new URLSearchParams()
		if (search) params.set("search", search)
		if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
		if (marketFilter && marketFilter !== "ALL") params.set("marketId", marketFilter)
		params.set("sortBy", "quoteDate")
		params.set("sortOrder", "desc")
		return params
	}, [search, statusFilter, marketFilter])

	const { data, isLoading, error } = useQuotesQuery(queryParams)
	const { data: marketsData } = useMarketsQuery()
	const deleteMutation = useDeleteQuoteMutation()

	const Quotes = data?.Quotes || []
	const markets = marketsData?.markets || []

	const handleDelete = async () => {
		if (!QuoteToDelete) return
		await deleteMutation.mutateAsync(QuoteToDelete)
		setDeleteDialogOpen(false)
		setQuoteToDelete(null)
	}

	const openDeleteDialog = (id: string) => {
		setQuoteToDelete(id)
		setDeleteDialogOpen(true)
	}

	if (isLoading) return <QuotesSkeleton />

	if (error) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="text-center space-y-2">
							<XCircle className="mx-auto h-12 w-12 text-destructive" />
							<h3 className="text-lg font-semibold">Erro ao carregar cotações</h3>
							<p className="text-sm text-muted-foreground">{(error as Error).message}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Cotações</h1>
					<p className="text-muted-foreground">Gerencie suas cotações e compare preços entre mercados</p>
				</div>
				<Button onClick={() => router.push("/cotacoes/novo")}>
					<Plus className="mr-2 h-4 w-4" />
					Nova Cotação
				</Button>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Filter className="h-5 w-5" />
						Filtros
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar cotação..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">Todos os Status</SelectItem>
								<SelectItem value="DRAFT">Rascunho</SelectItem>
								<SelectItem value="FINALIZED">Finalizado</SelectItem>
								<SelectItem value="APPROVED">Aprovado</SelectItem>
								<SelectItem value="CONVERTED">Convertido</SelectItem>
								<SelectItem value="EXPIRED">Expirado</SelectItem>
								<SelectItem value="CANCELLED">Cancelado</SelectItem>
							</SelectContent>
						</Select>
						<Select value={marketFilter} onValueChange={setMarketFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Mercado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">Todos os Mercados</SelectItem>
								{markets.map((market) => (
									<SelectItem key={market.id} value={market.id}>
										{market.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Quote List */}
			{Quotes.length === 0 ? (
				<Card>
					<CardContent className="py-12">
						<div className="text-center space-y-3">
							<Archive className="mx-auto h-16 w-16 text-muted-foreground" />
							<h3 className="text-lg font-semibold">Nenhuma cotação encontrada</h3>
							<p className="text-sm text-muted-foreground">
								{search || statusFilter !== "ALL" || marketFilter !== "ALL"
									? "Tente ajustar os filtros"
									: "Crie seu primeiro orçamento para começar"}
							</p>
							{!search && statusFilter === "ALL" && marketFilter === "ALL" && (
								<Button onClick={() => router.push("/cotacoes/novo")} className="mt-4">
									<Plus className="mr-2 h-4 w-4" />
									Criar Orçamento
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Quotes.map((Quote: Quote) => {
						const statusInfo = statusConfig[Quote.status]
						const StatusIcon = statusInfo.icon
						const typeInfo = typeConfig[Quote.type]
						const TypeIcon = typeInfo.icon
						const isExpired = Quote.validUntil && new Date(Quote.validUntil) < new Date()

						return (
							<Card key={Quote.id} className="hover:shadow-md transition-shadow">
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="space-y-1 flex-1">
											<CardTitle className="text-lg">{Quote.name}</CardTitle>
											{Quote.description && (
												<CardDescription className="line-clamp-2">{Quote.description}</CardDescription>
											)}
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => router.push(`/cotacoes/${Quote.id}`)}>
													<Eye className="mr-2 h-4 w-4" />
													Visualizar
												</DropdownMenuItem>
												{Quote.status !== "CONVERTED" && (
													<>
														<DropdownMenuItem onClick={() => router.push(`/cotacoes/${Quote.id}/editar`)}>
															<Edit className="mr-2 h-4 w-4" />
															Editar
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => router.push(`/cotacoes/${Quote.id}/duplicar`)}>
															<Copy className="mr-2 h-4 w-4" />
															Duplicar
														</DropdownMenuItem>
													</>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive"
													disabled={Quote.status === "CONVERTED"}
													onClick={() => openDeleteDialog(Quote.id)}
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Excluir
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
									<div className="flex items-center gap-2 pt-2 flex-wrap">
										<Badge variant={isExpired ? "destructive" : statusInfo.variant}>
											<StatusIcon className="mr-1 h-3 w-3" />
											{isExpired ? "Expirado" : statusInfo.label}
										</Badge>
										<Badge variant="outline" className={typeInfo.color}>
											<TypeIcon className="mr-1 h-3 w-3" />
											{typeInfo.label}
										</Badge>
										{Quote.category && (
											<Badge variant="outline" className="text-xs">
												{Quote.category.name}
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<div className="text-sm text-muted-foreground">Valor Total</div>
										<div className="text-2xl font-bold">{formatCurrency(Quote.finalEstimated)}</div>
										{Quote.totalDiscount > 0 && (
											<div className="flex items-center gap-1 text-sm text-green-600">
												<TrendingDown className="h-3 w-3" />
												{formatCurrency(Quote.totalDiscount)} de desconto
											</div>
										)}
									</div>
									<div className="space-y-1 text-sm">
										{Quote.market && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Mercado:</span>
												<span className="font-medium">{Quote.market.name}</span>
											</div>
										)}
										<div className="flex justify-between">
											<span className="text-muted-foreground">Itens:</span>
											<span className="font-medium">{Quote._count?.items || 0}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Data:</span>
											<span className="font-medium">
												{format(new Date(Quote.quoteDate), "dd/MM/yyyy", { locale: ptBR })}
											</span>
										</div>
										{Quote.validUntil && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Válido até:</span>
												<span className="font-medium">
													{format(new Date(Quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}
												</span>
											</div>
										)}
									</div>
									<div className="flex items-center justify-between pt-2 border-t">
										<Button variant="outline" size="sm" onClick={() => router.push(`/cotacoes/${Quote.id}`)}>
											Ver Detalhes
										</Button>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>
			)}

			{/* Delete Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir esta cotação? Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Floating Action Button */}
			<FloatingActionButton
				icon={Calculator}
				label="Nova Cotação"
				onClick={() => router.push("/cotacoes/novo")}
			/>
		</div>
	)
}
