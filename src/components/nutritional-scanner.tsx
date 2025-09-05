"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X, Loader2 } from "lucide-react"
import { createWorker } from "tesseract.js"

interface NutritionalScannerProps {
  onScanComplete: (text: string) => void // Alterado: agora devolve o texto extraído
  onClose: () => void
  isOpen: boolean
} 

export function NutritionalScanner({ onScanComplete, onClose, isOpen }: NutritionalScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Novo estado para feedback

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
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
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePictureAndProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      setIsProcessing(true); // Inicia o feedback de processamento
      stopCamera(); // Desliga a câmara para poupar recursos

      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      
      try {
        const worker = await createWorker('por'); // 'por' para o idioma português
        const ret = await worker.recognize(dataUrl);
        await worker.terminate();
        onScanComplete(ret.data.text); // Envia o texto extraído
      } catch (error) {
        console.error("Erro no OCR:", error);
      } finally {
        setIsProcessing(false);
        onClose();
      }
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-6 relative">
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-10">
            <X className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold mb-4">Escanear Rótulo</h3>
          
          {isProcessing ? (
            <div className="w-full h-96 flex flex-col items-center justify-center bg-black rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-4"/>
                <p className="text-white">A processar imagem...</p>
            </div>
          ) : (
            <div className="w-full h-96 bg-black rounded-lg overflow-hidden relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
              <div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg m-4"></div>
            </div>
          )}

          <Button onClick={takePictureAndProcess} className="w-full mt-4" disabled={isProcessing}>
            <Camera className="mr-2 h-4 w-4" />
            {isProcessing ? 'Aguarde...' : 'Capturar Imagem'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}