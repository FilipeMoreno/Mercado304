"use client"

import { Barcode, Camera, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface AddBarcodeDialogProps {
	isOpen: boolean
	onClose: () => void
	productId: string
	productName: string
	initialBarcode?: string
	onSuccess?: () => void
}

export function AddBarcodeDialog({
	isOpen,
	onClose,
	productId,
	productName,
	initialBarcode = "",
	onSuccess,
}: AddBarcodeDialogProps) {
	const [barcode, setBarcode] = useState(initialBarcode)
	const [showScanner, setShowScanner] = useState(false)
	const [isAdding, setIsAdding] = useState(false)

	// Atualizar quando o initialBarcode mudar
	useEffect(() => {
		if (initialBarcode) {
			setBarcode(initialBarcode)
		}
	}, [initialBarcode])

	const handleBarcodeScanned = (scannedBarcode: string) => {
		setBarcode(scannedBarcode)
		setShowScanner(false)
	}

	const handleAdd = async () => {
		if (!barcode || !barcode.trim()) {
			toast.error("Digite ou escaneie um código de barras")
			return
		}

		setIsAdding(true)
		try {
			const response = await fetch(`/api/products/${productId}/barcodes`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ barcode: barcode.trim() }),
			})

			if (!response.ok) {
				const error = await response.json()
				toast.error(error.error || "Erro ao adicionar código de barras")
				setIsAdding(false)
				return
			}

			toast.success("Código de barras adicionado com sucesso!")
			setBarcode("")
			onSuccess?.()
			onClose()
		} catch (error) {
			console.error("Erro ao adicionar código de barras:", error)
			toast.error("Erro ao adicionar código de barras")
		} finally {
			setIsAdding(false)
		}
	}

	const handleClose = () => {
		if (!isAdding) {
			setBarcode("")
			onClose()
		}
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Barcode className="h-6 w-6 text-primary" />
							</div>
							<div className="flex-1">
								<DialogTitle className="text-xl">Adicionar Código de Barras</DialogTitle>
								<DialogDescription className="mt-1">
									Vincule um novo código ao produto
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Produto */}
						<div className="rounded-lg border bg-muted/50 p-4">
							<p className="text-sm font-medium text-muted-foreground mb-1">Produto</p>
							<p className="font-semibold">{productName}</p>
						</div>

						<Separator />

						{/* Input de código de barras */}
						<div className="space-y-3">
							<Label htmlFor="barcode" className="text-sm font-medium">
								Código de Barras (GTIN/EAN)
							</Label>
							<div className="flex gap-2">
								<Input
									id="barcode"
									placeholder="Digite ou escaneie o código"
									value={barcode}
									onChange={(e) => setBarcode(e.target.value)}
									disabled={isAdding}
									className="flex-1 h-10"
									onKeyDown={(e) => {
										if (e.key === "Enter" && barcode.trim()) {
											handleAdd()
										}
									}}
									autoFocus
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setShowScanner(true)}
									disabled={isAdding}
									title="Escanear código de barras"
									className="h-10 w-10 shrink-0"
								>
									<Camera className="h-5 w-5" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Digite manualmente ou use a câmera para escanear
							</p>
						</div>
					</div>

					<Separator />

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={handleClose} disabled={isAdding}>
							Cancelar
						</Button>
						<Button onClick={handleAdd} disabled={!barcode.trim() || isAdding}>
							{isAdding ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adicionando...
								</>
							) : (
								<>
									<Barcode className="mr-2 h-4 w-4" />
									Adicionar
								</>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{showScanner && (
				<BarcodeScanner isOpen={showScanner} onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
			)}
		</>
	)
}
