"use client"

import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useId, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ImageUploadProps {
	currentImageUrl?: string
	onImageChange: (imageUrl: string | null) => void
	onUploadStateChange?: (isUploading: boolean) => void
	disabled?: boolean
	className?: string
	folder?: "markets" | "brands" | "products" | "uploads"
}

export function ImageUpload({ currentImageUrl, onImageChange, onUploadStateChange, disabled = false, className = "", folder = "uploads" }: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
	const [isDragOver, setIsDragOver] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const uploadInstructionsId = useId()

	// Sincronizar previewUrl quando currentImageUrl mudar (para edição)
	useEffect(() => {
		setPreviewUrl(currentImageUrl || null)
	}, [currentImageUrl])

	const processFile = async (file: File) => {
		// Validar tipo de arquivo
		if (!file.type.startsWith("image/")) {
			toast.error("Por favor, selecione apenas arquivos de imagem")
			return
		}

		// Validar tamanho (máximo 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("A imagem deve ter no máximo 5MB")
			return
		}

		setIsUploading(true)
		onUploadStateChange?.(true)

		try {
			// Criar preview local
			const reader = new FileReader()
			reader.onload = (e) => {
				const result = e.target?.result as string
				setPreviewUrl(result)
			}
			reader.readAsDataURL(file)

			// Upload para o servidor
			const formData = new FormData()
			formData.append("file", file)

			const response = await fetch(`/api/upload/image?folder=${folder}`, {
				method: "POST",
				body: formData,
			})

			if (!response.ok) {
				throw new Error("Erro no upload da imagem")
			}

			const data = await response.json()
			onImageChange(data.imageUrl)
			toast.success("Imagem enviada com sucesso!")
		} catch (error) {
			console.error("Erro no upload:", error)
			toast.error("Erro ao enviar imagem")
			setPreviewUrl(currentImageUrl || null)
		} finally {
			setIsUploading(false)
			onUploadStateChange?.(false)
		}
	}

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return
		await processFile(file)
	}

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		if (!disabled) {
			setIsDragOver(true)
		}
	}

	const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragOver(false)
	}

	const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragOver(false)

		if (disabled) return

		const files = event.dataTransfer.files
		if (files.length > 0) {
			const file = files[0]
			await processFile(file)
		}
	}

	// Prevenir comportamento padrão de drag na página
	const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
	}

	const handleRemoveImage = () => {
		setPreviewUrl(null)
		onImageChange(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const handleClick = () => {
		if (!disabled) {
			fileInputRef.current?.click()
		}
	}

	return (
		<div className={className}>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileSelect}
				className="hidden"
				disabled={disabled}
				aria-label="Selecionar imagem do mercado"
			/>

			{previewUrl ? (
				<Card className="relative group">
					<CardContent className="p-0">
						<div className="relative w-full h-48">
							<Image
								src={previewUrl}
								alt="Preview da imagem"
								fill
								className="object-cover rounded-lg"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							/>
							{!disabled && (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={handleRemoveImage}
									disabled={isUploading}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			) : (
				<Card
					className={`cursor-pointer transition-all duration-200 ${
						isDragOver ? "bg-blue-50 border-blue-300 border-2 border-dashed scale-105" : "hover:bg-gray-50"
					} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
					onClick={handleClick}
					onDragEnter={handleDragEnter}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					role="button"
					tabIndex={disabled ? -1 : 0}
					aria-label="Área de upload de imagem. Clique ou arraste uma imagem aqui."
					aria-describedby={uploadInstructionsId}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault()
							handleClick()
						}
					}}
				>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="text-center">
							{isUploading ? (
								<Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
							) : isDragOver ? (
								<Upload className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
							) : (
								<ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							)}
							<p id={uploadInstructionsId} className="text-sm text-gray-600 mb-2">
								{isUploading
									? "Enviando imagem..."
									: isDragOver
										? "Solte a imagem aqui"
										: "Clique ou arraste uma imagem aqui"}
							</p>
							<p className="text-xs text-gray-500">PNG, JPG ou WEBP até 5MB</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
