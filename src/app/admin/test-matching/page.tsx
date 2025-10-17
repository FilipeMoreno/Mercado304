"use client"

import { AlertCircle, Bug, CheckCircle, Loader2, Search, XCircle } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	CATEGORIAS_BUSCA,
	getCategoriasParaBusca,
	isProvavelmenteAlimento,
	LOCAL_PADRAO,
	PERIODO_PADRAO,
	RAIO_PADRAO,
	TODAS_CATEGORIAS,
} from "@/lib/nota-parana-config"

interface MatchResult {
	mercadoCadastrado: string
	razaoSocialCadastrada: string
	enderecoCadastrado: string
	estabelecimentoAPI: string
	enderecoAPI: string
	matchNome: boolean
	matchEndereco: boolean
	wouldMatch: boolean
	preco: string
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
	resultados: MatchResult[]
	totalMercados: number
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
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Testando...
								</>
							) : (
								<>
									<Search className="mr-2 h-4 w-4" />
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
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Resultados do Teste</AlertTitle>
						<AlertDescription>
							Código de barras: <strong>{result.barcode}</strong> • {result.totalMercados} mercados cadastrados •{" "}
							{result.resultados.length} matches encontrados
						</AlertDescription>
					</Alert>

					{/* Card de Debug */}
					<Card className="border-blue-200 bg-blue-50/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-blue-900">
								<Bug className="h-5 w-5" />
								Debug - Configuração da Busca
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Detecção de Tipo */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-sm font-medium text-blue-900 mb-1">Tipo de Produto Detectado</div>
										<Badge variant={isProvavelmenteAlimento(result.barcode) ? "default" : "secondary"} className="text-sm">
											{isProvavelmenteAlimento(result.barcode) ? "🍎 Alimento" : "🧹 Não Alimento"}
										</Badge>
									</div>
									<div>
										<div className="text-sm font-medium text-blue-900 mb-1">Tipo de Termo</div>
										<Badge variant="outline" className="text-sm">
											{/^\d{8,14}$/.test(result.barcode) ? "🔢 Código de Barras" : "📝 Nome"}
										</Badge>
									</div>
								</div>

								{/* Categorias Buscadas */}
								<div>
									<div className="text-sm font-medium text-blue-900 mb-2">
										Categorias Buscadas ({getCategoriasParaBusca(result.barcode).length} no total)
									</div>
									<div className="flex flex-wrap gap-2">
										{getCategoriasParaBusca(result.barcode).map((catId) => (
											<Badge key={catId} variant="outline" className="text-xs">
												{catId}: {TODAS_CATEGORIAS[catId] || "Desconhecida"}
											</Badge>
										))}
									</div>
								</div>

								{/* Parâmetros da API */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-white rounded border">
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

								{/* URL de Exemplo */}
								<div>
									<div className="text-sm font-medium text-blue-900 mb-1">Exemplo de URL Gerada</div>
									<div className="p-2 bg-white rounded border text-xs font-mono break-all">
										{`${process.env.NEXT_PUBLIC_API_URL || ""}/api/nota-parana/produtos?termo=${result.barcode}&categoria=${getCategoriasParaBusca(result.barcode)[0]}&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${result.barcode}`}
									</div>
								</div>

								{/* Categorias que SERIAM usadas na sincronização */}
								<div className="border-t pt-3">
									<div className="text-sm font-medium text-blue-900 mb-2">
										Categorias Usadas na Sincronização Real ({CATEGORIAS_BUSCA.length} categorias)
									</div>
									<div className="flex flex-wrap gap-2">
										{CATEGORIAS_BUSCA.map((catId) => (
											<Badge
												key={catId}
												variant={getCategoriasParaBusca(result.barcode).includes(catId) ? "default" : "secondary"}
												className="text-xs"
											>
												{catId}
											</Badge>
										))}
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										Badges azuis = categorias sendo testadas • Badges cinzas = não incluídas neste teste
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{result.resultados.length === 0 ? (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								Nenhum match encontrado. Verifique se os mercados têm razão social cadastrada.
							</CardContent>
						</Card>
					) : (
						result.resultados.map((match) => (
							<Card
								key={`${match.mercadoCadastrado}-${match.estabelecimentoAPI}`}
								className={match.wouldMatch ? "border-l-4 border-l-green-600" : "border-l-4 border-l-yellow-600"}
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="flex items-center gap-2">
												{match.wouldMatch ? (
													<CheckCircle className="h-5 w-5 text-green-600" />
												) : (
													<XCircle className="h-5 w-5 text-yellow-600" />
												)}
												{match.mercadoCadastrado}
											</CardTitle>
											<CardDescription className="mt-2">
												{match.wouldMatch ? (
													<span className="text-green-600 font-medium">✅ Preço seria registrado neste mercado</span>
												) : (
													<span className="text-yellow-600 font-medium">
														⚠️ Não seria registrado (falta match de endereço)
													</span>
												)}
											</CardDescription>
										</div>
										<div className="text-right">
											<div className="text-2xl font-bold">{match.preco}</div>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{/* Razão Social */}
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-sm font-medium mb-1">Razão Social (Cadastrada)</div>
												<div className="text-sm text-muted-foreground">{match.razaoSocialCadastrada || "Não cadastrada"}</div>
											</div>
											<div>
												<div className="text-sm font-medium mb-1">Estabelecimento (API)</div>
												<div className="text-sm text-muted-foreground">{match.estabelecimentoAPI}</div>
											</div>
										</div>

										{/* Match de Nome */}
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">Match de Nome:</span>
											{match.matchNome ? (
												<Badge variant="default">
													✅ {match.detalhesMatch.totalMatchesNome} palavras coincidem: {match.detalhesMatch.palavrasMatch.join(", ")}
												</Badge>
											) : (
												<Badge variant="destructive">❌ Sem match</Badge>
											)}
										</div>

										{/* Endereços */}
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-sm font-medium mb-1">Endereço (Cadastrado)</div>
												<div className="text-sm text-muted-foreground">{match.enderecoCadastrado || "Não cadastrado"}</div>
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
													<Badge variant="outline">
														{match.detalhesMatch.totalMatchesEndereco}/3 matches
													</Badge>
												</div>
												{match.detalhesMatch.totalMatchesEndereco < 2 && (
													<Alert variant="destructive">
														<AlertCircle className="h-4 w-4" />
														<AlertDescription>
															Precisa de pelo menos 2 matches de endereço. Verifique se o endereço cadastrado está correto.
														</AlertDescription>
													</Alert>
												)}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>
			)}
		</div>
	)
}

