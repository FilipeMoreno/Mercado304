"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Camera, Check, LinkIcon, List, Plus, Save, Sparkles, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { PriceAlert } from "@/components/price-alert"
import { RelatedProductsCard } from "@/components/related-products-card"
import { PhotoListCreator } from "@/components/shopping-list/photo-list-creator"
import { NovaListaSkeleton } from "@/components/skeletons/nova-lista-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveSelectDialog, type SelectOption } from "@/components/ui/responsive-select-dialog"
import { useCreateShoppingListMutation, useUIPreferences } from "@/hooks"
import { cn } from "@/lib/utils"
import { TempStorage } from "@/lib/temp-storage"
import { useProactiveAiStore } from "@/store/useProactiveAiStore"

interface ShoppingListItem {
	productId?: string
	productName: string
	productUnit: string
	quantity: number | string
	estimatedPrice?: number | string
	priceAlert?: {
		hasAlert: boolean
		alertType?: "price_warning" | "high_price"
		message: string
		details?: {
			currentPrice: number
			suggestedPrice?: number
			averagePrice?: number
			savings?: number
			savingsPercent?: number
			suggestedMarket?: {
				name: string
			}
			difference?: number
			percentDifference?: number
			totalComparisons: number
			historicalPurchases?: number
		}
	}
}

