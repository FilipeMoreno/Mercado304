"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	Edit,
	FileText,
	MapPin,
	ShoppingCart,
	TrendingDown,
	XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useConvertQuoteToPurchaseMutation, useQuoteQuery, useUpdateQuoteMutation } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"
import type { QuoteStatus } from "@/types"

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

export default function BudgetDetailPage({ params }: { params: { id: string } }) {
	const router = useRouter()
	const { data: quote, isLoading, error } = useQuoteQuery(params.id)
	const convertMutation = useConvertQuoteToPurchaseMutation()
	const updateMutation = useUpdateQuoteMutation()

	const handleConvert = async () => {
		await convertMutation.mutateAsync({ id: params.id })
		router.push("/compras")
	}

	const handleFinalize = async () => {
		await updateMutation.mutateAsync({
			id: params.id,
			data: { status: "FINALIZED" },
		})
	}

	if (isLoading) return <QuotesSkeleton />

	if (error || !quote) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="text-center space-y-2">
							<XCircle className="mx-auto h-12 w-12 text-destructive" />
							<h3 className="text-lg font-semibold">Orçamento não encontrado</h3>
							<p className="text-sm text-muted-foreground">
								{error ? (error as Error).message : "O orçamento solicitado não existe"}
							</p>
							<Button onClick={() => router.push("/orcamentos")} className="mt-4">
								Voltar para Orçamentos
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	const statusInfo = statusConfig[quote.status as QuoteStatus]
	const StatusIcon = statusInfo.icon
	const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date()
	const canConvert = quote.status !== "CONVERTED" && quote.marketId && quote.items && quote.items.length > 0

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<Button variant="ghost" size="sm" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<h1 className="text-3xl font-bold">{quote.name}</h1>
					{quote.description && <p className="text-muted-foreground">{quote.description}</p>}
					<div className="flex items-center gap-2">
						<Badge variant={isExpired ? "destructive" : statusInfo.variant}>
							<StatusIcon className="mr-1 h-3 w-3" />
							{isExpired ? "Expirado" : statusInfo.label}
						</Badge>
					</div>
				</div>
				<div className="flex gap-2">
					{quote.status !== "CONVERTED" && (
						<Button variant="outline" onClick={() => router.push(`/orcamentos/${quote.id}/editar`)}>
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Button>
					)}
					{quote.status === "DRAFT" && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="secondary">
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Finalizar Orçamento
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Finalizar Orçamento</AlertDialogTitle>
									<AlertDialogDescription>
										Tem certeza que deseja finalizar este orçamento? Orçamentos finalizados podem ser convertidos em
										compras.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction onClick={handleFinalize}>Finalizar</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
					{canConvert && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button>
									<ShoppingCart className="mr-2 h-4 w-4" />
									Converter em Compra
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Converter Orçamento em Compra</AlertDialogTitle>
									<AlertDialogDescription>
										Tem certeza que deseja converter este orçamento em uma compra real? Esta ação não pode ser desfeita
										e o orçamento ficará marcado como convertido.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction onClick={handleConvert}>Confirmar Conversão</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(quote.finalEstimated)}</div>
						{quote.totalDiscount > 0 && (
							<div className="flex items-center gap-1 text-sm text-green-600 mt-1">
								<TrendingDown className="h-3 w-3" />
								{formatCurrency(quote.totalDiscount)} de desconto
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">Informações</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						{quote.market && (
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>{quote.market.name}</span>
							</div>
						)}
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>{format(new Date(quote.quoteDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
						</div>
						{quote.validUntil && (
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span>Válido até {format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</span>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">Estatísticas</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total de Itens:</span>
							<span className="font-medium">{quote.items?.length || 0}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Valor Antes do Desconto:</span>
							<span className="font-medium">{formatCurrency(quote.totalEstimated)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Desconto Total:</span>
							<span className="font-medium text-green-600">{formatCurrency(quote.totalDiscount)}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Items Table */}
			<Card>
				<CardHeader>
					<CardTitle>Itens do Orçamento</CardTitle>
					<CardDescription>Lista completa de produtos incluídos neste orçamento</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produto</TableHead>
								<TableHead className="text-right">Qtd</TableHead>
								<TableHead className="text-right">Preço Unit.</TableHead>
								<TableHead className="text-right">Desconto</TableHead>
								<TableHead className="text-right">Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{quote.items && quote.items.length > 0 ? (
								quote.items.map((item: any) => (
									<TableRow key={item.id}>
										<TableCell>
											<div>
												<div className="font-medium">{item.productName}</div>
												{item.brandName && <div className="text-sm text-muted-foreground">{item.brandName}</div>}
												{item.productCategory && (
													<Badge variant="outline" className="text-xs mt-1">
														{item.productCategory}
													</Badge>
												)}
												{item.notes && <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>}
											</div>
										</TableCell>
										<TableCell className="text-right">
											{item.quantity} {item.productUnit}
										</TableCell>
										<TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
										<TableCell className="text-right">
											{item.unitDiscount > 0 ? (
												<span className="text-green-600">{formatCurrency(item.totalDiscount)}</span>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell className="text-right font-medium">{formatCurrency(item.finalPrice)}</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-muted-foreground">
										Nenhum item adicionado
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>

					{quote.items && quote.items.length > 0 && (
						<>
							<Separator className="my-4" />
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Subtotal:</span>
									<span>{formatCurrency(quote.totalEstimated)}</span>
								</div>
								{quote.totalDiscount > 0 && (
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Desconto:</span>
										<span className="text-green-600">-{formatCurrency(quote.totalDiscount)}</span>
									</div>
								)}
								<Separator />
								<div className="flex justify-between text-lg font-bold">
									<span>Total:</span>
									<span>{formatCurrency(quote.finalEstimated)}</span>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Notes */}
			{quote.notes && (
				<Card>
					<CardHeader>
						<CardTitle>Observações</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
