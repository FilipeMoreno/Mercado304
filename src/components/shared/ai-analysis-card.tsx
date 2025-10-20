"use client"

import { Lightbulb, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface AiAnalysisCardProps {
  title: string
  description?: string
  icon?: React.ElementType
  children: React.ReactNode
  loading?: boolean
  className?: string
}

export function AiAnalysisCard({
  title,
  description,
  icon: Icon = Lightbulb,
  children,
  loading = false,
  className = "",
}: AiAnalysisCardProps) {
  // Estado de loading com skeleton
  if (loading) {
    return (
      <Card
        className={`relative overflow-hidden border border-violet-200/50 dark:border-violet-500/30 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/10 dark:via-blue-950/10 dark:to-cyan-950/10 shadow-sm rounded-lg ${className}`}
      >
        {/* Decoração de fundo */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/10 to-cyan-200/10 dark:from-violet-400/5 dark:to-cyan-400/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/10 to-violet-200/10 dark:from-blue-400/5 dark:to-violet-400/5 rounded-full blur-xl" />

        <CardContent className="relative p-6">
          <div className="flex items-start gap-4">
            {/* Skeleton para o ícone */}
            <Skeleton className="size-12 rounded-lg shrink-0 bg-violet-200 dark:bg-violet-800" />

            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Skeleton para o título */}
                <Skeleton className="h-6 w-1/2 rounded-sm bg-violet-200 dark:bg-violet-800" />
                {/* Skeleton para o badge "IA" */}
                <Skeleton className="h-6 w-10 rounded-sm bg-violet-200 dark:bg-violet-800" />
              </div>

              {/* Skeleton para a descrição */}
              <Skeleton className="h-4 w-3/4 rounded-sm bg-violet-200 dark:bg-violet-800" />

              {/* Skeleton para o conteúdo (children) */}
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full rounded-sm bg-violet-200 dark:bg-violet-800" />
                <Skeleton className="h-4 w-4/5 rounded-sm bg-violet-200 dark:bg-violet-800" />
                <Skeleton className="h-4 w-3/4 rounded-sm bg-violet-200 dark:bg-violet-800" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estado carregado
  return (
    <Card
      className={`relative overflow-hidden border border-transparent bg-linear-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/10 dark:via-blue-950/10 dark:to-cyan-950/10 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-cyan-400/20 dark:from-violet-400/10 dark:to-cyan-400/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-violet-400/20 dark:from-blue-400/10 dark:to-violet-400/10 rounded-full blur-xl" />

      <CardContent className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 shadow-sm shrink-0">
            <Icon className="size-6 text-white" />
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {title}
              </h3>
              <Badge
                variant="secondary"
                className="bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900 dark:text-violet-100 dark:border-violet-800 shrink-0"
              >
                <Sparkles className="size-3 mr-1" />
                IA
              </Badge>
            </div>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </p>
            )}
            <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {children}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}