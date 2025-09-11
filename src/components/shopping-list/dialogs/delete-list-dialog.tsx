"use client";

import { Trash2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteListDialogProps {
	isOpen: boolean;
	onClose: () => void;
	listName: string;
	onDelete: () => Promise<void>;
	deleting: boolean;
}

export function DeleteListDialog({
	isOpen,
	onClose,
	listName,
	onDelete,
	deleting,
}: DeleteListDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Trash2 className="h-5 w-5 text-red-500" />
						Confirmar Exclusão
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p>
						Tem certeza que deseja excluir a lista{" "}
						<strong>{listName}</strong>?
					</p>
					<p className="text-sm text-gray-600">
						Esta ação não pode ser desfeita e todos os itens da lista serão
						perdidos.
					</p>
					<div className="flex gap-2 pt-4">
						<Button
							variant="destructive"
							onClick={onDelete}
							disabled={deleting}
							className="flex-1"
						>
							{deleting ? "Excluindo..." : "Sim, Excluir"}
						</Button>
						<Button variant="outline" onClick={onClose}>
							Cancelar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}