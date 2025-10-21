"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

interface EditListDialogProps {
	isOpen: boolean
	onClose: () => void
	listName: string
	onSave: (newName: string) => Promise<void>
	saving: boolean
}

export function EditListDialog({ isOpen, onClose, listName, onSave, saving }: EditListDialogProps) {
	const [editName, setEditName] = useState(listName)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editName.trim()) return
		await onSave(editName.trim())
		onClose()
	}

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title="Editar Lista" maxWidth="md">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="editListName">Nome da Lista *</Label>
					<Input
						id="editListName"
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
						placeholder="Ex: Compras da Semana"
						required
					/>
				</div>
				<div className="flex gap-2 pt-4">
					<Button type="submit" disabled={saving} className="flex-1">
						{saving ? "Salvando..." : "Salvar"}
					</Button>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</form>
		</ResponsiveDialog>
	)
}
