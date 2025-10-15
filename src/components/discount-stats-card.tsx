"use client"

import { motion } from "framer-motion"
import { Percent, TrendingDown, Store, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DiscountStatsCardProps {
  discountStats?: {
    totalDiscounts: number
    purchasesWithDiscounts: number
    averageDiscount: number
    discountPercentage: number
    monthlyDiscounts: Array<{ month: string; totalDiscounts: number }>
    topDiscountMarkets: Array<{
      marketId: string
      marketName: string
      totalDiscounts: number
      purchasesWithDiscounts: number
    }>
  }
  isLoading?: boolean
}

export function DiscountStatsCard({ discountStats, isLoading }: DiscountStatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!discountStats) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-green-600" />
            Estatísticas de Descontos
          </CardTitle>
          <CardDescription>
            Análise dos descontos obtidos nas suas compras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo Principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(discountStats.totalDiscounts)}
              </div>
              <div className="text-sm text-gray-600">Total Economizado</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {discountStats.purchasesWithDiscounts}
              </div>
              <div className="text-sm text-gray-600">Compras com Desconto</div>
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Média por desconto:</span>
              <span className="font-medium">{formatCurrency(discountStats.averageDiscount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">% com desconto:</span>
              <span className="font-medium">{formatPercentage(discountStats.discountPercentage)}</span>
            </div>
          </div>

          {/* Top Mercados com Descontos */}
          {discountStats.topDiscountMarkets.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Mercados com Mais Descontos
              </h4>
              <div className="space-y-2">
                {discountStats.topDiscountMarkets.slice(0, 3).map((market, index) => (
                  <div key={market.marketId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{market.marketName}</span>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(market.totalDiscounts)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {market.purchasesWithDiscounts} compras
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico de Descontos Mensais */}
          {discountStats.monthlyDiscounts.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Descontos por Mês
              </h4>
              <div className="space-y-2">
                {discountStats.monthlyDiscounts.slice(-6).map((month, index) => (
                  <div key={month.month} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {new Date(month.month + "-01").toLocaleDateString("pt-BR", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(month.totalDiscounts)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
