"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Apple, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  TrendingUp,
  Heart,
  Leaf
} from "lucide-react"

interface HealthyAlternative {
  id: string
  name: string
  unit: string
  barcode?: string
  brand?: { name: string }
  healthScore: number
  nutritionalInfo: {
    calories?: number
    proteins?: number
    carbohydrates?: number
    totalFat?: number
    saturatedFat?: number
    transFat?: number
    fiber?: number
    sodium?: number
    totalSugars?: number
    servingSize?: string
    allergensContains: string[]
    allergensMayContain: string[]
  }
  averagePrice?: number
  purchaseCount: number
  healthReasons: string[]
}

interface HealthyAlternativesProps {
  categoryId: string
  excludeProductId?: string
  onAddToCart?: (productId: string, productName: string) => void
  onAddToList?: (productId: string, productName: string) => void
  maxItems?: number
  showAddButtons?: boolean
  title?: string
}

export function HealthyAlternatives({ 
  categoryId, 
  excludeProductId,
  onAddToCart,
  onAddToList,
  maxItems = 3,
  showAddButtons = true,
  title
}: HealthyAlternativesProps) {
  const [alternatives, setAlternatives] = useState<HealthyAlternative[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (categoryId) {
      fetchAlternatives()
    }
  }, [categoryId, excludeProductId])

  const fetchAlternatives = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        categoryId,
        limit: maxItems.toString(),
        ...(excludeProductId ? { excludeProductId } : {})
      })

      const response = await fetch(`/api/products/healthy-alternatives?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAlternatives(data.alternatives)
        setCategoryName(data.categoryName)
      }
    } catch (error) {
      console.error('Erro ao buscar alternativas saudáveis:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <Heart className="h-4 w-4 text-green-600" />
    if (score >= 60) return <Leaf className="h-4 w-4 text-yellow-600" />
    return <Apple className="h-4 w-4 text-red-600" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600" />
            Sugestões Saudáveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                  </div>
                  <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alternatives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600" />
            {title || "Sugestões Saudáveis"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Apple className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">
              Nenhuma alternativa saudável encontrada para {categoryName || 'esta categoria'}
            </p>
            <p className="text-xs mt-1">
              Adicione informações nutricionais aos produtos para ver sugestões
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600" />
            {title || `Opções Mais Saudáveis - ${categoryName}`}
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {alternatives.length} sugestões
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alternatives.map((product, index) => (
            <div key={product.id} className={`p-3 border rounded-lg ${getHealthScoreColor(product.healthScore)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    {getHealthScoreIcon(product.healthScore)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    {product.brand && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {product.brand.name}
                      </p>
                    )}
                    
                    {/* Informações Nutricionais Principais */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {product.nutritionalInfo.calories && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {product.nutritionalInfo.calories} kcal
                        </span>
                      )}
                      {product.nutritionalInfo.proteins && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {product.nutritionalInfo.proteins}g prot.
                        </span>
                      )}
                      {product.nutritionalInfo.fiber && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {product.nutritionalInfo.fiber}g fibras
                        </span>
                      )}
                    </div>

                    {/* Razões de Saúde */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.healthReasons.slice(0, 2).map((reason, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    {getHealthScoreIcon(product.healthScore)}
                    <span className="text-sm font-bold">
                      {product.healthScore}
                    </span>
                  </div>
                  
                  {product.averagePrice && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      R$ {product.averagePrice.toFixed(2)}
                    </div>
                  )}

                  {showAddButtons && (
                    <div className="flex gap-1">
                      {onAddToCart && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => onAddToCart(product.id, product.name)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Comprar
                        </Button>
                      )}
                      {onAddToList && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => onAddToList(product.id, product.name)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Lista
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span>
                    {product.purchaseCount > 0 
                      ? `Comprado ${product.purchaseCount} vezes` 
                      : 'Produto novo'}
                  </span>
                  {product.nutritionalInfo.servingSize && (
                    <span>Porção: {product.nutritionalInfo.servingSize}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs text-green-700 dark:text-green-400">
              <p className="font-medium mb-1">Dica: Por que estas opções são mais saudáveis?</p>
              <p>
                Produtos com score alto geralmente têm menos sódio, açúcar e gorduras ruins, 
                e mais fibras, proteínas e outros nutrientes benéficos.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}