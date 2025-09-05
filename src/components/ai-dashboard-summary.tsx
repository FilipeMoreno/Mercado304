"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2 } from "lucide-react"
import { Skeleton } from "./ui/skeleton"

export function AiDashboardSummary() {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      try {
        const response = await fetch('/api/dashboard/ai-summary')
        if (response.ok) {
          const data = await response.json()
          setSummary(data.summary)
        }
      } catch (error) {
        console.error("Erro ao buscar resumo da IA:", error)
        setSummary("Não foi possível carregar os insights no momento.")
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  return (
    <Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <Wand2 className="h-5 w-5" />
          Insight da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-purple-800 dark:text-purple-300">
            {summary}
          </p>
        )}
      </CardContent>
    </Card>
  )
}