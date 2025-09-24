"use client"

import { Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	useCreateWasteMutation,
	useDeleteConfirmation,
	useDeleteWasteMutation,
	useUpdateWasteMutation,
	useWasteQuery,
} from "@/hooks"
import { WasteDetails } from "./components/waste-details"
import { WasteForm } from "./components/waste-form"
import { WasteGrid } from "./components/waste-grid"
import { WastePagination } from "./components/waste-pagination"
import { WasteStats } from "./components/waste-stats"

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

export default function DesperdiciosClient() {
	const [searchTerm, setSearchTerm] = useState("")
	const [filterReason, setFilterReason] = useState<string>("all")
	const [selectedRecord, setSelectedRecord] = useState<WasteRecord | null>(null)
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showDetailsDialog, setShowDetailsDialog] = useState(false)
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize] = useState(12) // Para grid de 3x4

	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<WasteRecord>()

	// Build URLSearchParams for the waste query
	const wasteParams = useMemo(() => {
		const params = new URLSearchParams({
			page: currentPage.toString(),
			limit: pageSize.toString(),
		})
		if (searchTerm) params.append("search", searchTerm)
		if (filterReason !== "all") params.append("reason", filterReason)
		return params
	}, [searchTerm, filterReason, currentPage, pageSize])

	// React Query hooks
	const { data: wasteData, isLoading, error } = useWasteQuery(wasteParams)
	const createWasteMutation = useCreateWasteMutation()
	const updateWasteMutation = useUpdateWasteMutation()
	const deleteWasteMutation = useDeleteWasteMutation()

	// Extract data from React Query
	const wasteRecords = wasteData?.wasteRecords || []
	const stats = wasteData?.stats || null

	const handleDeleteRecord = async () => {
		if (!deleteState.item) return

		try {
			await deleteWasteMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Erro ao remover registro:", error)
		}
	}

	const handleCreateRecord = async (newRecordData: Omit<WasteRecord, "id">) => {
		try {
			await createWasteMutation.mutateAsync(newRecordData)
			setShowCreateDialog(false)
		} catch (error) {
			console.error("Erro ao criar registro:", error)
		}
	}

	const handleUpdateRecord = async (updatedRecordData: Omit<WasteRecord, "id">) => {
		try {
			if (!selectedRecord) return

			await updateWasteMutation.mutateAsync({
				id: selectedRecord.id,
				data: updatedRecordData,
			})
			setShowEditDialog(false)
			setSelectedRecord(null)
		} catch (error) {
			console.error("Erro ao atualizar registro:", error)
		}
	}

	const handleViewDetails = (record: WasteRecord) => {
		setSelectedRecord(record)
		setShowDetailsDialog(true)
	}

	const handleEdit = (record: WasteRecord) => {
		setSelectedRecord(record)
		setShowEditDialog(true)
	}

	const handleDelete = (record: WasteRecord) => {
		openDeleteConfirm(record)
	}

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	// Handle error states
	if (error) {
		return (
			<div className="space-y-6">
				<div className="text-center py-12">
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar desperdícios</h3>
					<p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os dados. Tente recarregar a página.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Controles */}
			<div className="flex justify-end items-center mb-6">
				<Button onClick={() => setShowCreateDialog(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Registrar Desperdício
				</Button>
			</div>

			{/* Filtros */}
			<div className="flex flex-row gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar por produto..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<div className="w-auto">
					<Select value={filterReason} onValueChange={setFilterReason}>
						<SelectTrigger>
							<SelectValue placeholder="Filtrar por motivo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos os motivos</SelectItem>
							<SelectItem value="EXPIRED">Vencido</SelectItem>
							<SelectItem value="DAMAGED">Danificado</SelectItem>
							<SelectItem value="OVERSTOCK">Excesso de Estoque</SelectItem>
							<SelectItem value="QUALITY">Problema de Qualidade</SelectItem>
							<SelectItem value="POWER_OUTAGE">Falta de Energia</SelectItem>
							<SelectItem value="FORGOTTEN">Esquecido</SelectItem>
							<SelectItem value="OTHER">Outro</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Estatísticas */}
			<WasteStats stats={stats} isLoading={isLoading} />

			{/* Lista de desperdícios */}
			<div className="space-y-4">
				<WasteGrid
					records={wasteRecords}
					isLoading={isLoading}
					pageSize={pageSize}
					onViewDetails={handleViewDetails}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>

				{/* Paginação */}
				{wasteData?.pagination && (
					<WastePagination
						currentPage={currentPage}
						totalPages={wasteData.pagination.totalPages}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			{/* Diálogos */}
			<ResponsiveDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				title="Registrar Novo Desperdício"
				maxWidth="2xl"
			>
				<WasteForm onSubmit={handleCreateRecord} onCancel={() => setShowCreateDialog(false)} />
			</ResponsiveDialog>

			<ResponsiveDialog
				open={showDetailsDialog}
				onOpenChange={setShowDetailsDialog}
				title="Detalhes do Desperdício"
				maxWidth="2xl"
			>
				{selectedRecord && <WasteDetails record={selectedRecord} />}
			</ResponsiveDialog>

			<ResponsiveDialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				title="Editar Desperdício"
				maxWidth="2xl"
			>
				{selectedRecord && (
					<WasteForm
						initialData={selectedRecord}
						onSubmit={handleUpdateRecord}
						onCancel={() => {
							setShowEditDialog(false)
							setSelectedRecord(null)
						}}
					/>
				)}
			</ResponsiveDialog>

			{/* Diálogo de confirmação de exclusão */}
			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				onConfirm={handleDeleteRecord}
				onCancel={closeDeleteConfirm}
				confirmText="Sim, Excluir"
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteWasteMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<div className="space-y-2">
					<p className="text-sm text-gray-700">
						Tem certeza que deseja excluir o registro de desperdício <strong>{deleteState.item?.productName}</strong>?
					</p>
					<p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
				</div>
			</ResponsiveConfirmDialog>
		</div>
	)
}
