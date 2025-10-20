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

interface NutritionalInfoDialogProps {
	productId: string
	onSuccess?: () => void
	onCancel?: () => void
	onShowScanner?: () => void
}

export function NutritionalInfoDialog({ productId, onSuccess, onCancel, onShowScanner }: NutritionalInfoDialogProps) {
	const [formData, setFormData] = useState<Partial<NutritionalInfo>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showScanner, setShowScanner] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)

	const handleScanResult = async (imageData: string) => {
		try {
			setIsAnalyzing(true)
			setShowScanner(false)

			// Chamar API para analisar a imagem com IA
			const response = await fetch('/api/ai/analyze-nutritional-label', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					image: imageData,
					productId,
				}),
			})

			if (!response.ok) {
				throw new Error('Erro ao analisar a imagem')
			}

			const result = await response.json()

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
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleSubmit = async () => {
		try {
			setIsSubmitting(true)

			// Validar campos obrigatórios
			const requiredFields = ['calories', 'carbohydrates', 'proteins', 'totalFat', 'saturatedFat', 'transFat', 'fiber', 'sodium']
			const missingFields = requiredFields.filter(field => !formData[field as keyof NutritionalInfo])

			if (missingFields.length > 0) {
				toast.error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`)
				return
			}

			// Enviar dados para a API
			const response = await fetch(`/api/products/${productId}/nutritional-info`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...formData,
					productId,
				}),
			})

			if (!response.ok) {
				throw new Error('Erro ao salvar informações nutricionais')
			}

			toast.success('Informações nutricionais salvas com sucesso!')
			onSuccess?.()
		} catch (error) {
			console.error('Error saving nutritional info:', error)
			toast.error('Erro ao salvar informações nutricionais')
		} finally {
			setIsSubmitting(false)
		}
	}


	return (
		<>
			{/* Botões de ação no topo - fora do scroll */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<Button
					variant="outline"
					onClick={onShowScanner}
					disabled={isSubmitting || isAnalyzing}
					className="flex-1"
				>
					<QrCode className="size-4 mr-2" />
					Scanner de Rótulo
				</Button>
				<Button
					variant="outline"
					disabled={true}
					className="flex-1 opacity-50"
					title="Em breve: Análise com IA"
				>
					<Sparkles className="size-4 mr-2" />
					Análise com IA
				</Button>
			</div>

			{isAnalyzing && (
				<div className="text-center py-4 mb-6">
					<div className="inline-flex items-center gap-2 text-blue-600">
						<Sparkles className="size-4 animate-spin" />
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
					disabled={isSubmitting || isAnalyzing}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || isAnalyzing}
				>
					{isSubmitting ? 'Salvando...' : 'Salvar Informações'}
				</Button>
			</div>
		</>
	)
}
