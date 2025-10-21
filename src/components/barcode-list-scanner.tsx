"use client"

import { Camera, Loader2, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

interface BarcodeListScannerProps {
	isOpen: boolean
	onScanComplete: (barcodes: string[]) => void
	onClose: () => void
}

export function BarcodeListScanner({ isOpen, onScanComplete, onClose }: BarcodeListScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [isCameraActive, setIsCameraActive] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [capturedImage, setCapturedImage] = useState<string>("")
	const [error, setError] = useState<string>("")

	// Inicializar câmera
	const initializeCamera = useCallback(async () => {
		try {
			setError("")
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment",
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			})

			if (videoRef.current) {
				videoRef.current.srcObject = stream
				streamRef.current = stream
				setIsCameraActive(true)
			}
		} catch (err) {
			console.error("Erro ao acessar câmera:", err)
			setError("Não foi possível acessar a câmera. Você pode fazer upload de uma foto.")
			toast.error("Erro ao acessar câmera")
		}
	}, [])

	// Parar câmera
	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => {
				track.stop()
			})
			streamRef.current = null
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null
		}
		setIsCameraActive(false)
	}, [])

	// Processar imagem
	const processImage = useCallback(
		async (dataUrl: string) => {
			setCapturedImage(dataUrl)
			setIsProcessing(true)
			stopCamera()

			try {
				toast.info("Processando códigos de barras...")

				const response = await fetch("/api/ocr/barcode-list", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ imageUrl: dataUrl }),
				})

				if (!response.ok) {
					const error = await response.json()
					throw new Error(error.error || "Falha ao processar imagem")
				}

				const result = await response.json()

				if (result.barcodes && result.barcodes.length > 0) {
					toast.success(`${result.barcodes.length} código(s) de barras encontrado(s)!`)
					onScanComplete(result.barcodes)
				} else {
					toast.warning("Nenhum código de barras foi detectado na imagem")
				}
			} catch (error) {
				console.error("Erro ao processar imagem:", error)
				const errorMessage = error instanceof Error ? error.message : "Erro ao processar imagem"
				toast.error(errorMessage)
			} finally {
				setIsProcessing(false)
				setCapturedImage("")
			}
		},
		[onScanComplete, stopCamera],
	)

	// Capturar foto
	const takePicture = useCallback(async () => {
		const video = videoRef.current
		const canvas = canvasRef.current

		if (!video || !canvas) return

		const context = canvas.getContext("2d")
		if (!context) return

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

		const dataUrl = canvas.toDataURL("image/jpeg", 0.95)
		await processImage(dataUrl)
	}, [processImage])

	// Upload de arquivo
	const handleFileUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (!file) return

			const reader = new FileReader()
			reader.onload = async (e) => {
				const dataUrl = e.target?.result as string
				await processImage(dataUrl)
			}
			reader.readAsDataURL(file)
		},
		[processImage],
	)

	// Inicializar quando abrir
	useEffect(() => {
		if (isOpen) {
			initializeCamera()
		} else {
			stopCamera()
			setCapturedImage("")
			setIsProcessing(false)
			setError("")
		}
	}, [isOpen, initializeCamera, stopCamera])

	// Cleanup
	useEffect(() => {
		return () => {
			stopCamera()
		}
	}, [stopCamera])

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={onClose} title="Escanear Códigos de Barras" maxWidth="2xl">
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Tire uma foto do cupom fiscal para extrair automaticamente os códigos de barras dos produtos.
				</p>

				{error && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
						<p className="text-sm text-yellow-800">{error}</p>
					</div>
				)}

				{/* Vídeo da câmera */}
				{!capturedImage && !isProcessing && (
					<div className="relative aspect-video bg-black rounded-lg overflow-hidden">
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="w-full h-full object-cover"
							style={{ transform: "scaleX(-1)" }}
						/>
						<canvas ref={canvasRef} className="hidden" />

						{isCameraActive && (
							<div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-lg pointer-events-none flex items-center justify-center">
								<div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
									📱 Posicione o cupom na área da câmera
								</div>
							</div>
						)}
					</div>
				)}

				{/* Imagem processando */}
				{isProcessing && (
					<div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
						<div className="text-center space-y-3">
							<Loader2 className="size-12 animate-spin text-blue-500 mx-auto" />
							<div>
								<p className="font-semibold">Processando imagem...</p>
								<p className="text-sm text-muted-foreground">Extraindo códigos de barras</p>
							</div>
						</div>
					</div>
				)}

				{/* Botões de ação */}
				{!isProcessing && (
					<div className="flex gap-2">
						{isCameraActive ? (
							<Button onClick={takePicture} className="flex-1 gap-2">
								<Camera className="size-4" />
								Capturar Foto
							</Button>
						) : (
							<Button onClick={initializeCamera} variant="outline" className="flex-1 gap-2">
								<Camera className="size-4" />
								Ativar Câmera
							</Button>
						)}

						<Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 gap-2">
							<Upload className="size-4" />
							Fazer Upload
						</Button>
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
					</div>
				)}

				{/* Dicas */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-sm font-semibold text-blue-900 mb-2">💡 Dicas para melhor resultado:</p>
					<ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
						<li>Certifique-se de que os códigos de barras estejam visíveis e nítidos</li>
						<li>Evite reflexos e sombras sobre os códigos</li>
						<li>Mantenha o cupom plano e bem iluminado</li>
						<li>Os códigos serão associados automaticamente aos itens corretos usando nome, preço e valor</li>
					</ul>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
