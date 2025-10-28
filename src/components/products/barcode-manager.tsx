"use client"

import { Camera, Plus, Sparkles, Star, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Barcode {
	id: string
	barcode: string
	isPrimary: boolean
}

interface BarcodeManagerProps {
	productId?: string
	initialBarcodes?: Barcode[]
	onBarcodesChange?: (barcodes: string[]) => void
	onBarcodeLookup?: (barcode: string) => void // Callback para buscar informações do produto
}

export function BarcodeManager({ productId, initialBarcodes = [], onBarcodesChange, onBarcodeLookup }: BarcodeManagerProps) {
	const [barcodes, setBarcodes] = useState<Barcode[]>(initialBarcodes)
	const [newBarcode, setNewBarcode] = useState("")
	const [showScanner, setShowScanner] = useState(false)
	const [isAdding, setIsAdding] = useState(false)

	const addBarcode = async (barcode: string) => {
		if (!barcode || !barcode.trim()) return

		const trimmedBarcode = barcode.trim()

		// Verificar se já existe
		if (barcodes.some((b) => b.barcode === trimmedBarcode)) {
			toast.error("Este código de barras já foi adicionado")
			return
		}

		// Se tem productId, adicionar via API
		if (productId) {
			setIsAdding(true)
			try {
				const response = await fetch(`/api/products/${productId}/barcodes`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ barcode: trimmedBarcode }),
				})

				if (!response.ok) {
					const error = await response.json()
					toast.error(error.error || "Erro ao adicionar código de barras")
					setIsAdding(false)
					return
				}

				const newBarcodeData = await response.json()
				setBarcodes((prev) => [...prev, newBarcodeData])
				toast.success("Código de barras adicionado")
				setNewBarcode("")
				setIsAdding(false)
				return
			} catch (error) {
				console.error("Erro ao adicionar código de barras:", error)
				toast.error("Erro ao adicionar código de barras")
				setIsAdding(false)
				return
			}
		}

		// Se não tem productId (criação), apenas adicionar localmente
		const newBarcodeEntry: Barcode = {
			id: Math.random().toString(),
			barcode: trimmedBarcode,
			isPrimary: barcodes.length === 0,
		}

		setBarcodes((prev) => [...prev, newBarcodeEntry])
		onBarcodesChange?.(barcodes.map((b) => b.barcode).concat(trimmedBarcode))
		setNewBarcode("")
		toast.success("Código de barras adicionado")
	}

	const removeBarcode = async (id: string) => {
		// Se tem productId, remover via API
		if (productId) {
			try {
				const response = await fetch(`/api/products/${productId}/barcodes?barcodeId=${id}`, {
					method: "DELETE",
				})

				if (!response.ok) {
					const error = await response.json()
					toast.error(error.error || "Erro ao remover código de barras")
					return
				}

				setBarcodes((prev) => prev.filter((b) => b.id !== id))
				toast.success("Código de barras removido")
				return
			} catch (error) {
				console.error("Erro ao remover código de barras:", error)
				toast.error("Erro ao remover código de barras")
				return
			}
		}

		// Se não tem productId, apenas remover localmente
		setBarcodes((prev) => prev.filter((b) => b.id !== id))
		onBarcodesChange?.(barcodes.filter((b) => b.id !== id).map((b) => b.barcode))
		toast.success("Código de barras removido")
	}

	const setPrimary = async (id: string) => {
		const updatedBarcodes = barcodes.map((b) => ({
			...b,
			isPrimary: b.id === id,
		}))

		// Se tem productId, atualizar via API
		if (productId) {
			try {
				const response = await fetch(`/api/products/${productId}/barcodes`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ barcodeId: id, isPrimary: true }),
				})

				if (!response.ok) {
					const error = await response.json()
					toast.error(error.error || "Erro ao definir código principal")
					return
				}

				setBarcodes(updatedBarcodes)
				toast.success("Código principal atualizado")
				return
			} catch (error) {
				console.error("Erro ao atualizar código principal:", error)
				toast.error("Erro ao atualizar código principal")
				return
			}
		}

		// Se não tem productId, apenas atualizar localmente
		setBarcodes(updatedBarcodes)
		toast.success("Código principal atualizado")
	}

	const handleBarcodeScanned = (barcode: string) => {
		addBarcode(barcode)
		setShowScanner(false)
	}

	const handleLookupBarcode = () => {
		if (!newBarcode) return
		// Chamar callback externo para buscar informações
		onBarcodeLookup?.(newBarcode)
	}

	return (
		<div className="space-y-4">
			{/* Label */}
			<Label className="text-sm font-medium">Códigos de Barras (GTIN/EAN)</Label>

			{/* Lista de códigos de barras */}
			{barcodes.length > 0 && (
				<div className="space-y-2">
					{barcodes.map((barcode) => (
						<div key={barcode.id} className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={() => setPrimary(barcode.id)}
								title={barcode.isPrimary ? "Código principal" : "Marcar como principal"}
							>
								<Star className={barcode.isPrimary ? "h-4 w-4 fill-yellow-500 text-yellow-500" : "h-4 w-4"} />
							</Button>
							<div className="flex-1 font-mono text-sm">{barcode.barcode}</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={() => removeBarcode(barcode.id)}
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Input para adicionar manualmente */}
			<div className="flex gap-2 w-full">
				<Input
					placeholder="Digite o código de barras"
					value={newBarcode}
					onChange={(e) => setNewBarcode(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							addBarcode(newBarcode)
						}
					}}
					disabled={isAdding}
					className="flex-1 h-10"
				/>
				<Button
					type="button"
					size="icon"
					onClick={() => addBarcode(newBarcode)}
					disabled={!newBarcode || isAdding}
					title="Adicionar código de barras"
					className="h-10 w-10 shrink-0"
				>
					<Plus className="h-5 w-5" />
				</Button>
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
				{newBarcode && (
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={handleLookupBarcode}
						disabled={!newBarcode || isAdding}
						title="Buscar informações do produto com IA"
						className="h-10 w-10 shrink-0"
					>
						<Sparkles className="h-5 w-5" />
					</Button>
				)}
			</div>

			{showScanner && (
				<BarcodeScanner isOpen={showScanner} onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
			)}

		</div>
	)
}
