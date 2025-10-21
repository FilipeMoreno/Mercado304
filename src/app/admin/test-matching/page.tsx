"use client"

import { AlertCircle, Bug, CheckCircle, Loader2, Search } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LOCAL_PADRAO, PERIODO_PADRAO, RAIO_PADRAO, TODAS_CATEGORIAS } from "@/lib/nota-parana-config"

interface MatchResult {
	mercadoCadastrado: string
	razaoSocialCadastrada: string
	enderecoCadastrado: string
	estabelecimentoAPI: string
	enderecoAPI: string
	categoria: number
	matchNome: boolean
	matchEndereco: boolean
	wouldMatch: boolean
	preco: string
	dataHora: string
	tempo: string
	detalhesMatch: {
		palavrasMatch: string[]
		totalMatchesNome: number
		temRua: boolean
		temNumero: boolean
		temBairro: boolean
		totalMatchesEndereco: number
	}
}

interface TestResult {
	barcode: string
	totalMercadosCadastrados: number
	totalEstabelecimentosAPI: number
	categoriasEncontradas: number[]
	topCategorias: { categoria: number; quantidade: number }[]
	estatisticas: {
		matches: number
		possiveisMatches: number
		semMatch: number
		total: number
	}
	resultados: {
		matches: MatchResult[]
		possiveisMatches: MatchResult[]
		semMatch: MatchResult[]
	}
}

