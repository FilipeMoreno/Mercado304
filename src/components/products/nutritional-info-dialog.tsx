"use client"

import { useState } from "react"
import { QrCode, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { NutritionalInfoForm } from "@/components/nutritional-info-form"
import type { NutritionalInfo } from "@/types"
import { useAnalyzeNutritionalLabelMutation, useSaveNutritionalInfoMutation } from "@/hooks/use-react-query"

interface NutritionalInfoDialogProps {
	productId: string
	onSuccess?: () => void
	onCancel?: () => void
	onShowScanner?: () => void
}

export function NutritionalInfoDialog({ productId, onSuccess, onCancel, onShowScanner }: NutritionalInfoDialogProps) {
	const [formData, setFormData] = useState<Partial<NutritionalInfo>>({})
	const [showScanner, setShowScanner] = useState(false)

	const analyzeMutation = useAnalyzeNutritionalLabelMutation()
	const saveMutation = useSaveNutritionalInfoMutation()

	const handleScanResult = async (imageData: string) => {
		setShowScanner(false)

		try {
			const result = await analyzeMutation.mutateAsync({
				image: imageData,
				productId,
			})

			// Preencher formulário com dados extraídos
			if (result.nutritionalInfo) {
				setFormData(prev => ({
					...prev,
					...result.nutritionalInfo,
				}))
				toast.success('Informações nutricionais extraídas com sucesso!')
			} else {
				toast.warning('Não foi possível extrair informações da imagem')
			}
		} catch (error) {
			console.error('Error analyzing image:', error)
			toast.error('Erro ao analisar a imagem')
		}
	}

	const handleSubmit = async () => {
		// Validar campos obrigatórios
		const requiredFields = ['calories', 'carbohydrates', 'proteins', 'totalFat', 'saturatedFat', 'transFat', 'fiber', 'sodium']
		const missingFields = requiredFields.filter(field => !formData[field as keyof NutritionalInfo])

		if (missingFields.length > 0) {
			toast.error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`)
			return
		}

		try {
			await saveMutation.mutateAsync({
				productId,
				data: formData,
			})
			onSuccess?.()
		} catch (error) {
			console.error('Error saving nutritional info:', error)
			// Error toast is handled by the mutation
		}
	}


	const isLoading = analyzeMutation.isPending || saveMutation.isPending

	return (
		<>
			{/* Botões de ação no topo - fora do scroll */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<Button
					variant="outline"
					onClick={onShowScanner}
					disabled={isLoading}
					className="flex-1"
				>
					<QrCode className="h-4 w-4 mr-2" />
					Scanner de Rótulo
				</Button>
				<Button
					variant="outline"
					disabled={true}
					className="flex-1 opacity-50"
					title="Em breve: Análise com IA"
				>
					<Sparkles className="h-4 w-4 mr-2" />
					Análise com IA
				</Button>
			</div>

			{analyzeMutation.isPending && (
				<div className="text-center py-4 mb-6">
					<div className="inline-flex items-center gap-2 text-blue-600">
						<Sparkles className="h-4 w-4 animate-spin" />
						<span>Analisando rótulo nutricional...</span>
					</div>
				</div>
			)}

			<Separator className="mb-6" />

			{/* Área de scroll */}
			<div className="space-y-6 mb-6">
				<NutritionalInfoForm
					initialData={formData}
					onDataChange={setFormData}
				/>
			</div>

			{/* Botões de ação na base - fora do scroll */}
			<div className="flex justify-end gap-3 pt-6 border-t bg-background">
				<Button
					variant="outline"
					onClick={onCancel}
					disabled={isLoading}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isLoading}
				>
					{saveMutation.isPending ? 'Salvando...' : 'Salvar Informações'}
				</Button>
			</div>
		</>
	)
}
