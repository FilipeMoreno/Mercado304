// src/components/shopping-list/price-search-dialog.tsx
"use client"

import { Calendar, Loader2, MapPin, Search, Store, TrendingDown } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotaParana } from "@/hooks"
import { getCategoriasParaBusca } from "@/lib/nota-parana-config"
import type { NotaParanaProduto } from "@/types"

interface PriceInfo {
	marketId: string
	marketName: string
	location?: string
	price: number
	lastUpdate: string
	source: string
}

interface ProductPriceData {
	type: "product"
	productName: string
	productId: string
	brand?: string
	category?: string
	prices: PriceInfo[]
	lowestPrice: PriceInfo | null
	averagePrice: number | null
}

interface TextSearchData {
	type: "text"
	searchTerm: string
	brand?: string
	category?: string
	message: string
}

type PriceSearchData = ProductPriceData | TextSearchData

interface PriceSearchDialogProps {
	isOpen: boolean
	onClose: () => void
	itemId: string | null
	itemName: string
}

const RAIO_FIXO = 20 // 20km fixo
const PERIODO_PADRAO = 60 // 60 dias

export function PriceSearchDialog({ isOpen, onClose, itemId, itemName }: PriceSearchDialogProps) {
	const [loading, setLoading] = useState(false)
	const [searchData, setSearchData] = useState<PriceSearchData | null>(null)

	// Estados para Nota Paraná
	const [notaParanaProdutos, setNotaParanaProdutos] = useState<NotaParanaProduto[]>([])
	const [searching, setSearching] = useState(false)
	const [periodo, setPeriodo] = useState<string>(PERIODO_PADRAO.toString())

	const { loading: notaParanaLoading, buscarProdutos } = useNotaParana()

	// Buscar produtos no Nota Paraná
	const handleNotaParanaSearch = useCallback(
		async (termo: string, periodoCustom?: string) => {
			setSearching(true)
			try {
				const categoriasParaBuscar = getCategoriasParaBusca(termo)
				const todosProdutosTemp: NotaParanaProduto[] = []

				// Buscar produtos em cada categoria
				for (const categoriaId of categoriasParaBuscar) {
					try {
						const resultado = await buscarProdutos({
							termo: termo.trim(),
							categoria: categoriaId,
							raio: RAIO_FIXO,
							data: parseInt(periodoCustom || periodo, 10) as -1 | 0 | 1 | 7 | 30,
							offset: 0,
						})

						if (resultado?.produtos) {
							todosProdutosTemp.push(...resultado.produtos)
						}
					} catch (err) {
						console.error(`Erro ao buscar categoria ${categoriaId}:`, err)
					}
				}

				// Ordenar por menor preço
				const produtosOrdenados = todosProdutosTemp.sort((a, b) => {
					const precoA = parseFloat(a.valor_tabela) - parseFloat(a.valor_desconto)
					const precoB = parseFloat(b.valor_tabela) - parseFloat(b.valor_desconto)
					return precoA - precoB
				})

				setNotaParanaProdutos(produtosOrdenados)

				if (produtosOrdenados.length === 0) {
					toast.info("Nenhum produto encontrado no Nota Paraná")
				} else {
					toast.success(`${produtosOrdenados.length} produtos encontrados`)
				}
			} catch (error) {
				console.error("Erro ao buscar no Nota Paraná:", error)
				toast.error("Erro ao buscar no Nota Paraná")
			} finally {
				setSearching(false)
			}
		},
		[buscarProdutos, periodo],
	)

	// Buscar dados do item
	const fetchPriceData = useCallback(async () => {
		if (!itemId) return

		setLoading(true)
		try {
			const response = await fetch(`/api/shopping-lists/items/${itemId}/search-best-price`)

			if (!response.ok) {
				throw new Error("Erro ao buscar preços")
			}

			const data: PriceSearchData = await response.json()
			setSearchData(data)

			// Se for texto livre, buscar automaticamente no Nota Paraná
			if (data.type === "text") {
				await handleNotaParanaSearch(data.searchTerm)
			}
		} catch (error) {
			console.error("Erro ao buscar preços:", error)
			toast.error("Erro ao buscar preços")
		} finally {
			setLoading(false)
		}
	}, [itemId, handleNotaParanaSearch])

	useEffect(() => {
		if (isOpen && itemId) {
			fetchPriceData()
		} else {
			// Limpar dados ao fechar
			setSearchData(null)
			setNotaParanaProdutos([])
		}
	}, [isOpen, itemId, fetchPriceData])

	// Formatar data
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		})
	}

	// Formatar preço
	const formatPrice = (price: number) => {
		return price.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
		})
	}

	// Calcular preço final do Nota Paraná
	const calcularPrecoFinal = (produto: NotaParanaProduto) => {
		const valorTabela = parseFloat(produto.valor_tabela)
		const valorDesconto = parseFloat(produto.valor_desconto)
		return valorTabela - valorDesconto
	}

	// Formatar endereço completo
	const formatarEndereco = (produto: NotaParanaProduto) => {
		const est = produto.estabelecimento
		const endereco = `${est.tp_logr} ${est.nm_logr}, ${est.nr_logr}`
		const complemento = est.complemento ? ` ${est.complemento}` : ""
		const bairroMun = `${est.bairro} - ${est.mun}/${est.uf}`
		return { linha1: endereco + complemento, linha2: bairroMun }
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Search className="size-5" />
						Buscar Menor Preço
					</DialogTitle>
					<DialogDescription>
						Encontre os melhores preços para: <strong>{itemName}</strong>
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-8 animate-spin text-primary" />
						<span className="ml-2">Buscando preços...</span>
					</div>
				) : searchData ? (
					<div className="space-y-6">
						{/* Produto vinculado - mostrar histórico de preços */}
						{searchData.type === "product" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-semibold">{searchData.productName}</h3>
										<div className="text-sm text-muted-foreground space-x-2">
											{searchData.brand && <span>Marca: {searchData.brand}</span>}
											{searchData.category && <span>• Categoria: {searchData.category}</span>}
										</div>
									</div>
									{searchData.lowestPrice && (
										<div className="text-right">
											<div className="text-sm text-muted-foreground">Menor preço encontrado</div>
											<div className="text-3xl font-bold text-green-600">
												{formatPrice(searchData.lowestPrice.price)}
											</div>
										</div>
									)}
								</div>

								{searchData.averagePrice && (
									<div className="text-sm text-muted-foreground">
										Preço médio: {formatPrice(searchData.averagePrice)} • {searchData.prices.length} mercado(s)
									</div>
								)}

								{/* Lista de preços por mercado */}
								<div className="space-y-3">
									<h4 className="font-semibold">Preços por Mercado</h4>
									{searchData.prices.length > 0 ? (
										searchData.prices.map((priceInfo, index) => (
											<Card key={priceInfo.marketId} className={index === 0 ? "border-green-500 border-2" : ""}>
												<CardContent className="pt-6">
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<Store className="size-4 text-muted-foreground" />
																<h5 className="font-medium">{priceInfo.marketName}</h5>
																{index === 0 && (
																	<Badge variant="default" className="ml-2">
																		Menor preço
																	</Badge>
																)}
															</div>
															{priceInfo.location && (
																<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
																	<MapPin className="h-3 w-3" />
																	<span>{priceInfo.location}</span>
																</div>
															)}
															<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
																<Calendar className="h-3 w-3" />
																<span>Última atualização: {formatDate(priceInfo.lastUpdate)}</span>
															</div>
															<div className="mt-1 text-xs text-muted-foreground">
																Fonte: {priceInfo.source === "purchase" ? "Compra registrada" : "Registro manual"}
															</div>
														</div>
														<div className="text-right">
															<div className="text-2xl font-bold text-primary">{formatPrice(priceInfo.price)}</div>
															{searchData.lowestPrice && priceInfo.marketId !== searchData.lowestPrice.marketId && (
																<div className="text-xs text-muted-foreground mt-1">
																	+{formatPrice(priceInfo.price - searchData.lowestPrice.price)}
																</div>
															)}
														</div>
													</div>
												</CardContent>
											</Card>
										))
									) : (
										<div className="text-center py-8 text-muted-foreground">
											Nenhum preço registrado para este produto
										</div>
									)}
								</div>
							</div>
						)}

						{/* Texto livre - mostrar resultados do Nota Paraná */}
						{searchData.type === "text" && (
							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<div className="flex-1">
										<Label>Período de busca (dias)</Label>
										<Select
											value={periodo}
											onValueChange={(value) => {
												setPeriodo(value)
												if (searchData.searchTerm) {
													handleNotaParanaSearch(searchData.searchTerm, value)
												}
											}}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="0">Hoje</SelectItem>
												<SelectItem value="1">Ontem</SelectItem>
												<SelectItem value="7">Última semana</SelectItem>
												<SelectItem value="15">Últimos 15 dias</SelectItem>
												<SelectItem value="30">Último mês</SelectItem>
												<SelectItem value="60">Últimos 2 meses</SelectItem>
												<SelectItem value="-1">Todos</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="pt-6">
										<Button
											onClick={() => handleNotaParanaSearch(searchData.searchTerm)}
											disabled={searching || notaParanaLoading}
										>
											{searching || notaParanaLoading ? (
												<>
													<Loader2 className="mr-2 size-4 animate-spin" />
													Buscando...
												</>
											) : (
												<>
													<Search className="mr-2 size-4" />
													Buscar Novamente
												</>
											)}
										</Button>
									</div>
								</div>

								{searching || notaParanaLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="size-8 animate-spin text-primary" />
										<span className="ml-2">Buscando no Nota Paraná...</span>
									</div>
								) : notaParanaProdutos.length > 0 ? (
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<h4 className="font-semibold">Resultados do Nota Paraná ({notaParanaProdutos.length})</h4>
											{notaParanaProdutos.length > 0 && (
												<div className="text-sm text-muted-foreground">
													A partir de {formatPrice(calcularPrecoFinal(notaParanaProdutos[0]))}
												</div>
											)}
										</div>

										{/* Limitar a 10 primeiros resultados */}
										{notaParanaProdutos.slice(0, 10).map((produto) => {
											const valorDesconto = parseFloat(produto.valor_desconto)
											const valorTabela = parseFloat(produto.valor_tabela)
											const precoFinal = calcularPrecoFinal(produto)
											const percentualDesconto = valorTabela > 0 ? ((valorDesconto / valorTabela) * 100).toFixed(0) : 0
											const endereco = formatarEndereco(produto)

											return (
												<Card key={produto.id} className="border-l-4 border-l-blue-500">
													<CardContent className="pt-6">
														<div className="flex justify-between items-start gap-4">
															<div className="flex-1">
																<h5 className="font-semibold">{produto.desc}</h5>

																{/* Estabelecimento */}
																<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
																	<Store className="size-4 shrink-0" />
																	<span className="font-medium">
																		{produto.estabelecimento.nm_fan || produto.estabelecimento.nm_emp}
																	</span>
																</div>

																{/* Endereço */}
																<div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
																	<MapPin className="size-4 shrink-0 mt-0.5" />
																	<div>
																		<div>{endereco.linha1}</div>
																		<div>{endereco.linha2}</div>
																	</div>
																</div>

																{/* Data */}
																<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
																	<Calendar className="h-3 w-3" />
																	<span>{produto.tempo}</span>
																</div>

																{/* Código de barras */}
																{produto.gtin && (
																	<div className="mt-2 text-xs text-muted-foreground">EAN: {produto.gtin}</div>
																)}
															</div>

															{/* Preços */}
															<div className="text-right">
																{valorDesconto > 0 ? (
																	<>
																		<div className="text-xs text-muted-foreground line-through">
																			{formatPrice(valorTabela)}
																		</div>
																		<div className="text-2xl font-bold text-primary">{formatPrice(precoFinal)}</div>
																		<Badge variant="destructive" className="mt-1">
																			<TrendingDown className="h-3 w-3 mr-1" />-{percentualDesconto}%
																		</Badge>
																	</>
																) : (
																	<div className="text-2xl font-bold">{formatPrice(valorTabela)}</div>
																)}
															</div>
														</div>
													</CardContent>
												</Card>
											)
										})}

										{notaParanaProdutos.length > 10 && (
											<div className="text-center text-sm text-muted-foreground pt-2">
												Mostrando 10 de {notaParanaProdutos.length} resultados
											</div>
										)}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado no Nota Paraná</div>
								)}
							</div>
						)}
					</div>
				) : (
					<div className="text-center py-8 text-muted-foreground">Selecione um item para buscar preços</div>
				)}

				<div className="flex justify-end gap-2 pt-4 border-t">
					<Button variant="outline" onClick={onClose}>
						Fechar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
