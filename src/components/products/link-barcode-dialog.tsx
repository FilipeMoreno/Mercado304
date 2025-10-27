"use client"

import { Camera, Link2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductCombobox } from "@/components/ui/product-combobox"
import { useInfiniteProductsQuery } from "@/hooks"

interface LinkBarcodeDialogProps {
	isOpen: boolean
	onClose: () => void
	onBarcodeScanned?: (barcode: string) => void
}

export function LinkBarcodeDialog({ isOpen, onClose, onBarcodeScanned }: LinkBarcodeDialogProps) {
	const [barcode, setBarcode] = useState("")
	const [showScanner, setShowScanner] = useState(false)
	const [selectedProductId, setSelectedProductId] = useState<string>("")
	const [isLinking, setIsLinking] = useState(false)

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteProductsQuery({
		search: "",
		enabled: true,
	})

	const products = data?.pages.flatMap((page) => page.products) || []

	const handleBarcodeScanned = (scannedBarcode: string) => {
		setBarcode(scannedBarcode)
		setShowScanner(false)
		onBarcodeScanned?.(scannedBarcode)
	}

	const handleLink = async () => {
		if (!barcode || !barcode.trim()) {
			toast.error("Digite ou escaneie um código de barras")
			return
		}

		if (!selectedProductId) {
			toast.error("Selecione um produto")
			return
		}

		setIsLinking(true)
		try {
			const response = await fetch(`/api/products/${selectedProductId}/barcodes`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ barcode: barcode.trim() }),
			})

			if (!response.ok) {
				const error = await response.json()
				toast.error(error.error || "Erro ao vincular código de barras")
				setIsLinking(false)
				return
			}

			toast.success("Código de barras vinculado com sucesso!")
			onClose()
			setBarcode("")
			setSelectedProductId("")
		} catch (error) {
			console.error("Erro ao vincular código de barras:", error)
			toast.error("Erro ao vincular código de barras")
		} finally {
			setIsLinking(false)
		}
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Link2 className="h-5 w-5" />
							Vincular GTIN/EAN a Produto
						</DialogTitle>
						<DialogDescription>Adicione um código de barras a um produto já existente</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Input de código de barras */}
						<div className="space-y-2">
							<Label>Código de Barras (GTIN/EAN)</Label>
							<div className="flex gap-2">
								<Input
									placeholder="Digite ou escaneie o código"
									value={barcode}
									onChange={(e) => setBarcode(e.target.value)}
									disabled={isLinking}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setShowScanner(true)}
									disabled={isLinking}
								>
									<Camera className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Seleção de produto */}
						<div className="space-y-2">
							<Label>Produto</Label>
							<ProductCombobox
								products={products}
								value={selectedProductId}
								onValueChange={setSelectedProductId}
								placeholder="Busque e selecione o produto"
								disabled={isLinking}
								hasNextPage={hasNextPage}
								fetchNextPage={fetchNextPage}
								isFetchingNextPage={isFetchingNextPage}
								isLoading={isLoading}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={onClose} disabled={isLinking}>
							Cancelar
						</Button>
						<Button onClick={handleLink} disabled={!barcode || !selectedProductId || isLinking}>
							{isLinking ? "Vinculando..." : "Vincular"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{showScanner && (
				<BarcodeScanner isOpen={showScanner} onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
			)}
		</>
	)
}
