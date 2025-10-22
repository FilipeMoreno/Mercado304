"use client"

import { AlertCircle, Check, Link as LinkIcon, Package, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ShoppingListItem {
	id: string
	productId?: string
	productName: string
	productUnit: string
	quantity: number
	estimatedPrice?: number
	brand?: string
	category?: string
	notes?: string
	isChecked: boolean
}

interface ReviewItem extends ShoppingListItem {
	unitPrice: number
	unitDiscount: number
	linkedProductId?: string
}

interface ShoppingListReviewProps {
	items: ShoppingListItem[]
	onConfirm: (items: ReviewItem[]) => Promise<void>
	onCancel: () => void
	isSubmitting: boolean
}

export function ShoppingListReview({ items, onConfirm, onCancel, isSubmitting }: ShoppingListReviewProps) {
	const [reviewItems, setReviewItems] = useState<ReviewItem[]>(
		items.map((item) => ({
			...item,
			...(item.productId ? { linkedProductId: item.productId } : {}),
			unitPrice: item.estimatedPrice || 0,
			unitDiscount: 0,
		})) as ReviewItem[],
	)
	const [products, setProducts] = useState<any[]>([])
	const [openPopover, setOpenPopover] = useState<number | null>(null)

	// Buscar TODOS os produtos (sem paginação)
	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch("/api/products?limit=10000")
				if (response.ok) {
					const data = await response.json()
					setProducts(data.products || [])
				}
			} catch (error) {
				console.error("Erro ao buscar produtos:", error)
			}
		}
		fetchProducts()
	}, [])

	const unlinkedCount = reviewItems.filter((item) => !item.linkedProductId).length
	const linkedCount = reviewItems.filter((item) => item.linkedProductId).length

	const handleProductNameChange = (index: number, newName: string) => {
		const newItems = [...reviewItems]
		const currentItem = newItems[index]
		if (!currentItem) return

		currentItem.productName = newName
		// Ao editar o nome manualmente, remove o vínculo
		if (currentItem.linkedProductId) {
			const { linkedProductId, ...rest } = currentItem
			newItems[index] = rest as ReviewItem
		}
		setReviewItems(newItems)
	}

	const handleProductLink = (index: number, product: any) => {
		const newItems = [...reviewItems]
		const currentItem = newItems[index]
		if (!currentItem) return

		currentItem.linkedProductId = product.id
		currentItem.productName = product.name

		toast.success(`Produto vinculado: "${product.name}"`)
		setReviewItems(newItems)
		setOpenPopover(null)
	}

	const handleUnlink = (index: number) => {
		const newItems = [...reviewItems]
		const currentItem = newItems[index]
		if (!currentItem) return

		const { linkedProductId, ...rest } = currentItem
		newItems[index] = rest as ReviewItem
		toast.info(`Item desvinculado, permanecerá como texto livre`)
		setReviewItems(newItems)
	}

	const handlePriceChange = (index: number, field: "unitPrice" | "unitDiscount", value: string) => {
		const newItems = [...reviewItems]
		const currentItem = newItems[index]
		if (!currentItem) return

		currentItem[field] = parseFloat(value) || 0
		setReviewItems(newItems)
	}

	const handleQuantityChange = (index: number, value: string) => {
		const newItems = [...reviewItems]
		const currentItem = newItems[index]
		if (!currentItem) return

		currentItem.quantity = parseFloat(value) || 1
		setReviewItems(newItems)
	}

	const handleConfirm = async () => {
		// Valida se todos os itens tem preço
		const invalidItems = reviewItems.filter((item) => !item.unitPrice || item.unitPrice <= 0)
		if (invalidItems.length > 0) {
			toast.error("Todos os itens precisam ter um preço unitário válido")
			return
		}

		await onConfirm(reviewItems)
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Revisar Itens da Lista</h2>
				<p className="text-muted-foreground">
					Vincule os itens a produtos cadastrados e ajuste os preços antes de registrar a compra
				</p>
			</div>

			{/* Resumo */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Resumo da Vinculação</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<div className="flex items-center gap-2">
							<Badge variant="default" className="bg-green-600">
								{linkedCount} vinculados
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="secondary">{unlinkedCount} texto livre</Badge>
						</div>
					</div>

					{unlinkedCount > 0 && (
						<Alert className="mt-3">
							<AlertCircle className="size-4" />
							<AlertDescription className="text-sm">
								{unlinkedCount} {unlinkedCount === 1 ? "item permanecerá" : "itens permanecerão"} como texto livre. Você
								pode vinculá-los a produtos cadastrados para melhor controle.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Lista de itens */}
			<div className="space-y-3">
				{reviewItems.map((item, index) => {
					const total = item.quantity * (item.unitPrice - (item.unitDiscount || 0))
					const isLinked = !!item.linkedProductId

					return (
						<Card key={item.id}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<CardTitle className="text-base flex items-center gap-2">
											{isLinked ? (
												<Check className="size-4 text-green-600" />
											) : (
												<Package className="size-4 text-gray-400" />
											)}
											{item.productName}
										</CardTitle>
										<CardDescription className="mt-1">
											{item.quantity} {item.productUnit}
											{item.brand && ` • ${item.brand}`}
											{item.category && ` • ${item.category}`}
										</CardDescription>
										{item.notes && <p className="text-xs text-muted-foreground italic mt-1">💬 {item.notes}</p>}
									</div>
									{isLinked ? (
										<Badge variant="default" className="bg-green-600">
											<LinkIcon className="h-3 w-3 mr-1" />
											Vinculado
										</Badge>
									) : (
										<Badge variant="secondary">Texto livre</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Nome do produto (texto livre ou vinculado) */}
								<div className="space-y-2">
									<Label>Nome do Produto</Label>
									<div className="flex gap-2">
										<div className="flex-1 relative">
											<Input
												value={item.productName}
												onChange={(e) => handleProductNameChange(index, e.target.value)}
												placeholder="Digite o nome do produto..."
												className="pr-10"
											/>
											<Popover
												open={openPopover === index}
												onOpenChange={(open) => setOpenPopover(open ? index : null)}
											>
												<PopoverTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="absolute right-0 top-0 h-full px-3"
														title="Buscar produto cadastrado"
													>
														<LinkIcon className="size-4" />
													</Button>
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
																	onSelect={() => handleProductLink(index, product)}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			item.linkedProductId === product.id ? "opacity-100" : "opacity-0",
																		)}
																	/>
																	<div className="flex-1">
																		<div className="font-medium">{product.name}</div>
																		{product.brand && (
																			<div className="text-xs text-muted-foreground">{product.brand.name}</div>
																		)}
																	</div>
																</CommandItem>
															))}
														</CommandGroup>
													</Command>
												</PopoverContent>
											</Popover>
										</div>
										{isLinked && (
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUnlink(index)}
												title="Desvincular produto"
											>
												<X className="size-4" />
											</Button>
										)}
									</div>
									{isLinked && <p className="text-xs text-muted-foreground">✓ Vinculado a produto cadastrado</p>}
								</div>

								{/* Quantidade e Preços */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="space-y-2">
										<Label>Quantidade *</Label>
										<Input
											type="number"
											step="0.01"
											min="0.01"
											value={item.quantity || ""}
											onChange={(e) => handleQuantityChange(index, e.target.value)}
											placeholder="1"
										/>
									</div>
									<div className="space-y-2">
										<Label>Preço Unitário *</Label>
										<Input
											type="number"
											step="0.01"
											min="0"
											value={item.unitPrice || ""}
											onChange={(e) => handlePriceChange(index, "unitPrice", e.target.value)}
											placeholder="0.00"
										/>
									</div>
									<div className="space-y-2">
										<Label>Desconto Unit. (opcional)</Label>
										<Input
											type="number"
											step="0.01"
											min="0"
											value={item.unitDiscount || ""}
											onChange={(e) => handlePriceChange(index, "unitDiscount", e.target.value)}
											placeholder="0.00"
										/>
									</div>
									<div className="space-y-2">
										<Label>Total</Label>
										<Input value={`R$ ${total.toFixed(2)}`} disabled className="bg-muted" />
									</div>
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{/* Ações */}
			<div className="flex gap-3 pt-4 pb-20 md:pb-4">
				<Button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 md:flex-initial">
					{isSubmitting ? "Registrando..." : `Registrar Compra (${reviewItems.length} itens)`}
				</Button>
				<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
					Cancelar
				</Button>
			</div>
		</div>
	)
}
