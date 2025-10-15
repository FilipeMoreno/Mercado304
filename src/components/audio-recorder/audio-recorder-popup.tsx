"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AudioRecorder } from "./audio-recorder"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface AudioRecorderPopupProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete?: (audioBlob: Blob) => void
  onError?: (error: Error) => void
  disabled?: boolean
}

export function AudioRecorderPopup({
  isOpen,
  onClose,
  onRecordingComplete,
  onError,
  disabled = false,
}: AudioRecorderPopupProps) {
  const [isRecording, setIsRecording] = useState(false)

  const handleRecordingComplete = (audioBlob: Blob) => {
    onRecordingComplete?.(audioBlob)
    onClose()
  }

  const handleError = (error: Error) => {
    onError?.(error)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gravar Áudio</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isRecording}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onError={handleError}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
