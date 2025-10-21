"use client"

import { Mic, Pause, Play, Send, Trash2 } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MicrophoneWaveform } from "@/components/ui/waveform"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
	onRecordingComplete?: (audioBlob: Blob) => void
	onError?: (error: Error) => void
	className?: string
	disabled?: boolean
}

export function AudioRecorder({ onRecordingComplete, onError, className, disabled = false }: AudioRecorderProps) {
	const [isRecording, setIsRecording] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	const [hasRecording, setHasRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)

	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const streamRef = useRef<MediaStream | null>(null)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream

			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder
			audioChunksRef.current = []

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data)
				}
			}

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
				setHasRecording(true)
				onRecordingComplete?.(audioBlob)
			}

			mediaRecorder.start()
			setIsRecording(true)
			setRecordingTime(0)
			setHasRecording(false)

			// Timer para mostrar o tempo de gravação
			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1)
			}, 1000)
		} catch (error) {
			onError?.(error as Error)
		}
	}, [onRecordingComplete, onError])

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
			mediaRecorderRef.current.stop()
		}

		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
		}

		if (timerRef.current) {
			clearInterval(timerRef.current)
		}

		setIsRecording(false)
		setIsProcessing(true)

		// Simular processamento
		setTimeout(() => {
			setIsProcessing(false)
		}, 1000)
	}, [])

	const playRecording = useCallback(() => {
		if (audioChunksRef.current.length === 0) return

		const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
		const audioUrl = URL.createObjectURL(audioBlob)

		if (audioRef.current) {
			audioRef.current.pause()
		}

		const audio = new Audio(audioUrl)
		audioRef.current = audio

		audio.onplay = () => setIsPlaying(true)
		audio.onended = () => setIsPlaying(false)
		audio.onpause = () => setIsPlaying(false)

		audio.play()
	}, [])

	const pauseRecording = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause()
		}
	}, [])

	const deleteRecording = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause()
			audioRef.current = null
		}

		audioChunksRef.current = []
		setHasRecording(false)
		setRecordingTime(0)
		setIsPlaying(false)
	}, [])

	const sendRecording = useCallback(() => {
		if (audioChunksRef.current.length > 0) {
			const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
			onRecordingComplete?.(audioBlob)
		}
	}, [onRecordingComplete])

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
	}

	return (
		<div className={cn("w-full", className)}>
			{/* Waveform Container */}
			<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
				<div className="h-8 w-full">
					<MicrophoneWaveform
						active={isRecording}
						processing={isProcessing}
						barWidth={3}
						barGap={1}
						barRadius={2}
						barColor="#8b5cf6"
						height={32}
						className="w-full"
					/>
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{/* Delete Button */}
					{hasRecording && (
						<Button
							variant="ghost"
							size="icon"
							onClick={deleteRecording}
							className="text-red-500 hover:text-red-700 hover:bg-red-50"
							disabled={disabled}
						>
							<Trash2 className="size-4" />
						</Button>
					)}

					{/* Play/Pause Button */}
					{hasRecording && !isRecording && (
						<Button
							variant="ghost"
							size="icon"
							onClick={isPlaying ? pauseRecording : playRecording}
							className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
							disabled={disabled}
						>
							{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
						</Button>
					)}

					{/* Timer */}
					{recordingTime > 0 && (
						<span className="text-sm font-mono text-gray-600 dark:text-gray-400">{formatTime(recordingTime)}</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Record Button */}
					<Button
						onClick={isRecording ? stopRecording : startRecording}
						disabled={disabled}
						className={cn(
							"rounded-full w-12 h-12",
							isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white",
						)}
					>
						<Mic className="size-5" />
					</Button>

					{/* Send Button */}
					{hasRecording && !isRecording && (
						<Button
							onClick={sendRecording}
							disabled={disabled}
							className="bg-green-500 hover:bg-green-600 text-white rounded-full size-12"
						>
							<Send className="size-5" />
						</Button>
					)}
				</div>
			</div>

			{/* Footer Text */}
			<p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
				Este assistente usa inteligência artificial para te responder
			</p>
		</div>
	)
}
