"use client"

import { motion, AnimatePresence, useDragControls, Variants } from "framer-motion"
import { useState, useRef, ReactNode } from "react"
import { X, Menu, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileNavigationProps {
  children: ReactNode
  trigger?: ReactNode
  className?: string
  overlayClassName?: string
  panelClassName?: string
  closeOnOverlayClick?: boolean
  closeOnItemClick?: boolean
  dragToClose?: boolean
  snapPoints?: number[]
  defaultSnapPoint?: number
}

export function MobileNavigation({
  children,
  trigger,
  className,
  overlayClassName,
  panelClassName,
  closeOnOverlayClick = true,
  closeOnItemClick = true,
  dragToClose = true,
  snapPoints = [0.3, 0.7, 0.95],
  defaultSnapPoint = 0.7
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint)
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  const handleDragEnd = (_: any, info: any) => {
    const { offset, velocity } = info
    const height = window.innerHeight
    const currentY = -offset.y
    const velocityThreshold = 500

    // Se velocidade for alta para baixo, fechar
    if (velocity.y > velocityThreshold) {
      handleClose()
      return
    }

    // Encontrar o snap point mais próximo
    const targetPositions = snapPoints.map(point => height * point)
    const currentPosition = height * currentSnapPoint + currentY

    let closestSnapPoint = snapPoints[0]
    let minDistance = Math.abs(targetPositions[0] - currentPosition)

    targetPositions.forEach((pos, index) => {
      const distance = Math.abs(pos - currentPosition)
      if (distance < minDistance) {
        minDistance = distance
        closestSnapPoint = snapPoints[index]
      }
    })

    setCurrentSnapPoint(closestSnapPoint)
  }

  const panelVariants: Variants = {
    hidden: {
      y: "100%",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    visible: {
      y: `${(1 - currentSnapPoint) * 100}%`,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  }

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 0.5,
      transition: { duration: 0.3 }
    }
  }

  const handleItemClick = () => {
    if (closeOnItemClick) {
      handleClose()
    }
  }

  return (
    <>
      {/* Trigger */}
      {trigger ? (
        <div onClick={handleOpen}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpen}
          className={className}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Navigation Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className={cn(
                "fixed inset-0 bg-black z-40",
                overlayClassName
              )}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={closeOnOverlayClick ? handleClose : undefined}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              className={cn(
                "fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[95vh] overflow-hidden",
                panelClassName
              )}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              drag={dragToClose ? "y" : false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              style={{
                height: `${currentSnapPoint * 100}vh`
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <motion.div
                  className="w-12 h-1 bg-gray-300 rounded-full cursor-grab"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onPointerDown={(e) => {
                    if (dragToClose) {
                      dragControls.start(e)
                    }
                  }}
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <div className="flex items-center gap-2">
                  {/* Snap Point Controls */}
                  <div className="flex gap-1">
                    {snapPoints.map((point, index) => (
                      <button
                        key={point}
                        onClick={() => setCurrentSnapPoint(point)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          currentSnapPoint === point 
                            ? "bg-blue-500" 
                            : "bg-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div 
                className="flex-1 overflow-y-auto p-4"
                onClick={handleItemClick}
              >
                {children}
              </div>

              {/* Expand/Collapse Button */}
              <div className="sticky bottom-0 bg-white border-t p-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextIndex = snapPoints.indexOf(currentSnapPoint) + 1
                    const nextSnapPoint = snapPoints[nextIndex] || snapPoints[0]
                    setCurrentSnapPoint(nextSnapPoint)
                  }}
                  className="text-gray-500"
                >
                  <ChevronUp className={cn(
                    "h-4 w-4 transition-transform",
                    currentSnapPoint === snapPoints[snapPoints.length - 1] && "rotate-180"
                  )} />
                  <span className="ml-2 text-xs">
                    {currentSnapPoint === snapPoints[snapPoints.length - 1] ? "Minimizar" : "Expandir"}
                  </span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}