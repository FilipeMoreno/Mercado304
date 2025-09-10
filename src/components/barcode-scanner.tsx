"use client";

import {
	BrowserMultiFormatReader,
	DecodeHintType,
	NotFoundException,
	type Result,
} from "@zxing/library";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BarcodeScannerProps {
	onScan: (barcode: string) => void;
	onClose: () => void;
	isOpen: boolean;
}

export function BarcodeScanner({
	onScan,
	onClose,
	isOpen,
}: BarcodeScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const codeReader = useRef<BrowserMultiFormatReader | null>(null);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (!isOpen || typeof window === "undefined") return;

		const hints = new Map();
		const formats = ["CODE_128", "EAN_13", "EAN_8", "CODE_39", "QR_CODE"];
		hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

		codeReader.current = new BrowserMultiFormatReader(hints);

		const startScanner = async () => {
			try {
				const videoElement = videoRef.current;
				if (!videoElement) {
					setError("Elemento de vídeo não encontrado.");
					return;
				}

				await codeReader.current?.decodeFromVideoDevice(
					null, // Usar a câmara padrão (a de trás em dispositivos móveis)
					videoElement,
					(result: Result | null, err?: any) => {
						if (result) {
							onScan(result.getText());
							codeReader.current?.reset();
							onClose();
						}
						if (err && !(err instanceof NotFoundException)) {
							console.error("Erro de decodificação:", err);
							setError("Erro ao ler o código de barras.");
						}
					},
				);
			} catch (err) {
				console.error("Erro ao iniciar a câmara:", err);
				setError("Erro ao acessar a câmera. Verifique as permissões.");
			}
		};

		startScanner();

		return () => {
			if (codeReader.current) {
				codeReader.current.reset();
			}
		};
	}, [isOpen, onScan, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<Card className="w-full max-w-2xl mx-4">
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">
							Scanner de Código de Barras
						</h3>
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
								<video
									ref={videoRef}
									className="w-full h-full object-cover"
								></video>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="w-3/4 h-24 border-2 border-green-500 rounded-md animate-pulse"></div>
								</div>
							</div>
							<p className="text-sm text-gray-600 text-center">
								Posicione o código de barras dentro da área verde
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