export default function TestMatchingPage() {
	const [barcode, setBarcode] = useState("")
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<TestResult | null>(null)

	const handleTest = async () => {
		if (!barcode.trim()) return

		setLoading(true)
		setResult(null)

		try {
			const response = await fetch("/api/admin/test-matching", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ barcode: barcode.trim() }),
			})

			if (!response.ok) {
				throw new Error("Erro ao testar matching")
			}

			const data = await response.json()
			setResult(data)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Teste de Matching - Sincronização de Preços</h1>
				<p className="text-muted-foreground mt-2">
					Teste se seus mercados serão identificados corretamente pela API do Nota Paraná
				</p>
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Testar Código de Barras</CardTitle>
					<CardDescription>Digite um código de barras para ver quais mercados fariam match</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<Input
							placeholder="Ex: 7894900027013"
							value={barcode}
							onChange={(e) => setBarcode(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleTest()}
						/>
						<Button onClick={handleTest} disabled={loading || !barcode.trim()}>
							{loading ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Testando...
								</>
							) : (
								<>
									<Search className="mr-2 size-4" />
									Testar
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{result && (
				<div className="space-y-4">
					<Alert>
						<AlertCircle className="size-4" />
						<AlertTitle>Resultados do Teste</AlertTitle>
						<AlertDescription>
							Código de barras: <strong>{result.barcode}</strong> • {result.totalMercadosCadastrados} mercados
							cadastrados • {result.totalEstabelecimentosAPI} estabelecimentos da API • {result.estatisticas.matches}{" "}
							matches perfeitos
						</AlertDescription>
					</Alert>

					{/* Card de Estatísticas */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card className="border-green-200 bg-green-50/50">
							<CardHeader>
								<CardTitle className="text-green-900 text-lg">✅ Matches Perfeitos</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900">{result.estatisticas.matches}</div>
								<p className="text-sm text-muted-foreground mt-1">Preços serão sincronizados</p>
							</CardContent>
						</Card>
						<Card className="border-yellow-200 bg-yellow-50/50">
							<CardHeader>
								<CardTitle className="text-yellow-900 text-lg">⚠️ Possíveis Matches</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-yellow-900">{result.estatisticas.possiveisMatches}</div>
								<p className="text-sm text-muted-foreground mt-1">Match de nome, mas falta endereço</p>
							</CardContent>
						</Card>
						<Card className="border-red-200 bg-red-50/50">
							<CardHeader>
								<CardTitle className="text-red-900 text-lg">❌ Sem Match</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-900">{result.estatisticas.semMatch}</div>
								<p className="text-sm text-muted-foreground mt-1">Não serão sincronizados</p>
							</CardContent>
						</Card>
					</div>

					{/* Card de Debug */}
					<Card className="border-blue-200 bg-blue-50/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-blue-900">
								<Bug className="size-5" />
								Debug - Configuração da Busca
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Top 3 Categorias */}
								<div>
									<div className="text-sm font-medium text-blue-900 mb-2">Top 3 Categorias (usadas pela API)</div>
									<div className="flex flex-wrap gap-2">
										{result.topCategorias.map((cat) => (
											<Badge key={cat.categoria} variant="default" className="text-sm">
												{TODAS_CATEGORIAS[cat.categoria] || `Categoria ${cat.categoria}`}: {cat.quantidade}{" "}
												estabelecimento(s)
											</Badge>
										))}
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										A API retorna produtos ordenados por categoria com mais registros. Sistema usa as top 3.
									</p>
								</div>

								{/* Todas Categorias Encontradas */}
								<div>
									<div className="text-sm font-medium text-blue-900 mb-2">
										Todas as Categorias Encontradas ({result.categoriasEncontradas.length} no total)
									</div>
									<div className="flex flex-wrap gap-2">
										{result.categoriasEncontradas.map((catId) => (
											<Badge
												key={catId}
												variant={result.topCategorias.some((t) => t.categoria === catId) ? "default" : "secondary"}
												className="text-xs"
											>
												{catId}: {TODAS_CATEGORIAS[catId] || "Desconhecida"}
											</Badge>
										))}
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										Badges azuis = top 3 processadas • Badges cinzas = ignoradas
									</p>
								</div>

								{/* Parâmetros da API */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-white rounded-sm border">
									<div>
										<div className="text-xs text-muted-foreground mb-1">Localização</div>
										<div className="text-sm font-mono">{LOCAL_PADRAO}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Raio</div>
										<div className="text-sm font-mono">{RAIO_PADRAO} km</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Período</div>
										<div className="text-sm font-mono">{PERIODO_PADRAO} dias</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Ordenação</div>
										<div className="text-sm font-mono">Relevância (0)</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Matches Perfeitos */}
					{result.estatisticas.matches > 0 && (
						<div className="space-y-4">
							<h2 className="text-2xl font-bold flex items-center gap-2">
								<CheckCircle className="size-6 text-green-600" />
								Matches Perfeitos ({result.estatisticas.matches})
							</h2>
							{result.resultados.matches.map((match) => (
								<Card
									key={`${match.mercadoCadastrado}-${match.estabelecimentoAPI}`}
									className="border-l-4 border-l-green-600"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="flex items-center gap-2">
													<CheckCircle className="size-5 text-green-600" />
													{match.mercadoCadastrado}
												</CardTitle>
												<CardDescription className="mt-2">
													<span className="text-green-600 font-medium">✅ Preço será registrado neste mercado</span>
												</CardDescription>
											</div>
											<div className="text-right">
												<div className="text-2xl font-bold">{match.preco}</div>
												<div className="text-xs text-muted-foreground">{match.tempo}</div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{/* Categoria */}
											<div>
												<Badge variant="outline">
													Categoria {match.categoria}: {TODAS_CATEGORIAS[match.categoria] || "Desconhecida"}
												</Badge>
											</div>

											{/* Razão Social */}
											<div className="grid grid-cols-2 gap-4">
												<div>
													<div className="text-sm font-medium mb-1">Razão Social (Cadastrada)</div>
													<div className="text-sm text-muted-foreground">{match.razaoSocialCadastrada}</div>
												</div>
												<div>
													<div className="text-sm font-medium mb-1">Estabelecimento (API)</div>
													<div className="text-sm text-muted-foreground">{match.estabelecimentoAPI}</div>
												</div>
											</div>

											{/* Match de Nome */}
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">Match de Nome:</span>
												<Badge variant="default">
													✅ {match.detalhesMatch.totalMatchesNome} palavras coincidem:{" "}
													{match.detalhesMatch.palavrasMatch.join(", ")}
												</Badge>
											</div>

											{/* Endereços */}
											<div className="grid grid-cols-2 gap-4">
												<div>
													<div className="text-sm font-medium mb-1">Endereço (Cadastrado)</div>
													<div className="text-sm text-muted-foreground">
														{match.enderecoCadastrado || "Não cadastrado"}
													</div>
												</div>
												<div>
													<div className="text-sm font-medium mb-1">Endereço (API)</div>
													<div className="text-sm text-muted-foreground">{match.enderecoAPI}</div>
												</div>
											</div>

											{/* Match de Endereço */}
											{match.enderecoCadastrado && (
												<div className="space-y-2">
													<span className="text-sm font-medium">Validação de Endereço:</span>
													<div className="flex flex-wrap gap-2">
														<Badge variant={match.detalhesMatch.temRua ? "default" : "secondary"}>
															{match.detalhesMatch.temRua ? "✅" : "❌"} Rua
														</Badge>
														<Badge variant={match.detalhesMatch.temNumero ? "default" : "secondary"}>
															{match.detalhesMatch.temNumero ? "✅" : "❌"} Número
														</Badge>
														<Badge variant={match.detalhesMatch.temBairro ? "default" : "secondary"}>
															{match.detalhesMatch.temBairro ? "✅" : "❌"} Bairro
														</Badge>
														<Badge variant="outline">{match.detalhesMatch.totalMatchesEndereco}/3 matches</Badge>
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}

					{/* Possíveis Matches */}
					{result.estatisticas.possiveisMatches > 0 && (
						<div className="space-y-4">
							<h2 className="text-2xl font-bold flex items-center gap-2">
								<AlertCircle className="size-6 text-yellow-600" />
								Possíveis Matches - Precisa Ajuste ({result.estatisticas.possiveisMatches})
							</h2>
							<Alert>
								<AlertCircle className="size-4" />
								<AlertDescription>
									Estes mercados têm match de nome mas faltam dados de endereço ou o endereço não corresponde.
								</AlertDescription>
							</Alert>
							{result.resultados.possiveisMatches.slice(0, 5).map((match) => (
								<Card
									key={`${match.mercadoCadastrado}-${match.estabelecimentoAPI}`}
									className="border-l-4 border-l-yellow-600"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="flex items-center gap-2">
													<AlertCircle className="size-5 text-yellow-600" />
													{match.mercadoCadastrado}
												</CardTitle>
												<CardDescription className="mt-2">
													<span className="text-yellow-600 font-medium">
														⚠️ Match de nome, mas falta validação de endereço
													</span>
												</CardDescription>
											</div>
											<div className="text-right">
												<div className="text-2xl font-bold">{match.preco}</div>
												<div className="text-xs text-muted-foreground">{match.tempo}</div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{/* Categoria */}
											<div>
												<Badge variant="outline">
													Categoria {match.categoria}: {TODAS_CATEGORIAS[match.categoria] || "Desconhecida"}
												</Badge>
											</div>

											{/* Razão Social */}
											<div className="grid grid-cols-2 gap-4">
												<div>
													<div className="text-sm font-medium mb-1">Razão Social (Cadastrada)</div>
													<div className="text-sm text-muted-foreground">{match.razaoSocialCadastrada}</div>
												</div>
												<div>
													<div className="text-sm font-medium mb-1">Estabelecimento (API)</div>
													<div className="text-sm text-muted-foreground">{match.estabelecimentoAPI}</div>
												</div>
											</div>

											{/* Match de Nome */}
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">Match de Nome:</span>
												<Badge variant="default">
													✅ {match.detalhesMatch.totalMatchesNome} palavras:{" "}
													{match.detalhesMatch.palavrasMatch.join(", ")}
												</Badge>
											</div>

											{/* Endereços */}
											<div className="grid grid-cols-2 gap-4">
												<div>
													<div className="text-sm font-medium mb-1">Endereço (Cadastrado)</div>
													<div className="text-sm text-muted-foreground">
														{match.enderecoCadastrado || "Não cadastrado"}
													</div>
												</div>
												<div>
													<div className="text-sm font-medium mb-1">Endereço (API)</div>
													<div className="text-sm text-muted-foreground">{match.enderecoAPI}</div>
												</div>
											</div>

											{/* Match de Endereço - Problema */}
											<Alert variant="destructive">
												<AlertCircle className="size-4" />
												<AlertDescription>
													<strong>Problema:</strong>{" "}
													{!match.enderecoCadastrado
														? "Endereço não cadastrado"
														: `Apenas ${match.detalhesMatch.totalMatchesEndereco}/3 matches de endereço`}
													<br />
													<strong>Solução:</strong>{" "}
													{!match.enderecoCadastrado
														? "Cadastre o endereço completo do mercado"
														: "Verifique se rua, número e bairro estão corretos"}
												</AlertDescription>
											</Alert>
										</div>
									</CardContent>
								</Card>
							))}
							{result.estatisticas.possiveisMatches > 5 && (
								<Alert>
									<AlertCircle className="size-4" />
									<AlertDescription>
										Exibindo apenas os primeiros 5 de {result.estatisticas.possiveisMatches} possíveis matches.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					{/* Sem Match */}
					{result.estatisticas.semMatch > 0 && (
						<div className="space-y-4">
							<h2 className="text-2xl font-bold flex items-center gap-2 text-red-600">
								❌ Sem Match - Não Serão Sincronizados ({result.estatisticas.semMatch})
							</h2>
							<Alert variant="destructive">
								<AlertCircle className="size-4" />
								<AlertTitle>Atenção!</AlertTitle>
								<AlertDescription>
									Estes mercados NÃO serão incluídos na sincronização automática de preços. Verifique se a razão social
									e o endereço estão cadastrados corretamente.
								</AlertDescription>
							</Alert>
							{result.resultados.semMatch.map((match) => (
								<Card key={match.mercadoCadastrado} className="border-l-4 border-l-red-600 opacity-75">
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="flex items-center gap-2">
													<AlertCircle className="size-5 text-red-600" />
													{match.mercadoCadastrado}
												</CardTitle>
												<CardDescription className="mt-2">
													<span className="text-red-600 font-medium">
														❌{" "}
														{match.estabelecimentoAPI === "Nenhum estabelecimento encontrado na API"
															? "Nenhum estabelecimento correspondente encontrado na API do Nota Paraná"
															: "Não há match suficiente com os dados da API"}
													</span>
												</CardDescription>
											</div>
											<div className="text-right">
												{match.preco !== "-" && (
													<>
														<div className="text-2xl font-bold text-muted-foreground">{match.preco}</div>
														<div className="text-xs text-muted-foreground">{match.tempo}</div>
													</>
												)}
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{/* Dados Cadastrados */}
											<div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-sm">
												<div>
													<div className="text-sm font-medium mb-1">Razão Social Cadastrada</div>
													<div className="text-sm text-muted-foreground">{match.razaoSocialCadastrada}</div>
												</div>
												<div>
													<div className="text-sm font-medium mb-1">Endereço Cadastrado</div>
													<div className="text-sm text-muted-foreground">{match.enderecoCadastrado}</div>
												</div>
											</div>

											{/* Melhor Tentativa de Match */}
											{match.estabelecimentoAPI !== "Nenhum estabelecimento encontrado na API" && (
												<div>
													<div className="text-sm font-medium mb-2">Melhor correspondência encontrada na API:</div>
													<div className="grid grid-cols-2 gap-4">
														<div>
															<div className="text-xs text-muted-foreground mb-1">Estabelecimento</div>
															<div className="text-sm">{match.estabelecimentoAPI}</div>
														</div>
														<div>
															<div className="text-xs text-muted-foreground mb-1">Endereço</div>
															<div className="text-sm">{match.enderecoAPI}</div>
														</div>
													</div>
													{match.detalhesMatch.totalMatchesNome > 0 && (
														<div className="mt-2">
															<Badge variant="secondary" className="text-xs">
																{match.detalhesMatch.totalMatchesNome} palavra(s) coincidem:{" "}
																{match.detalhesMatch.palavrasMatch.join(", ")}
															</Badge>
															<span className="text-xs text-muted-foreground ml-2">(mínimo: 2 palavras)</span>
														</div>
													)}
												</div>
											)}

											{/* Recomendações */}
											<Alert>
												<AlertCircle className="size-4" />
												<AlertTitle>Como resolver:</AlertTitle>
												<AlertDescription className="space-y-1">
													{!match.razaoSocialCadastrada || match.razaoSocialCadastrada === "Não informada" ? (
														<p>
															• Cadastre a <strong>razão social</strong> (nome oficial) do mercado
														</p>
													) : null}
													{!match.enderecoCadastrado || match.enderecoCadastrado === "Não informado" ? (
														<p>
															• Cadastre o <strong>endereço completo</strong> (rua, número e bairro)
														</p>
													) : null}
													{match.estabelecimentoAPI === "Nenhum estabelecimento encontrado na API" ? (
														<p>
															• Este mercado pode não estar no raio de busca ({RAIO_PADRAO}km) ou não ter este produto
															em estoque
														</p>
													) : (
														<p>
															• Verifique se a razão social e endereço cadastrados correspondem aos dados oficiais do
															mercado
														</p>
													)}
												</AlertDescription>
											</Alert>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
