"use client"

import { Pause, Play, RotateCcw, Timer, Volume2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface RecipeTimerProps {
	suggestedTime?: string // Ex: "30 minutos", "1 hora", "45 min"
}

export function RecipeTimer({ suggestedTime }: RecipeTimerProps) {
	const [minutes, setMinutes] = useState(0)
	const [seconds, setSeconds] = useState(0)
	const [totalSeconds, setTotalSeconds] = useState(0)
	const [isRunning, setIsRunning] = useState(false)
	const [timeLeft, setTimeLeft] = useState(0)

	const parseSuggestedTime = useCallback((timeString: string): number => {
		const text = timeString.toLowerCase()
		let totalSeconds = 0

		// Extrair horas
		const hoursMatch = text.match(/(\d+)\s*(hora|hr|h)/)
		if (hoursMatch && hoursMatch[1]) {
			totalSeconds += parseInt(hoursMatch[1], 10) * 3600
		}

		// Extrair minutos
		const minutesMatch = text.match(/(\d+)\s*(minuto|min|m)/)
		if (minutesMatch && minutesMatch[1]) {
			totalSeconds += parseInt(minutesMatch[1], 10) * 60
		}

		// Apenas números (assumir minutos)
		if (totalSeconds === 0) {
			const numbersMatch = text.match(/(\d+)/)
			if (numbersMatch && numbersMatch[1]) {
				totalSeconds = parseInt(numbersMatch[1], 10) * 60
			}
		}

		return totalSeconds
	}, [])

	// Parsear tempo sugerido
	useEffect(() => {
		if (suggestedTime) {
			const parsed = parseSuggestedTime(suggestedTime)
			if (parsed > 0) {
				setMinutes(Math.floor(parsed / 60))
				setSeconds(parsed % 60)
				setTotalSeconds(parsed)
			}
		}
	}, [suggestedTime, parseSuggestedTime])

	const playAlarm = useCallback(() => {
		// Criar áudio programaticamente
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

		// Tocar 3 bips
		for (let i = 0; i < 3; i++) {
			setTimeout(() => {
				const oscillator = audioContext.createOscillator()
				const gainNode = audioContext.createGain()

				oscillator.connect(gainNode)
				gainNode.connect(audioContext.destination)

				oscillator.frequency.value = 800
				oscillator.type = "sine"

				gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

				oscillator.start(audioContext.currentTime)
				oscillator.stop(audioContext.currentTime + 0.2)
			}, i * 300)
		}
	}, [])

	// Cronômetro principal
	useEffect(() => {
		let interval: NodeJS.Timeout

		if (isRunning && timeLeft > 0) {
			interval = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsRunning(false)
						playAlarm()
						toast.success("⏰ Tempo esgotado! Verifique sua receita.")
						return 0
					}
					return prev - 1
				})
			}, 1000)
		}

		return () => {
			if (interval) {
				clearInterval(interval)
			}
		}
	}, [isRunning, timeLeft, playAlarm])

	const startTimer = () => {
		const total = minutes * 60 + seconds
		if (total > 0) {
			setTotalSeconds(total)
			setTimeLeft(total)
			setIsRunning(true)
		}
	}

	const pauseTimer = () => {
		setIsRunning(false)
	}

	const resetTimer = () => {
		setIsRunning(false)
		setTimeLeft(0)
	}

	const formatTime = (totalSeconds: number): string => {
		const mins = Math.floor(totalSeconds / 60)
		const secs = totalSeconds % 60
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
	}

	const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Timer className="size-5 text-blue-500" />
					Cronômetro de Cozinha
				</CardTitle>
				{suggestedTime && <p className="text-sm text-gray-500">Tempo sugerido: {suggestedTime}</p>}
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Timer Display */}
				<div className="text-center">
					<div className="text-4xl font-mono font-bold text-gray-800 mb-2">{formatTime(timeLeft)}</div>
					{totalSeconds > 0 && (
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
								style={{ width: `${progress}%` }}
							></div>
						</div>
					)}
				</div>

				{/* Input Controls */}
				{!isRunning && timeLeft === 0 && (
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className="text-xs text-gray-500">Minutos</label>
							<Input
								type="number"
								value={minutes}
								onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
								min="0"
								max="180"
								placeholder="0"
							/>
						</div>
						<div>
							<label className="text-xs text-gray-500">Segundos</label>
							<Input
								type="number"
								value={seconds}
								onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
								min="0"
								max="59"
								placeholder="0"
							/>
						</div>
					</div>
				)}

				{/* Timer Controls */}
				<div className="flex gap-2">
					{!isRunning ? (
						<Button onClick={startTimer} className="flex-1" disabled={timeLeft === 0 && minutes === 0 && seconds === 0}>
							<Play className="size-4 mr-2" />
							Iniciar
						</Button>
					) : (
						<Button onClick={pauseTimer} variant="outline" className="flex-1">
							<Pause className="size-4 mr-2" />
							Pausar
						</Button>
					)}

					<Button onClick={resetTimer} variant="outline" disabled={timeLeft === 0 && !isRunning}>
						<RotateCcw className="size-4 mr-2" />
						Reset
					</Button>
				</div>

				{/* Quick Set Buttons */}
				{!isRunning && timeLeft === 0 && (
					<div className="grid grid-cols-3 gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMinutes(5)
								setSeconds(0)
							}}
						>
							5min
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMinutes(10)
								setSeconds(0)
							}}
						>
							10min
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMinutes(15)
								setSeconds(0)
							}}
						>
							15min
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMinutes(30)
								setSeconds(0)
							}}
						>
							30min
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMinutes(45)
								setSeconds(0)
							}}
						>
							45min
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMinutes(60)
								setSeconds(0)
							}}
						>
							1h
						</Button>
					</div>
				)}

				{/* Alarm Test */}
				<Button variant="ghost" size="sm" onClick={playAlarm} className="w-full text-xs text-gray-500">
					<Volume2 className="h-3 w-3 mr-1" />
					Testar alarme
				</Button>
			</CardContent>
		</Card>
	)
}
