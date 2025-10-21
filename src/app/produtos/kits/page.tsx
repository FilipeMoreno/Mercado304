"use client"

import { Filter, Package, Plus, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { KitCardEnhanced } from "@/components/kits/kit-card-enhanced"
import { KitListSkeleton } from "@/components/kits/kit-list-skeleton"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDeleteProductKitMutation, useProductKitsQuery } from "@/hooks/use-react-query"
import type { ProductKitWithItems } from "@/types/product-kit"

export default function ProductKitsPage() {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
	const [kitToDelete, setKitToDelete] = useState<ProductKitWithItems | null>(null)

	// Query com React Query otimizado
	const { data: kitsData, isLoading, error, refetch } = useProductKitsQuery()
	const deleteKitMutation = useDeleteProductKitMutation()

	// Memoized filtered kits
	const filteredKits = useMemo(() => {
		if (!kitsData?.data) return []

		let kits = kitsData.data as ProductKitWithItems[]

		// Filtro por busca
		if (searchTerm) {
			const search = searchTerm.toLowerCase()
			kits = kits.filter(
				(kit) =>
					kit.kitProduct.name.toLowerCase().includes(search) ||
					kit.description?.toLowerCase().includes(search) ||
					kit.items.some((item) => item.product.name.toLowerCase().includes(search)),
			)
		}

		// Filtro por status
		if (statusFilter !== "all") {
			kits = kits.filter((kit) => (statusFilter === "active" ? kit.isActive : !kit.isActive))
		}

		return kits
	}, [kitsData, searchTerm, statusFilter])

	// Stats
	const stats = useMemo(() => {
		if (!kitsData?.data) return { total: 0, active: 0, inactive: 0, totalProducts: 0 }

		const kits = kitsData.data as ProductKitWithItems[]
		return {
			total: kits.length,
			active: kits.filter((k) => k.isActive).length,
			inactive: kits.filter((k) => !k.isActive).length,
			totalProducts: kits.reduce((sum, k) => sum + k.items.length, 0),
		}
	}, [kitsData])

	const handleCreateNew = () => {
		router.push("/produtos/kits/novo")
	}

	const handleDelete = (kit: ProductKitWithItems) => {
		setKitToDelete(kit)
	}

	const confirmDelete = async () => {
		if (!kitToDelete) return

		try {
			// Deletar o kit usando o mutation (usa kitProductId, não id)
			await deleteKitMutation.mutateAsync(kitToDelete.kitProductId)
			setKitToDelete(null)
		} catch (error) {
			console.error("Error deleting kit:", error)
			// Error is already handled by the mutation hook
		}
	}

	const clearFilters = () => {
		setSearchTerm("")
		setStatusFilter("all")
	}

	const hasActiveFilters = searchTerm || statusFilter !== "all"

	return (
		<div className="container mx-auto py-8 px-4 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
						<Package className="size-8 text-primary" />
						Kits e Combos
					</h1>
					<p className="text-muted-foreground mt-2">Cadastre combos promocionais que os mercados oferecem</p>
				</div>

				<Button size="lg" onClick={handleCreateNew}>
					<Plus className="size-4 mr-2" />
					Novo Kit
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total de Kits</p>
								<p className="text-2xl font-bold">{stats.total}</p>
							</div>
							<Package className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Kits Ativos</p>
								<p className="text-2xl font-bold text-green-600">{stats.active}</p>
							</div>
							<CheckCircle2 className="size-8 text-green-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Kits Inativos</p>
								<p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
							</div>
							<XCircle className="size-8 text-orange-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Produtos</p>
								<p className="text-2xl font-bold">{stats.totalProducts}</p>
							</div>
							<Box className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Search */}
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									type="text"
									placeholder="Buscar kits por nome, descrição ou produtos..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						{/* Status Filter */}
						<Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
							<SelectTrigger className="w-full md:w-[180px]">
								<Filter className="size-4 mr-2" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="active">Ativos</SelectItem>
								<SelectItem value="inactive">Inativos</SelectItem>
							</SelectContent>
						</Select>

						{/* Clear Filters */}
						{hasActiveFilters && (
							<Button variant="ghost" size="icon" onClick={clearFilters}>
								<X className="size-4" />
							</Button>
						)}
					</div>

					{/* Active Filters Display */}
					{hasActiveFilters && (
						<div className="flex items-center gap-2 mt-3 pt-3 border-t">
							<span className="text-sm text-muted-foreground">Filtros ativos:</span>
							{searchTerm && (
								<Badge variant="secondary">
									Busca: {searchTerm}
									<X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setSearchTerm("")} />
								</Badge>
							)}
							{statusFilter !== "all" && (
								<Badge variant="secondary">
									Status: {statusFilter === "active" ? "Ativo" : "Inativo"}
									<X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setStatusFilter("all")} />
								</Badge>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Error State */}
			{error && (
				<Card className="border-destructive">
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							<AlertCircle className="size-5 text-destructive" />
							<div className="flex-1">
								<p className="font-semibold text-destructive">Erro ao carregar kits</p>
								<p className="text-sm text-muted-foreground mt-1">
									{error instanceof Error ? error.message : "Erro desconhecido"}
								</p>
							</div>
							<Button variant="outline" size="sm" onClick={() => refetch()}>
								Tentar Novamente
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Loading State */}
			{isLoading && <KitListSkeleton count={6} />}

			{/* Empty State */}
			{!isLoading && !error && filteredKits.length === 0 && (
				<Card>
					<CardContent className="p-12">
						<div className="text-center">
							<Package className="size-16 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								{hasActiveFilters ? "Nenhum kit encontrado" : "Nenhum kit cadastrado"}
							</h3>
							<p className="text-muted-foreground mb-6">
								{hasActiveFilters
									? "Tente ajustar os filtros ou limpar a busca"
									: "Comece criando seu primeiro kit de produtos"}
							</p>
							{hasActiveFilters ? (
								<Button variant="outline" onClick={clearFilters}>
									<X className="size-4 mr-2" />
									Limpar Filtros
								</Button>
							) : (
								<Button onClick={handleCreateNew}>
									<Plus className="size-4 mr-2" />
									Criar Primeiro Kit
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Kits Grid */}
			{!isLoading && filteredKits.length > 0 && (
				<Suspense fallback={<KitListSkeleton count={filteredKits.length} />}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredKits.map((kit) => (
							<KitCardEnhanced key={kit.id} kit={kit} onDelete={handleDelete} />
						))}
					</div>
				</Suspense>
			)}

			{/* Results Count */}
			{!isLoading && filteredKits.length > 0 && (
				<div className="text-center text-sm text-muted-foreground">
					Mostrando {filteredKits.length} de {stats.total} kit{stats.total !== 1 ? "s" : ""}
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!kitToDelete} onOpenChange={() => setKitToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir Kit</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir o kit <strong>{kitToDelete?.kitProduct.name}</strong>?
							<br />
							<br />
							Esta ação não pode ser desfeita. O kit será removido permanentemente do sistema.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Excluir Kit
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

import { AlertCircle, Box, CheckCircle2, XCircle } from "lucide-react"
// Imports necessários
import { Card, CardContent } from "@/components/ui/card"
