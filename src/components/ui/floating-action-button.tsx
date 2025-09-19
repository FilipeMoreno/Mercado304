"use client"

import { motion, AnimatePresence, Variants } from "framer-motion"
import { useState, ReactNode } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FABAction {
  icon: ReactNode
  label: string
  onClick: () => void
  color?: string
  bgColor?: string
}

interface FloatingActionButtonProps {
  icon?: ReactNode
  actions?: FABAction[]
  onClick?: () => void
  className?: string
  position?: "bottom-right" | "bottom-left" | "bottom-center"
  size?: "sm" | "md" | "lg"
  expandDirection?: "up" | "down" | "left" | "right"
  showLabels?: boolean
  closeOnAction?: boolean
}

const positionClasses = {
  "bottom-right": "fixed bottom-6 right-6",
  "bottom-left": "fixed bottom-6 left-6", 
  "bottom-center": "fixed bottom-6 left-1/2 transform -translate-x-1/2"
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-14 h-14",
  lg: "w-16 h-16"
}

const iconSizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6", 
  lg: "h-7 w-7"
}

export function FloatingActionButton({
  icon = <Plus className="h-6 w-6" />,
  actions = [],
  onClick,
  className,
  position = "bottom-right",
  size = "md",
  expandDirection = "up",
  showLabels = true,
  closeOnAction = true
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsExpanded(!isExpanded)
    } else if (onClick) {
      onClick()
    }
  }

  const handleActionClick = (action: FABAction) => {
    action.onClick()
    if (closeOnAction) {
      setIsExpanded(false)
    }
  }

  const getActionPosition = (index: number) => {
    const spacing = 60
    const offset = (index + 1) * spacing

    switch (expandDirection) {
      case "up":
        return { y: -offset, x: 0 }
      case "down":
        return { y: offset, x: 0 }
      case "left":
        return { y: 0, x: -offset }
      case "right":
        return { y: 0, x: offset }
      default:
        return { y: -offset, x: 0 }
    }
  }

  const mainButtonVariants: Variants = {
    normal: {
      scale: 1,
      rotate: 0
    },
    expanded: {
      scale: 1.1,
      rotate: 45,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  }

  const actionVariants: Variants = {
    hidden: {
      scale: 0,
      opacity: 0,
      y: 0,
      x: 0
    },
    visible: (index: number) => ({
      scale: 1,
      opacity: 1,
      ...getActionPosition(index),
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        delay: index * 0.1
      }
    }),
    exit: {
      scale: 0,
      opacity: 0,
      y: 0,
      x: 0,
      transition: {
        duration: 0.2
      }
    }
  }

  const labelVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      x: expandDirection === "right" ? -10 : 
         expandDirection === "left" ? 10 : 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        delay: 0.1
      }
    }
  }

  return (
    <div className={cn(positionClasses[position], "z-50", className)}>
      {/* Overlay para fechar quando expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence>
        {isExpanded && actions.map((action, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              [expandDirection === "up" || expandDirection === "down" ? "left" : "top"]: "50%",
              transform: expandDirection === "up" || expandDirection === "down" 
                ? "translateX(-50%)" 
                : "translateY(-50%)"
            }}
            variants={actionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={index}
          >
            <div className="flex items-center gap-3">
              {/* Label */}
              {showLabels && (expandDirection === "up" || expandDirection === "down") && (
                <motion.div
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="px-3 py-1 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
                >
                  {action.label}
                </motion.div>
              )}

              {/* Action Button */}
              <motion.button
                onClick={() => handleActionClick(action)}
                className={cn(
                  "w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white",
                  action.bgColor || "bg-blue-500",
                  action.color || "text-white"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.icon}
              </motion.button>

              {/* Label para direções horizontais */}
              {showLabels && (expandDirection === "left" || expandDirection === "right") && (
                <motion.div
                  variants={labelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="px-3 py-1 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
                >
                  {action.label}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        variants={mainButtonVariants}
        animate={isExpanded ? "expanded" : "normal"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleMainClick}
          className={cn(
            sizeClasses[size],
            "rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-0"
          )}
          size="icon"
        >
          {isExpanded && actions.length > 0 ? (
            <X className={iconSizeClasses[size]} />
          ) : (
            <div className={iconSizeClasses[size]}>
              {icon}
            </div>
          )}
        </Button>
      </motion.div>
    </div>
  )
}