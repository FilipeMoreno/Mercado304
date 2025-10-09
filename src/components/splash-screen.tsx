"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Sparkles } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500) // Aguarda animação de saída
    }, duration)

    return () => clearTimeout(timer)
  }, [onComplete, duration])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat" />
          </div>

          {/* Main Content */}
          <div className="relative flex flex-col items-center space-y-8">
            {/* Logo Container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1,
                ease: "easeOut",
                delay: 0.2
              }}
              className="relative"
            >
              {/* Glow Effect */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-white rounded-full blur-xl"
              />
              
              {/* Logo Background */}
              <div className="relative bg-white rounded-full p-6 shadow-2xl">
                <ShoppingCart className="w-16 h-16 text-blue-600" />
                
                {/* Sparkles */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
                
                <motion.div
                  animate={{ 
                    rotate: -360,
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-1 -left-1"
                >
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                delay: 0.8,
                ease: "easeOut"
              }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-white mb-2">
                Mercado304
              </h1>
              <p className="text-white/80 text-lg font-medium">
                Gestão de Compras
              </p>
            </motion.div>

            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.5,
                delay: 1.5
              }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                  className="w-3 h-3 bg-white rounded-full"
                />
              ))}
            </motion.div>

            {/* Version */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.5,
                delay: 2
              }}
              className="absolute bottom-8 text-white/60 text-sm"
            >
              v1.5.1
            </motion.div>
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{
              y: [-10, 10, -10],
              x: [-5, 5, -5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 left-10 w-8 h-8 bg-white/20 rounded-full blur-sm"
          />
          
          <motion.div
            animate={{
              y: [10, -10, 10],
              x: [5, -5, 5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-32 right-16 w-6 h-6 bg-white/15 rounded-full blur-sm"
          />
          
          <motion.div
            animate={{
              y: [-15, 15, -15],
              x: [8, -8, 8],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute top-1/3 right-8 w-4 h-4 bg-white/10 rounded-full blur-sm"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
