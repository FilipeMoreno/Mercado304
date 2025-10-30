'use client';

import { useState, useRef } from 'react';
import { Camera, X, RotateCcw, Zap, ZapOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProductPhotoCaptureProps {
  onPhotoCapture: (file: File) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export function ProductPhotoCapture({ 
  onPhotoCapture, 
  onClose, 
  isProcessing = false 
}: ProductPhotoCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (deviceId?: string) => {
    try {
      // Parar stream anterior se existir
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: deviceId ? undefined : { ideal: 'environment' }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Listar dispositivos disponíveis
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      if (!currentDeviceId && videoDevices.length > 0) {
        setCurrentDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      setCurrentDeviceId(nextDevice.deviceId);
      startCamera(nextDevice.deviceId);
    }
  };

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          });
          setFlashEnabled(!flashEnabled);
        } catch (error) {
          console.error('Erro ao controlar flash:', error);
        }
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para blob e chamar callback
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `produto-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onPhotoCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      onPhotoCapture(file);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Iniciar câmera quando componente monta
  useState(() => {
    if (captureMode === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  });

  return (
    <Card className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <h3 className="text-white font-semibold">Capturar Produto</h3>
        <div className="flex items-center gap-2">
          {/* Toggle entre câmera e upload */}
          <div className="flex bg-black/30 rounded-lg p-1">
            <Button
              variant={captureMode === 'camera' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCaptureMode('camera')}
              className="text-white"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              variant={captureMode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCaptureMode('upload')}
              className="text-white"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {captureMode === 'camera' ? (
          <>
            {/* Área do vídeo */}
            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de foco */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                </div>
              </div>

              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Analisando produto...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controles da câmera */}
            <div className="p-4 bg-black/50">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Flash */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={toggleFlash}
                  className="text-white"
                  disabled={isProcessing}
                >
                  {flashEnabled ? (
                    <Zap className="w-6 h-6" />
                  ) : (
                    <ZapOff className="w-6 h-6" />
                  )}
                </Button>

                {/* Botão de captura */}
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  disabled={!stream || isProcessing}
                  className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200"
                >
                  <Camera className="w-8 h-8" />
                </Button>

                {/* Trocar câmera */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={switchCamera}
                  className="text-white"
                  disabled={devices.length <= 1 || isProcessing}
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Modo upload */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md w-full">
              {selectedImage ? (
                /* Preview da imagem selecionada */
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={selectedImage} 
                      alt="Produto selecionado" 
                      className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-center">
                          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p>Analisando produto...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      disabled={isProcessing}
                    >
                      Trocar Imagem
                    </Button>
                  </div>
                </div>
              ) : (
                /* Área de upload */
                <div 
                  className={`border-2 border-dashed rounded-lg p-12 cursor-pointer transition-all duration-200 ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                    isDragOver ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {isDragOver ? 'Solte a imagem aqui' : 'Selecionar foto do produto'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isDragOver ? 'Solte para fazer upload' : 'Clique aqui ou arraste uma imagem'}
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
          </div>
        )}
      </div>

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}