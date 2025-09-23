"use client"

import { Camera, CameraOff, Copy, Download, Eye, FileText, Loader2, RotateCcw, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface OCRResult {
	text: string
	confidence: number
	words: Array<{
		text: string
		confidence: number
		bbox: {
			x: number
			y: number
			width: number
			height: number
		}
	}>
}

interface OCRScannerProps {
	onTextDetected: (result: OCRResult) => void
	onClose: () => void
	isOpen: boolean
	mode?: "receipt" | "label" | "general"
}

export function OCRScanner({ onTextDetected, onClose, isOpen, mode = "general" }: OCRScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const workerRef = useRef<any>(null)

	const [isLoading, setIsLoading] = useState(true)
	const [hasCamera, setHasCamera] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [extractedText, setExtractedText] = useState("")
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDevice, setSelectedDevice] = useState<string>("")
	const [ocrReady, setOcrReady] = useState(false)
	const [progress, setProgress] = useState(0)

	const modeConfig = {
		receipt: {
			title: "Scanner de Nota Fiscal",
			description: "Digitalize notas fiscais automaticamente",
			icon: "🧾",
			tesseractOptions: {
				tessedit_pageseg_mode: "6", // Uniform block of text
				tessedit_char_whitelist:
					"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüý.,:-/$%()[]",
			},
		},
		label: {
			title: "Scanner de Etiquetas",
			description: "Extraia texto de etiquetas de produtos",
			icon: "🏷️",
			tesseractOptions: {
				tessedit_pageseg_mode: "8", // Single word
				tessedit_char_whitelist:
					"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüý.,:-/$%()[]",
			},
		},
		general: {
			title: "Scanner OCR Geral",
			description: "Extraia texto de qualquer imagem",
			icon: "📄",
			tesseractOptions: {
				tessedit_pageseg_mode: "3", // Fully automatic page segmentation
			},
		},
	}

	const config = modeConfig[mode]

	// Inicializar Tesseract worker
	useEffect(() => {
		const initTesseract = async () => {
			if (!isOpen) return

			try {
				setIsLoading(true)

				// Carregar Tesseract dinamicamente
				const Tesseract = (await import("tesseract.js")).default

				const worker = await Tesseract.createWorker("por", 1, {
					logger: (m) => {
						if (m.status === "recognizing text") {
							setProgress(Math.round(m.progress * 100))
						}
					},
				})

				// Configurar opções específicas do modo
				await worker.setParameters(config.tesseractOptions as any)

				workerRef.current = worker
				setOcrReady(true)
				console.log("🔤 Tesseract OCR inicializado")
				toast.success("🤖 OCR carregado e pronto!")
			} catch (error) {
				console.error("Erro ao inicializar Tesseract:", error)
				toast.error("Erro ao carregar OCR. Algumas funcionalidades podem não funcionar.")
			} finally {
				setIsLoading(false)
			}
		}

		initTesseract()

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate()
				workerRef.current = null
			}
		}
	}, [isOpen, config.tesseractOptions])

	// Verificar câmeras disponíveis
	useEffect(() => {
		const getDevices = async () => {
			if (!isOpen) return

			try {
				await navigator.mediaDevices.getUserMedia({ video: true })
				const devices = await navigator.mediaDevices.enumerateDevices()
				const videoDevices = devices.filter((device) => device.kind === "videoinput")
				setDevices(videoDevices)
				setHasCamera(videoDevices.length > 0)

				// Preferir câmera traseira
				const backCamera = videoDevices.find(
					(device) =>
						device.label.toLowerCase().includes("back") ||
						device.label.toLowerCase().includes("rear") ||
						device.label.toLowerCase().includes("environment"),
				)
				setSelectedDevice(backCamera?.deviceId || videoDevices[0]?.deviceId || "")
			} catch (error) {
				console.error("Erro ao acessar câmera:", error)
				setHasCamera(false)
			}
		}

		getDevices()
	}, [isOpen])

	// Inicializar câmera
	useEffect(() => {
		if (!isOpen || !hasCamera || !selectedDevice) return

		const startCamera = async () => {
			try {
				const constraints = {
					video: {
						deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
						facingMode: selectedDevice ? undefined : "environment",
						width: { ideal: 1920, min: 1280 },
						height: { ideal: 1080, min: 720 },
					},
				}

				const stream = await navigator.mediaDevices.getUserMedia(constraints)
				streamRef.current = stream

				if (videoRef.current) {
					videoRef.current.srcObject = stream
					videoRef.current.play()
				}
			} catch (error) {
				console.error("Erro ao iniciar câmera:", error)
				toast.error("Erro ao iniciar câmera")
			}
		}

		startCamera()

		return () => {
			stopCamera()
		}
	}, [isOpen, hasCamera, selectedDevice])

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
			streamRef.current = null
		}

		if (videoRef.current) {
			videoRef.current.srcObject = null
		}
	}

	const performOCR = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
		if (!workerRef.current || !ocrReady) {
			toast.error("OCR não está pronto")
			return
		}

		try {
			setIsProcessing(true)
			setProgress(0)

			console.log("🔤 Iniciando OCR...")

			// Realizar OCR
			const { data } = await workerRef.current.recognize(imageElement)

			// Processar resultado
			const result: OCRResult = {
				text: data.text.trim(),
				confidence: Math.round(data.confidence),
				words: data.words
					.map((word: any) => ({
						text: word.text,
						confidence: Math.round(word.confidence),
						bbox: word.bbox,
					}))
					.filter((word: any) => word.confidence > 30), // Filtrar palavras com baixa confiança
			}

			console.log("📄 Texto extraído:", result)
			setExtractedText(result.text)

			if (result.text.trim()) {
				onTextDetected(result)
				toast.success(`📝 ${result.words.length} palavras extraídas!`)
			} else {
				toast.warning("Nenhum texto foi detectado na imagem")
			}
		} catch (error) {
			console.error("Erro no OCR:", error)
			toast.error("Erro ao extrair texto da imagem")
		} finally {
			setIsProcessing(false)
			setProgress(0)
		}
	}

	const capturePhoto = async () => {
		if (!videoRef.current || !canvasRef.current) return

		const canvas = canvasRef.current
		const video = videoRef.current
		const context = canvas.getContext("2d")

		if (!context) return

		// Configurar canvas com alta qualidade
		canvas.width = video.videoWidth
		canvas.height = video.videoHeight

		// Aplicar filtros para melhorar OCR
		context.filter = "contrast(1.2) brightness(1.1) saturate(0.9)"
		context.drawImage(video, 0, 0, canvas.width, canvas.height)

		// Realizar OCR no frame capturado
		await performOCR(canvas)
	}

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const img = new Image()
		img.onload = async () => {
			await performOCR(img)
		}
		img.src = URL.createObjectURL(file)
	}

	const switchCamera = () => {
		if (devices.length <= 1) return

		const currentIndex = devices.findIndex((device) => device.deviceId === selectedDevice)
		const nextIndex = (currentIndex + 1) % devices.length
		setSelectedDevice(devices[nextIndex].deviceId)
	}

	const copyToClipboard = async () => {
		if (extractedText) {
			await navigator.clipboard.writeText(extractedText)
			toast.success("Texto copiado para a área de transferência!")
		}
	}

	const downloadText = () => {
		if (extractedText) {
			const blob = new Blob([extractedText], { type: "text/plain" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = `ocr-extract-${Date.now()}.txt`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
			toast.success("Arquivo de texto baixado!")
		}
	}

	const clearText = () => {
		setExtractedText("")
	}

	if (!isOpen) return null

	if (isLoading) {
		return (
			<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
				<Card className="w-80">
					<CardContent className="p-6 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p>Carregando OCR...</p>
						<p className="text-xs text-gray-500 mt-2">Iniciando reconhecimento de texto</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
			{/* Header */}
			<div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
				<div className="flex items-center gap-2">
					<FileText className="h-5 w-5" />
					<span className="font-medium">{config.title}</span>
					{ocrReady && (
						<Badge variant="secondary" className="bg-green-500/20 text-green-300">
							OCR Ativo
						</Badge>
					)}
				</div>
				<Button variant="ghost" size="icon" onClick={onClose} className="text-white">
					<CameraOff className="h-5 w-5" />
				</Button>
			</div>

			{/* Camera/Upload Area */}
			<div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden mb-4">
				{hasCamera ? (
					<>
						<video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
						<canvas ref={canvasRef} style={{ display: "none" }} />

						{/* Overlay de scanning */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-72 h-56 border-2 border-blue-400/50 rounded-lg relative">
								<div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
								<div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
								<div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
								<div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>

								{/* Indicador de OCR */}
								<div className="absolute top-2 left-2">
									<Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
										<FileText className="h-3 w-3 mr-1" />
										OCR
									</Badge>
								</div>
							</div>
						</div>

						{/* Status */}
						{isProcessing && (
							<div className="absolute top-4 left-4 right-4">
								<Badge variant="secondary" className="bg-blue-500/20 text-blue-300 animate-pulse w-full justify-center">
									<Loader2 className="h-3 w-3 mr-1 animate-spin" />
									Processando... {progress}%
								</Badge>
							</div>
						)}
					</>
				) : (
					<div className="w-full h-full flex items-center justify-center text-white">
						<div className="text-center">
							<CameraOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>Câmera não disponível</p>
							<p className="text-sm opacity-70">Use o upload de imagem</p>
						</div>
					</div>
				)}
			</div>

			{/* Controles */}
			<div className="w-full max-w-md px-4">
				<div className="flex justify-center gap-3 mb-4">
					{hasCamera && (
						<>
							<Button
								onClick={capturePhoto}
								disabled={isProcessing || !ocrReady}
								className="bg-blue-600 hover:bg-blue-700"
							>
								{isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
								Extrair Texto
							</Button>

							{devices.length > 1 && (
								<Button
									variant="outline"
									size="icon"
									onClick={switchCamera}
									className="bg-black/50 border-white/30 text-white"
								>
									<RotateCcw className="h-4 w-4" />
								</Button>
							)}
						</>
					)}

					<Button
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						disabled={isProcessing || !ocrReady}
						className="bg-black/50 border-white/30 text-white"
					>
						<Upload className="h-4 w-4 mr-2" />
						Upload
					</Button>

					{extractedText && (
						<Button variant="outline" onClick={clearText} className="bg-black/50 border-white/30 text-white">
							Limpar
						</Button>
					)}
				</div>

				{/* Input de arquivo escondido */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileUpload}
					style={{ display: "none" }}
				/>

				{/* Resultados */}
				{extractedText && (
					<Card className="bg-black/50 border-white/30">
						<CardHeader>
							<CardTitle className="text-white text-sm flex items-center justify-between">
								<span className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-blue-400" />
									Texto Extraído
								</span>
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={copyToClipboard}
										className="text-white hover:bg-white/20 h-8 w-8 p-0"
									>
										<Copy className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={downloadText}
										className="text-white hover:bg-white/20 h-8 w-8 p-0"
									>
										<Download className="h-3 w-3" />
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								value={extractedText}
								onChange={(e) => setExtractedText(e.target.value)}
								className="bg-white/10 border-white/30 text-white placeholder-white/50 min-h-24"
								placeholder="Texto extraído aparecerá aqui..."
							/>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Instruções */}
			<div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm opacity-80">
				<p>
					{config.icon} {config.description}
				</p>
				<p className="text-xs mt-1">Funciona melhor com texto bem iluminado e nítido</p>
			</div>
		</div>
	)
}
