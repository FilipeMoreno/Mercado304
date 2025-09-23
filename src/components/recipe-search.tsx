"use client"

import { Search, Sparkles, X } from "lucide-react"
import { useId, useState } from "react"
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
	const aiModeId = useId()
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
		<Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
			<CardContent className="p-8">
				<div className="space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<h2 className="text-2xl font-bold text-gray-900">Criar Receitas com IA</h2>
						<p className="text-gray-600">
							Descreva o que você quer cozinhar ou adicione ingredientes para receitas personalizadas
						</p>
					</div>

					{/* Switch para alternar entre busca local e IA */}
					{!hideNormalSearch && (
						<div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
							<div className="flex items-center space-x-3">
								<Switch id={aiModeId} checked={useAI} onCheckedChange={setUseAI} />
								<Label htmlFor={aiModeId} className="text-sm font-semibold text-gray-700">
									{useAI ? "🤖 Buscar com IA" : "📚 Buscar receitas salvas"}
								</Label>
							</div>

							{/* Botão Me Surpreenda */}
							<Dialog open={showSurpriseSettings} onOpenChange={setShowSurpriseSettings}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={!useAI}
										className="border-blue-300 text-blue-700 hover:bg-blue-100"
									>
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
						<div className="flex justify-center p-6 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 rounded-xl border border-yellow-200 shadow-sm">
							<Dialog open={showSurpriseSettings} onOpenChange={setShowSurpriseSettings}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										size="lg"
										className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 px-8 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
									>
										<Sparkles className="h-5 w-5 mr-3" />
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
					<div className="space-y-2">
						<Label className="text-sm font-semibold text-gray-700">O que você quer cozinhar?</Label>
						<div className="relative">
							<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
							<Input
								placeholder={useAI ? "Ex: massa com frango e legumes..." : "Buscar receitas por nome ou descrição..."}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyPress={handleKeyPress}
								className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200"
							/>
						</div>
					</div>

					{/* Busca por ingredientes */}
					<div className="space-y-3">
						<Label className="text-sm font-semibold text-gray-700">Ingredientes disponíveis</Label>
						<div className="relative">
							<Input
								placeholder="Digite um ingrediente e pressione Enter..."
								value={ingredientInput}
								onChange={(e) => {
									setIngredientInput(e.target.value)
									setShowSuggestions(e.target.value.length > 0)
								}}
								onKeyPress={handleKeyPress}
								onFocus={() => setShowSuggestions(ingredientInput.length > 0)}
								className="h-12 text-base border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-200"
							/>

							{/* Sugestões de ingredientes */}
							{showSuggestions && filteredSuggestions.length > 0 && (
								<div className="absolute z-10 w-full mt-2 bg-white border-2 border-green-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
									{filteredSuggestions.map((ingredient) => (
										<button
											key={ingredient}
											type="button"
											className="w-full px-4 py-3 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors duration-150"
											onClick={() => handleAddIngredient(ingredient)}
										>
											<span className="text-gray-700 font-medium">{ingredient}</span>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Ingredientes selecionados */}
						{selectedIngredients.length > 0 && (
							<div className="space-y-2">
								<Label className="text-sm font-medium text-gray-600">Ingredientes selecionados:</Label>
								<div className="flex flex-wrap gap-2">
									{selectedIngredients.map((ingredient) => (
										<Badge
											key={ingredient}
											variant="secondary"
											className="pr-1 bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors duration-150"
										>
											{ingredient}
											<button
												type="button"
												onClick={() => handleRemoveIngredient(ingredient)}
												className="ml-2 hover:bg-green-300 rounded-full p-0.5 transition-colors duration-150"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Botões de ação */}
					<div className="flex gap-3 pt-2">
						<Button
							onClick={handleSearch}
							className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
						>
							{!useAI && <Search className="h-5 w-5 mr-2" />}
							{useAI ? "✨ Gerar com IA" : "🔍 Buscar Receitas"}
						</Button>
						{(searchTerm || selectedIngredients.length > 0) && (
							<Button
								variant="outline"
								onClick={handleClearSearch}
								className="h-12 px-6 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
							>
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
