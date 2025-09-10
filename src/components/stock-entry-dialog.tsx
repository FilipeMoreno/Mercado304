"use client";

import { Copy, Save } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types";

export interface StockEntry {
	id: string;
	expirationDate?: string;
	batchNumber?: string;
	location: string;
	notes?: string;
}

interface StockEntryDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (entries: StockEntry[]) => void;
	product: Product | undefined;
	quantity: number;
	initialEntries: StockEntry[];
}

export function StockEntryDialog({
	isOpen,
	onClose,
	onSave,
	product,
	quantity,
	initialEntries,
}: StockEntryDialogProps) {
	const [entries, setEntries] = React.useState<StockEntry[]>(initialEntries);

	React.useEffect(() => {
		if (isOpen) {
			// Sincroniza ou cria as entradas de estoque quando o diálogo abre
			const newEntries: StockEntry[] = Array.from(
				{ length: quantity },
				(_, i) =>
					initialEntries[i] || {
						id: Math.random().toString(),
						location: "Despensa",
						batchNumber: "",
						expirationDate: "",
						notes: "",
					},
			);
			setEntries(newEntries);
		}
	}, [isOpen, quantity, initialEntries]);

	const handleEntryChange = (
		index: number,
		field: keyof StockEntry,
		value: string,
	) => {
		const updatedEntries = [...entries];
		updatedEntries[index] = { ...updatedEntries[index], [field]: value };
		setEntries(updatedEntries);
	};

	const applyToAll = () => {
		if (entries.length > 0) {
			const firstEntry = entries[0];
			setEntries(
				entries.map((entry) => ({
					...entry,
					...firstEntry,
					id: entry.id, // Manter o ID único
				})),
			);
		}
	};

	const handleSave = () => {
		onSave(entries);
		onClose();
	};

	if (!product) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Detalhes do Estoque: {product.name}</DialogTitle>
					<DialogDescription>
						Insira as informações para cada unidade do produto.
					</DialogDescription>
				</DialogHeader>
				<div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
					{entries.map((entry, index) => (
						<div key={entry.id} className="p-4 border rounded-lg space-y-4">
							<h4 className="font-semibold">Unidade {index + 1}</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{product.hasExpiration && (
									<div className="space-y-2">
										<Label htmlFor={`expirationDate-${index}`}>
											Data de Validade
										</Label>
										<Input
											id={`expirationDate-${index}`}
											type="date"
											value={entry.expirationDate || ""}
											onChange={(e) =>
												handleEntryChange(
													index,
													"expirationDate",
													e.target.value,
												)
											}
										/>
									</div>
								)}
								<div className="space-y-2">
									<Label htmlFor={`batchNumber-${index}`}>Lote/Batch</Label>
									<Input
										id={`batchNumber-${index}`}
										value={entry.batchNumber || ""}
										onChange={(e) =>
											handleEntryChange(index, "batchNumber", e.target.value)
										}
										placeholder="Ex: L2025A"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`location-${index}`}>Localização</Label>
									<Select
										value={entry.location}
										onValueChange={(value) =>
											handleEntryChange(index, "location", value)
										}
									>
										<SelectTrigger id={`location-${index}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Despensa">Despensa</SelectItem>
											<SelectItem value="Geladeira">Geladeira</SelectItem>
											<SelectItem value="Freezer">Freezer</SelectItem>
											<SelectItem value="Outro">Outro</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`notes-${index}`}>Observações</Label>
									<Input
										id={`notes-${index}`}
										value={entry.notes || ""}
										onChange={(e) =>
											handleEntryChange(index, "notes", e.target.value)
										}
										placeholder="Notas adicionais"
									/>
								</div>
							</div>
						</div>
					))}
				</div>
				<DialogFooter className="mt-4">
					<Button
						variant="outline"
						onClick={applyToAll}
						disabled={entries.length <= 1}
					>
						<Copy className="mr-2 h-4 w-4" />
						Aplicar a Todos
					</Button>
					<Button onClick={handleSave}>
						<Save className="mr-2 h-4 w-4" />
						Salvar Detalhes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
