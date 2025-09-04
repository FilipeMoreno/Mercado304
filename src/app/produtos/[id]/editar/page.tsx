"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { BrandSelect, CategorySelect } from "@/components/selects"
import { ArrowLeft, Package, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Product } from "@/types"

const units = [
  "unidade",
  "kg",
  "g",
  "litro",
  "ml",
  "pacote",
  "caixa",
  "garrafa",
  "lata",
  "saco"
]

export default function EditarProdutoPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    unit: "unidade",
    brandId: "",
    barcode: "",
    hasStock: false,
    minStock: "",
    maxStock: "",
    hasExpiration: false,
    defaultShelfLifeDays: ""
  })

  useEffect(() => {
    if (productId) {
      fetchData()
    }
  }, [productId])

  const fetchData = async () => {
    try {
      const productRes = await fetch(`/api/products/${productId}`)

      if (!productRes.ok) {
        toast.error('Produto não encontrado')
        router.push('/produtos')
        return
      }

      const productData = await productRes.json()
      setProduct(productData)

      // Preencher formulário
      setFormData({
        name: productData.name,
        categoryId: productData.categoryId || "",
        unit: productData.unit,
        brandId: productData.brandId || "",
        barcode: productData.barcode || "",
        hasStock: productData.hasStock || false,
        minStock: productData.minStock?.toString() || "",
        maxStock: productData.maxStock?.toString() || "",
        hasExpiration: productData.hasExpiration || false,
        defaultShelfLifeDays: productData.defaultShelfLifeDays?.toString() || ""
      })
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
      router.push('/produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Nome do produto é obrigatório")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          categoryId: formData.categoryId || null,
          unit: formData.unit,
          brandId: formData.brandId || null,
          barcode: formData.barcode.trim() || null,
          hasStock: formData.hasStock,
          minStock: formData.minStock ? parseFloat(formData.minStock) : null,
          maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
          hasExpiration: formData.hasExpiration,
          defaultShelfLifeDays: formData.defaultShelfLifeDays ? parseInt(formData.defaultShelfLifeDays) : null
        })
      })

      if (response.ok) {
        toast.success('Produto atualizado com sucesso!')
        router.push(`/produtos/${productId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar produto')
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      toast.error('Erro ao atualizar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/produtos/${productId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Editar: {product.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Atualize as informações do produto
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Leite Integral"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandId">Marca</Label>
                <BrandSelect
                  value={formData.brandId}
                  onValueChange={(value) => handleSelectChange("brandId", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <CategorySelect
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de Medida</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => handleSelectChange("unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Ex: 7891234567890"
                />
              </div>
            </div>

            {/* Controle de Estoque */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Controle de Estoque</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasStock" 
                  checked={formData.hasStock}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, hasStock: checked as boolean }))
                  }
                />
                <Label htmlFor="hasStock">Produto com controle de estoque</Label>
              </div>

              {formData.hasStock && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input
                      id="minStock"
                      name="minStock"
                      type="number"
                      step="0.01"
                      value={formData.minStock}
                      onChange={handleChange}
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Estoque Máximo</Label>
                    <Input
                      id="maxStock"
                      name="maxStock"
                      type="number"
                      step="0.01"
                      value={formData.maxStock}
                      onChange={handleChange}
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Controle de Validade */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Controle de Validade</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasExpiration" 
                  checked={formData.hasExpiration}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, hasExpiration: checked as boolean }))
                  }
                />
                <Label htmlFor="hasExpiration">Produto com validade</Label>
              </div>

              {formData.hasExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="defaultShelfLifeDays">Prazo de Validade Padrão (dias)</Label>
                  <Input
                    id="defaultShelfLifeDays"
                    name="defaultShelfLifeDays"
                    type="number"
                    value={formData.defaultShelfLifeDays}
                    onChange={handleChange}
                    placeholder="Ex: 30"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Usado para calcular automaticamente a validade quando o produto for adicionado ao estoque
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Link href={`/produtos/${productId}`}>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}