export default function NovaListaPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const createShoppingListMutation = useCreateShoppingListMutation()
	const id = useId()
	const { selectStyle } = useUIPreferences()
	const [products, setProducts] = useState<{ id: string; name: string;[key: string]: unknown }[]>([])
	const [dataLoading, setDataLoading] = useState(true)
	const [loading, setLoading] = useState(false)
	const [showScanner, setShowScanner] = useState(false)
	const [scanningForIndex, setScanningForIndex] = useState<number | null>(null)
	const [showPhotoCreator, setShowPhotoCreator] = useState(false)
	const { showInsight } = useProactiveAiStore()

	const [checkingPrices, setCheckingPrices] = useState<boolean[]>([false])
	const [openPopovers, setOpenPopovers] = useState<number[]>([])
	const [openDialogs, setOpenDialogs] = useState<number[]>([])

	const [listName, setListName] = useState("")

	const [items, setItems] = useState<ShoppingListItem[]>([
		{ productId: undefined, productName: "", productUnit: "unidade", quantity: 1, estimatedPrice: "", priceAlert: undefined },
	])

	// Inputs control arrays to allow empty typing and specific decimals
	const [quantityInputs, setQuantityInputs] = useState<string[]>(["1.000"])
	const [priceInputs, setPriceInputs] = useState<string[]>(["0.00"])

	const [relatedProductsVisibility, setRelatedProductsVisibility] = useState<boolean[]>(
		new Array(items.length).fill(true),
	)
	const [priceAlertVisibility, setPriceAlertVisibility] = useState<boolean[]>(new Array(items.length).fill(true))

	const updateItem = useCallback((index: number, field: keyof ShoppingListItem, value: string | number) => {
		setItems((currentItems) => {
			const newItems = [...currentItems]
			newItems[index] = { ...newItems[index], [field]: value }
			return newItems
		})
	}, [])

	const handleProductNameChange = (index: number, name: string) => {
		setItems((currentItems) => {
			const newItems = [...currentItems]
			newItems[index] = {
				...newItems[index],
				productName: name,
				// Remove vínculo se editar manualmente
				productId: undefined,
			}
			return newItems
		})
	}

	const handleProductSelected = (index: number, product: any) => {
		setItems((currentItems) => {
			const newItems = [...currentItems]
			newItems[index] = {
				...newItems[index],
				productId: product.id,
				productName: product.name,
				productUnit: product.unit || "unidade",
			}
			return newItems
		})
		// Fecha o popover
		setOpenPopovers(prev => prev.filter(i => i !== index))
		toast.success(`Produto vinculado: "${product.name}"`)
	}

	const handleUnlinkProduct = (index: number) => {
		setItems((currentItems) => {
			const newItems = [...currentItems]
			newItems[index] = {
				...newItems[index],
				productId: undefined,
			}
			return newItems
		})
	}

	useEffect(() => {
		const storageKey = searchParams.get("storageKey")
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey)
			if (preservedData) {
				try {
					if (preservedData.listName) {
						setListName(preservedData.listName)
					}

					if (preservedData.items) {
						setItems(preservedData.items)
					}

					if (preservedData.newProductId && preservedData.targetItemIndex !== undefined) {
						setTimeout(() => {
							updateItem(preservedData.targetItemIndex, "productId", preservedData.newProductId)
						}, 1000)
					}

					TempStorage.remove(storageKey)
					window.history.replaceState({}, "", "/lista/nova")
				} catch (error) {
					console.error("Erro ao restaurar dados:", error)
					TempStorage.remove(storageKey)
				}
			}
		}
	}, [searchParams, updateItem])

	const fetchData = useCallback(async () => {
		try {
			// Buscar TODOS os produtos sem paginação
			const productsRes = await fetch("/api/products?limit=10000")

			if (productsRes.ok) {
				const productsData = await productsRes.json()
				setProducts(productsData.products || [])
			}
		} catch (error) {
			console.error("Erro ao carregar dados:", error)
		} finally {
			setDataLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const addItem = () => {
		setItems([...items, { productId: undefined, productName: "", productUnit: "unidade", quantity: 1, estimatedPrice: "", priceAlert: undefined }])
		setCheckingPrices([...checkingPrices, false])
		setRelatedProductsVisibility([...relatedProductsVisibility, true])
		setPriceAlertVisibility([...priceAlertVisibility, true])
		setQuantityInputs((prev) => [...prev, "1.000"])
		setPriceInputs((prev) => [...prev, "0.00"])
	}

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index))
			setCheckingPrices(checkingPrices.filter((_, i) => i !== index))
			setRelatedProductsVisibility(relatedProductsVisibility.filter((_, i) => i !== index))
			setPriceAlertVisibility(priceAlertVisibility.filter((_, i) => i !== index))
			setQuantityInputs((prev) => prev.filter((_, i) => i !== index))
			setPriceInputs((prev) => prev.filter((_, i) => i !== index))
		}
	}

	const checkPrice = async (index: number, productId: string, estimatedPrice: number) => {
		if (!productId || !estimatedPrice) return

		setCheckingPrices((current) => current.map((c, i) => (i === index ? true : c)))

		try {
			const response = await fetch("/api/price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId,
					currentPrice: estimatedPrice,
					currentMarketId: "generic",
				}),
			})

			const alertData = await response.json()

			setItems((currentItems) =>
				currentItems.map((item, i) => (i === index ? { ...item, priceAlert: alertData } : item)),
			)
		} catch (error) {
			console.error("Erro ao verificar preço:", error)
		} finally {
			setCheckingPrices((current) => current.map((c, i) => (i === index ? false : c)))
		}
	}

	const addRelatedItem = (productId: string) => {
		const itemExists = items.some((item) => item.productId === productId)
		if (itemExists) {
			toast.info("Este produto já está na lista.")
			return
		}

		const product = products.find(p => p.id === productId)
		setItems([...items, {
			productId,
			productName: product?.name || "",
			productUnit: (product as any)?.unit || "unidade",
			quantity: 1,
			estimatedPrice: "",
			priceAlert: undefined
		}])
		toast.success("Produto adicionado à lista!")
	}

	const handleBarcodeScanned = async (barcode: string) => {
		try {
			const response = await fetch(`/api/products/barcode/${barcode}`)
			if (response.ok) {
				const product = await response.json()
				if (scanningForIndex !== null) {
					updateItem(scanningForIndex, "productId", product.id)
				}
				toast.success(`Produto "${product.name}" adicionado!`)
			} else {
				toast.error("Produto não encontrado para este código de barras")
			}
		} catch (error) {
			console.error("Erro ao buscar produto:", error)
			toast.error("Erro ao buscar produto")
		} finally {
			setShowScanner(false)
			setScanningForIndex(null)
		}
	}

	const openScanner = (index: number) => {
		setScanningForIndex(index)
		setShowScanner(true)
	}

	const handleCloseRelatedProducts = (index: number) => {
		const newVisibility = [...relatedProductsVisibility]
		newVisibility[index] = false
		setRelatedProductsVisibility(newVisibility)
	}

	const handleClosePriceAlert = (index: number) => {
		const newVisibility = [...priceAlertVisibility]
		newVisibility[index] = false
		setPriceAlertVisibility(newVisibility)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!listName.trim()) {
			toast.error("O nome da lista é obrigatório")
			return
		}

		const validItems = items
			.filter((item) => {
				const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
				return item.productName.trim() && qty > 0 && !isNaN(qty)
			})
			.map((item) => ({
				...item,
				quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
				estimatedPrice: parseFloat(String(item.estimatedPrice)) || null,
			}))

		if (validItems.length === 0) {
			toast.error("Adicione pelo menos um item válido à lista")
			return
		}

		setLoading(true)

		try {
			await createShoppingListMutation.mutateAsync({
				name: listName,
				items: validItems.map((item) => ({
					productId: item.productId || undefined,
					productName: item.productName,
					productUnit: item.productUnit,
					quantity: item.quantity,
					estimatedPrice: item.estimatedPrice || 0,
				})) as any,
			})

			toast.success("Lista criada com sucesso!")
			// Pequeno delay para garantir que a invalidação seja processada
			setTimeout(() => {
				router.push("/lista")
			}, 100)
		} catch (error) {
			console.error("Erro ao criar lista:", error)
			toast.error("Erro ao criar lista")
		} finally {
			setLoading(false)
		}
	}

	const handlePriceBlur = async (index: number) => {
		const item = items[index]
		const price = parseFloat(String(item.estimatedPrice))

		if (item.productId && price > 0) {
			checkPrice(index, item.productId, price)
			try {
				const response = await fetch("/api/ai/proactive-insight", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productId: item.productId, price }),
				})
				const data = await response.json()
				if (data.suggestion) {
					showInsight({
						message: data.suggestion.message,
						duration: 10000,
					})
				}
			} catch (error) {
				console.error("Erro ao obter insight proativo:", error)
			}
		}
	}

	const calculateTotal = () => {
		return items.reduce((sum, item) => {
			const price = parseFloat(String(item.estimatedPrice)) || 0
			const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity
			return sum + quantity * price
		}, 0)
	}

	const handlePhotoListCreation = async (finalItems: any[]) => {
		try {
			// Converter itens finais para o formato da lista
			const convertedItems = finalItems.map((finalItem) => {
				if (finalItem.isTemporary) {
					// Item temporário - texto livre
					return {
						productId: undefined,
						productName: finalItem.tempName || "",
						productUnit: "unidade",
						quantity: finalItem.quantity,
						estimatedPrice: "",
						priceAlert: undefined,
					}
				} else {
					// Item com produto associado
					const product = products.find(p => p.id === finalItem.productId)
					return {
						productId: finalItem.productId,
						productName: product?.name || "",
						productUnit: (product as any)?.unit || "unidade",
						quantity: finalItem.quantity,
						estimatedPrice: "",
						priceAlert: undefined,
					}
				}
			})

			// Substituir itens atuais pelos da foto
			setItems(convertedItems)

			// Ajustar arrays de controle
			setCheckingPrices(new Array(convertedItems.length).fill(false))
			setRelatedProductsVisibility(new Array(convertedItems.length).fill(true))
			setPriceAlertVisibility(new Array(convertedItems.length).fill(true))
			setQuantityInputs(convertedItems.map(item => String(item.quantity)))
			setPriceInputs(new Array(convertedItems.length).fill("0.00"))

			// Sugerir nome da lista se não tiver
			if (!listName.trim()) {
				setListName(`Lista IA - ${new Date().toLocaleDateString()}`)
			}

			toast.success(`${finalItems.length} itens adicionados da foto!`)
		} catch (error) {
			console.error("Erro ao processar itens da foto:", error)
			toast.error("Erro ao processar itens da foto")
		}
	}

	if (dataLoading) {
		return <NovaListaSkeleton />
	}

	return (
		<div className="min-h-screen bg-gray-50/50 pb-20 md:pb-6">
			{/* Header fixo para mobile */}
			<div className="sticky top-0 z-10 bg-white border-b shadow-sm md:relative md:shadow-none md:border-none">
				<div className="px-4 py-4 md:px-0">
					<div className="flex items-center gap-4">
						<Link href="/lista">
							<Button variant="outline" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								<span className="hidden sm:inline">Voltar</span>
							</Button>
						</Link>
						<div className="flex-1">
							<h1 className="text-xl md:text-3xl font-bold">Nova Lista de Compras</h1>
							<p className="text-gray-600 text-sm md:text-base mt-1 md:mt-2">
								Crie uma nova lista para organizar suas compras
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="px-4 md:px-0 space-y-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<List className="h-5 w-5" />
										Informações da Lista
									</CardTitle>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowPhotoCreator(true)}
										className="flex items-center gap-2"
									>
										<Sparkles className="h-4 w-4" />
										<span className="hidden sm:inline">Criar com IA</span>
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor={`listName-${id}`}>Nome da Lista *</Label>
									<Input
										id={`listName-${id}`}
										name="listName"
										value={listName}
										onChange={(e) => setListName(e.target.value)}
										placeholder="Ex: Compras da Semana"
										required
									/>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<Plus className="h-5 w-5" />
										Itens da Lista
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{items.map((item, index) => (
										<motion.div
											key={`item-${index}-${item.productId || "empty"}`}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.3 + index * 0.05 }}
											className="space-y-4 p-4 border rounded-lg bg-white shadow-sm"
										>
											{/* Número do item */}
											<div className="text-xs text-gray-500 font-medium">Item {index + 1}</div>

											{/* Produto full width - Input híbrido */}
											<div className="space-y-2">
												<Label>Nome do Produto *</Label>
												<div className="flex gap-2">
													<div className="flex-1 relative">
														<Input
															value={item.productName}
															onChange={(e) => handleProductNameChange(index, e.target.value)}
															placeholder="Digite o nome ou busque um produto..."
															className="pr-10"
														/>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="absolute right-0 top-0 h-full px-3 hover:bg-accent"
															onClick={() => {
																if (selectStyle === "dialog") {
																	setOpenDialogs(prev => [...prev, index])
																} else {
																	setOpenPopovers(prev => [...prev, index])
																}
															}}
															title="Buscar produto cadastrado"
														>
															<LinkIcon className="h-4 w-4" />
														</Button>
													</div>
													{item.productId && (
														<Button
															type="button"
															variant="outline"
															size="icon"
															onClick={() => handleUnlinkProduct(index)}
															title="Desvincular produto"
														>
															<X className="h-4 w-4" />
														</Button>
													)}
												</div>
												{item.productId && (
													<p className="text-xs text-green-600">
														✓ Vinculado a produto cadastrado
													</p>
												)}

												{/* Dialogs/Popovers separados do input */}
												{selectStyle === "dialog" ? (
													<ResponsiveSelectDialog
														open={openDialogs.includes(index)}
														onOpenChange={(open) => {
															if (!open) {
																setOpenDialogs(prev => prev.filter(i => i !== index))
															}
														}}
														value={item.productId || ""}
														onValueChange={(productId) => {
															const product = products.find(p => p.id === productId)
															if (product) {
																handleProductSelected(index, product)
																setOpenDialogs(prev => prev.filter(i => i !== index))
															}
														}}
														options={products.map((product) => ({
															id: product.id,
															label: product.name,
															sublabel: (product as any).brand?.name || undefined,
														}))}
														title="Buscar Produto"
														placeholder="Selecione um produto"
														searchPlaceholder="Buscar produto..."
														emptyText="Nenhum produto encontrado."
														showCreateNew={false}
														renderTrigger={false}
													/>
												) : (
													<Popover
														open={openPopovers.includes(index)}
														onOpenChange={(open) => {
															if (open) {
																setOpenPopovers(prev => [...prev, index])
															} else {
																setOpenPopovers(prev => prev.filter(i => i !== index))
															}
														}}
													>
														<PopoverTrigger asChild>
															<div className="hidden" />
														</PopoverTrigger>
														<PopoverContent className="w-[400px] p-0" align="start">
															<Command>
																<CommandInput placeholder="Buscar produto..." />
																<CommandEmpty>Nenhum produto encontrado</CommandEmpty>
																<CommandGroup className="max-h-[300px] overflow-auto">
																	{products.map((product) => (
																		<CommandItem
																			key={product.id}
																			value={product.name}
																			onSelect={() => handleProductSelected(index, product)}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					item.productId === product.id ? "opacity-100" : "opacity-0"
																				)}
																			/>
																			<div className="flex-1">
																				<div className="font-medium">{product.name}</div>
																				{(product as any).brand && (
																					<div className="text-xs text-muted-foreground">{(product as any).brand.name}</div>
																				)}
																			</div>
																		</CommandItem>
																	))}
																</CommandGroup>
															</Command>
														</PopoverContent>
													</Popover>
												)}
											</div>

											{/* Quantidade, Preço, Total */}
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
												<div className="space-y-2">
													<Label>Quantidade *</Label>
													<Input
														type="text"
														inputMode="decimal"
														step="0.001"
														min="0"
														value={quantityInputs[index] ?? (items[index]?.quantity ? String(items[index].quantity) : "")}
														onChange={(e) => {
															const raw = e.target.value
															setQuantityInputs((prev) => {
																const next = [...prev]
																next[index] = raw
																return next
															})

															// Permitir campo vazio
															if (raw === "") {
																updateItem(index, "quantity", "")
																return
															}

															// Normalizar vírgula para ponto
															const normalized = raw.replace(',', '.')

															// Validar se é um número válido (incluindo decimais)
															const numberRegex = /^\d*\.?\d*$/
															if (numberRegex.test(normalized)) {
																const parsed = parseFloat(normalized)
																if (!Number.isNaN(parsed) && parsed >= 0) {
																	updateItem(index, "quantity", parsed)
																} else if (normalized === "" || normalized === ".") {
																	updateItem(index, "quantity", "")
																}
															}
														}}
														placeholder="0,000"
														className="text-center"
													/>
												</div>
												<div className="space-y-2">
													<Label>Preço Estimado</Label>
													<Input
														type="text"
														inputMode="decimal"
														step="0.01"
														min="0"
														value={priceInputs[index] ?? (items[index]?.estimatedPrice ? String(items[index].estimatedPrice) : "")}
														onChange={(e) => {
															const raw = e.target.value
															setPriceInputs((prev) => {
																const next = [...prev]
																next[index] = raw
																return next
															})
															const normalized = raw.replace(',', '.')
															const parsed = parseFloat(normalized)
															if (!Number.isNaN(parsed)) {
																updateItem(index, "estimatedPrice", parsed)
																// trigger best price check on blur in original; here we can still call on blur
															} else if (raw === "") {
																updateItem(index, "estimatedPrice", "")
															}
														}}
														onBlur={() => handlePriceBlur(index)}
														placeholder="0,00"
														className="text-center"
													/>
												</div>
												<div className="space-y-2 md:block">
													<Label>Total</Label>
													<Input
														value={`R$ ${((typeof items[index].quantity === 'string' ? parseFloat(items[index].quantity) || 0 : items[index].quantity) * (parseFloat(String(items[index].estimatedPrice)) || 0)).toFixed(2)}`}
														disabled
														className="bg-gray-50 text-center font-semibold"
													/>
												</div>
											</div>

											{/* Alertas e produtos relacionados */}
											<div className="space-y-3">
												{priceAlertVisibility[index] && item.priceAlert && (
													<div className="pt-2">
														<PriceAlert
															alertData={item.priceAlert}
															loading={checkingPrices[index]}
															onClose={() => handleClosePriceAlert(index)}
														/>
													</div>
												)}

												{relatedProductsVisibility[index] && item.productId && (
													<div className="pt-2">
														<RelatedProductsCard
															productId={item.productId}
															onAddProduct={addRelatedItem}
															onClose={() => handleCloseRelatedProducts(index)}
														/>
													</div>
												)}
											</div>

											{/* Botões de ação */}
											<div className="flex justify-between items-center pt-2">
												<div className="flex gap-2">
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => openScanner(index)}
														title="Escanear código de barras"
													>
														<Camera className="h-4 w-4 mr-1" />
														<span className="hidden sm:inline">Scanner</span>
													</Button>
												</div>

												{items.length > 1 && (
													<Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
														<Trash2 className="h-4 w-4 mr-1" />
														Remover
													</Button>
												)}
											</div>
										</motion.div>
									))}
								</div>

								{/* Total e botões de ação - apenas no desktop */}
								<div className="hidden md:flex justify-between items-center pt-4 border-t">
									<div className="text-lg font-bold">Total Estimado ({items.length} itens): R$ {calculateTotal().toFixed(2)}</div>
									<div className="flex gap-3">
										<Button type="button" onClick={addItem} variant="outline">
											<Plus className="h-4 w-4 mr-2" />
											Adicionar Item
										</Button>
										<Link href="/lista">
											<Button type="button" variant="outline">
												Cancelar
											</Button>
										</Link>
										<Button type="submit" disabled={loading}>
											<Save className="h-4 w-4 mr-2" />
											{loading ? "Salvando..." : "Salvar Lista"}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</form>
			</div>

			{/* Barra fixa na parte inferior para mobile */}
			<div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg md:hidden">
				<div className="px-4 py-3">
					<div className="flex items-center justify-between gap-3">
						{/* Botão de adicionar item */}
						<Button type="button" onClick={addItem} className="flex-1 bg-primary hover:bg-primary/90" size="lg">
							<Plus className="h-5 w-5 mr-2" />
							Adicionar Item
						</Button>

						{/* Total da lista */}
						<div className="text-center min-w-[120px]">
							<div className="text-sm text-gray-600">Total</div>
							<div className="text-lg font-bold text-primary">R$ {calculateTotal().toFixed(2)}</div>
						</div>
					</div>

					{/* Botões de ação */}
					<div className="flex gap-2 mt-3">
						<Button type="submit" disabled={loading} onClick={handleSubmit} className="flex-1" size="lg">
							<Save className="h-4 w-4 mr-2" />
							{loading ? "Salvando..." : "Salvar Lista"}
						</Button>
						<Link href="/lista" className="flex-1">
							<Button type="button" variant="outline" className="w-full" size="lg">
								Cancelar
							</Button>
						</Link>
					</div>
				</div>
			</div>

			<BarcodeScanner
				isOpen={showScanner}
				onScan={handleBarcodeScanned}
				onClose={() => {
					setShowScanner(false)
					setScanningForIndex(null)
				}}
			/>

			<PhotoListCreator
				isOpen={showPhotoCreator}
				onClose={() => setShowPhotoCreator(false)}
				onCreateList={handlePhotoListCreation}
			/>
		</div>
	)
}
