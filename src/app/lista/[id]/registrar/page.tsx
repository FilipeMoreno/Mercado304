"use client"

import { ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ShoppingListReview } from "@/components/shopping-list/shopping-list-review"
import { Button } from "@/components/ui/button"
import { MarketSelect } from "@/components/selects/market-select"
import { MarketSelectDialog } from "@/components/selects/market-select-dialog"
import { PaymentMethodSelectDialog } from "@/components/selects/payment-method-select-dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useUIPreferences } from "@/hooks"
import { PaymentMethod } from "@/types"

const paymentMethods = [
  { value: "MONEY", label: "Dinheiro" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
  { value: "PIX", label: "PIX" },
]

export default function RegistrarCompraListaPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string
  const { selectStyle } = useUIPreferences()

  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dados da compra
  const [marketId, setMarketId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = useState("MONEY")
  const [totalDiscount, setTotalDiscount] = useState(0)

  const fetchListDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Lista não encontrada")
          router.push("/lista")
          return
        }
        throw new Error("Erro ao buscar lista")
      }

      const data = await response.json()
      setList(data)
    } catch (error) {
      console.error("Erro ao buscar detalhes da lista:", error)
      toast.error("Erro ao carregar lista")
    } finally {
      setLoading(false)
    }
  }, [listId, router])

  useEffect(() => {
    fetchListDetails()
  }, [fetchListDetails])

  const handleConfirm = async (reviewedItems: any[]) => {
    if (!marketId) {
      toast.error("Selecione o mercado onde fez a compra")
      return
    }

    setSubmitting(true)
    try {
      // Criar compra com os itens revisados
      const purchaseData = {
        marketId,
        purchaseDate,
        paymentMethod,
        totalDiscount,
        items: reviewedItems.map(item => ({
          productId: item.linkedProductId || null,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitDiscount: item.unitDiscount || 0,
        })),
      }

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao registrar compra")
      }

      const purchase = await response.json()
      toast.success("Compra registrada com sucesso!")
      router.push(`/compras`)
    } catch (error: any) {
      console.error("Erro ao registrar compra:", error)
      toast.error(error.message || "Erro ao registrar compra")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full size-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando lista...</p>
        </div>
      </div>
    )
  }

  if (!list || !list.items || list.items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/lista/${listId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Registrar Compra</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <Package className="size-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Esta lista está vazia. Adicione itens antes de registrar uma compra.
            </p>
            <Link href={`/lista/${listId}`}>
              <Button className="mt-4">
                Voltar para Lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/lista/${listId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Registrar Compra</h1>
          <p className="text-gray-600 mt-2">Lista: {list.name}</p>
        </div>
      </div>

      {/* Informações da Compra */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mercado *</Label>
              {selectStyle === "dialog" ? (
                <MarketSelectDialog
                  value={marketId}
                  onValueChange={setMarketId}
                />
              ) : (
                <MarketSelect
                  value={marketId}
                  onValueChange={setMarketId}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Data da Compra *</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              {selectStyle === "dialog" ? (
                <PaymentMethodSelectDialog
                  value={paymentMethod as PaymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                />
              ) : (
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Desconto Total (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={totalDiscount || ""}
                onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review dos itens */}
      <ShoppingListReview
        items={list.items}
        onConfirm={handleConfirm}
        onCancel={() => router.push(`/lista/${listId}`)}
        isSubmitting={submitting}
      />
    </div>
  )
}

