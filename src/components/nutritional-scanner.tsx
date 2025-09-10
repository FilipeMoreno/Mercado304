"use client";

import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

// REMOVIDO: import { createWorker } from "tesseract.js"

interface NutritionalScannerProps {
	onScanComplete: (response: any) => void; // Altere de 'string' para 'any'
	onClose: () => void;
}

export function NutritionalScanner({
	onScanComplete,
	onClose,
}: NutritionalScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		startCamera();
		return () => stopCamera();
	}, []);

	const startCamera = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
			});
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
			}
			setStream(mediaStream);
		} catch (err) {
			console.error("Erro ao acessar a câmera:", err);
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
	};

	const takePictureAndProcess = async () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (video && canvas) {
			setIsProcessing(true);
			stopCamera();

			const context = canvas.getContext("2d");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

			// Obter a imagem como Base64
			const dataUrl = canvas.toDataURL("image/png");

			try {
				// Chamar nossa API de backend em vez do Tesseract.js
				const response = await fetch("/api/ocr/scan", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ imageUrl: dataUrl }),
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Falha na API de OCR");
				}

				const result = await response.json();
				onScanComplete(result); // Enviar o texto recebido para a página
			} catch (error) {
				console.error("Erro ao chamar a API de OCR:", error);
			} finally {
				setIsProcessing(false);
				onClose();
			}
		}
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>Escanear Rótulo</DialogTitle>
			</DialogHeader>

			{isProcessing ? (
				<div className="w-full h-96 flex flex-col items-center justify-center bg-black rounded-lg">
					<Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
					<p className="text-white">A processar imagem...</p>
				</div>
			) : (
				<div className="w-full h-96 bg-black rounded-lg overflow-hidden relative">
					<video
						ref={videoRef}
						autoPlay
						playsInline
						className="w-full h-full object-cover"
					></video>
					<canvas ref={canvasRef} className="hidden"></canvas>
					<div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg m-4"></div>
				</div>
			)}

			<Button
				onClick={takePictureAndProcess}
				className="w-full mt-4"
				disabled={isProcessing}
			>
				<Camera className="mr-2 h-4 w-4" />
				{isProcessing ? "Aguarde..." : "Capturar Imagem"}
			</Button>
		</>
	);
}
