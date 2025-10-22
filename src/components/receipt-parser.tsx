"use client"

import { Edit, Receipt, Save, Trash2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { OCRScanner } from "@/components/ocr-scanner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ParsedReceipt {
	market: string
	date: string
	items: Array<{
		name: string
		quantity: number
		unitPrice: number
		totalPrice: number
	}>
	subtotal: number
	tax: number
	total: number
	paymentMethod: string
	address?: string
}

interface ReceiptParserProps {
	onReceiptParsed: (receipt: ParsedReceipt) => void
	onClose: () => void
	isOpen: boolean
}

export function ReceiptParser({ onReceiptParsed, onClose, isOpen }: ReceiptParserProps) {
	const [showOCR, setShowOCR] = useState(false)
	const [rawText, setRawText] = useState("")
	const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null)
	const [isEditing, setIsEditing] = useState(false)

	const parseReceiptText = (text: string): ParsedReceipt => {
		console.log("🧾 Parsing receipt text:", text)

		const lines = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line)

		const receipt: ParsedReceipt = {
			market: "",
			date: "",
			items: [],
			subtotal: 0,
			tax: 0,
			total: 0,
			paymentMethod: "",
			address: "",
		}

		// Patterns para extração
		const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/
		const _timePattern = /(\d{1,2}:\d{2})/
		const pricePattern = /R?\$?\s*(\d+[,.]\d{2})/
		const _itemPattern = /^(.+?)\s+(\d+[,.]\d{2})\s*$/
		const totalPattern = /(?:total|soma|valor)[\s:]*R?\$?\s*(\d+[,.]\d{2})/i
		const subtotalPattern = /(?:subtotal|sub-total)[\s:]*R?\$?\s*(\d+[,.]\d{2})/i
		const taxPattern = /(?:imposto|taxa|tax)[\s:]*R?\$?\s*(\d+[,.]\d{2})/i

		// Encontrar mercado (normalmente primeiras linhas)
		const marketCandidates = lines
			.slice(0, 5)
			.filter((line) => line.length > 3 && !datePattern.test(line) && !pricePattern.test(line) && !/^\d/.test(line))
		receipt.market = marketCandidates[0] || "Mercado não identificado"

		// Encontrar data
		for (const line of lines) {
			const dateMatch = line.match(datePattern)
			if (dateMatch && dateMatch[1]) {
				receipt.date = dateMatch[1]
				break
			}
		}

		// Encontrar endereço (linhas que contêm CEP, rua, avenida, etc.)
		const addressPattern = /(?:rua|av|avenida|alameda|praça|r\.|av\.|cep|cidade)/i
		const addressCandidates = lines.filter((line) => addressPattern.test(line))
		if (addressCandidates.length > 0) {
			receipt.address = addressCandidates.join(", ")
		}

		// Encontrar total
		for (const line of lines) {
			const totalMatch = line.match(totalPattern)
			if (totalMatch && totalMatch[1]) {
				receipt.total = parseFloat(totalMatch[1].replace(",", "."))
				break
			}
		}

		// Encontrar subtotal
		for (const line of lines) {
			const subtotalMatch = line.match(subtotalPattern)
			if (subtotalMatch && subtotalMatch[1]) {
				receipt.subtotal = parseFloat(subtotalMatch[1].replace(",", "."))
				break
			}
		}

		// Encontrar taxa/imposto
		for (const line of lines) {
			const taxMatch = line.match(taxPattern)
			if (taxMatch && taxMatch[1]) {
				receipt.tax = parseFloat(taxMatch[1].replace(",", "."))
				break
			}
		}

		// Identificar método de pagamento
		const paymentMethods = ["dinheiro", "cartão", "card", "débito", "crédito", "pix", "vale"]
		for (const line of lines) {
			for (const method of paymentMethods) {
				if (line.toLowerCase().includes(method)) {
					receipt.paymentMethod = method.charAt(0).toUpperCase() + method.slice(1)
					break
				}
			}
			if (receipt.paymentMethod) break
		}

		// Extrair itens (linhas com padrão: produto + preço)
		const itemLines = lines.filter((line) => {
			// Filtrar linhas que não são headers, totais, etc.
			const isHeader =
				/^(?:cupom|nota|mercado|supermercado|data|hora|total|subtotal|troco|operador|caixa|cnpj|cpf)/i.test(line)
			const isFooter = /^(?:obrigado|volte|sempre|www|tel|telefone)/i.test(line)
			const hasPrice = pricePattern.test(line)

			return !isHeader && !isFooter && hasPrice && line.length > 5
		})

		for (const line of itemLines) {
			// Tentar diferentes padrões para extrair nome e preço do item
			const patterns = [
				// Padrão: "PRODUTO QUANTIDADE x PREÇO UNITÁRIO = TOTAL"
				/^(.+?)\s+(\d+(?:[,.]\d+)?)\s*x\s*(\d+[,.]\d{2})\s*=?\s*(\d+[,.]\d{2})\s*$/,
				// Padrão: "PRODUTO PREÇO"
				/^(.+?)\s+(\d+[,.]\d{2})\s*$/,
				// Padrão: "QUANTIDADE PRODUTO PREÇO"
				/^(\d+)\s+(.+?)\s+(\d+[,.]\d{2})\s*$/,
			]

			for (const pattern of patterns) {
				const match = line.match(pattern)
				if (match) {
					let name = "",
						quantity = 1,
						unitPrice = 0,
						totalPrice = 0

					if (pattern === patterns[0] && match[1] && match[2] && match[3] && match[4]) {
						// Padrão completo
						name = match[1].trim()
						quantity = parseFloat(match[2].replace(",", "."))
						unitPrice = parseFloat(match[3].replace(",", "."))
						totalPrice = parseFloat(match[4].replace(",", "."))
					} else if (pattern === patterns[1] && match[1] && match[2]) {
						// Produto + preço
						name = match[1].trim()
						totalPrice = parseFloat(match[2].replace(",", "."))
						unitPrice = totalPrice
					} else if (pattern === patterns[2] && match[1] && match[2] && match[3]) {
						// Quantidade + produto + preço
						quantity = parseFloat(match[1])
						name = match[2].trim()
						totalPrice = parseFloat(match[3].replace(",", "."))
						unitPrice = totalPrice / quantity
					}

					// Limpar nome do produto
					name = name.replace(/^[\d\s\-*]+/, "").trim()

					if (name && totalPrice > 0) {
						receipt.items.push({
							name,
							quantity,
							unitPrice,
							totalPrice,
						})
					}
					break
				}
			}
		}

		// Calcular subtotal se não foi encontrado
		if (receipt.subtotal === 0 && receipt.items.length > 0) {
			receipt.subtotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0)
		}

		// Calcular total se não foi encontrado
		if (receipt.total === 0) {
			receipt.total = receipt.subtotal + receipt.tax
		}

		console.log("📊 Parsed receipt:", receipt)
		return receipt
	}

	const handleOCRResult = (result: any) => {
		setRawText(result.text)
		const parsed = parseReceiptText(result.text)
		setParsedReceipt(parsed)
		setShowOCR(false)
		toast.success(`🧾 Nota fiscal processada! ${parsed.items.length} itens encontrados`)
	}

	const handleSave = () => {
		if (parsedReceipt) {
			onReceiptParsed(parsedReceipt)
			toast.success("Nota fiscal salva com sucesso!")
			onClose()
		}
	}

	const updateReceiptField = (field: string, value: any) => {
		if (parsedReceipt) {
			setParsedReceipt({
				...parsedReceipt,
				[field]: value,
			})
		}
	}

	const updateItem = (index: number, field: string, value: any) => {
		if (parsedReceipt) {
			const newItems = [...parsedReceipt.items]
			const currentItem = newItems[index];
			if (!currentItem) return;

			newItems[index] = {
				...currentItem,
				[field]: value,
			}
			// Recalcular preço total do item se necessário
			if (field === "quantity" || field === "unitPrice") {
				const updatedItem = newItems[index];
				if (updatedItem) {
					updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
				}
			}
			setParsedReceipt({
				...parsedReceipt,
				items: newItems,
			})
		}
	}

	const removeItem = (index: number) => {
		if (parsedReceipt) {
			const newItems = parsedReceipt.items.filter((_, i) => i !== index)
			setParsedReceipt({
				...parsedReceipt,
				items: newItems,
			})
		}
	}

	const addNewItem = () => {
		if (parsedReceipt) {
			setParsedReceipt({
				...parsedReceipt,
				items: [
					...parsedReceipt.items,
					{
						name: "",
						quantity: 1,
						unitPrice: 0,
						totalPrice: 0,
					},
				],
			})
		}
	}

	if (!isOpen) return null

	if (showOCR) {
		return (
			<OCRScanner mode="receipt" onTextDetected={handleOCRResult} onClose={() => setShowOCR(false)} isOpen={true} />
		)
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Receipt className="size-5" />
							Parser de Nota Fiscal
						</div>
						<div className="flex items-center gap-2">
							{parsedReceipt && (
								<Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
									{isEditing ? <X className="size-4" /> : <Edit className="size-4" />}
									{isEditing ? "Cancelar" : "Editar"}
								</Button>
							)}
							<Button variant="outline" size="sm" onClick={onClose}>
								<X className="size-4" />
							</Button>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{!parsedReceipt ? (
						<div className="text-center py-8">
							<Receipt className="size-16 mx-auto mb-4 text-gray-400" />
							<h3 className="text-lg font-semibold mb-2">Digitalizar Nota Fiscal</h3>
							<p className="text-gray-600 mb-4">Use a câmera ou faça upload de uma imagem da nota fiscal</p>
							<Button onClick={() => setShowOCR(true)} size="lg">
								<Receipt className="size-4 mr-2" />
								Iniciar Scanner OCR
							</Button>
						</div>
					) : (
						<div className="space-y-6">
							{/* Informações básicas */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label>Mercado</Label>
									{isEditing ? (
										<Input
											value={parsedReceipt.market}
											onChange={(e) => updateReceiptField("market", e.target.value)}
										/>
									) : (
										<p className="font-medium">{parsedReceipt.market}</p>
									)}
								</div>
								<div>
									<Label>Data</Label>
									{isEditing ? (
										<Input value={parsedReceipt.date} onChange={(e) => updateReceiptField("date", e.target.value)} />
									) : (
										<p className="font-medium">{parsedReceipt.date || "Não identificada"}</p>
									)}
								</div>
								{parsedReceipt.address && (
									<div className="md:col-span-2">
										<Label>Endereço</Label>
										{isEditing ? (
											<Input
												value={parsedReceipt.address}
												onChange={(e) => updateReceiptField("address", e.target.value)}
											/>
										) : (
											<p className="text-sm text-gray-600">{parsedReceipt.address}</p>
										)}
									</div>
								)}
							</div>

							{/* Items */}
							<div>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold">Itens da Compra</h3>
									{isEditing && (
										<Button onClick={addNewItem} size="sm">
											Adicionar Item
										</Button>
									)}
								</div>

								<div className="space-y-2">
									{parsedReceipt.items.map((item, index) => (
										<Card key={index} className="p-3">
											{isEditing ? (
												<div className="grid grid-cols-12 gap-2 items-center">
													<div className="col-span-5">
														<Input
															value={item.name}
															onChange={(e) => updateItem(index, "name", e.target.value)}
															placeholder="Nome do produto"
															className="text-sm"
														/>
													</div>
													<div className="col-span-2">
														<Input
															type="number"
															value={item.quantity}
															onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
															placeholder="Qtd"
															className="text-sm"
														/>
													</div>
													<div className="col-span-2">
														<Input
															type="number"
															step="0.01"
															value={item.unitPrice}
															onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
															placeholder="Preço unit."
															className="text-sm"
														/>
													</div>
													<div className="col-span-2">
														<Badge variant="secondary">R$ {item.totalPrice.toFixed(2)}</Badge>
													</div>
													<div className="col-span-1">
														<Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="size-8 p-0">
															<Trash2 className="h-3 w-3" />
														</Button>
													</div>
												</div>
											) : (
												<div className="flex justify-between items-center">
													<div>
														<p className="font-medium">{item.name}</p>
														<p className="text-sm text-gray-600">
															{item.quantity}x R$ {item.unitPrice.toFixed(2)}
														</p>
													</div>
													<Badge>R$ {item.totalPrice.toFixed(2)}</Badge>
												</div>
											)}
										</Card>
									))}
								</div>
							</div>

							{/* Totals */}
							<Card className="p-4 bg-gray-50">
								<div className="space-y-2">
									{parsedReceipt.subtotal > 0 && (
										<div className="flex justify-between">
											<span>Subtotal:</span>
											<span>R$ {parsedReceipt.subtotal.toFixed(2)}</span>
										</div>
									)}
									{parsedReceipt.tax > 0 && (
										<div className="flex justify-between">
											<span>Impostos:</span>
											<span>R$ {parsedReceipt.tax.toFixed(2)}</span>
										</div>
									)}
									<div className="flex justify-between font-bold text-lg border-t pt-2">
										<span>Total:</span>
										<span>R$ {parsedReceipt.total.toFixed(2)}</span>
									</div>
									{parsedReceipt.paymentMethod && (
										<div className="flex justify-between text-sm text-gray-600">
											<span>Forma de Pagamento:</span>
											<span>{parsedReceipt.paymentMethod}</span>
										</div>
									)}
								</div>
							</Card>

							{/* Raw text for debugging */}
							{rawText && (
								<details>
									<summary className="cursor-pointer text-sm text-gray-600">Ver texto original extraído</summary>
									<Textarea
										value={rawText}
										readOnly
										className="mt-2 text-xs h-32"
										placeholder="Texto extraído do OCR..."
									/>
								</details>
							)}

							{/* Action buttons */}
							<div className="flex gap-3 justify-end">
								<Button variant="outline" onClick={() => setShowOCR(true)}>
									<Receipt className="size-4 mr-2" />
									Escanear Novamente
								</Button>
								<Button onClick={handleSave}>
									<Save className="size-4 mr-2" />
									Salvar Compra
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
