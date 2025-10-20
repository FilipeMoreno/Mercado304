// src/components/nota-parana-search-advanced.tsx
"use client"

import { Calendar, Filter, Loader2, MapPin, Search, ShoppingBag, Store, TrendingDown } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotaParana } from "@/hooks"
import { getCategoriasParaBusca, isProvavelmenteAlimento } from "@/lib/nota-parana-config"
import type { NotaParanaCategoria, NotaParanaProduto } from "@/types"

type OrdenacaoType = "relevancia" | "menor-preco" | "maior-preco" | "maior-desconto"
type PeriodoType = "-1" | "0" | "1" | "7" | "15" | "30" | "60"
type PeriodoHorasType = "1h" | "6h" | "12h" | "24h" | null

const ITEMS_PER_PAGE = 20
const RAIO_FIXO = 20 // 20km fixo

export function NotaParanaSearchAdvanced() {
	// Estado da busca
	const [termo, setTermo] = useState("")
	const [step, setStep] = useState<"busca" | "categorias" | "produtos">("busca")
	const [isBarcode, setIsBarcode] = useState(false)
	const [isAlimento, setIsAlimento] = useState(true)

	// Categorias
	const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<NotaParanaCategoria[]>([])
	const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<number[]>([])

	// Produtos e paginação
	const [todosProdutos, setTodosProdutos] = useState<NotaParanaProduto[]>([])
	const [produtosFiltrados, setProdutosFiltrados] = useState<NotaParanaProduto[]>([])
	const [paginaAtual, setPaginaAtual] = useState(1)

	// Filtros
	const [ordenacao, setOrdenacao] = useState<OrdenacaoType>("menor-preco")
	const [periodo, setPeriodo] = useState<PeriodoType>("60")
	const [periodoHoras, setPeriodoHoras] = useState<PeriodoHorasType>(null)
	const [precoMin, setPrecoMin] = useState<string>("")
	const [precoMax, setPrecoMax] = useState<string>("")

	const { loading, buscarCategorias, buscarProdutos } = useNotaParana()

	// Buscar categorias (ou produtos direto se for código de barras)
	const handleBuscarCategorias = async () => {
		if (!termo.trim()) return

		// Detectar se é código de barras
		const isBarcodeDetected = /^\d{8,14}$/.test(termo.trim())
		setIsBarcode(isBarcodeDetected)

		// Se for código de barras, buscar produtos diretamente usando categorias inteligentes
		if (isBarcodeDetected) {
			// Usa detecção inteligente: se for alimento busca em categorias de alimentos,
			// senão busca em categorias de não alimentos
			const categoriasParaBuscar = getCategoriasParaBusca(termo.trim())

			const todosProdutosTemp: NotaParanaProduto[] = []

			// Buscar produtos em cada categoria
			for (const categoriaId of categoriasParaBuscar) {
				try {
					const resultado = await buscarProdutos({
						termo: termo.trim(),
						categoria: categoriaId,
						raio: RAIO_FIXO,
						data: parseInt(periodo, 10) as -1 | 0 | 1 | 7 | 30,
						offset: 0,
					})

					if (resultado?.produtos) {
						todosProdutosTemp.push(...resultado.produtos)
					}
				} catch {}
			}

			if (todosProdutosTemp.length > 0) {
				setTodosProdutos(todosProdutosTemp)
				aplicarFiltros(todosProdutosTemp)
				setStep("produtos")
				setPaginaAtual(1)
			} else {
				toast.error("Nenhum produto encontrado com este código de barras")
			}
			return
		}

		// Para busca por nome, mostrar categorias para seleção
		const resultado = await buscarCategorias({
			termo: termo.trim(),
			raio: RAIO_FIXO,
		})

		if (resultado && resultado.categorias.length > 0) {
			setCategoriasDisponiveis(resultado.categorias)
			setStep("categorias")
		}
	}

	// Toggle categoria selecionada
	const toggleCategoria = (categoriaId: number) => {
		setCategoriasSelecionadas((prev) =>
			prev.includes(categoriaId) ? prev.filter((id) => id !== categoriaId) : [...prev, categoriaId],
		)
	}

	// Buscar produtos das categorias selecionadas
	const handleBuscarProdutos = async () => {
		if (categoriasSelecionadas.length === 0) return

		const todosProdutosTemp: NotaParanaProduto[] = []

		// Buscar produtos de cada categoria selecionada
		for (const categoriaId of categoriasSelecionadas) {
			const resultado = await buscarProdutos({
				termo: termo.trim(),
				categoria: categoriaId,
				raio: RAIO_FIXO,
				data: parseInt(periodo, 10) as -1 | 0 | 1 | 7 | 30,
				offset: 0,
			})

			if (resultado?.produtos) {
				todosProdutosTemp.push(...resultado.produtos)
			}
		}

		setTodosProdutos(todosProdutosTemp)
		aplicarFiltros(todosProdutosTemp)
		setStep("produtos")
		setPaginaAtual(1)
	}

	// Aplicar filtros e ordenação
	const aplicarFiltros = (produtos: NotaParanaProduto[] = todosProdutos) => {
		let filtrados = [...produtos]

		// Filtrar por período em horas (lado do cliente)
		if (periodoHoras) {
			const agora = new Date()
			const horasAtras = {
				"1h": 1,
				"6h": 6,
				"12h": 12,
				"24h": 24,
			}[periodoHoras]

			if (horasAtras) {
				const dataLimite = new Date(agora.getTime() - horasAtras * 60 * 60 * 1000)
				filtrados = filtrados.filter((p) => {
					const dataProduto = new Date(p.datahora)
					return dataProduto >= dataLimite
				})
			}
		}

		// Filtrar por preço mínimo
		if (precoMin) {
			const min = parseFloat(precoMin)
			filtrados = filtrados.filter((p) => {
				const preco = parseFloat(p.valor_tabela) - parseFloat(p.valor_desconto)
				return preco >= min
			})
		}

		// Filtrar por preço máximo
		if (precoMax) {
			const max = parseFloat(precoMax)
			filtrados = filtrados.filter((p) => {
				const preco = parseFloat(p.valor_tabela) - parseFloat(p.valor_desconto)
				return preco <= max
			})
		}

		// Ordenar
		switch (ordenacao) {
			case "menor-preco":
				filtrados.sort((a, b) => {
					const precoA = parseFloat(a.valor_tabela) - parseFloat(a.valor_desconto)
					const precoB = parseFloat(b.valor_tabela) - parseFloat(b.valor_desconto)
					return precoA - precoB
				})
				break
			case "maior-preco":
				filtrados.sort((a, b) => {
					const precoA = parseFloat(a.valor_tabela) - parseFloat(a.valor_desconto)
					const precoB = parseFloat(b.valor_tabela) - parseFloat(b.valor_desconto)
					return precoB - precoA
				})
				break
			case "maior-desconto":
				filtrados.sort((a, b) => {
					const descontoA = parseFloat(a.valor_desconto)
					const descontoB = parseFloat(b.valor_desconto)
					return descontoB - descontoA
				})
				break
			default:
				// relevancia - manter ordem original
				break
		}

		setProdutosFiltrados(filtrados)
		setPaginaAtual(1)
	}

	// Atualizar filtros
	const handleAtualizarFiltros = () => {
		aplicarFiltros()
	}

	// Voltar para busca
	const handleNovaBusca = () => {
		setStep("busca")
		setTermo("")
		setIsBarcode(false)
		setCategoriasDisponiveis([])
		setCategoriasSelecionadas([])
		setTodosProdutos([])
		setProdutosFiltrados([])
		setPaginaAtual(1)
		setPrecoMin("")
		setPrecoMax("")
	}

	// Voltar para seleção de categorias
	const handleVoltarCategorias = () => {
		setStep("categorias")
		setTodosProdutos([])
		setProdutosFiltrados([])
		setPaginaAtual(1)
	}

	// Formatar preço
	const formatarPreco = (valor: string | number) => {
		const num = typeof valor === "string" ? parseFloat(valor) : valor
		return num.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
		})
	}

	// Calcular preço final
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

	// Paginação
	const totalPaginas = Math.ceil(produtosFiltrados.length / ITEMS_PER_PAGE)
	const produtosPaginados = produtosFiltrados.slice((paginaAtual - 1) * ITEMS_PER_PAGE, paginaAtual * ITEMS_PER_PAGE)

	// Estatísticas
	const estatisticas = {
		total: produtosFiltrados.length,
		precoMinimo: produtosFiltrados.length > 0 ? Math.min(...produtosFiltrados.map((p) => calcularPrecoFinal(p))) : 0,
		precoMaximo: produtosFiltrados.length > 0 ? Math.max(...produtosFiltrados.map((p) => calcularPrecoFinal(p))) : 0,
	}

	return (
		<div className="space-y-6">
			{/* Passo 1: Busca inicial */}
			{step === "busca" && (
				<Card>
					<CardHeader>
						<CardTitle>Buscar Produtos</CardTitle>
						<CardDescription>Digite o nome do produto ou código de barras para iniciar</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex gap-4">
								<div className="flex-1">
									<Input
										placeholder="Ex: Coca Cola, Arroz, ou código de barras"
										value={termo}
										onChange={(e) => {
											const valor = e.target.value
											setTermo(valor)
											const isBarcodeTemp = /^\d{8,14}$/.test(valor.trim())
											setIsBarcode(isBarcodeTemp)
											setIsAlimento(isProvavelmenteAlimento(valor))
										}}
										onKeyDown={(e) => e.key === "Enter" && handleBuscarCategorias()}
									/>
								</div>
								<Button onClick={handleBuscarCategorias} disabled={loading || !termo.trim()}>
									{loading ? (
										<>
											<Loader2 className="mr-2 size-4 animate-spin" />
											Buscando...
										</>
									) : (
										<>
											<Search className="mr-2 size-4" />
											Buscar
										</>
									)}
								</Button>
							</div>
							{termo.trim() && (
								<div className="flex items-center gap-3 text-sm">
									{isBarcode && (
										<Badge variant="default" className="flex items-center gap-1">
											<ShoppingBag className="h-3 w-3" />
											Código de barras - busca direta
										</Badge>
									)}
									<Badge variant={isAlimento ? "secondary" : "outline"} className="flex items-center gap-1">
										{isAlimento ? "🍎" : "🧹"} {isAlimento ? "Alimento" : "Não alimento"} - {getCategoriasParaBusca(termo).length}{" "}
										categorias
									</Badge>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Passo 2: Seleção de categorias */}
			{step === "categorias" && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Selecione as Categorias</CardTitle>
								<CardDescription>Escolha uma ou mais categorias para buscar produtos</CardDescription>
							</div>
							<Button variant="outline" onClick={handleNovaBusca}>
								Nova Busca
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{categoriasDisponiveis.map((categoria) => (
								<button
									key={categoria.id}
									type="button"
									className="w-full flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent text-left"
									onClick={() => toggleCategoria(categoria.id)}
								>
									<Checkbox
										checked={categoriasSelecionadas.includes(categoria.id)}
										onCheckedChange={() => toggleCategoria(categoria.id)}
									/>
									<div className="flex-1">
										<div className="font-semibold">{categoria.desc}</div>
										<div className="text-sm text-muted-foreground">{categoria.qtd} produtos</div>
									</div>
									<Badge variant="secondary">{categoria.qtd}</Badge>
								</button>
							))}
						</div>

						<div className="mt-6 flex justify-end">
							<Button
								onClick={handleBuscarProdutos}
								disabled={loading || categoriasSelecionadas.length === 0}
								size="lg"
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Carregando produtos...
									</>
								) : (
									<>
										<ShoppingBag className="mr-2 size-4" />
										Ver Produtos ({categoriasSelecionadas.length}{" "}
										{categoriasSelecionadas.length === 1 ? "categoria" : "categorias"})
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Passo 3: Produtos com filtros */}
			{step === "produtos" && (
				<>
					{/* Navegação e estatísticas */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div className="flex gap-2">
									<Button variant="outline" onClick={handleNovaBusca}>
										Nova Busca
									</Button>
									<Button variant="outline" onClick={handleVoltarCategorias}>
										Alterar Categorias
									</Button>
								</div>
								<div className="text-sm text-muted-foreground">
									<strong>{estatisticas.total}</strong> produtos encontrados • {formatarPreco(estatisticas.precoMinimo)}{" "}
									a {formatarPreco(estatisticas.precoMaximo)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Filtros */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Filter className="size-5" />
								Filtros e Ordenação
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
								{/* Período em Horas */}
								<div className="space-y-2">
									<Label>Período (Horas)</Label>
									<Select
										value={periodoHoras || "none"}
										onValueChange={(value) => {
											setPeriodoHoras(value === "none" ? null : (value as PeriodoHorasType))
											if (value !== "none") {
												setPeriodo("0") // Define período para "hoje" quando usar horas
											}
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Não filtrar</SelectItem>
											<SelectItem value="1h">Última hora</SelectItem>
											<SelectItem value="6h">Últimas 6 horas</SelectItem>
											<SelectItem value="12h">Últimas 12 horas</SelectItem>
											<SelectItem value="24h">Últimas 24 horas</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Período em Dias */}
								<div className="space-y-2">
									<Label>Período (Dias)</Label>
									<Select
										value={periodo}
										onValueChange={(value) => {
											setPeriodo(value as PeriodoType)
											if (value !== "0") {
												setPeriodoHoras(null) // Limpa filtro de horas
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

								{/* Ordenação */}
								<div className="space-y-2">
									<Label>Ordenar por</Label>
									<Select value={ordenacao} onValueChange={(value) => setOrdenacao(value as OrdenacaoType)}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="menor-preco">Menor Preço</SelectItem>
											<SelectItem value="maior-preco">Maior Preço</SelectItem>
											<SelectItem value="maior-desconto">Maior Desconto</SelectItem>
											<SelectItem value="relevancia">Relevância</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Preço mínimo */}
								<div className="space-y-2">
									<Label>Preço Mínimo</Label>
									<Input
										type="number"
										placeholder="R$ 0,00"
										value={precoMin}
										onChange={(e) => setPrecoMin(e.target.value)}
										step="0.01"
										min="0"
									/>
								</div>

								{/* Preço máximo */}
								<div className="space-y-2">
									<Label>Preço Máximo</Label>
									<Input
										type="number"
										placeholder="R$ 999,99"
										value={precoMax}
										onChange={(e) => setPrecoMax(e.target.value)}
										step="0.01"
										min="0"
									/>
								</div>

								{/* Botão aplicar */}
								<div className="space-y-2 md:col-span-2 lg:col-span-1">
									<Label className="invisible">Aplicar</Label>
									<Button onClick={handleAtualizarFiltros} className="w-full">
										Aplicar Filtros
									</Button>
								</div>
							</div>

							{/* Informação sobre filtros ativos */}
							{periodoHoras && (
								<div className="mt-4 text-sm text-muted-foreground">
									⏰ Filtrando produtos das{" "}
									{periodoHoras === "1h"
										? "última hora"
										: periodoHoras === "6h"
											? "últimas 6 horas"
											: periodoHoras === "12h"
												? "últimas 12 horas"
												: "últimas 24 horas"}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Lista de produtos */}
					{produtosPaginados.length > 0 ? (
						<div className="space-y-4">
							{produtosPaginados.map((produto) => {
								const valorDesconto = parseFloat(produto.valor_desconto)
								const valorTabela = parseFloat(produto.valor_tabela)
								const precoFinal = calcularPrecoFinal(produto)
								const percentualDesconto = valorTabela > 0 ? ((valorDesconto / valorTabela) * 100).toFixed(0) : 0
								const endereco = formatarEndereco(produto)

								return (
									<Card key={produto.id} className="border-l-4 border-l-primary">
										<CardContent className="pt-6">
											<div className="flex justify-between items-start gap-4">
												<div className="flex-1">
													<h4 className="font-semibold text-lg">{produto.desc}</h4>

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
																{formatarPreco(valorTabela)}
															</div>
															<div className="text-2xl font-bold text-primary">{formatarPreco(precoFinal)}</div>
															<Badge variant="destructive" className="mt-1">
																<TrendingDown className="h-3 w-3 mr-1" />-{percentualDesconto}%
															</Badge>
														</>
													) : (
														<div className="text-2xl font-bold">{formatarPreco(valorTabela)}</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})}
						</div>
					) : (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								Nenhum produto encontrado com os filtros aplicados
							</CardContent>
						</Card>
					)}

					{/* Paginação */}
					{totalPaginas > 1 && (
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div className="text-sm text-muted-foreground">
										Página {paginaAtual} de {totalPaginas}
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
											disabled={paginaAtual === 1}
										>
											Anterior
										</Button>
										<Button
											variant="outline"
											onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
											disabled={paginaAtual === totalPaginas}
										>
											Próxima
										</Button>
									</div>
									<div className="text-sm text-muted-foreground">
										Mostrando {(paginaAtual - 1) * ITEMS_PER_PAGE + 1} -{" "}
										{Math.min(paginaAtual * ITEMS_PER_PAGE, produtosFiltrados.length)} de {produtosFiltrados.length}
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	)
}
