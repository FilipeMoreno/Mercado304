"use client";

import { Edit, Save } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BestPriceAlert } from "@/components/best-price-alert";

interface ShoppingListItem {
	id: string;
	quantity: number;
	estimatedPrice?: number;
	isChecked: boolean;
	bestPriceAlert?: any;
	productName?: string;
	productUnit?: string;
	product?: {
		id: string;
		name: string;
		unit: string;
		brand?: {
			name: string;
		};
		category?: {
			id: string;
			name: string;
			icon?: string;
		};
	};
}

interface EditItemData {
	quantity: number;
	estimatedPrice: number;
}

interface EditItemDialogProps {
	isOpen: boolean;
	onClose: () => void;
	editingItem: ShoppingListItem | null;
	editItemData: EditItemData;
	onEditItemDataChange: (data: EditItemData) => void;
	onUpdate: () => Promise<void>;
	updating: boolean;
	onCloseBestPriceAlert: () => void;
	onCheckBestPrice?: (itemId: string, productId: string, price: number) => void;
}

export function EditItemDialog({
	isOpen,
	onClose,
	editingItem,
	editItemData,
	onEditItemDataChange,
	onUpdate,
	updating,
	onCloseBestPriceAlert,
	onCheckBestPrice,
}: EditItemDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Edit className="h-5 w-5" />
						Editar Item
					</DialogTitle>
				</DialogHeader>
				{editingItem && (
					<div className="space-y-4">
						<div className="p-3 bg-gray-50 rounded">
							<p className="font-medium">
								{editingItem.product?.name || editingItem.productName}
							</p>
							{editingItem.product?.brand && (
								<p className="text-sm text-gray-600">
									{editingItem.product.brand.name}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label>Quantidade *</Label>
							<Input
								type="number"
								step="0.01"
								min="0.01"
								value={editItemData.quantity}
								onChange={(e) =>
									onEditItemDataChange({
										...editItemData,
										quantity: parseFloat(e.target.value) || 1,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Preço Estimado (opcional)</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={editItemData.estimatedPrice || ""}
								onChange={(e) => {
									const newPrice = parseFloat(e.target.value) || 0;
									onEditItemDataChange({
										...editItemData,
										estimatedPrice: newPrice,
									});

									if (editingItem?.product?.id && newPrice > 0 && onCheckBestPrice) {
										setTimeout(() => {
											onCheckBestPrice(
												editingItem.id,
												editingItem.product?.id!,
												newPrice,
											);
										}, 1000);
									}
								}}
								placeholder="0.00"
							/>
						</div>

						{/* Alert de Menor Preço no Dialog de Edição */}
						{editingItem?.bestPriceAlert?.isBestPrice &&
							!editingItem.bestPriceAlert.isFirstRecord && (
								<BestPriceAlert
									productName={
										editingItem.product?.name ||
										editingItem.productName ||
										"Produto"
									}
									currentPrice={editItemData.estimatedPrice || 0}
									previousBestPrice={
										editingItem.bestPriceAlert.previousBestPrice
									}
									totalRecords={editingItem.bestPriceAlert.totalRecords}
									onClose={onCloseBestPriceAlert}
								/>
							)}

						<div className="flex gap-2 pt-4">
							<Button
								onClick={onUpdate}
								disabled={updating}
								className="flex-1"
							>
								<Save className="h-4 w-4 mr-2" />
								{updating ? "Salvando..." : "Salvar"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
							>
								Cancelar
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}