"use client"

import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useEffectEvent, useId, useState } from "react"
import { ProductDuplicateDialog } from "@/components/products/product-duplicate-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProductDuplicateCheck } from "@/hooks/use-product-duplicate-check"

interface ProductNameInputProps {
	value: string
	onChange: (value: string) => void
	onBlur?: () => void
	placeholder?: string
	disabled?: boolean
	fieldError?: string
	onClearError?: () => void
	brandId?: string
	categoryId?: string
	currentBarcode?: string // Código de barras que o usuário já preencheu
}

export function ProductNameInput({
	value,
	onChange,
	onBlur,
	placeholder = "Nome do produto",
	disabled = false,
	fieldError,
	onClearError,
	brandId,
	categoryId,
	currentBarcode,
}: ProductNameInputProps) {
	const id = useId()
	const router = useRouter()
	const [showDialog, setShowDialog] = useState(false)
	const [dialogShown, setDialogShown] = useState(false)

	const { duplicateProduct, isChecking } = useProductDuplicateCheck({
		productName: value,
		brandId,
		categoryId
	})

	// useEffectEvent para abrir dialog - sempre vê as props mais recentes
	const onHandleDuplicateDialog = useEffectEvent(() => {
		if (duplicateProduct && !dialogShown && !fieldError && value.length >= 3) {
			setShowDialog(true)
			setDialogShown(true)
		}

		// Reset quando o nome mudar
		if (!duplicateProduct) {
			setDialogShown(false)
		}
	})

	useEffect(() => {
		onHandleDuplicateDialog()
	}, [duplicateProduct]) // ✅ dialogShown, fieldError, value não são dependências (Effect Event)

	const showDuplicateIndicator = value.length >= 3 && duplicateProduct && !fieldError

	const handleAddBarcode = () => {
		setShowDialog(false)
		// Navegar para a página de edição do produto com foco em adicionar código de barras
		// Se houver código de barras preenchido, passar como parâmetro
		const url = currentBarcode
			? `/produtos/${duplicateProduct?.id}?action=add-barcode&barcode=${encodeURIComponent(currentBarcode)}`
			: `/produtos/${duplicateProduct?.id}?action=add-barcode`
		router.push(url)
	}

	const handleEditProduct = () => {
		setShowDialog(false)
		// Navegar para a página de edição do produto
		router.push(`/produtos/${duplicateProduct?.id}`)
	}

	const handleContinue = () => {
		setShowDialog(false)
		// Apenas fecha o dialog e permite continuar o cadastro
	}

	const handleCloseDialog = () => {
		setShowDialog(false)
	}

	return (
		<div className="space-y-2">
			<Label htmlFor={id} className="text-sm font-medium">Nome do Produto *</Label>
			<div className="relative">
				<Input
					id={id}
					placeholder={placeholder}
					value={value}
					onChange={(e) => {
						onChange(e.target.value)
						if (onClearError) {
							onClearError()
						}
					}}
					onBlur={onBlur}
					disabled={disabled}
					className={fieldError ? "border-destructive" : showDuplicateIndicator ? "border-yellow-500" : ""}
				/>
				{isChecking && value.length >= 3 && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>

			{fieldError && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{fieldError}</AlertDescription>
				</Alert>
			)}

			{showDuplicateIndicator && (
				<Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
					<AlertTriangle className="h-4 w-4 text-yellow-600" />
					<AlertDescription className="flex items-center justify-between gap-2">
						<div className="text-yellow-800 dark:text-yellow-200">
							<span className="font-medium">Produto similar encontrado:</span>{" "}
							{duplicateProduct.name}
							{duplicateProduct.brand?.name && <span className="ml-1">({duplicateProduct.brand.name})</span>}
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowDialog(true)}
							className="shrink-0 border-yellow-600 hover:bg-yellow-100"
						>
							Ver opções
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{duplicateProduct && (
				<ProductDuplicateDialog
					isOpen={showDialog}
					existingProduct={duplicateProduct}
					onClose={handleCloseDialog}
					onAddBarcode={handleAddBarcode}
					onEditProduct={handleEditProduct}
					onContinue={handleContinue}
				/>
			)}
		</div>
	)
}
