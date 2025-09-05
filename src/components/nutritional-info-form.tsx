"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { NutritionalInfo } from "@/types"
import { Apple } from "lucide-react"

// Lista de alérgenos comuns no Brasil
const commonAllergens = [
  "Leite", "Ovos", "Peixe", "Crustáceos", "Amendoim", 
  "Soja", "Trigo", "Centeio", "Cevada", "Aveia", "Glúten",
  "Amêndoa", "Avelã", "Castanha-de-caju", "Castanha-do-Pará", 
  "Macadâmia", "Nozes", "Pecã", "Pistache"
]

interface NutritionalInfoFormProps {
  initialData?: Partial<NutritionalInfo> | null
  onDataChange: (data: Partial<NutritionalInfo>) => void
}

export function NutritionalInfoForm({ initialData, onDataChange }: NutritionalInfoFormProps) {
  const [formData, setFormData] = useState<Partial<NutritionalInfo>>({
    servingSize: "",
    calories: undefined,
    carbohydrates: undefined,
    proteins: undefined,
    totalFat: undefined,
    saturatedFat: undefined,
    transFat: undefined,
    fiber: undefined,
    sodium: undefined,
    totalSugars: undefined,
    addedSugars: undefined,
    allergensContains: [],
    allergensMayContain: [],
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        calories: initialData.calories ?? undefined,
        carbohydrates: initialData.carbohydrates ?? undefined,
        proteins: initialData.proteins ?? undefined,
        totalFat: initialData.totalFat ?? undefined,
        saturatedFat: initialData.saturatedFat ?? undefined,
        transFat: initialData.transFat ?? undefined,
        fiber: initialData.fiber ?? undefined,
        sodium: initialData.sodium ?? undefined,
        totalSugars: initialData.totalSugars ?? undefined,
        addedSugars: initialData.addedSugars ?? undefined,
        allergensContains: initialData.allergensContains || [],
        allergensMayContain: initialData.allergensMayContain || [],
      })
    }
  }, [initialData])

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numericValue = value === '' ? undefined : parseFloat(value)
    
    const updatedData = { ...formData, [name]: numericValue }
    setFormData(updatedData)
    onDataChange(updatedData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    onDataChange(updatedData)
  }

  const handleAllergenChange = (allergen: string, type: 'contains' | 'mayContain', checked: boolean) => {
    const key = type === 'contains' ? 'allergensContains' : 'allergensMayContain'
    const currentAllergens = formData[key] || []
    let newAllergens: string[]

    if (checked) {
      newAllergens = [...currentAllergens, allergen]
    } else {
      newAllergens = currentAllergens.filter(a => a !== allergen)
    }
    
    const updatedData = { ...formData, [key]: newAllergens }
    setFormData(updatedData)
    onDataChange(updatedData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600"/>
            Informações Nutricionais
        </CardTitle>
        <CardDescription>
          Preencha os valores nutricionais do produto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campos de Nutrientes */}
        <div className="space-y-2">
            <Label htmlFor="servingSize">Porção de Referência</Label>
            <Input id="servingSize" name="servingSize" value={formData.servingSize || ""} onChange={handleChange} placeholder="Ex: 100g, 200ml, 1 unidade"/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Calorias (kcal)</Label>
            <Input id="calories" name="calories" type="number" step="0.1" value={formData.calories ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbohydrates">Carboidratos (g)</Label>
            <Input id="carbohydrates" name="carbohydrates" type="number" step="0.1" value={formData.carbohydrates ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proteins">Proteínas (g)</Label>
            <Input id="proteins" name="proteins" type="number" step="0.1" value={formData.proteins ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalFat">Gorduras Totais (g)</Label>
            <Input id="totalFat" name="totalFat" type="number" step="0.1" value={formData.totalFat ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saturatedFat">Gord. Saturadas (g)</Label>
            <Input id="saturatedFat" name="saturatedFat" type="number" step="0.1" value={formData.saturatedFat ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transFat">Gord. Trans (g)</Label>
            <Input id="transFat" name="transFat" type="number" step="0.1" value={formData.transFat ?? ''} onChange={handleNumericChange} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="totalSugars">Açúcares Totais (g)</Label>
            <Input id="totalSugars" name="totalSugars" type="number" step="0.1" value={formData.totalSugars ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addedSugars">Açúcares Adic. (g)</Label>
            <Input id="addedSugars" name="addedSugars" type="number" step="0.1" value={formData.addedSugars ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiber">Fibra Alimentar (g)</Label>
            <Input id="fiber" name="fiber" type="number" step="0.1" value={formData.fiber ?? ''} onChange={handleNumericChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sodium">Sódio (mg)</Label>
            <Input id="sodium" name="sodium" type="number" step="0.1" value={formData.sodium ?? ''} onChange={handleNumericChange} />
          </div>
        </div>

        {/* Seção de Alergênicos */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Alergénios</h4>
          <div className="space-y-2">
            <Label className="text-red-600">CONTÉM:</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAllergens.map(allergen => (
                <div key={allergen} className="flex items-center space-x-2">
                  <Checkbox
                    id={`contains-${allergen}`}
                    checked={formData.allergensContains?.includes(allergen)}
                    onCheckedChange={(checked) => handleAllergenChange(allergen, 'contains', !!checked)}
                  />
                  <Label htmlFor={`contains-${allergen}`}>{allergen}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-yellow-600">PODE CONTER:</Label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAllergens.map(allergen => (
                <div key={allergen} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mayContain-${allergen}`}
                    checked={formData.allergensMayContain?.includes(allergen)}
                    onCheckedChange={(checked) => handleAllergenChange(allergen, 'mayContain', !!checked)}
                  />
                  <Label htmlFor={`mayContain-${allergen}`}>{allergen}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}