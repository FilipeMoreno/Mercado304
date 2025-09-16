"use client"

import { BrowserMultiFormatReader, DecodeHintType, NotFoundException, type Result } from "@zxing/library"
import { Camera, X, Flashlight, FlashlightOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
	const [error, setError] = useState<string>("")
	const [isFlashOn, setIsFlashOn] = useState(false)
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")

	// Função para listar câmeras disponíveis
	const getVideoDevices = async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = devices.filter(device => device.kind === 'videoinput')
			setDevices(videoDevices)
			
			// Preferir câmera traseira se disponível
			const backCamera = videoDevices.find(device => 
				device.label.toLowerCase().includes('back') || 
				device.label.toLowerCase().includes('rear') ||
				device.label.toLowerCase().includes('environment')
			)
			
			setSelectedDeviceId(backCamera?.deviceId || videoDevices[0]?.deviceId || "")
		} catch (err) {
			console.error("Erro ao listar dispositivos:", err)
		}
	}

	// Função para alternar flash/lanterna
	const toggleFlash = async () => {
		if (!streamRef.current) return
		
		const track = streamRef.current.getVideoTracks()[0]
		if (!track) return

		try {
			const capabilities = track.getCapabilities() as any
			if (capabilities.torch) {
				await track.applyConstraints({
					advanced: [{ torch: !isFlashOn } as any]
				})
				setIsFlashOn(!isFlashOn)
			}
		} catch (err) {
			console.error("Erro ao controlar flash:", err)
		}
	}

	useEffect(() => {
		if (!isOpen || typeof window === "undefined") return

		// Inicializar listas de dispositivos
		getVideoDevices()

		const hints = new Map()
		const formats = ["CODE_128", "EAN_13", "EAN_8", "CODE_39", "QR_CODE", "UPC_A", "UPC_E"]
		hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
		hints.set(DecodeHintType.TRY_HARDER, true)

		codeReader.current = new BrowserMultiFormatReader(hints)

		const startScanner = async () => {
			try {
				const videoElement = videoRef.current
				if (!videoElement) {
					setError("Elemento de vídeo não encontrado.")
					return
				}

				// Configurações otimizadas da câmera
				const constraints: MediaStreamConstraints = {
					video: {
						deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
						width: { ideal: 1920, min: 1280 },
						height: { ideal: 1080, min: 720 },
						aspectRatio: { ideal: 16/9 },
						facingMode: selectedDeviceId ? undefined : { ideal: "environment" }
					}
				}

				// Obter stream da câmera com configurações otimizadas
				const stream = await navigator.mediaDevices.getUserMedia(constraints)
				streamRef.current = stream
				videoElement.srcObject = stream

				// Aguardar o vídeo estar pronto
				await new Promise((resolve) => {
					videoElement.onloadedmetadata = resolve
				})

				// Configurar qualidade do vídeo
				const track = stream.getVideoTracks()[0]
				if (track) {
					// Aplicar configurações avançadas se suportadas
					try {
						const capabilities = track.getCapabilities() as any
						const constraints: any = {}

						if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
							constraints.focusMode = 'continuous'
						}
						if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
							constraints.exposureMode = 'continuous'
						}
						if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
							constraints.whiteBalanceMode = 'continuous'
						}
						
						// Aplicar configurações se houver alguma
						if (Object.keys(constraints).length > 0) {
							await track.applyConstraints({ advanced: [constraints] })
						}
					} catch (err) {
						console.log("Algumas configurações avançadas não são suportadas:", err)
					}
				}

				// Iniciar decodificação com intervalo reduzido para melhor performance
				let isScanning = true
				const scanInterval = setInterval(async () => {
					if (!isScanning || !codeReader.current || !videoElement.videoWidth) return

					try {
						const result = await codeReader.current.decodeOnceFromVideoDevice(selectedDeviceId || undefined, videoElement)
						if (result) {
							clearInterval(scanInterval)
							isScanning = false
							onScan(result.getText())
							if (streamRef.current) {
								streamRef.current.getTracks().forEach(track => track.stop())
							}
							onClose()
						}
					} catch (err) {
						// NotFoundException é esperado quando não há código visível
						if (!(err instanceof NotFoundException)) {
							console.error("Erro de decodificação:", err)
						}
					}
				}, 100) // Scan a cada 100ms para melhor responsividade

				// Cleanup function
				return () => {
					clearInterval(scanInterval)
					isScanning = false
					if (streamRef.current) {
						streamRef.current.getTracks().forEach(track => track.stop())
						streamRef.current = null
					}
				}

			} catch (err) {
				console.error("Erro ao iniciar a câmara:", err)
				setError("Erro ao acessar a câmera. Verifique as permissões.")
			}
		}

		const cleanup = startScanner()

		return () => {
			cleanup?.then(cleanupFn => cleanupFn?.())
			if (codeReader.current) {
				codeReader.current.reset()
			}
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop())
				streamRef.current = null
			}
		}
	}, [isOpen, onScan, onClose, selectedDeviceId])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<Card className="w-full max-w-2xl mx-4">
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">Scanner de Código de Barras</h3>
						<Button variant="outline" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{error ? (
						<div className="text-center py-8">
							<p className="text-red-500 mb-4">{error}</p>
							<Button onClick={onClose}>Fechar</Button>
						</div>
					) : (
						<div>
							<div className="w-full h-64 bg-black rounded-lg mb-4 overflow-hidden relative">
								<video ref={videoRef} className="w-full h-full object-cover"></video>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="w-3/4 h-24 border-2 border-green-500 rounded-md animate-pulse"></div>
								</div>
								
								{/* Controles da câmera */}
								<div className="absolute top-4 right-4 flex flex-col gap-2">
									{/* Botão de flash */}
									<Button
										variant="secondary"
										size="sm"
										onClick={toggleFlash}
										className="bg-black/50 hover:bg-black/70 text-white border-none"
									>
										{isFlashOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
									</Button>
									
									{/* Seletor de câmera */}
									{devices.length > 1 && (
										<select
											value={selectedDeviceId}
											onChange={(e) => setSelectedDeviceId(e.target.value)}
											className="px-2 py-1 text-xs bg-black/50 text-white border border-gray-300 rounded"
										>
											{devices.map((device) => (
												<option key={device.deviceId} value={device.deviceId} className="bg-black text-white">
													{device.label || `Câmera ${devices.indexOf(device) + 1}`}
												</option>
											))}
										</select>
									)}
								</div>
							</div>
							
							<div className="flex flex-col items-center space-y-2">
								<p className="text-sm text-gray-600 text-center">Posicione o código de barras dentro da área verde</p>
								<div className="flex items-center gap-4 text-xs text-gray-500">
									{devices.length > 1 && <span>📹 {devices.length} câmeras disponíveis</span>}
									{isFlashOn && <span>🔦 Flash ativo</span>}
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
