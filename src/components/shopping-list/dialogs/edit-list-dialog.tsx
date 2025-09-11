"use client";

import { Edit } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditListDialogProps {
	isOpen: boolean;
	onClose: () => void;
	listName: string;
	onSave: (newName: string) => Promise<void>;
	saving: boolean;
}

export function EditListDialog({
	isOpen,
	onClose,
	listName,
	onSave,
	saving,
}: EditListDialogProps) {
	const [editName, setEditName] = useState(listName);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editName.trim()) return;
		await onSave(editName.trim());
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Edit className="h-5 w-5" />
						Editar Lista
					</DialogTitle>
				</DialogHeader>
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
			</DialogContent>
		</Dialog>
	);
}