"use client"

import { MessageCircle, Mic, MicOff, User, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VoiceAssistantProps {
	onTimerCommand?: (command: "start" | "pause" | "reset" | "set", value?: number) => void
	onReadRecipe?: () => string | undefined
	recipe?: any
}

interface Message {
	id: string
	type: "user" | "assistant"
	text: string
	timestamp: Date
}

export function VoiceAssistant({ onTimerCommand, onReadRecipe, recipe }: VoiceAssistantProps) {
	const [isListening, setIsListening] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isSupported, setIsSupported] = useState(false)
	const [messages, setMessages] = useState<Message[]>([])
	const [showChat, setShowChat] = useState(false)
	const [_permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
	const [isMobile, setIsMobile] = useState(false)

	const recognitionRef = useRef<any>(null)
	const synthRef = useRef<SpeechSynthesis | null>(null)

	useEffect(() => {
		// Detectar se é mobile
		const checkMobile = () => {
			const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
			setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent))
		}
		checkMobile()

		// Verificar suporte do navegador
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
		const speechSynthesis = window.speechSynthesis

		if (SpeechRecognition && speechSynthesis) {
			setIsSupported(true)
			synthRef.current = speechSynthesis

			// Configurar reconhecimento de voz
			const recognition = new SpeechRecognition()
			recognition.continuous = false
			recognition.interimResults = false
			recognition.lang = "pt-BR"

			// Para mobile, configurações específicas
			if (isMobile) {
				recognition.maxAlternatives = 1
			}

			recognition.onstart = () => {
				console.log("🎤 Reconhecimento iniciado")
				setIsListening(true)
			}

			recognition.onend = () => {
				console.log("🎤 Reconhecimento finalizado")
				setIsListening(false)
			}

			recognition.onresult = (event: any) => {
				const transcript = event.results[0][0].transcript.toLowerCase()
				console.log("🎤 Resultado:", transcript)
				handleVoiceCommand(transcript)
			}

			recognition.onerror = (event: any) => {
				console.error("Erro no reconhecimento de voz:", event.error)
				setIsListening(false)
				
				// Tratamento específico de erros para mobile
				if (event.error === 'not-allowed') {
					setPermissionGranted(false)
					toast.error("Permissão de microfone negada. Verifique as configurações do navegador.")
				} else if (event.error === 'no-speech') {
					toast.error("Nenhuma fala detectada. Tente novamente.")
				} else if (event.error === 'aborted') {
					// Erro comum no mobile quando o reconhecimento é interrompido rapidamente
					console.log("Reconhecimento abortado - comum no mobile")
				} else {
					toast.error("Erro no reconhecimento de voz. Tente novamente.")
				}
			}

			recognitionRef.current = recognition

			// Mensagem de boas-vindas
			addMessage("assistant", 'Oi! Eu sou o Zé, seu assistente de cozinha! Diga "Zé" para começar a conversar.')
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop()
			}
			if (synthRef.current) {
				synthRef.current.cancel()
			}
		}
	}, [isMobile, handleVoiceCommand, // Mensagem de boas-vindas
			addMessage])

	const addMessage = (type: "user" | "assistant", text: string) => {
		const message: Message = {
			id: Date.now().toString(),
			type,
			text,
			timestamp: new Date(),
		}
		setMessages((prev) => [...prev.slice(-10), message]) // Manter apenas 10 mensagens
	}

	const speak = (text: string) => {
		if (!synthRef.current) return

		// Cancelar fala anterior
		synthRef.current.cancel()

		const utterance = new SpeechSynthesisUtterance(text)
		utterance.lang = "pt-BR"
		utterance.rate = 0.9
		utterance.pitch = 1.1
		utterance.volume = 0.8

		utterance.onstart = () => setIsSpeaking(true)
		utterance.onend = () => setIsSpeaking(false)
		utterance.onerror = () => setIsSpeaking(false)

		synthRef.current.speak(utterance)
	}

	const handleVoiceCommand = (transcript: string) => {
		console.log("🎤 Comando recebido:", transcript)
		addMessage("user", transcript)

		let response = ""

		// Ativar assistente
		if (transcript.includes("zé") || transcript.includes("ze")) {
			if (transcript.includes("oi") || transcript.includes("olá") || transcript.includes("hello")) {
				response = "Oi! Como posso ajudar na cozinha hoje?"
			} else if (
				transcript.includes("cronômetro") ||
				transcript.includes("cronometro") ||
				transcript.includes("timer")
			) {
				if (transcript.includes("iniciar") || transcript.includes("começar") || transcript.includes("start")) {
					onTimerCommand?.("start")
					response = "Cronômetro iniciado!"
				} else if (transcript.includes("pausar") || transcript.includes("parar")) {
					onTimerCommand?.("pause")
					response = "Cronômetro pausado!"
				} else if (transcript.includes("resetar") || transcript.includes("zerar")) {
					onTimerCommand?.("reset")
					response = "Cronômetro resetado!"
				} else {
					response = 'Você pode dizer: "Zé, iniciar cronômetro", "pausar cronômetro" ou "resetar cronômetro"'
				}
			} else if (transcript.includes("ler") || transcript.includes("receita")) {
				if (recipe) {
					if (onReadRecipe) {
						const recipeText = onReadRecipe()
						if (recipeText) {
							speak(recipeText)
							response = "Lendo a receita completa para você!"
						} else {
							response = "Vou ler a receita para você!"
						}
					} else {
						response = "Não há função de leitura disponível."
					}
				} else {
					response = "Não há receita para ler no momento."
				}
			} else if (transcript.includes("ingredientes")) {
				if (recipe?.ingredients || recipe?.ingredientes) {
					const ingredients = recipe.ingredients || recipe.ingredientes || []
					response = `Os ingredientes são: ${ingredients.slice(0, 5).join(", ")}`
					if (ingredients.length > 5) {
						response += ` e mais ${ingredients.length - 5} ingredientes.`
					}
				} else {
					response = "Não consigo encontrar a lista de ingredientes."
				}
			} else if (transcript.includes("tempo")) {
				const cookingTime = recipe?.tempo_preparo || recipe?.cookingTime
				if (cookingTime) {
					response = `O tempo de preparo é ${cookingTime}.`
				} else {
					response = "Não há tempo de preparo especificado para esta receita."
				}
			} else if (
				transcript.includes("modo de preparo") ||
				transcript.includes("preparo") ||
				transcript.includes("passos")
			) {
				const instructions = recipe?.modo_preparo || recipe?.instructions
				if (instructions) {
					const steps = instructions.split(/\n/).filter((step: string) => step.trim())
					const stepsText = steps
						.map(
							(step: string, index: number) =>
								`Passo ${index + 1}: ${step.replace(/^(\d+\.\s*|Passo \d+:\s*|\d+\)\s*)/, "")}`,
						)
						.join(". ")
					speak(stepsText)
					response = "Lendo o modo de preparo!"
				} else {
					response = "Não há modo de preparo disponível."
				}
			} else if (transcript.includes("dica") || transcript.includes("chef")) {
				const tip = recipe?.dica_chef || recipe?.chefTip
				if (tip) {
					response = `Dica do chef: ${tip}`
				} else {
					response = "Não há dicas do chef para esta receita."
				}
			} else if (transcript.includes("obrigado") || transcript.includes("obrigada") || transcript.includes("valeu")) {
				response = "De nada! Estou aqui para ajudar na cozinha sempre que precisar!"
			} else if (transcript.includes("ajuda") || transcript.includes("comandos")) {
				response =
					'Posso ajudar com: cronômetro, ler receita, ingredientes, tempo de preparo, modo de preparo, dicas do chef. Diga "Zé" seguido do comando!'
			} else {
				response = 'Como posso ajudar? Diga "Zé ajuda" para ver os comandos disponíveis!'
			}
		} else {
			response = 'Diga "Zé" primeiro para ativar o assistente!'
		}

		addMessage("assistant", response)
		speak(response)
	}

	const startListening = async () => {
		if (!isSupported || !recognitionRef.current) {
			toast.error("Reconhecimento de voz não suportado neste navegador.")
			return
		}

		// Para mobile, verificar permissões primeiro
		if (isMobile && 'permissions' in navigator) {
			try {
				const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
				if (permission.state === 'denied') {
					setPermissionGranted(false)
					toast.error("Permissão de microfone negada. Ative nas configurações do navegador.")
					return
				}
			} catch (error) {
				console.log("Não foi possível verificar permissões:", error)
			}
		}

		// Verificar se já está ouvindo
		if (isListening) {
			console.log("Já está ouvindo, ignorando...")
			return
		}

		try {
			console.log("🎤 Tentando iniciar reconhecimento...")
			
			// Para mobile, adicionar um pequeno delay para evitar problemas de user gesture
			if (isMobile) {
				await new Promise(resolve => setTimeout(resolve, 100))
			}
			
			recognitionRef.current.start()
			setPermissionGranted(true)
		} catch (error: any) {
			console.error("Erro ao iniciar reconhecimento:", error)
			
			if (error.name === 'InvalidStateError') {
				// Reconhecimento já está ativo, parar e tentar novamente
				console.log("Reconhecimento já ativo, reiniciando...")
				recognitionRef.current.stop()
				setTimeout(() => {
					if (!isListening) {
						recognitionRef.current.start()
					}
				}, 500)
			} else if (error.name === 'NotAllowedError') {
				setPermissionGranted(false)
				toast.error("Permissão de microfone negada. Ative nas configurações do navegador.")
			} else {
				toast.error("Erro ao iniciar reconhecimento de voz.")
			}
		}
	}

	const stopListening = () => {
		if (recognitionRef.current) {
			recognitionRef.current.stop()
		}
	}

	const stopSpeaking = () => {
		if (synthRef.current) {
			synthRef.current.cancel()
			setIsSpeaking(false)
		}
	}

	if (!isSupported) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageCircle className="h-5 w-5 text-gray-400" />
						Assistente Zé
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-500">Reconhecimento de voz não suportado neste navegador.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MessageCircle className="h-5 w-5 text-blue-500" />
						Assistente Zé
						{(isListening || isSpeaking) && (
							<Badge variant={isListening ? "default" : "secondary"}>{isListening ? "Ouvindo..." : "Falando..."}</Badge>
						)}
					</div>
					<Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)}>
						{showChat ? "−" : "+"}
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Controles principais */}
				<div className="flex gap-2">
					<Button
						onClick={isListening ? stopListening : startListening}
						variant={isListening ? "destructive" : "default"}
						className="flex-1"
						disabled={isSpeaking}
					>
						{isListening ? (
							<>
								<MicOff className="h-4 w-4 mr-2" />
								Parar
							</>
						) : (
							<>
								<Mic className="h-4 w-4 mr-2" />
								Falar
							</>
						)}
					</Button>

					<Button onClick={isSpeaking ? stopSpeaking : undefined} variant="outline" disabled={!isSpeaking}>
						{isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
					</Button>
				</div>

				{/* Dicas rápidas */}
				<div className="text-xs text-gray-500 space-y-1">
					<p>
						<strong>Comandos do Zé:</strong>
					</p>
					<p>• "Zé, iniciar cronômetro"</p>
					<p>• "Zé, ler receita"</p>
					<p>• "Zé, ingredientes"</p>
					<p>• "Zé, modo de preparo"</p>
					<p>• "Zé, dicas do chef"</p>
					<p>• "Zé, ajuda"</p>
				</div>

				{/* Chat expandido */}
				{showChat && (
					<div className="border-t pt-4">
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{messages.slice(-5).map((message) => (
								<div
									key={message.id}
									className={`flex gap-2 text-sm ${message.type === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`flex items-center gap-2 ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
									>
										<div className="flex-shrink-0">
											{message.type === "user" ? (
												<User className="h-4 w-4 text-blue-500" />
											) : (
												<MessageCircle className="h-4 w-4 text-green-500" />
											)}
										</div>
										<div
											className={`px-3 py-2 rounded-lg max-w-xs ${
												message.type === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
											}`}
										>
											{message.text}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
