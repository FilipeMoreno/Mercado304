"use client"

import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from "@zxing/library"
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
	const animationFrameRef = useRef<number>(undefined)
	const [error, setError] = useState<string>("")
	const [isFlashOn, setIsFlashOn] = useState(false)
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
	const [isLoading, setIsLoading] = useState(true)
	const [isCameraActive, setIsCameraActive] = useState(false)

	// Função para listar câmeras disponíveis
	const getVideoDevices = useCallback(async () => {
		try {
			// Verificar se a API está disponível
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

				// Configurações progressivas da câmera (começar com alta qualidade)
				const constraintSets = [
					// Primeira tentativa: máxima qualidade para scanner
					{
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
					},
					// Segunda tentativa: boa qualidade
					{
						video: deviceId
							? {
									deviceId: { exact: deviceId },
									width: { ideal: 1280, min: 720 },
									height: { ideal: 720, min: 480 },
									frameRate: { ideal: 30, min: 15 },
								}
							: {
									facingMode: { ideal: "environment" },
									width: { ideal: 1280, min: 720 },
									height: { ideal: 720, min: 480 },
									frameRate: { ideal: 30, min: 15 },
								},
					},
					// Terceira tentativa: configurações simples
					{
						video: deviceId
							? {
									deviceId: { exact: deviceId },
								}
							: {
									facingMode: "environment",
								},
					},
					// Quarta tentativa: qualquer vídeo
					{
						video: true,
					},
				]

				let stream: MediaStream | null = null
				let lastError: Error | null = null

				for (const constraints of constraintSets) {
					try {
						console.log("Tentando configurações:", constraints)
						stream = await navigator.mediaDevices.getUserMedia(constraints)
						console.log(
							"Stream obtido com sucesso:",
							stream.getVideoTracks().map((t) => t.label),
						)
						break
					} catch (err: any) {
						console.log("Configuração falhou:", err.name, err.message)
						lastError = err
					}
				}

				if (!stream) {
					throw lastError || new Error("Não foi possível obter stream de vídeo")
				}

				streamRef.current = stream
				videoElement.srcObject = stream

				// Aguardar o vídeo estar pronto com timeout mais longo
				await new Promise<void>((resolve, reject) => {
					const onLoadedMetadata = () => {
						videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
						videoElement.removeEventListener("error", onError)
						resolve()
					}

					const onError = (e: any) => {
						videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
						videoElement.removeEventListener("error", onError)
						reject(new Error(`Erro ao carregar vídeo: ${e.message || "Desconhecido"}`))
					}

					videoElement.addEventListener("loadedmetadata", onLoadedMetadata)
					videoElement.addEventListener("error", onError)

					// Timeout maior para dispositivos mais lentos
					setTimeout(() => {
						videoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
						videoElement.removeEventListener("error", onError)
						reject(new Error("Timeout ao carregar vídeo"))
					}, 15000)
				})

				// Tentar reproduzir o vídeo
				try {
					await videoElement.play()
					console.log("Vídeo iniciado com sucesso")
				} catch (playError: any) {
					console.warn("Erro ao iniciar vídeo automaticamente:", playError)
					// Em alguns navegadores, o play automático pode falhar, mas isso não é crítico
				}

				// Configurar track de vídeo com otimizações para scanner
				const track = stream.getVideoTracks()[0]
				if (track) {
					console.log("Track de vídeo:", track.label, track.getSettings())

					try {
						const capabilities = track.getCapabilities() as any
						console.log("Capacidades da câmera:", capabilities)

						const advancedConstraints: any = {}

						// Foco contínuo para manter código nítido
						if (capabilities.focusMode?.includes("continuous")) {
							advancedConstraints.focusMode = "continuous"
						} else if (capabilities.focusMode?.includes("single-shot")) {
							advancedConstraints.focusMode = "single-shot"
						}

						// Exposição contínua para compensar mudanças de luz
						if (capabilities.exposureMode?.includes("continuous")) {
							advancedConstraints.exposureMode = "continuous"
						}

						// Balance de branco automático
						if (capabilities.whiteBalanceMode?.includes("continuous")) {
							advancedConstraints.whiteBalanceMode = "continuous"
						}

						// Zoom para melhorar detecção (se disponível)
						if (capabilities.zoom) {
							const zoomRange = capabilities.zoom
							const idealZoom = Math.min(zoomRange.max || 1, Math.max(zoomRange.min || 1, 1.5))
							advancedConstraints.zoom = idealZoom
						}

						// Contraste e brilho otimizados para códigos
						if (capabilities.contrast) {
							const contrastRange = capabilities.contrast
							const idealContrast = Math.min(contrastRange.max || 100, Math.max(contrastRange.min || 0, 120))
							advancedConstraints.contrast = idealContrast
						}

						if (capabilities.brightness) {
							const brightnessRange = capabilities.brightness
							const idealBrightness = Math.min(brightnessRange.max || 100, Math.max(brightnessRange.min || 0, 110))
							advancedConstraints.brightness = idealBrightness
						}

						// Aplicar configurações se houver alguma
						if (Object.keys(advancedConstraints).length > 0) {
							await track.applyConstraints({ advanced: [advancedConstraints] })
							console.log("🎛️ Configurações otimizadas aplicadas:", advancedConstraints)
						}

						// Configurações básicas adicionais
						const basicConstraints: any = {}

						// Tentar configurar resolução alta se suportado
						if (capabilities.width && capabilities.height) {
							const maxWidth = capabilities.width.max || 1920
							const maxHeight = capabilities.height.max || 1080
							if (maxWidth >= 1280 && maxHeight >= 720) {
								basicConstraints.width = { ideal: Math.min(maxWidth, 1920) }
								basicConstraints.height = { ideal: Math.min(maxHeight, 1080) }
							}
						}

						if (Object.keys(basicConstraints).length > 0) {
							await track.applyConstraints(basicConstraints)
							console.log("📐 Resolução otimizada aplicada:", basicConstraints)
						}
					} catch (err) {
						console.log("⚠️ Algumas otimizações não são suportadas:", err)
					}
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

	// Função de scan usando canvas para melhor detecção
	const scanBarcode = useCallback(async () => {
		const videoElement = videoRef.current

		if (!videoElement || !codeReader.current || !videoElement.videoWidth || !videoElement.videoHeight) {
			// Continuar scanning se câmera estiver ativa
			if (isCameraActive) {
				animationFrameRef.current = requestAnimationFrame(scanBarcode)
			}
			return
		}

		try {
			// Criar canvas para capturar frame do vídeo
			const canvas = document.createElement("canvas")
			const context = canvas.getContext("2d")

			if (!context) {
				console.error("Não foi possível obter contexto do canvas")
				if (isCameraActive) {
					animationFrameRef.current = requestAnimationFrame(scanBarcode)
				}
				return
			}

			// Usar dimensões maiores para melhor resolução
			const sourceWidth = videoElement.videoWidth
			const sourceHeight = videoElement.videoHeight
			const scale = Math.min(1280 / sourceWidth, 720 / sourceHeight, 2) // Máximo 2x scale

			canvas.width = sourceWidth * scale
			canvas.height = sourceHeight * scale

			// Aplicar filtros para melhor contraste e nitidez
			context.filter = "contrast(1.2) brightness(1.1) saturate(0.8)"
			context.imageSmoothingEnabled = false // Manter pixels nítidos

			// Desenhar frame com escala otimizada
			context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

			// Debug apenas ocasionalmente
			if (Math.random() < 0.01) {
				console.log(`📷 Frame: ${canvas.width}x${canvas.height} (escala: ${scale.toFixed(2)}x)`)
			}

			// Tentar múltiplas regiões para melhorar detecção
			const regions = [
				// Imagem completa em alta qualidade
				{ dataUrl: canvas.toDataURL("image/png"), name: "completa-png" },
				// Imagem completa em JPEG
				{ dataUrl: canvas.toDataURL("image/jpeg", 0.95), name: "completa-jpeg" },
			]

			// Se a imagem for grande o suficiente, testar regiões centrais também
			if (canvas.width > 640 && canvas.height > 480) {
				// Região central (70%)
				const centerW = canvas.width * 0.7
				const centerH = canvas.height * 0.7
				const centerX = (canvas.width - centerW) / 2
				const centerY = (canvas.height - centerH) / 2

				const centerCanvas = document.createElement("canvas")
				const centerContext = centerCanvas.getContext("2d")
				if (centerContext) {
					centerCanvas.width = centerW
					centerCanvas.height = centerH
					centerContext.filter = "contrast(1.3) brightness(1.2)"
					centerContext.imageSmoothingEnabled = false
					centerContext.drawImage(canvas, centerX, centerY, centerW, centerH, 0, 0, centerW, centerH)
					regions.push({
						dataUrl: centerCanvas.toDataURL("image/png"),
						name: "centro-png",
					})
				}
			}

			// Tentar decodificar em cada região
			for (const region of regions) {
				try {
					const result = await codeReader.current.decodeFromImage(undefined, region.dataUrl)
					if (result) {
						console.log(
							"🎉 Código detectado:",
							result.getText(),
							"Formato:",
							result.getBarcodeFormat(),
							"Região:",
							region.name,
						)
						onScan(result.getText())
						stopStream()
						onClose()
						return
					}
				} catch (regionErr: any) {
					// Continuar para próxima região
					if (!(regionErr instanceof NotFoundException)) {
						console.warn(`⚠️ Erro na região ${region.name}:`, regionErr?.message || regionErr)
					}
				}
			}
		} catch (err) {
			// NotFoundException é esperado quando não há código visível
			if (!(err instanceof NotFoundException)) {
				console.error("❌ Erro de decodificação:", err)
			} else {
				// Mostrar tentativa a cada 50 ciclos (5 segundos aprox)
				if (Math.random() < 0.02) {
					console.log("🔍 Procurando código...")
				}
			}
		}

		// Continuar scanning com delay otimizado para qualidade
		if (isCameraActive) {
			setTimeout(() => {
				if (isCameraActive) {
					animationFrameRef.current = requestAnimationFrame(scanBarcode)
				}
			}, 150) // Delay de 150ms para melhor processamento
		}
	}, [isCameraActive, onScan, onClose, stopStream])

	// Inicializar ZXing
	useEffect(() => {
		if (!isOpen) return

		const hints = new Map()
		// Incluir mais formatos de código usando enums
		const formats = [
			BarcodeFormat.CODE_128,
			BarcodeFormat.EAN_13,
			BarcodeFormat.EAN_8,
			BarcodeFormat.CODE_39,
			BarcodeFormat.CODE_93,
			BarcodeFormat.CODABAR,
			BarcodeFormat.ITF,
			BarcodeFormat.QR_CODE,
			BarcodeFormat.DATA_MATRIX,
			BarcodeFormat.PDF_417,
			BarcodeFormat.UPC_A,
			BarcodeFormat.UPC_E,
			BarcodeFormat.UPC_EAN_EXTENSION,
		]
		hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
		hints.set(DecodeHintType.TRY_HARDER, true)

		codeReader.current = new BrowserMultiFormatReader(hints)
		console.log("ZXing inicializado com", formats.length, "formatos")

		return () => {
			stopStream()
		}
	}, [isOpen, stopStream])

	// Inicializar dispositivos e câmera
	useEffect(() => {
		if (!isOpen) return

		const initialize = async () => {
			try {
				// Tentar inicializar sem deviceId específico primeiro
				await initializeCamera("")
			} catch (err) {
				console.log("Tentativa inicial falhou, tentando enumerar dispositivos:", err)
				// Se falhar, tentar listar dispositivos primeiro
				const deviceId = await getVideoDevices()
				if (deviceId) {
					await initializeCamera(deviceId)
				}
			}
		}

		initialize()
	}, [isOpen, getVideoDevices, initializeCamera])

	// Trocar câmera quando selectedDeviceId mudar (apenas se já tivermos dispositivos)
	useEffect(() => {
		if (!isOpen || !selectedDeviceId || devices.length === 0 || isLoading) return

		console.log("Trocando para câmera:", selectedDeviceId)
		initializeCamera(selectedDeviceId)
	}, [selectedDeviceId, isOpen, initializeCamera, devices.length, isLoading])

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
		<div className="fixed bg-black bg-opacity-90 inset-0 flex items-center justify-center z-50">
			<Card className="w-full max-w-2xl mx-4">
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">Scanner de QR Code</h3>
						<Button variant="outline" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>

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

								{/* Overlay de scanning otimizado */}
								{isCameraActive && (
									<div className="absolute inset-0 flex items-center justify-center">
										{/* Área de foco principal - quadrada para QR code */}
										<div className="relative w-64 h-64 border-2 border-green-400 rounded-lg bg-green-400/10">
											{/* Cantos do scanner mais destacados */}
											<div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
											<div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
											<div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
											<div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>

											{/* Área central destacada */}
											<div className="absolute inset-4 border border-green-400/50 rounded-md bg-green-400/5">
												{/* Linha de scanning animada */}
												<div className="absolute inset-0 flex items-center justify-center">
													<div className="w-full h-0.5 bg-red-500 animate-pulse shadow-lg"></div>
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
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
