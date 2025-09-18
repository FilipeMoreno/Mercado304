"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface RecipeSearchProps {
	onSearch: (search: string, ingredients: string[]) => void
	availableIngredients?: string[]
}

export function RecipeSearch({ onSearch, availableIngredients = [] }: RecipeSearchProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
	const [ingredientInput, setIngredientInput] = useState("")
	const [showSuggestions, setShowSuggestions] = useState(false)

	const handleSearch = () => {
		onSearch(searchTerm, selectedIngredients)
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
		const newIngredients = selectedIngredients.filter(i => i !== ingredient)
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
		.filter(ingredient => 
			ingredient.toLowerCase().includes(ingredientInput.toLowerCase()) &&
			!selectedIngredients.includes(ingredient)
		)
		.slice(0, 10)

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					{/* Busca por nome/descrição */}
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar receitas por nome ou descrição..."
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
							Buscar Receitas
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