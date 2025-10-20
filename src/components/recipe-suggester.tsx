"use client"

import { ChefHat, Lightbulb, Loader2, Utensils } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TempStorage } from "@/lib/temp-storage"

interface RecipeSuggestion {
	refeicao: string
	prato: string
	descricao: string
	tempo_preparo: string
	ingredientes: string[]
	modo_preparo: string
	dica_chef: string
}

interface RecipeSuggesterProps {
	ingredientList: string[]
	buttonText?: string
}

export function RecipeSuggester({ ingredientList, buttonText = "Sugerir Receitas" }: RecipeSuggesterProps) {
	const router = useRouter()
	const [isOpen, setIsOpen] = useState(false)
	const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([])
	const [loading, setLoading] = useState(false)

	const handleSuggestRecipes = async () => {
		if (ingredientList.length < 2) {
			toast.info("Você precisa de pelo menos 2 ingredientes para receber sugestões.")
			return
		}
		setIsOpen(true)
		setLoading(true)
		setSuggestions([])
		try {
			const response = await fetch("/api/ai/suggest-recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ingredients: ingredientList }),
			})
			if (response.ok) {
				const data = await response.json()
				setSuggestions(data.sugestoes || [])
			} else {
				toast.error("Erro ao buscar sugestões de receitas.")
			}
		} catch (error) {
			console.error("Erro ao buscar sugestões:", error)
			toast.error("Erro ao carregar sugestões.")
		} finally {
			setLoading(false)
		}
	}

	const viewRecipe = (recipe: RecipeSuggestion) => {
		const storageKey = TempStorage.save({ recipe })
		router.push(`/receitas/visualizar?storageKey=${storageKey}`)
	}

	return (
		<>
			<Button onClick={handleSuggestRecipes} variant="outline">
				<Utensils className="size-4 mr-2" />
				{buttonText}
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Lightbulb className="size-5 text-yellow-500" />
							Sugestões do Chefe Virtual
						</DialogTitle>
						<DialogDescription>Clique em uma receita para ver os detalhes completos.</DialogDescription>
					</DialogHeader>
					<div className="max-h-[60vh] overflow-y-auto pr-4">
						{loading ? (
							<div className="flex flex-col items-center justify-center h-48">
								<Loader2 className="size-8 animate-spin text-primary" />
								<p className="mt-4 text-muted-foreground">Buscando receitas criativas...</p>
							</div>
						) : suggestions.length > 0 ? (
							<div className="space-y-4">
								{suggestions.map((sug, index) => (
									<div
										key={index}
										className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow-sm"
										onClick={() => viewRecipe(sug)}
									>
										<div className="flex justify-between items-start">
											<div>
												<p className="text-sm text-primary font-medium">{sug.refeicao}</p>
												<h3 className="font-semibold text-lg">{sug.prato}</h3>
											</div>
											<div className="text-sm text-muted-foreground">{sug.tempo_preparo}</div>
										</div>
										<p className="text-sm mt-2">{sug.descricao}</p>
										<div className="mt-3">
											<p className="text-xs font-semibold">Ingredientes Principais:</p>
											<div className="flex flex-wrap gap-1 mt-1">
												{sug.ingredientes.slice(0, 3).map((ing) => (
													<span key={ing} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-sm">
														{ing.split(" de ")[1] || ing}
													</span>
												))}
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center h-48 flex flex-col justify-center">
								<p>Nenhuma sugestão encontrada.</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
