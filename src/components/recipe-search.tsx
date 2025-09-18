"use client"

import { Search, Settings, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface RecipeSearchProps {
	onSearch: (search: string, ingredients: string[]) => void
	onAISearch?: (search: string, ingredients: string[], mealTypes?: string[]) => void
	onSurpriseMe?: (mealTypes: string[]) => void
	availableIngredients?: string[]
	hideNormalSearch?: boolean
}

export function RecipeSearch({
	onSearch,
	onAISearch,
	onSurpriseMe,
	availableIngredients = [],
	hideNormalSearch = false,
}: RecipeSearchProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
	const [ingredientInput, setIngredientInput] = useState("")
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [useAI, setUseAI] = useState(hideNormalSearch)
	const [showSurpriseSettings, setShowSurpriseSettings] = useState(false)
	const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([])

	const mealTypes = [
		{ id: "cafe_da_manha", label: "Café da Manhã" },
		{ id: "almoco", label: "Almoço" },
		{ id: "jantar", label: "Jantar" },
		{ id: "lanche", label: "Lanche" },
		{ id: "sobremesa", label: "Sobremesa" },
		{ id: "entrada", label: "Entrada" },
	]

	const handleSearch = () => {
		if (useAI && onAISearch) {
			onAISearch(searchTerm, selectedIngredients, selectedMealTypes)
		} else {
			onSearch(searchTerm, selectedIngredients)
		}
	}

	const handleSurpriseMe = () => {
		if (onSurpriseMe) {
			const mealTypesToUse = selectedMealTypes.length > 0 ? selectedMealTypes : ["almoco", "jantar"]
			onSurpriseMe(mealTypesToUse)
		}
		setShowSurpriseSettings(false)
	}

	const handleMealTypeToggle = (mealTypeId: string) => {
		setSelectedMealTypes((prev) =>
			prev.includes(mealTypeId) ? prev.filter((id) => id !== mealTypeId) : [...prev, mealTypeId],
		)
	}

	const handleClearSearch = () => {
		setSearchTerm("")
		setSelectedIngredients([])
		setIngredientInput("")
		onSearch("", [])
	}

	const handleAddIngredient = (ingredient: string) => {
		if (ingredient && !selectedIngredients.includes(ingredient)) {
			const newIngredients = [...selectedIngredients, ingredient]
			setSelectedIngredients(newIngredients)
			setIngredientInput("")
			setShowSuggestions(false)
			onSearch(searchTerm, newIngredients)
		}
	}

	const handleRemoveIngredient = (ingredient: string) => {
		const newIngredients = selectedIngredients.filter((i) => i !== ingredient)
		setSelectedIngredients(newIngredients)
		onSearch(searchTerm, newIngredients)
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			if (ingredientInput.trim()) {
				handleAddIngredient(ingredientInput.trim())
			} else {
				handleSearch()
			}
		}
	}

	const filteredSuggestions = availableIngredients
		.filter(
			(ingredient) =>
				ingredient.toLowerCase().includes(ingredientInput.toLowerCase()) && !selectedIngredients.includes(ingredient),
		)
		.slice(0, 10)

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					{/* Switch para alternar entre busca local e IA */}
					{!hideNormalSearch && (
						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center space-x-2">
								<Switch id="ai-mode" checked={useAI} onCheckedChange={setUseAI} />
								<Label htmlFor="ai-mode" className="text-sm font-medium">
									{useAI ? "🤖 Buscar com IA" : "📚 Buscar receitas salvas"}
								</Label>
							</div>

							{/* Botão Me Surpreenda */}
							<Dialog open={showSurpriseSettings} onOpenChange={setShowSurpriseSettings}>
								<DialogTrigger asChild>
									<Button variant="outline" size="sm" disabled={!useAI}>
										<Sparkles className="h-4 w-4 mr-2" />
										Me Surpreenda
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Me Surpreenda! ✨</DialogTitle>
										<DialogDescription>
											Selecione os tipos de refeição que você gostaria de receber sugestões.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-3">
											{mealTypes.map((mealType) => (
												<div key={mealType.id} className="flex items-center space-x-2">
													<Checkbox
														id={mealType.id}
														checked={selectedMealTypes.includes(mealType.id)}
														onCheckedChange={() => handleMealTypeToggle(mealType.id)}
													/>
													<Label htmlFor={mealType.id} className="text-sm">
														{mealType.label}
													</Label>
												</div>
											))}
										</div>
										<div className="flex gap-2">
											<Button onClick={handleSurpriseMe} className="flex-1">
												<Sparkles className="h-4 w-4 mr-2" />
												Gerar Receitas Surpresa
											</Button>
											<Button variant="outline" onClick={() => setShowSurpriseSettings(false)}>
												Cancelar
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					)}

					{/* Botão Me Surpreenda para página dedicada */}
					{hideNormalSearch && (
						<div className="flex justify-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
							<Dialog open={showSurpriseSettings} onOpenChange={setShowSurpriseSettings}>
								<DialogTrigger asChild>
									<Button variant="outline" size="lg" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
										<Sparkles className="h-5 w-5 mr-2" />
										Me Surpreenda com Receitas Criativas!
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Me Surpreenda! ✨</DialogTitle>
										<DialogDescription>
											Selecione os tipos de refeição que você gostaria de receber sugestões.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-3">
											{mealTypes.map((mealType) => (
												<div key={mealType.id} className="flex items-center space-x-2">
													<Checkbox
														id={mealType.id}
														checked={selectedMealTypes.includes(mealType.id)}
														onCheckedChange={() => handleMealTypeToggle(mealType.id)}
													/>
													<Label htmlFor={mealType.id} className="text-sm">
														{mealType.label}
													</Label>
												</div>
											))}
										</div>
										<div className="flex gap-2">
											<Button onClick={handleSurpriseMe} className="flex-1">
												<Sparkles className="h-4 w-4 mr-2" />
												Gerar Receitas Surpresa
											</Button>
											<Button variant="outline" onClick={() => setShowSurpriseSettings(false)}>
												Cancelar
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					)}

					{/* Busca por nome/descrição */}
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder={useAI ? "Descreva o que você quer cozinhar..." : "Buscar receitas por nome ou descrição..."}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyPress={handleKeyPress}
							className="pl-9"
						/>
					</div>

					{/* Busca por ingredientes */}
					<div className="space-y-2">
						<div className="relative">
							<Input
								placeholder="Adicionar ingrediente..."
								value={ingredientInput}
								onChange={(e) => {
									setIngredientInput(e.target.value)
									setShowSuggestions(e.target.value.length > 0)
								}}
								onKeyPress={handleKeyPress}
								onFocus={() => setShowSuggestions(ingredientInput.length > 0)}
							/>

							{/* Sugestões de ingredientes */}
							{showSuggestions && filteredSuggestions.length > 0 && (
								<div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
									{filteredSuggestions.map((ingredient) => (
										<button
											key={ingredient}
											className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											onClick={() => handleAddIngredient(ingredient)}
										>
											{ingredient}
										</button>
									))}
								</div>
							)}
						</div>

						{/* Ingredientes selecionados */}
						{selectedIngredients.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{selectedIngredients.map((ingredient) => (
									<Badge key={ingredient} variant="secondary" className="pr-1">
										{ingredient}
										<button
											onClick={() => handleRemoveIngredient(ingredient)}
											className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					{/* Botões de ação */}
					<div className="flex gap-2">
						<Button onClick={handleSearch} className="flex-1">
							<Search className="h-4 w-4 mr-2" />
							{useAI ? "Gerar com IA" : "Buscar Receitas"}
						</Button>
						{(searchTerm || selectedIngredients.length > 0) && (
							<Button variant="outline" onClick={handleClearSearch}>
								<X className="h-4 w-4 mr-2" />
								Limpar
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
