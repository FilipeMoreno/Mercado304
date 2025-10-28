"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { BudgetCard } from "@/components/budget-card"
import { Plus, Search, Filter, Calculator, Trash2 } from "lucide-react"
import { useBudgetsQuery, useDeleteBudgetMutation } from "@/hooks/use-react-query"
import type { BudgetWithSpent } from "@/types"
import Link from "next/link"

export default function BudgetsPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [search, setSearch] = useState(searchParams.get("search") || "")
	const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "ALL")
	const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL")
	const [budgetToDelete, setBudgetToDelete] = useState<BudgetWithSpent | null>(null)

	// Build query params
	const params = new URLSearchParams()
	if (search) params.set("search", search)
	if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter)
	if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)

	const { data: budgetsData, isLoading, error } = useBudgetsQuery(params)
	const deleteMutation = useDeleteBudgetMutation()

	// Extract budgets array from API response
	const budgets = budgetsData?.budgets || []

	const handleSearch = () => {
		const newParams = new URLSearchParams()
		if (search) newParams.set("search", search)
		if (typeFilter !== "ALL") newParams.set("type", typeFilter)
		if (statusFilter !== "ALL") newParams.set("status", statusFilter)
		router.push(`/orcamentos?${newParams.toString()}`)
	}

	const handleDelete = async () => {
		if (!budgetToDelete) return
		await deleteMutation.mutateAsync(budgetToDelete.id)
		setBudgetToDelete(null)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
					Erro ao carregar orçamentos: {error.message}
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold">Orçamentos</h1>
					<p className="text-muted-foreground">
						Controle seus gastos por categoria, mercado ou produto
					</p>
				</div>
				<Link href="/orcamentos/novo">
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Novo Orçamento
					</Button>
				</Link>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="flex-1 flex gap-2">
					<Input
						placeholder="Buscar orçamento..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						className="flex-1"
					/>
					<Button variant="outline" onClick={handleSearch}>
						<Search className="h-4 w-4" />
					</Button>
				</div>

				<div className="flex gap-2">
					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Tipo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Todos os Tipos</SelectItem>
							<SelectItem value="CATEGORY">Categoria</SelectItem>
							<SelectItem value="MARKET">Mercado</SelectItem>
							<SelectItem value="PRODUCT">Produto</SelectItem>
						</SelectContent>
					</Select>

					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Todos os Status</SelectItem>
							<SelectItem value="HEALTHY">Saudável</SelectItem>
							<SelectItem value="NEAR_LIMIT">Próximo ao Limite</SelectItem>
							<SelectItem value="OVER_BUDGET">Ultrapassado</SelectItem>
						</SelectContent>
					</Select>

					<Button variant="outline" onClick={handleSearch}>
						<Filter className="h-4 w-4 mr-2" />
						Filtrar
					</Button>
				</div>
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg" />
					))}
				</div>
			)}

			{/* Budget List */}
			{!isLoading && budgets.length > 0 && (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{budgets.map((budget: BudgetWithSpent) => (
						<BudgetCard
							key={budget.id}
							budget={budget}
							onView={(id) => router.push(`/orcamentos/${id}`)}
							onEdit={(id) => router.push(`/orcamentos/${id}/editar`)}
							onDelete={() => setBudgetToDelete(budget)}
						/>
					))}
				</div>
			)}

			{/* Empty State */}
			{!isLoading && budgets.length === 0 && (
				<div className="py-12">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Calculator className="h-6 w-6" />
							</EmptyMedia>
							<EmptyTitle>Nenhum orçamento cadastrado</EmptyTitle>
							<EmptyDescription>
								Comece criando seu primeiro orçamento para controlar seus gastos
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Link href="/orcamentos/novo">
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									Criar Primeiro Orçamento
								</Button>
							</Link>
						</EmptyContent>
					</Empty>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<ResponsiveConfirmDialog
				open={!!budgetToDelete}
				onOpenChange={() => setBudgetToDelete(null)}
				title="Confirmar Exclusão"
				description={`Tem certeza que deseja excluir o orçamento "${budgetToDelete?.name}"? Esta ação não pode ser desfeita.`}
				onConfirm={handleDelete}
				onCancel={() => setBudgetToDelete(null)}
				confirmText="Excluir"
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteMutation.isPending}
				icon={<Trash2 className="h-6 w-6 text-destructive" />}
			/>
		</div>
	)
}
