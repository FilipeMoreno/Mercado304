"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Calculator, Loader2, Sparkles, Lock } from "lucide-react"
import { useBudgetQuery, useUpdateBudgetMutation } from "@/hooks/use-react-query"
import { BudgetType } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"

interface EditBudgetPageProps {
	params: { id: string }
}

export default function EditBudgetPage({ params }: EditBudgetPageProps) {
	const { id } = params
	const router = useRouter()
	const { data: budget, isLoading: loadingBudget } = useBudgetQuery(id)
	const updateMutation = useUpdateBudgetMutation()

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		limitAmount: "",
		startDate: "",
		endDate: "",
		alertAt: "0.9",
	})

	// Load budget data into form
	useEffect(() => {
		if (budget) {
			setFormData({
				name: budget.name,
				description: budget.description || "",
				limitAmount: budget.limitAmount.toString(),
				startDate: format(new Date(budget.startDate), "yyyy-MM-dd"),
				endDate: format(new Date(budget.endDate), "yyyy-MM-dd"),
				alertAt: budget.alertAt.toString(),
			})
		}
	}, [budget])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			toast.error("Digite um nome para o orçamento")
			return
		}

		if (!formData.limitAmount || Number.parseFloat(formData.limitAmount) <= 0) {
			toast.error("Digite um valor limite válido")
			return
		}

		if (!formData.startDate || !formData.endDate) {
			toast.error("Selecione o período do orçamento")
			return
		}

		try {
			await updateMutation.mutateAsync({
				id,
				data: {
					name: formData.name,
					description: formData.description || undefined,
					limitAmount: Number.parseFloat(formData.limitAmount),
					period: `${new Date(formData.startDate).getFullYear()}-${String(new Date(formData.startDate).getMonth() + 1).padStart(2, "0")}`,
					startDate: new Date(formData.startDate),
					endDate: new Date(formData.endDate),
					alertAt: Number.parseFloat(formData.alertAt),
				},
			})

			router.push(`/orcamentos/${id}`)
		} catch (error) {
			// Error handled by mutation
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "CATEGORY":
				return "Por Categoria"
			case "MARKET":
				return "Por Mercado"
			case "PRODUCT":
				return "Por Produto"
			default:
				return type
		}
	}

	if (loadingBudget) {
		return (
			<div className="space-y-6 flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	if (!budget) {
		return (
			<div className="space-y-6 flex items-center justify-center py-12">
				<div className="text-center">
					<p className="text-lg font-medium mb-2">Orçamento não encontrado</p>
					<Button onClick={() => router.push("/orcamentos")}>
						Voltar para Orçamentos
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.back()}
						className="mb-4 -ml-2"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-lg bg-primary/10">
							<Calculator className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold tracking-tight">Editar Orçamento</h1>
							<p className="text-muted-foreground mt-1">
								Atualize as informações do seu orçamento
							</p>
						</div>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Card Principal */}
					<div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Sparkles className="h-4 w-4" />
							Informações Básicas
						</div>

						{/* Nome */}
						<div className="space-y-2">
							<Label htmlFor="name">Nome do Orçamento</Label>
							<Input
								id="name"
								placeholder="Ex: Gastos com Alimentação"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								className="h-11"
							/>
						</div>

						{/* Descrição */}
						<div className="space-y-2">
							<Label htmlFor="description">Descrição (opcional)</Label>
							<Textarea
								id="description"
								placeholder="Adicione observações sobre este orçamento..."
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								rows={3}
								className="resize-none"
							/>
						</div>
					</div>

					{/* Card Tipo e Alvo (Read-only) */}
					<div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Lock className="h-4 w-4" />
							Configuração do Controle
						</div>

						{/* Tipo (disabled) */}
						<div className="space-y-2">
							<Label htmlFor="type">Tipo de Controle</Label>
							<Input
								id="type"
								value={getTypeLabel(budget.type)}
								disabled
								className="h-11 bg-muted"
							/>
							<p className="text-sm text-muted-foreground">
								O tipo de orçamento não pode ser alterado após a criação
							</p>
						</div>

						{/* Alvo (disabled) */}
						{budget.target && (
							<div className="space-y-2">
								<Label htmlFor="target">
									{budget.type === "CATEGORY" ? "Categoria" : budget.type === "MARKET" ? "Mercado" : "Produto"}
								</Label>
								<Input
									id="target"
									value={budget.target.name}
									disabled
									className="h-11 bg-muted"
								/>
								<p className="text-sm text-muted-foreground">
									O alvo do orçamento não pode ser alterado após a criação
								</p>
							</div>
						)}
					</div>

					{/* Card Valores e Período */}
					<div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Calculator className="h-4 w-4" />
							Valores e Período
						</div>

						{/* Limite */}
						<div className="space-y-2">
							<Label htmlFor="limit">Valor Limite (R$)</Label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									R$
								</span>
								<Input
									id="limit"
									type="number"
									step="0.01"
									min="0"
									placeholder="0,00"
									value={formData.limitAmount}
									onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
									className="h-11 pl-10"
								/>
							</div>
							{formData.limitAmount && Number.parseFloat(formData.limitAmount) > 0 && (
								<p className="text-sm text-muted-foreground flex items-center gap-1">
									<span className="font-medium text-primary">
										{formatCurrency(Number.parseFloat(formData.limitAmount))}
									</span>
									<span>por período</span>
								</p>
							)}
						</div>

						{/* Período */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="startDate">Data Inicial</Label>
								<Input
									id="startDate"
									type="date"
									value={formData.startDate}
									onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
									className="h-11"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="endDate">Data Final</Label>
								<Input
									id="endDate"
									type="date"
									value={formData.endDate}
									onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
									className="h-11"
								/>
							</div>
						</div>

						{/* Alerta */}
						<div className="space-y-2">
							<Label htmlFor="alertAt">Receber Alerta Quando Atingir</Label>
							<Select
								value={formData.alertAt}
								onValueChange={(value) => setFormData({ ...formData, alertAt: value })}
							>
								<SelectTrigger className="h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0.7">70% do limite</SelectItem>
									<SelectItem value="0.8">80% do limite</SelectItem>
									<SelectItem value="0.9">90% do limite</SelectItem>
									<SelectItem value="0.95">95% do limite</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-sm text-muted-foreground">
								Você será alertado ao atingir{" "}
								<span className="font-medium text-foreground">
									{Number.parseFloat(formData.alertAt) * 100}%
								</span>{" "}
								do valor limite
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							className="flex-1 h-11"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							className="flex-1 h-11"
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Salvar Alterações
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
