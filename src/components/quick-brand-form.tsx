// src/components/quick-brand-form.tsx
"use client";

import { Save, Tag, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuickBrandFormProps {
	onClose: () => void;
	onBrandCreated: (newBrand: any) => void;
}

export function QuickBrandForm({
	onClose,
	onBrandCreated,
}: QuickBrandFormProps) {
	const [brandName, setBrandName] = useState("");
	const [saving, setSaving] = useState(false);

	const createBrand = async () => {
		if (!brandName.trim()) {
			toast.error("Nome da marca é obrigatório");
			return;
		}

		setSaving(true);

		try {
			const response = await fetch("/api/brands", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: brandName.trim() }),
			});

			if (response.ok) {
				const newBrand = await response.json();
				onBrandCreated(newBrand);
				setBrandName("");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao criar marca");
			}
		} catch (error) {
			console.error("Erro ao criar marca:", error);
			toast.error("Erro ao criar marca");
		} finally {
			setSaving(false);
		}
	};

	return (
		<DialogContent className="max-w-md">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<Tag className="h-5 w-5" />
					Adicionar Marca Rápida
				</DialogTitle>
			</DialogHeader>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="brandName">Nome da Marca *</Label>
					<Input
						id="brandName"
						value={brandName}
						onChange={(e) => setBrandName(e.target.value)}
						placeholder="Ex: Nestlé"
						required
					/>
				</div>
				<div className="flex gap-2 pt-4">
					<Button onClick={createBrand} disabled={saving} className="flex-1">
						<Save className="h-4 w-4 mr-2" />
						{saving ? "Criando..." : "Criar e Usar"}
					</Button>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
