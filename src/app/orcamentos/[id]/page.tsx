"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { ArrowLeft, Calendar, Edit, Loader2, Trash2, TrendingDown, TrendingUp } from "lucide-react"
import { useBudgetQuery, useDeleteBudgetMutation } from "@/hooks/use-react-query"
import { BudgetProgressBar } from "@/components/budget-progress-bar"
import { BudgetAlert } from "@/components/budget-alert"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

interface BudgetDetailsPageProps {
	params: { id: string }
}

export default function BudgetDetailsPage({ params }: BudgetDetailsPageProps) {
	const { id } = params
	const router = useRouter()
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const { data: budget, isLoading, error } = useBudgetQuery(id)
	const deleteMutation = useDeleteBudgetMutation()

	const handleDelete = async () => {
		await deleteMutation.mutateAsync(id)
		setShowDeleteDialog(false)
		router.push("/orcamentos")
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "CATEGORY":
				return "Categoria"
			case "MARKET":
				return "Mercado"
			case "PRODUCT":
				return "Produto"
			default:
				return type
		}
	}

	if (isLoading) {
		return (
			<div className="container py-8 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		)
	}

	if (error || !budget) {
		return (
			<div className="container py-8">
				<div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
					Erro ao carregar orçamento: {error?.message || "Orçamento não encontrado"}
				</div>
			</div>
		)
	}

	return (
		<div className="container py-8 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold">{budget.name}</h1>
							<Badge>{getTypeLabel(budget.type)}</Badge>
						</div>
						{budget.description && (
							<p className="text-muted-foreground mt-1">{budget.description}</p>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => router.push(`/orcamentos/${id}/editar`)}>
						<Edit className="h-4 w-4 mr-2" />
						Editar
					</Button>
					<Button
						variant="outline"
						className="text-destructive hover:bg-destructive/10"
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Excluir
					</Button>
				</div>
			</div>

			{/* Alert */}
			<BudgetAlert budget={budget} />

			{/* Overview Cards */}
			<div className="grid gap-6 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Gasto</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<p className="text-3xl font-bold">{formatCurrency(budget.spent)}</p>
							<TrendingUp className="h-5 w-5 text-destructive" />
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{budget.percentage.toFixed(1)}% do limite
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Limite</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<p className="text-3xl font-bold">{formatCurrency(budget.limitAmount)}</p>
						</div>
						<p className="text-xs text-muted-foreground mt-1">Limite definido</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{budget.isOverBudget ? "Ultrapassado" : "Disponível"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<p
								className={`text-3xl font-bold ${budget.isOverBudget ? "text-destructive" : "text-green-600"}`}
							>
								{formatCurrency(Math.abs(budget.remaining))}
							</p>
							{budget.isOverBudget ? (
								<TrendingUp className="h-5 w-5 text-destructive" />
							) : (
								<TrendingDown className="h-5 w-5 text-green-600" />
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{budget.isOverBudget ? "Acima do orçamento" : "Ainda disponível"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Progress */}
			<Card>
				<CardHeader>
					<CardTitle>Progresso do Orçamento</CardTitle>
				</CardHeader>
				<CardContent>
					<BudgetProgressBar budget={budget} />
				</CardContent>
			</Card>

			{/* Details */}
			<Card>
				<CardHeader>
					<CardTitle>Detalhes</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Tipo</p>
							<p className="text-lg">{getTypeLabel(budget.type)}</p>
						</div>
						{budget.target && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Alvo</p>
								<p className="text-lg">{budget.target.name}</p>
							</div>
						)}
						<div>
							<p className="text-sm font-medium text-muted-foreground">Período</p>
							<div className="flex items-center gap-2 text-lg">
								<Calendar className="h-4 w-4" />
								<span>
									{format(new Date(budget.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
									{format(new Date(budget.endDate), "dd/MM/yyyy", { locale: ptBR })}
								</span>
							</div>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Alerta em</p>
							<p className="text-lg">{(budget.alertAt * 100).toFixed(0)}%</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Purchases List */}
			{budget.purchases && budget.purchases.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Compras que Contribuíram</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Produto/Mercado</TableHead>
									<TableHead>Quantidade</TableHead>
									<TableHead className="text-right">Valor</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{budget.purchases.map((purchase: any) => (
									<TableRow key={purchase.id}>
										<TableCell>
											{format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: ptBR })}
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">
													{purchase.productName || `Compra ${purchase.itemCount ? `(${purchase.itemCount} itens)` : ""}`}
												</p>
												{purchase.marketName && (
													<p className="text-sm text-muted-foreground">{purchase.marketName}</p>
												)}
											</div>
										</TableCell>
										<TableCell>{purchase.quantity || "-"}</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(purchase.finalPrice || purchase.finalAmount)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Delete Confirmation Dialog */}
			<ResponsiveConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				title="Confirmar Exclusão"
				description="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
				onConfirm={handleDelete}
				onCancel={() => setShowDeleteDialog(false)}
				confirmText="Excluir"
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteMutation.isPending}
				icon={<Trash2 className="h-6 w-6 text-destructive" />}
			/>
		</div>
	)
}
