import { useEffect, useEffectEvent, useState } from "react"
import { useDebounce } from "./use-debounce"

interface DuplicateProduct {
	id: string
	name: string
	brand?: {
		name: string
	}
	category?: {
		name: string
	}
	barcodes?: {
		barcode: string
	}[]
}

interface ProductDuplicateCheckOptions {
	productName: string
	brandId?: string
	categoryId?: string
}

export function useProductDuplicateCheck(options: ProductDuplicateCheckOptions) {
	const { productName, brandId, categoryId } = options
	const [duplicateProduct, setDuplicateProduct] = useState<DuplicateProduct | null>(null)
	const [isChecking, setIsChecking] = useState(false)
	const debouncedName = useDebounce(productName, 500)

	// useEffectEvent para verificação de duplicação - sempre vê brandId e categoryId atualizados
	const onCheckDuplicate = useEffectEvent(async () => {
		if (!debouncedName || debouncedName.length < 3) {
			setDuplicateProduct(null)
			return
		}

		setIsChecking(true)
		try {
			const response = await fetch(`/api/products?search=${encodeURIComponent(debouncedName)}&limit=10`)
			if (response.ok) {
				const data = await response.json()
				const products = data.products || []
				
				// Verificar se há produto com nome exatamente igual
				const exactNameMatch = products.find(
					(p: DuplicateProduct) => p.name.toLowerCase() === debouncedName.toLowerCase()
				)
				
				if (exactNameMatch) {
					// Se também tem marca ou categoria correspondente, é duplicado com mais certeza
					let matchScore = 1 // Nome igual = score 1
					
					if (brandId && exactNameMatch.brand) {
						// Verificar se a marca corresponde
						const brandMatch = exactNameMatch.brand.name?.toLowerCase().includes(brandId.toLowerCase())
						if (brandMatch) {
							matchScore += 2 // Marca corresponde = +2
						}
					}
					
					if (categoryId && exactNameMatch.category) {
						// Verificar se a categoria corresponde
						const categoryMatch = exactNameMatch.category.id === categoryId
						if (categoryMatch) {
							matchScore += 2 // Categoria corresponde = +2
						}
					}
					
					// Se nome + marca + categoria = score 5, ou nome + uma delas = score 3
					// Considerar duplicado se score >= 3
					if (matchScore >= 3) {
						// Buscar detalhes completos do produto com barcodes
						const detailsResponse = await fetch(`/api/products/${exactNameMatch.id}`)
						if (detailsResponse.ok) {
							const details = await detailsResponse.json()
							setDuplicateProduct(details)
						} else {
							setDuplicateProduct(exactNameMatch)
						}
					} else {
						setDuplicateProduct(null)
					}
				} else {
					setDuplicateProduct(null)
				}
			}
		} catch (error) {
			console.error("Erro ao verificar duplicação:", error)
			setDuplicateProduct(null)
		} finally {
			setIsChecking(false)
		}
	})

	useEffect(() => {
		onCheckDuplicate()
	}, [debouncedName]) // ✅ brandId e categoryId não são dependências (Effect Event)

	return { duplicateProduct, isChecking }
}

