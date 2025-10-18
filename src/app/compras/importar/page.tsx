"use client"

import type { Market } from "@prisma/client"
import { motion } from "framer-motion"
import { Camera, Loader2, QrCode, Receipt, Scan, ShoppingCart, TestTube2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { FiscalReceiptScanner } from "@/components/fiscal-receipt-scanner"
import { NfceBarcodeScanner } from "@/components/nfce-barcode-scanner"
import NfceItemReview, { type MappedPurchaseItem, type NfceItem } from "@/components/nfce-item-review"
import { MarketSelect } from "@/components/selects/market-select"
import { MarketSelectDialog } from "@/components/selects/market-select-dialog"
import { PaymentMethodSelectDialog } from "@/components/selects/payment-method-select-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useUIPreferences } from "@/hooks"
import { useCreatePurchaseMutation } from "@/hooks/use-react-query"
import type { PaymentMethod } from "@/types"

type ViewState = "idle" | "processing" | "reviewing"

// Nova interface para a resposta da API de parse
interface NfceParseResponse {
	items: NfceItem[]
	marketInfo: {
		name: string
		address: string
		date?: string // Data da compra
		paymentMethod?: string // Forma de pagamento
	}
}

export default function ImportarCompraPage() {
	const router = useRouter()
	const { selectStyle } = useUIPreferences()
	const [viewState, setViewState] = useState<ViewState>("idle")
	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [isFiscalReceiptScannerOpen, setIsFiscalReceiptScannerOpen] = useState(false)
	const [nfceItems, setNfceItems] = useState<NfceItem[]>([])
	const [manualUrl, setManualUrl] = useState<string>(process.env.NFCE_URL_TEST || "")

	// Estados da compra
	const [marketId, setMarketId] = useState<number | null>(null)
	const [suggestedMarket, setSuggestedMarket] = useState<Market | null>(null)
	const [paymentMethod, setPaymentMethod] = useState<string>("CREDIT_CARD")
	const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split("T")[0])
	const [totalDiscount, setTotalDiscount] = useState<number>(0)

	const mutation = useCr_setTotalDiscounttion()

	// Redirecionar após sucesso
	useEffect(() => {
		if (mutation.isSuccess) {
			router.push("/compras")
		}
	}, [mutation.isSuccess, router])
	const handleFiscalReceiptScanComplete = async (data: any) => {
		setIsFiscalReceiptScannerOpen(false)
		setViewState("processing")
		setSuggestedMarket(null)
		setMarketId(null)

		try {
			// Mapear os dados do cupom fiscal para o formato esperado
			const items: NfceItem[] = data.itens.map((item: any, index: number) => {
				const quantity = item.quantidade || 1
				const unitPrice = item.valorUnitario || 0
				const totalPrice = item.valorTotal || unitPrice * quantity

				// Calcular desconto se houver
				const expectedTotal = quantity * unitPrice
				const discount = item.desconto || (expectedTotal > totalPrice ? expectedTotal - totalPrice : 0)

				return {
					id: index + 1,
					name: item.descricao,
					quantity: quantity,
					unitPrice: unitPrice,
					totalPrice: totalPrice,
					discount: discount > 0 ? discount : undefined,
					code: item.codigo,
					unit: item.unidade || "UN",
				}
			})

			const marketInfo = {
				name: data.estabelecimento?.nome || "",
				address: data.estabelecimento?.endereco || "",
				date: data.compra?.dataHoraAutorizacao
					? new Date(data.compra.dataHoraAutorizacao).toLocaleDateString("pt-BR")
					: undefined,
				paymentMethod: data.compra?.formaPagamento || undefined,
			}

			setNfceItems(items)
			setViewState("reviewing")

			// Se a nota tiver data, atualiza o estado
			if (marketInfo?.date) {
				const [day, month, year] = marketInfo.date.split("/")
				if (day && month && year) {
					const formattedDate = `${year}-${month}-${day}`
					setPurchaseDate(formattedDate)
				}
			}

			// Se a nota tiver forma de pagamento, atualiza o estado
			if (marketInfo?.paymentMethod) {
				const paymentMethodMap: { [key: string]: string } = {
					"Cartão de Crédito": "CREDIT_CARD",
					"Cartão de Débito": "DEBIT_CARD",
					Dinheiro: "CASH",
					Pix: "PIX",
				}
				setPaymentMethod(paymentMethodMap[marketInfo.paymentMethod] || "OTHER")
			}

			// Tentar encontrar o mercado
			if (marketInfo?.name) {
				const marketResponse = await fetch("/api/markets/find-by-details", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(marketInfo),
				})
				const foundMarket = await marketResponse.json()
				if (foundMarket) {
					setSuggestedMarket(foundMarket)
					setMarketId(foundMarket.id)
					toast.info(`Mercado sugerido: ${foundMarket.name}`, {
						description: "Verificamos o endereço da nota e encontramos um mercado correspondente.",
					})
				}
			}

			toast.success("Cupom fiscal processado com sucesso!")
		} catch (error: any) {
			toast.error("Erro ao processar cupom fiscal", { description: error.message })
			setViewState("idle")
		}
	}

	const handleScanSuccess = async (url: string) => {
		setIsScannerOpen(false)
		setViewState("processing")
		setSuggestedMarket(null) // Limpa sugestão anterior
		setMarketId(null)

		try {
			const response = await fetch("/api/nfce/parse", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.details || "Falha ao processar a nota fiscal.")
			}

			const { items, marketInfo }: NfceParseResponse = await response.json()

			// Agrupar itens com o mesmo nome
			const groupedItems = items.reduce((acc: NfceItem[], item) => {
				const existingItem = acc.find((i) => i.name.toLowerCase() === item.name.toLowerCase())
				if (existingItem) {
					// Somar quantidade e atualizar preço total
					existingItem.quantity += item.quantity
					existingItem.totalPrice += item.totalPrice
				} else {
					// Adicionar novo item
					acc.push({ ...item })
				}
				return acc
			}, [])

			setNfceItems(groupedItems)
			setViewState("reviewing")

			// Se a nota tiver data, atualiza o estado
			if (marketInfo?.date) {
				// Converte a data do formato DD/MM/YYYY para YYYY-MM-DD
				const [day, month, year] = marketInfo.date.split("/")
				if (day && month && year) {
					const formattedDate = `${year}-${month}-${day}`
					setPurchaseDate(formattedDate)
				}
			}

			// Se a nota tiver forma de pagamento, atualiza o estado
			if (marketInfo?.paymentMethod) {
				setPaymentMethod(marketInfo.paymentMethod)
			}

			// Após o sucesso, tenta encontrar o mercado
			if (marketInfo?.name) {
				const marketResponse = await fetch("/api/markets/find-by-details", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(marketInfo),
				})
				const foundMarket = await marketResponse.json()
				if (foundMarket) {
					setSuggestedMarket(foundMarket)
					setMarketId(foundMarket.id) // Pré-seleciona o mercado
					toast.info(`Mercado sugerido: ${foundMarket.name}`, {
						description: "Verificamos o endereço da nota e encontramos um mercado correspondente.",
					})
				}
			}
		} catch (error: any) {
			toast.error("Erro ao ler a nota", { description: error.message })
			setViewState("idle")
		}
	}

	const handleReviewConfirm = (mappedItems: MappedPurchaseItem[], reviewTotalDiscount?: number) => {
		if (!marketId) {
			toast.error("Selecione um mercado antes de salvar.")
			return
		}

		// Calcular o total considerando os descontos unitários
		const totalAmount = mappedItems.reduce((acc, item) => {
			const itemTotal = item.quantity * item.price
			const itemDiscount = item.quantity * (item.unitDiscount || 0)
			return acc + itemTotal - itemDiscount
		}, 0)

		const finalTotalDiscount = reviewTotalDiscount || totalDiscount || 0
		const finalAmount = totalAmount - finalTotalDiscount

		// Preparar os itens para a API
		const purchaseItems = mappedItems.map((item) => ({
			productId: item.productId,
			quantity: item.quantity,
			unitPrice: item.price,
			unitDiscount: item.unitDiscount || 0,
			productName: item.productName,
			addToStock: true, // Adicionar ao estoque por padrão
			stockEntries: [
				{
					quantity: item.quantity,
					location: "Despensa",
				},
			],
		}))

		mutation.mutate({
			marketId,
			paymentMethod,
			purchaseDate: new Date(purchaseDate),
			totalAmount: totalAmount + finalTotalDiscount, // Total antes do desconto
			totalDiscount: finalTotalDiscount,
			finalAmount: finalAmount,
			items: purchaseItems,
		})
	}

	const handleManualSubmit = () => {
		if (manualUrl.trim()) {
			handleScanSuccess(manualUrl.trim())
		} else {
			toast.warning("Por favor, insira uma URL válida.")
		}
	}

	const renderContent = () => {
		switch (viewState) {
			case "processing":
				return (
					<motion.div
						className="space-y-8"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						{/* Processing Header */}
						<div className="text-center space-y-4">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
								className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
							>
								<Loader2 className="h-8 w-8 text-white" />
							</motion.div>
							<div>
								<h2 className="text-xl font-semibold text-foreground">Processando Nota Fiscal</h2>
								<p className="text-muted-foreground">Analisando e extraindo informações dos produtos...</p>
							</div>
						</div>

						{/* Processing Cards */}
						<div className="space-y-6">
							<Card>
								<CardContent className="p-6 grid md:grid-cols-3 gap-4">
									<div>
										<Skeleton className="h-4 w-16 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div>
										<Skeleton className="h-4 w-24 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div>
										<Skeleton className="h-4 w-20 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<Skeleton className="h-6 w-48" />
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{Array.from({ length: 3 }).map((_, i) => (
											<motion.div
												key={i}
												className="flex items-center justify-between p-4 border rounded-lg"
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: i * 0.1 }}
											>
												<div className="flex items-center space-x-3">
													<Skeleton className="h-12 w-12 rounded-lg" />
													<div>
														<Skeleton className="h-5 w-40 mb-2" />
														<Skeleton className="h-4 w-24" />
													</div>
												</div>
												<div>
													<Skeleton className="h-6 w-20" />
												</div>
											</motion.div>
										))}
									</div>
									<div className="flex justify-end mt-6 space-x-2">
										<Skeleton className="h-10 w-24" />
										<Skeleton className="h-10 w-24" />
									</div>
								</CardContent>
							</Card>
						</div>
					</motion.div>
				)

			case "reviewing":
				return (
					<motion.div
						className="space-y-6"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						{/* Header */}
						<div className="text-center space-y-2">
							<div className="mx-auto w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
								<ShoppingCart className="h-6 w-6 text-green-600" />
							</div>
							<h2 className="text-xl font-semibold">Revisar Compra</h2>
							<p className="text-muted-foreground">Confirme os dados da sua compra antes de salvar</p>
						</div>

						{/* Purchase Details */}
						<Card className="border-green-200 bg-green-50/50">
							<CardContent className="p-6 grid md:grid-cols-3 gap-4">
								<div>
									<Label htmlFor="market" className="text-green-800">
										Mercado *
									</Label>
									{selectStyle === "dialog" ? (
										<MarketSelectDialog
											key={suggestedMarket?.id}
											value={marketId !== null ? marketId.toString() : undefined}
											onValueChange={(value) => setMarketId(parseInt(value, 10))}
										/>
									) : (
										<MarketSelect
											key={suggestedMarket?.id}
											value={marketId !== null ? marketId.toString() : undefined}
											onValueChange={(value) => setMarketId(parseInt(value, 10))}
										/>
									)}
								</div>
								<div>
									<Label htmlFor="payment-method" className="text-green-800">
										Forma de Pagamento
									</Label>
									{selectStyle === "dialog" ? (
										<PaymentMethodSelectDialog
											value={paymentMethod as PaymentMethod}
											onValueChange={(value) => setPaymentMethod(value)}
										/>
									) : (
										<Select value={paymentMethod} onValueChange={setPaymentMethod}>
											<SelectTrigger id="payment-method">
												<SelectValue placeholder="Selecione a forma de pagamento" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
												<SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
												<SelectItem value="CASH">Dinheiro</SelectItem>
												<SelectItem value="PIX">Pix</SelectItem>
												<SelectItem value="OTHER">Outro</SelectItem>
											</SelectContent>
										</Select>
									)}
								</div>
								<div>
									<Label htmlFor="date" className="text-green-800">
										Data da Compra
									</Label>
									<Input
										id="date"
										type="date"
										value={purchaseDate}
										onChange={(e) => setPurchaseDate(e.target.value)}
										className="border-green-200 focus:border-green-400"
									/>
								</div>
							</CardContent>
						</Card>

						{/* Items Review */}
						<NfceItemReview
							items={nfceItems}
							onConfirm={handleReviewConfirm}
							onCancel={() => setViewState("idle")}
							isSubmitting={mutation.isPending}
						/>
					</motion.div>
				)
			default:
				return (
					<motion.div
						className="space-y-8"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						{/* Action Cards */}
						<div className="grid md:grid-cols-2 gap-6">
							<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
								<Card
									className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 group cursor-pointer"
									onClick={() => setIsScannerOpen(true)}
								>
									<CardContent className="p-6 text-center space-y-4">
										<div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
											<QrCode className="h-6 w-6 text-blue-600" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">Escanear QR Code</h3>
											<p className="text-sm text-muted-foreground">
												Use a câmera para escanear o QR Code da sua nota fiscal eletrônica
											</p>
										</div>
										<Button
											className="w-full"
											onClick={(e) => {
												e.stopPropagation()
												setIsScannerOpen(true)
											}}
										>
											<Scan className="h-4 w-4 mr-2" />
											Iniciar Scanner
										</Button>
									</CardContent>
								</Card>
							</motion.div>

							<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
								<Card
									className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200 group cursor-pointer"
									onClick={() => setIsFiscalReceiptScannerOpen(true)}
								>
									<CardContent className="p-6 text-center space-y-4">
										<div className="mx-auto w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
											<Camera className="h-6 w-6 text-green-600" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">Fotografar Cupom</h3>
											<p className="text-sm text-muted-foreground">
												Tire uma foto do seu cupom fiscal para extrair as informações automaticamente
											</p>
										</div>
										<Button
											variant="outline"
											className="w-full border-green-200 hover:bg-green-50"
											onClick={(e) => {
												e.stopPropagation()
												setIsFiscalReceiptScannerOpen(true)
											}}
										>
											<Camera className="h-4 w-4 mr-2" />
											Fotografar
										</Button>
									</CardContent>
								</Card>
							</motion.div>
						</div>

						{/* Features */}
						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
							<Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<ShoppingCart className="h-5 w-5 text-blue-600" />
										<h3 className="font-semibold text-blue-900">O que acontece após importar?</h3>
									</div>
									<div className="grid sm:grid-cols-3 gap-4 text-sm">
										<div className="flex items-start gap-2">
											<div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
											<div>
												<p className="font-medium text-blue-800">Produtos Identificados</p>
												<p className="text-blue-600">Reconhecemos automaticamente os produtos da sua compra</p>
											</div>
										</div>
										<div className="flex items-start gap-2">
											<div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
											<div>
												<p className="font-medium text-purple-800">Estoque Atualizado</p>
												<p className="text-purple-600">Seus produtos são adicionados automaticamente ao estoque</p>
											</div>
										</div>
										<div className="flex items-start gap-2">
											<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
											<div>
												<p className="font-medium text-green-800">Histórico Salvo</p>
												<p className="text-green-600">Mantemos o registro completo da sua compra</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>

						{/* Developer Section */}
						{process.env.NODE_ENV === "development" && (
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
								<Card className="border-dashed border-2 border-amber-200 bg-amber-50/50">
									<CardContent className="p-6 space-y-4">
										<div className="flex items-center gap-2">
											<TestTube2 className="h-5 w-5 text-amber-600" />
											<h4 className="font-semibold text-amber-800">Modo Desenvolvedor</h4>
										</div>
										<p className="text-sm text-amber-700">
											Cole a URL completa do QR Code da nota fiscal para testar a importação manualmente.
										</p>
										<div className="space-y-3">
											<Label htmlFor="manual-url" className="text-amber-800">
												URL da Nota Fiscal
											</Label>
											<Input
												id="manual-url"
												placeholder="http://..."
												value={manualUrl}
												onChange={(e) => setManualUrl(e.target.value)}
												className="border-amber-200 focus:border-amber-400"
											/>
											<Button
												variant="secondary"
												className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
												onClick={handleManualSubmit}
											>
												<Upload className="h-4 w-4 mr-2" />
												Importar Manualmente
											</Button>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						)}
					</motion.div>
				)
		}
	}

	return (
		<div className="container mx-auto py-8">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold flex items-center gap-2">
							<Receipt className="h-6 w-6 text-blue-600" />
							Importar Compra
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Digitalize cupons fiscais e QR Codes para importar suas compras automaticamente
						</p>
					</div>
				</div>

				{renderContent()}
			</div>
			<NfceBarcodeScanner isOpen={isScannerOpen} onScan={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
			<FiscalReceiptScanner
				isOpen={isFiscalReceiptScannerOpen}
				onScanComplete={handleFiscalReceiptScanComplete}
				onClose={() => setIsFiscalReceiptScannerOpen(false)}
			/>
		</div>
	)
}
