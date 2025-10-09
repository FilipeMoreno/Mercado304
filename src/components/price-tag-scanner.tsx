"use client"

import { Camera, CameraOff, Flashlight, FlashlightOff, RotateCcw, X, Zap } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PriceTagScannerProps {
	onScan: (result: { barcode: string; price: number; confidence: number }) => void
	onClose: () => void
	isOpen: boolean
	marketId?: string
}

interface ScanResult {
	barcode: string
	price: number
	confidence: number
	rawText?: string
}

export function PriceTagScanner({ onScan, onClose, isOpen, marketId }: PriceTagScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	
	const [error, setError] = useState<string>("")
	const [isFlashOn, setIsFlashOn] = useState(false)
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
	const [isLoading, setIsLoading] = useState(true)
	const [isCameraActive, setIsCameraActive] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [capturedImage, setCapturedImage] = useState<string>("")

	// Função para listar câmeras disponíveis
	const getVideoDevices = useCallback(async () => {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("API de mídia não suportada neste navegador")
			}

			// Solicitar permissão básica primeiro
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
			})

			// Parar o stream temporário
			stream.getTracks().forEach((track) => track.stop())

			const deviceList = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = deviceList.filter((device) => device.kind === "videoinput")

			console.log(
				"Dispositivos de vídeo encontrados:",
				videoDevices.map((d) => ({ id: d.deviceId, label: d.label })),
			)

			setDevices(videoDevices)

			// Preferir câmera traseira se disponível
			const backCamera = videoDevices.find(
				(device) =>
					device.label.toLowerCase().includes("back") ||
					device.label.toLowerCase().includes("rear") ||
					device.label.toLowerCase().includes("environment") ||
					device.label.toLowerCase().includes("facing back") ||
					device.label.toLowerCase().includes("traseira"),
			)

			const selectedId = backCamera?.deviceId || videoDevices[0]?.deviceId || ""
			console.log("Câmera selecionada:", selectedId, backCamera?.label || videoDevices[0]?.label)

			setSelectedDeviceId(selectedId)
			return selectedId
		} catch (err: any) {
			console.error("Erro ao listar dispositivos:", err)
			let errorMessage = "Erro ao acessar a câmera."

			if (err.name === "NotAllowedError") {
				errorMessage = "Permissão negada. Permita o acesso à câmera."
			} else if (err.name === "NotFoundError") {
				errorMessage = "Nenhuma câmera encontrada."
			} else if (err.name === "NotSupportedError") {
				errorMessage = "Câmera não suportada neste navegador."
			} else if (err.name === "NotReadableError") {
				errorMessage = "Câmera em uso por outro aplicativo."
			} else if (err.name === "OverconstrainedError") {
				errorMessage = "Configurações de câmera não suportadas."
			}

			setError(errorMessage)
			return ""
		}
	}, [])

	// Função para alternar flash/lanterna
	const toggleFlash = useCallback(async () => {
		if (!streamRef.current) return

		const track = streamRef.current.getVideoTracks()[0]
		if (!track) return

		try {
			const capabilities = track.getCapabilities() as any
			if (capabilities.torch) {
				await track.applyConstraints({
					advanced: [{ torch: !isFlashOn } as any],
				})
				setIsFlashOn(!isFlashOn)
			}
		} catch (err) {
			console.error("Erro ao controlar flash:", err)
		}
	}, [isFlashOn])

	// Função para alternar câmera
	const switchCamera = useCallback(async () => {
		const currentIndex = devices.findIndex((device) => device.deviceId === selectedDeviceId)
		const nextIndex = (currentIndex + 1) % devices.length
		const nextDevice = devices[nextIndex]

		if (nextDevice) {
			setSelectedDeviceId(nextDevice.deviceId)
		}
	}, [devices, selectedDeviceId])

	// Função para parar stream
	const stopStream = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
			streamRef.current = null
		}

		setIsCameraActive(false)
		setIsFlashOn(false)
	}, [])

	// Função para inicializar câmera
	const initializeCamera = useCallback(
		async (deviceId: string) => {
			try {
				setIsLoading(true)
				setError("")

				const videoElement = videoRef.current
				if (!videoElement) {
					throw new Error("Elemento de vídeo não encontrado")
				}

				// Parar stream anterior se existir
				stopStream()

				console.log("Inicializando câmera com dispositivo:", deviceId)

				// Configurações otimizadas para captura de etiquetas
				const constraints = {
					video: deviceId
						? {
								deviceId: { exact: deviceId },
								width: { ideal: 1920, min: 1280 },
								height: { ideal: 1080, min: 720 },
								frameRate: { ideal: 30, min: 20 },
								focusMode: { ideal: "continuous" },
								exposureMode: { ideal: "continuous" },
								whiteBalanceMode: { ideal: "continuous" },
							}
						: {
								facingMode: { ideal: "environment" },
								width: { ideal: 1920, min: 1280 },
								height: { ideal: 1080, min: 720 },
								frameRate: { ideal: 30, min: 20 },
								focusMode: { ideal: "continuous" },
								exposureMode: { ideal: "continuous" },
								whiteBalanceMode: { ideal: "continuous" },
							},
				}

				const stream = await navigator.mediaDevices.getUserMedia(constraints)
				streamRef.current = stream
				videoElement.srcObject = stream

				// Aguardar o vídeo carregar
				await new Promise<void>((resolve, reject) => {
					const onLoadedMetadata = () => {
						videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
						videoElement.removeEventListener("error", onError)
						resolve()
					}

					const onError = (e: Event) => {
						videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
						videoElement.removeEventListener("error", onError)
						reject(new Error("Erro ao carregar vídeo"))
					}

					videoElement.addEventListener("loadedmetadata", onLoadedMetadata)
					videoElement.addEventListener("error", onError)

					setTimeout(() => {
						videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
						videoElement.removeEventListener("error", onError)
						reject(new Error("Timeout ao carregar vídeo"))
					}, 10000)
				})

				// Tentar reproduzir o vídeo
				try {
					await videoElement.play()
					console.log("Vídeo iniciado com sucesso")
				} catch (playError: any) {
					console.warn("Erro ao iniciar vídeo automaticamente:", playError)
				}

				setIsCameraActive(true)
				setIsLoading(false)
				console.log("Câmera inicializada com sucesso")
			} catch (err: any) {
				console.error("Erro ao inicializar câmera:", err)
				let errorMessage = "Erro ao acessar a câmera."

				if (err.name === "NotAllowedError") {
					errorMessage = "Permissão negada. Permita o acesso à câmera."
				} else if (err.name === "NotFoundError") {
					errorMessage = "Câmera não encontrada ou dispositivo inválido."
				} else if (err.name === "NotSupportedError") {
					errorMessage = "Câmera não suportada neste navegador."
				} else if (err.name === "NotReadableError") {
					errorMessage = "Câmera em uso por outro aplicativo."
				} else if (err.name === "OverconstrainedError") {
					errorMessage = "Configurações de câmera não suportadas."
				} else if (err.message?.includes("Timeout")) {
					errorMessage = "Timeout ao carregar câmera. Tente novamente."
				}

				setError(errorMessage)
				setIsLoading(false)
			}
		},
		[stopStream],
	)

	// Função para capturar imagem e processar com IA
	const captureAndProcess = useCallback(async () => {
		const videoElement = videoRef.current
		const canvas = canvasRef.current

		if (!videoElement || !canvas || !isCameraActive) {
			toast.error("Câmera não está ativa")
			return
		}

		setIsProcessing(true)

		try {
			const context = canvas.getContext("2d")
			if (!context) {
				throw new Error("Não foi possível obter contexto do canvas")
			}

			// Configurar canvas com as dimensões do vídeo
			canvas.width = videoElement.videoWidth
			canvas.height = videoElement.videoHeight

			// Capturar frame atual do vídeo
			context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

			// Converter para base64
			const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)
			setCapturedImage(imageDataUrl)

			// Enviar para API de processamento
			const response = await fetch("/api/ai/price-tag-scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					imageUrl: imageDataUrl,
					marketId: marketId 
				}),
			})

			if (!response.ok) {
				throw new Error("Erro ao processar imagem")
			}

			const result = await response.json()

			if (result.success && result.barcode && result.price) {
				toast.success("Etiqueta processada com sucesso!")
				onScan({
					barcode: result.barcode,
					price: result.price,
					confidence: result.confidence || 0.8,
				})
			} else {
				toast.error(result.message || "Não foi possível extrair dados da etiqueta")
			}
		} catch (error: any) {
			console.error("Erro ao processar imagem:", error)
			toast.error("Erro ao processar a imagem da etiqueta")
		} finally {
			setIsProcessing(false)
			setCapturedImage("")
		}
	}, [isCameraActive, onScan, marketId])

	// Inicializar quando abrir
	useEffect(() => {
		if (isOpen && devices.length === 0) {
			getVideoDevices().then((deviceId) => {
				if (deviceId) {
					initializeCamera(deviceId)
				}
			})
		}
	}, [isOpen, getVideoDevices, initializeCamera, devices.length])

	// Trocar câmera quando selectedDeviceId mudar
	useEffect(() => {
		if (!isOpen || !selectedDeviceId || devices.length === 0 || isLoading) return

		console.log("Trocando para câmera:", selectedDeviceId)
		initializeCamera(selectedDeviceId)
	}, [selectedDeviceId, isOpen, initializeCamera, devices.length, isLoading])

	// Cleanup
	useEffect(() => {
		return () => {
			stopStream()
		}
	}, [stopStream])

	if (!isOpen) return null

	return (
		<div className="fixed bg-black bg-opacity-90 inset-0 flex items-center justify-center z-50">
			<Card className="w-full max-w-2xl mx-4">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5" />
							Scanner de Etiqueta de Preço
						</CardTitle>
						<Button variant="outline" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					{error ? (
						<div className="text-center py-8">
							<p className="text-red-400 mb-4">{error}</p>
							<div className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
								<p>Debug info:</p>
								<p>Dispositivos encontrados: {devices.length}</p>
								<p>ID selecionado: {selectedDeviceId || "Nenhum"}</p>
								<p>
									Navegador:{" "}
									{navigator.userAgent.includes("Chrome")
										? "Chrome"
										: navigator.userAgent.includes("Firefox")
											? "Firefox"
											: navigator.userAgent.includes("Safari")
												? "Safari"
												: "Outro"}
								</p>
								<p>HTTPS: {window.location.protocol === "https:" ? "Sim" : "Não"}</p>
							</div>
							<div className="flex gap-2 justify-center">
								<Button
									onClick={() => initializeCamera(selectedDeviceId)}
									variant="outline"
									className="border-gray-600 text-white hover:bg-gray-800"
								>
									Tentar Novamente
								</Button>
								<Button
									onClick={async () => {
										const id = await getVideoDevices()
										if (id) {
											await initializeCamera(id)
										}
									}}
									variant="outline"
									className="border-gray-600 text-white hover:bg-gray-800"
								>
									Recarregar Dispositivos
								</Button>
								<Button onClick={onClose} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
									Fechar
								</Button>
							</div>
						</div>
					) : (
						<div>
							<div className="w-full h-80 bg-black rounded-lg mb-4 overflow-hidden relative">
								{isLoading && (
									<div className="absolute inset-0 flex items-center justify-center bg-black">
										<div className="text-white text-center">
											<Camera className="h-8 w-8 mx-auto mb-2 animate-pulse" />
											<p>Inicializando câmera...</p>
										</div>
									</div>
								)}

								<video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
								<canvas ref={canvasRef} className="hidden" />

								{/* Overlay de captura otimizado para etiquetas */}
								{isCameraActive && (
									<div className="absolute inset-0 flex items-center justify-center">
										{/* Área de foco retangular para etiquetas */}
										<div className="relative w-80 h-48 border-2 border-blue-400 rounded-lg bg-blue-400/10">
											{/* Cantos do scanner */}
											<div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
											<div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
											<div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
											<div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>

											{/* Área central destacada */}
											<div className="absolute inset-4 border border-blue-400/50 rounded-md bg-blue-400/5">
												<div className="absolute inset-0 flex items-center justify-center">
													<div className="text-white text-xs bg-black/70 px-2 py-1 rounded">
														Posicione a etiqueta aqui
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Controles da câmera */}
								<div className="absolute top-4 right-4 flex flex-col gap-2">
									{/* Botão de flash */}
									<Button
										variant="secondary"
										size="sm"
										onClick={toggleFlash}
										disabled={!isCameraActive}
										className="bg-black/70 hover:bg-black/90 text-white border-none"
									>
										{isFlashOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
									</Button>

									{/* Botão de trocar câmera */}
									{devices.length > 1 && (
										<Button
											variant="secondary"
											size="sm"
											onClick={switchCamera}
											disabled={!isCameraActive}
											className="bg-black/70 hover:bg-black/90 text-white border-none"
										>
											<RotateCcw className="h-4 w-4" />
										</Button>
									)}

									{/* Status da câmera */}
									<div className="text-xs text-white bg-black/70 px-2 py-1 rounded">
										{isCameraActive ? <Camera className="h-3 w-3" /> : <CameraOff className="h-3 w-3" />}
									</div>
								</div>

								{/* Indicadores na parte inferior */}
								<div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs text-white">
									<div className="bg-black/70 px-2 py-1 rounded">
										{devices.length > 0 &&
											`Câmera ${devices.findIndex((d) => d.deviceId === selectedDeviceId) + 1}/${devices.length}`}
									</div>
									{isFlashOn && (
										<div className="bg-black/70 px-2 py-1 rounded flex items-center gap-1">
											<span>🔦</span>
											<span>Flash ativo</span>
										</div>
									)}
								</div>
							</div>

							{/* Botão de captura */}
							<div className="flex justify-center gap-4">
								<Button
									onClick={captureAndProcess}
									disabled={!isCameraActive || isProcessing}
									className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
									size="lg"
								>
									{isProcessing ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Processando...
										</>
									) : (
										<>
											<Camera className="h-4 w-4 mr-2" />
											Capturar Etiqueta
										</>
									)}
								</Button>
							</div>

							{/* Instruções */}
							<div className="mt-4 text-center text-sm text-gray-600">
								<p>📋 Posicione a etiqueta de preço dentro da área destacada</p>
								<p>🔍 Certifique-se de que o código de barras e preço estejam visíveis</p>
								<p>💡 Use o flash se necessário para melhor iluminação</p>
							</div>

							{/* Preview da imagem capturada */}
							{capturedImage && (
								<div className="mt-4">
									<Badge variant="secondary" className="mb-2">
										Imagem Capturada
									</Badge>
									<img
										src={capturedImage}
										alt="Etiqueta capturada"
										className="w-full max-w-xs mx-auto rounded-lg border"
									/>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}