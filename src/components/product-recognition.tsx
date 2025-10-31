"use client"

import { Brain, Camera, CameraOff, Eye, Loader2, RotateCcw, Upload } from "lucide-react"
import { useEffect, useRef, useState, Activity } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductPrediction {
	label: string
	confidence: number
	category?: string
}

interface ProductRecognitionProps {
	onProductDetected: (predictions: ProductPrediction[]) => void
	onClose: () => void
	isOpen: boolean
}

export function ProductRecognition({ onProductDetected, onClose, isOpen }: ProductRecognitionProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const modelRef = useRef<any>(null)

	const [isLoading, setIsLoading] = useState(true)
	const [hasCamera, setHasCamera] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [predictions, setPredictions] = useState<ProductPrediction[]>([])
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDevice, setSelectedDevice] = useState<string>("")
	const [modelLoaded, setModelLoaded] = useState(false)

	// Carregar modelo TensorFlow.js MobileNet
	useEffect(() => {
		const loadModel = async () => {
			if (!isOpen) return

			try {
				setIsLoading(true)
				// Simular carregamento do modelo por enquanto
				await new Promise((resolve) => setTimeout(resolve, 2000))

				// TODO: Implementar carregamento real do TensorFlow quando necessário
				setModelLoaded(true)
				console.log("🤖 Modelo simulado carregado")
				toast.success("🧠 Modelo de IA carregado!")
			} catch (error) {
				console.error("Erro ao carregar modelo:", error)
				toast.error("Erro ao carregar modelo de IA.")
			} finally {
				setIsLoading(false)
			}
		}

		loadModel()
	}, [isOpen])

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
						width: { ideal: 640 },
						height: { ideal: 480 },
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

	const analyzeImage = async (imageElement: HTMLImageElement | HTMLVideoElement) => {
		if (!modelLoaded) {
			toast.error("Modelo de IA não carregado")
			return
		}

		try {
			setIsAnalyzing(true)

			// Simular análise de IA
			await new Promise((resolve) => setTimeout(resolve, 1500))

			// Predições simuladas
			const mockPredictions: ProductPrediction[] = [
				{
					label: "Banana",
					confidence: 85,
					category: categorizeProduct("Banana"),
				},
				{
					label: "Apple",
					confidence: 78,
					category: categorizeProduct("Apple"),
				},
				{
					label: "Orange",
					confidence: 65,
					category: categorizeProduct("Orange"),
				},
			]

			console.log("🔍 Predições simuladas:", mockPredictions)
			setPredictions(mockPredictions)

			if (mockPredictions.length > 0) {
				onProductDetected(mockPredictions)
				toast.success(`📸 ${mockPredictions.length} produto(s) identificado(s)!`)
			} else {
				toast.warning("Nenhum produto reconhecido")
			}
		} catch (error) {
			console.error("Erro na análise:", error)
			toast.error("Erro ao analisar imagem")
		} finally {
			setIsAnalyzing(false)
		}
	}

	const categorizeProduct = (label: string): string => {
		const categories: { [key: string]: string[] } = {
			Frutas: ["banana", "apple", "orange", "strawberry", "lemon", "pineapple", "grape"],
			Vegetais: ["broccoli", "carrot", "corn", "cucumber", "bell pepper", "mushroom"],
			Bebidas: ["wine bottle", "beer bottle", "coffee mug", "cup", "pop bottle"],
			Pães: ["bagel", "pretzel", "croissant", "pizza"],
			Proteínas: ["hot dog", "hamburger", "taco"],
			Doces: ["ice cream", "chocolate", "cake", "cookie"],
		}

		const lowerLabel = label.toLowerCase()
		for (const [category, items] of Object.entries(categories)) {
			if (items.some((item) => lowerLabel.includes(item))) {
				return category
			}
		}
		return "Outros"
	}

	const capturePhoto = async () => {
		if (!videoRef.current || !canvasRef.current) return

		const canvas = canvasRef.current
		const video = videoRef.current
		const context = canvas.getContext("2d")

		if (!context) return

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		context.drawImage(video, 0, 0, canvas.width, canvas.height)

		await analyzeImage(video)
	}

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const img = new Image()
		img.onload = async () => {
			await analyzeImage(img)
		}
		img.src = URL.createObjectURL(file)
	}

	const switchCamera = () => {
		if (devices.length <= 1) return

		const currentIndex = devices.findIndex((device) => device.deviceId === selectedDevice)
		const nextIndex = (currentIndex + 1) % devices.length
		setSelectedDevice(devices[nextIndex].deviceId)
	}

	const clearPredictions = () => {
		setPredictions([])
	}

	if (!isOpen) return null

	if (isLoading) {
		return (
			<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
				<Card className="w-80">
					<CardContent className="p-6 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p>Carregando modelo de IA...</p>
						<p className="text-xs text-gray-500 mt-2">Pode levar alguns segundos</p>
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
					<Brain className="h-5 w-5" />
					<span className="font-medium">Reconhecimento de Produtos IA</span>
					{modelLoaded && (
						<Badge variant="secondary" className="bg-green-500/20 text-green-300">
							IA Ativa
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

						{/* Overlay de análise */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-64 h-48 border-2 border-blue-400/50 rounded-lg relative">
								<div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
								<div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
								<div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
								<div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>

								<div className="absolute top-2 left-2">
									<Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
										<Brain className="h-3 w-3 mr-1" />
										IA
									</Badge>
								</div>
							</div>
						</div>

						{/* Status */}
						{isAnalyzing && (
							<div className="absolute top-4 left-4">
								<Badge variant="secondary" className="bg-blue-500/20 text-blue-300 animate-pulse">
									<Loader2 className="h-3 w-3 mr-1 animate-spin" />
									Analisando...
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
								disabled={isAnalyzing || !modelLoaded}
								className="bg-blue-600 hover:bg-blue-700"
							>
								{isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
								Analisar
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
						disabled={isAnalyzing || !modelLoaded}
						className="bg-black/50 border-white/30 text-white"
					>
						<Upload className="h-4 w-4 mr-2" />
						Upload
					</Button>

					{predictions.length > 0 && (
						<Button variant="outline" onClick={clearPredictions} className="bg-black/50 border-white/30 text-white">
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
				{predictions.length > 0 && (
					<Card className="bg-black/50 border-white/30">
						<CardHeader>
							<CardTitle className="text-white text-sm flex items-center gap-2">
								<Brain className="h-4 w-4 text-yellow-400" />
								Produtos Detectados
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{predictions.map((prediction, index) => (
								<div key={index} className="flex justify-between items-center">
									<div className="text-white">
										<p className="text-sm font-medium">{prediction.label}</p>
										{prediction.category && <p className="text-xs text-gray-400">{prediction.category}</p>}
									</div>
									<Badge
										variant="secondary"
										className={`${
											prediction.confidence > 70
												? "bg-green-500/20 text-green-300"
												: prediction.confidence > 40
													? "bg-yellow-500/20 text-yellow-300"
													: "bg-red-500/20 text-red-300"
										}`}
									>
										{prediction.confidence}%
									</Badge>
								</div>
							))}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Instruções */}
			<div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm opacity-80">
				<p>🧠 Use IA para identificar produtos por imagem</p>
				<p className="text-xs mt-1">Funciona melhor com produtos bem iluminados e centralizados</p>
			</div>
		</div>
	)
}
