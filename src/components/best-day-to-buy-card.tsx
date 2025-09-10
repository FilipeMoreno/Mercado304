"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { CalendarDays, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Skeleton } from "./ui/skeleton"

interface BestDayAnalysis {
  dayOfWeek: number
  averagePrice: number
  purchaseCount: number
}

interface BestDayToBuyCardProps {
  productId: string
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function BestDayToBuyCard({ productId }: BestDayToBuyCardProps) {
  const [data, setData] = useState<BestDayAnalysis[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setAiAnalysis(null)
      try {
        const response = await fetch('/api/products/best-day-to-buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.message) {
            setData(null)
          } else {
            setData(result)
            fetchAiAnalysis() // Chama a análise da IA depois de obter os dados
          }
        } else {
          toast.error('Erro ao buscar análise do dia da semana')
        }
      } catch (error) {
        console.error('Erro ao buscar análise:', error)
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchData()
    }
  }, [productId])

  const fetchAiAnalysis = async () => {
    setLoadingAi(true)
    try {
      const response = await fetch('/api/products/best-day-to-buy/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })
      if (response.ok) {
        const result = await response.json()
        setAiAnalysis(result.analysis)
      }
    } catch (error) {
      console.error("Erro ao buscar análise da IA", error)
    } finally {
      setLoadingAi(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Análise por Dia da Semana
          </CardTitle>
          <CardDescription>
            Melhor dia para comprar este produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return null
  }
  
  const formattedData = data.map(d => ({
    name: dayNames[d.dayOfWeek],
    "Preço Médio": d.averagePrice,
    "Compras": d.purchaseCount
  }))

  const bestDay = data.reduce((prev, curr) => prev.averagePrice < curr.averagePrice ? prev : curr)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Análise por Dia da Semana
        </CardTitle>
        <CardDescription>
          Melhor dia para comprar este produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="Preço Médio" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm font-medium text-green-800">
            Com base em {bestDay.purchaseCount} compras, o melhor dia para comprar este produto é
            <span className="font-bold ml-1">{dayNames[bestDay.dayOfWeek]}</span>, com preço médio de
            <span className="font-bold ml-1">R$ {bestDay.averagePrice.toFixed(2)}</span>.
          </p>
        </div>

        {loadingAi && (
          <Card className="mt-4 bg-blue-50 border-blue-200">
             <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <Skeleton className="h-4 w-48 bg-blue-100" />
                </div>
             </CardContent>
          </Card>
        )}

        {aiAnalysis && !loadingAi && (
          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                <Sparkles className="h-4 w-4" />
                Análise do Zé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">{aiAnalysis}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}