"use client"

import { BrowserMultiFormatReader, DecodeHintType, NotFoundException } from "@zxing/library"
import { Camera, CameraOff, Flashlight, FlashlightOff, RotateCcw, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BarcodeScannerProps {
	onScan: (barcode: string) => void
	onClose: () => void
	isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const codeReader = useRef<BrowserMultiFormatReader | null>(null)
	const animationFrameRef = useRef<number>()
	const [error, setError] = useState<string>("")
	const [isFlashOn, setIsFlashOn] = useState(false)
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
	const [isLoading, setIsLoading] = useState(true)
	const [isCameraActive, setIsCameraActive] = useState(false)

	// Função para listar câmeras disponíveis
	const getVideoDevices = useCallback(async () => {
		try {
			// Solicitar permissão primeiro
			await navigator.mediaDevices.getUserMedia({ video: true })
			
			const deviceList = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = deviceList.filter((device) => device.kind === "videoinput")
			setDevices(videoDevices)

			// Preferir câmera traseira se disponível
			const backCamera = videoDevices.find(
				(device) =>
					device.label.toLowerCase().includes("back") ||
					device.label.toLowerCase().includes("rear") ||
					device.label.toLowerCase().includes("environment") ||
					device.label.toLowerCase().includes("facing back")
			)

			const selectedId = backCamera?.deviceId || videoDevices[0]?.deviceId || ""
			setSelectedDeviceId(selectedId)
			return selectedId
		} catch (err) {
			console.error("Erro ao listar dispositivos:", err)
			setError("Erro ao acessar a câmera. Verifique as permissões.")
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
		const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId)
		const nextIndex = (currentIndex + 1) % devices.length
		const nextDevice = devices[nextIndex]
		
		if (nextDevice) {
			setSelectedDeviceId(nextDevice.deviceId)
		}
	}, [devices, selectedDeviceId])

	// Função para parar stream
	const stopStream = useCallback(() => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = undefined
		}
		
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
			streamRef.current = null
		}
		
		if (codeReader.current) {
			codeReader.current.reset()
		}
		
		setIsCameraActive(false)
		setIsFlashOn(false)
	}, [])

	// Função para inicializar câmera
	const initializeCamera = useCallback(async (deviceId: string) => {
		try {
			setIsLoading(true)
			setError("")
			
			const videoElement = videoRef.current
			if (!videoElement) {
				throw new Error("Elemento de vídeo não encontrado")
			}

			// Parar stream anterior se existir
			stopStream()

			// Configurações otimizadas da câmera para PWA
			const constraints: MediaStreamConstraints = {
				video: {
					deviceId: deviceId ? { exact: deviceId } : undefined,
					width: { ideal: 1280, min: 640 },
					height: { ideal: 720, min: 480 },
					aspectRatio: { ideal: 16 / 9 },
					facingMode: deviceId ? undefined : { ideal: "environment" },
					frameRate: { ideal: 30, min: 15 }
				},
			}

			// Obter stream da câmera
			const stream = await navigator.mediaDevices.getUserMedia(constraints)
			streamRef.current = stream
			videoElement.srcObject = stream

			// Aguardar o vídeo estar pronto
			await new Promise<void>((resolve, reject) => {
				videoElement.onloadedmetadata = () => resolve()
				videoElement.onerror = () => reject(new Error("Erro ao carregar vídeo"))
				setTimeout(() => reject(new Error("Timeout ao carregar vídeo")), 10000)
			})

			await videoElement.play()

			// Configurar track de vídeo
			const track = stream.getVideoTracks()[0]
			if (track) {
				try {
					const capabilities = track.getCapabilities() as any
					const advancedConstraints: any = {}

					if (capabilities.focusMode?.includes("continuous")) {
						advancedConstraints.focusMode = "continuous"
					}
					if (capabilities.exposureMode?.includes("continuous")) {
						advancedConstraints.exposureMode = "continuous"
					}
					if (capabilities.whiteBalanceMode?.includes("continuous")) {
						advancedConstraints.whiteBalanceMode = "continuous"
					}

					if (Object.keys(advancedConstraints).length > 0) {
						await track.applyConstraints({ advanced: [advancedConstraints] })
					}
				} catch (err) {
					console.log("Algumas configurações avançadas não são suportadas:", err)
				}
			}

			setIsCameraActive(true)
			setIsLoading(false)
		} catch (err) {
			console.error("Erro ao inicializar câmera:", err)
			setError("Erro ao acessar a câmera. Verifique as permissões.")
			setIsLoading(false)
		}
	}, [stopStream])

	// Função de scan usando video element diretamente
	const scanBarcode = useCallback(async () => {
		const videoElement = videoRef.current
		
		if (!videoElement || !codeReader.current || !videoElement.videoWidth) {
			// Continuar scanning se câmera estiver ativa
			if (isCameraActive) {
				animationFrameRef.current = requestAnimationFrame(scanBarcode)
			}
			return
		}

		try {
			// Tentar decodificar diretamente do elemento de vídeo
			const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoElement)
			
			if (result) {
				onScan(result.getText())
				stopStream()
				onClose()
				return
			}
		} catch (err) {
			// NotFoundException é esperado quando não há código visível
			if (!(err instanceof NotFoundException)) {
				console.error("Erro de decodificação:", err)
			}
		}

		// Continuar scanning
		if (isCameraActive) {
			animationFrameRef.current = requestAnimationFrame(scanBarcode)
		}
	}, [isCameraActive, onScan, onClose, stopStream])

	// Inicializar ZXing
	useEffect(() => {
		if (!isOpen) return

		const hints = new Map()
		const formats = ["CODE_128", "EAN_13", "EAN_8", "CODE_39", "QR_CODE", "UPC_A", "UPC_E"]
		hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
		hints.set(DecodeHintType.TRY_HARDER, true)

		codeReader.current = new BrowserMultiFormatReader(hints)

		return () => {
			stopStream()
		}
	}, [isOpen, stopStream])

	// Inicializar dispositivos e câmera
	useEffect(() => {
		if (!isOpen) return

		const initialize = async () => {
			const deviceId = await getVideoDevices()
			if (deviceId) {
				await initializeCamera(deviceId)
			}
		}

		initialize()
	}, [isOpen, getVideoDevices, initializeCamera])

	// Trocar câmera quando selectedDeviceId mudar
	useEffect(() => {
		if (!isOpen || !selectedDeviceId) return
		
		initializeCamera(selectedDeviceId)
	}, [selectedDeviceId, isOpen, initializeCamera])

	// Iniciar scanning quando câmera estiver ativa
	useEffect(() => {
		if (isCameraActive && !animationFrameRef.current) {
			animationFrameRef.current = requestAnimationFrame(scanBarcode)
		}
	}, [isCameraActive, scanBarcode])

	// Cleanup
	useEffect(() => {
		return () => {
			stopStream()
		}
	}, [stopStream])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
			<Card className="w-full max-w-2xl mx-4 bg-gray-900 border-gray-700">
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold text-white">Scanner de Código de Barras</h3>
						<Button variant="outline" size="sm" onClick={onClose} className="border-gray-600 text-white hover:bg-gray-800">
							<X className="h-4 w-4" />
						</Button>
					</div>

					{error ? (
						<div className="text-center py-8">
							<p className="text-red-400 mb-4">{error}</p>
							<div className="flex gap-2 justify-center">
								<Button onClick={() => initializeCamera(selectedDeviceId)} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
									Tentar Novamente
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
								
								<video 
									ref={videoRef} 
									className="w-full h-full object-cover"
									playsInline
									muted
									autoPlay
								/>

								{/* Overlay de scanning */}
								{isCameraActive && (
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="w-3/4 h-32 border-2 border-green-400 rounded-md bg-green-400/10">
											<div className="w-full h-0.5 bg-red-500 animate-pulse mt-16"></div>
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
										{devices.length > 0 && `Câmera ${devices.findIndex(d => d.deviceId === selectedDeviceId) + 1}/${devices.length}`}
									</div>
									{isFlashOn && (
										<div className="bg-black/70 px-2 py-1 rounded flex items-center gap-1">
											<span>🔦</span>
											<span>Flash ativo</span>
										</div>
									)}
								</div>
							</div>

							<div className="flex flex-col items-center space-y-2">
								<p className="text-sm text-gray-400 text-center">
									Posicione o código de barras dentro da área verde
								</p>
								<p className="text-xs text-gray-500 text-center">
									Funciona com códigos EAN, UPC, CODE 128/39 e QR Code
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
