"use client"

import { AlertTriangle, ArrowLeft, CheckCircle, Info, Shield } from "lucide-react"
import Link from "next/link"
import {
	AlmondIcon,
	BarleyIcon,
	BrazilNutIcon,
	CashewIcon,
	CrustaceanIcon,
	EggIcon,
	FishIcon,
	GlutenIcon,
	HazelnutIcon,
	LatexIcon,
	MacadamiaIcon,
	MilkIcon,
	OatIcon,
	PeanutIcon,
	PecanIcon,
	PistachioIcon,
	RyeIcon,
	SoyIcon,
	TriticaleIcon,
	WalnutsIcon,
	WheatIcon,
} from "@/components/AllergenIcons"
import { ALLERGEN_CATEGORIES } from "@/components/allergen-icons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AllergenicosPage() {
	const allergensByCategory = {
		dairy: [{ name: "Leite", icon: MilkIcon, desc: "Leite de vaca e derivados (queijo, iogurte, manteiga)" }],
		eggs: [{ name: "Ovos", icon: EggIcon, desc: "Ovos de galinha e produtos que os contenham" }],
		fish: [{ name: "Peixe", icon: FishIcon, desc: "Peixes de água doce e salgada" }],
		shellfish: [{ name: "Crustáceos", icon: CrustaceanIcon, desc: "Camarão, caranguejo, lagosta, lagostim" }],
		peanuts: [{ name: "Amendoim", icon: PeanutIcon, desc: "Amendoim e produtos derivados (pasta, óleo)" }],
		soy: [
			{ name: "Soja", icon: SoyIcon, desc: "Grão de soja e derivados (leite de soja, tofu, proteína texturizada)" },
		],
		grains: [
			{ name: "Trigo", icon: WheatIcon, desc: "Cereal com glúten, principal ingrediente de pães e massas" },
			{ name: "Centeio", icon: RyeIcon, desc: "Cereal com glúten, usado em pães escuros" },
			{ name: "Cevada", icon: BarleyIcon, desc: "Cereal com glúten, usado em cervejas e maltes" },
			{ name: "Aveia", icon: OatIcon, desc: "Pode conter glúten por contaminação cruzada" },
			{ name: "Glúten", icon: GlutenIcon, desc: "Proteína encontrada em trigo, centeio e cevada" },
			{ name: "Triticale", icon: TriticaleIcon, desc: "Híbrido de trigo e centeio" },
		],
		nuts: [
			{ name: "Amêndoa", icon: AlmondIcon, desc: "Fruto seco oleaginoso" },
			{ name: "Avelã", icon: HazelnutIcon, desc: "Fruto seco usado em chocolates" },
			{ name: "Castanha-de-caju", icon: CashewIcon, desc: "Fruto seco popular no Brasil" },
			{ name: "Castanha-do-Pará", icon: BrazilNutIcon, desc: "Rica em selênio, nativa da Amazônia" },
			{ name: "Macadâmia", icon: MacadamiaIcon, desc: "Fruto seco de origem australiana" },
			{ name: "Nozes", icon: WalnutsIcon, desc: "Fruto seco rico em ômega-3" },
			{ name: "Pecã", icon: PecanIcon, desc: "Fruto seco usado em tortas" },
			{ name: "Pistache", icon: PistachioIcon, desc: "Fruto seco de cor verde" },
		],
		latex: [{ name: "Látex", icon: LatexIcon, desc: "Látex natural (relacionado a frutas tropicais)" }],
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			<div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
				{/* Header */}
				<div className="space-y-4">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="size-4" />
						Voltar
					</Link>

					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
								<AlertTriangle className="size-6 text-white" />
							</div>
							<div>
								<h1 className="text-4xl font-bold tracking-tight">Guia de Alergênicos</h1>
								<p className="text-lg text-muted-foreground">Informações completas sobre alergênicos alimentares</p>
							</div>
						</div>
					</div>
				</div>

				{/* Info Cards */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card className="border-2 border-blue-200 dark:border-blue-800">
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
									<Info className="size-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="font-semibold">O que são alergênicos?</p>
									<p className="text-sm text-muted-foreground">Substâncias que podem causar reações alérgicas</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-2 border-green-200 dark:border-green-800">
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
									<Shield className="size-5 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<p className="font-semibold">Por que informar?</p>
									<p className="text-sm text-muted-foreground">Exigência legal para proteção do consumidor</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-2 border-purple-200 dark:border-purple-800">
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
									<CheckCircle className="size-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<p className="font-semibold">Como identificar?</p>
									<p className="text-sm text-muted-foreground">Consulte os ícones nos produtos</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content */}
				<Tabs defaultValue="icons" className="w-full">
					<TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
						<TabsTrigger value="icons">Ícones por Categoria</TabsTrigger>
						<TabsTrigger value="colors">Esquema de Cores</TabsTrigger>
						<TabsTrigger value="info">Informações Gerais</TabsTrigger>
					</TabsList>

					{/* Ícones por Categoria */}
					<TabsContent value="icons" className="space-y-6 mt-6">
						{Object.entries(allergensByCategory).map(([categoryKey, allergens]) => {
							const category = ALLERGEN_CATEGORIES[categoryKey as keyof typeof ALLERGEN_CATEGORIES]
							return (
								<Card key={categoryKey} className="border-2 overflow-hidden">
									<CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
										<div className="flex items-center gap-3">
											<span className="text-3xl">{category.emoji}</span>
											<div>
												<CardTitle>{category.name}</CardTitle>
												<CardDescription>{allergens.length} alergênico(s) nesta categoria</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-6">
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{allergens.map((allergen) => (
												<div
													key={allergen.name}
													className="flex items-start gap-3 p-4 rounded-lg border-2 bg-card hover:bg-muted/50 transition-colors"
												>
													<div className="flex size-12 items-center justify-center rounded-xl bg-muted shrink-0">
														<allergen.icon size={24} variant="outline" className="text-foreground" />
													</div>
													<div className="space-y-1 min-w-0">
														<p className="font-semibold text-sm">{allergen.name}</p>
														<p className="text-xs text-muted-foreground leading-relaxed">{allergen.desc}</p>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)
						})}
					</TabsContent>

					{/* Esquema de Cores */}
					<TabsContent value="colors" className="space-y-6 mt-6">
						<Card className="border-2">
							<CardHeader>
								<CardTitle>Sistema de Cores por Categoria</CardTitle>
								<CardDescription>Cada categoria tem uma cor específica para fácil identificação visual</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									{Object.entries(ALLERGEN_CATEGORIES).map(([key, category]) => {
										const colorClasses = {
											blue: "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
											purple:
												"bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300",
											cyan: "bg-cyan-100 dark:bg-cyan-900/50 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300",
											orange:
												"bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300",
											amber:
												"bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300",
											green:
												"bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300",
											yellow:
												"bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300",
											brown:
												"bg-stone-100 dark:bg-stone-900/50 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300",
											gray: "bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300",
										}
										const colorClass = colorClasses[category.color as keyof typeof colorClasses]

										return (
											<div key={key} className={`p-4 rounded-lg border-2 ${colorClass}`}>
												<div className="flex items-center gap-3">
													<span className="text-2xl">{category.emoji}</span>
													<div>
														<p className="font-bold">{category.name}</p>
														<p className="text-sm opacity-80">Cor: {category.color}</p>
													</div>
												</div>
											</div>
										)
									})}
								</div>

								<Separator />

								<div className="space-y-3">
									<h3 className="font-semibold text-lg">Legenda de Avisos</h3>
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="flex items-center gap-3 p-3 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50">
											<Badge variant="destructive" className="shrink-0">
												⚠️ Contém
											</Badge>
											<p className="text-sm text-red-700 dark:text-red-300">Produto CONTÉM o alergênico</p>
										</div>
										<div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/50">
											<Badge variant="secondary" className="shrink-0">
												⚡ Pode conter
											</Badge>
											<p className="text-sm text-yellow-700 dark:text-yellow-300">
												PODE CONTER por contaminação cruzada
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Informações Gerais */}
					<TabsContent value="info" className="space-y-6 mt-6">
						<Card className="border-2">
							<CardHeader>
								<CardTitle>Legislação Brasileira</CardTitle>
								<CardDescription>RDC nº 26/2015 da ANVISA</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm leading-relaxed">
									A <strong>Resolução RDC nº 26 de 2 de julho de 2015</strong> da ANVISA estabelece os requisitos para
									rotulagem obrigatória dos principais alimentos que causam alergias alimentares.
								</p>
								<div className="p-4 rounded-lg bg-muted space-y-2">
									<p className="font-semibold text-sm">Principais pontos:</p>
									<ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
										<li>Declaração obrigatória na lista de ingredientes</li>
										<li>Uso de caracteres destacados (negrito, cor ou tamanho)</li>
										<li>Informação sobre possível contaminação cruzada</li>
										<li>Aplicação a alimentos embalados e produtos a granel</li>
									</ul>
								</div>
							</CardContent>
						</Card>

						<Card className="border-2">
							<CardHeader>
								<CardTitle>O que é Alergia Alimentar?</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm leading-relaxed">
									Alergia alimentar é uma <strong>reação adversa</strong> que ocorre por um mecanismo imunológico, após
									a ingestão de determinado alimento. Pode variar desde manifestações leves até reações graves,
									potencialmente fatais (anafilaxia).
								</p>
								<Separator />
								<div>
									<h3 className="font-semibold mb-2">Sintomas Comuns</h3>
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="p-3 rounded-lg bg-muted text-sm space-y-1">
											<p className="font-medium">🔴 Cutâneos</p>
											<p className="text-muted-foreground text-xs">Urticária, coceira, inchaço</p>
										</div>
										<div className="p-3 rounded-lg bg-muted text-sm space-y-1">
											<p className="font-medium">🔴 Respiratórios</p>
											<p className="text-muted-foreground text-xs">Tosse, chiado, falta de ar</p>
										</div>
										<div className="p-3 rounded-lg bg-muted text-sm space-y-1">
											<p className="font-medium">🔴 Gastrointestinais</p>
											<p className="text-muted-foreground text-xs">Náusea, vômito, diarreia</p>
										</div>
										<div className="p-3 rounded-lg bg-muted text-sm space-y-1">
											<p className="font-medium">🔴 Cardiovasculares</p>
											<p className="text-muted-foreground text-xs">Tontura, queda de pressão</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-amber-200 dark:border-amber-800">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
									<AlertTriangle className="size-5" />
									Contaminação Cruzada
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm leading-relaxed">
									Ocorre quando um alimento entra em contato com outro alimento ou superfície que contém alergênicos,
									mesmo em quantidades mínimas. Isso pode acontecer durante:
								</p>
								<ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
									<li>Produção na mesma linha de fabricação</li>
									<li>Compartilhamento de equipamentos</li>
									<li>Transporte e armazenamento</li>
									<li>Manipulação inadequada</li>
								</ul>
								<div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
									<p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
										<strong>Importante:</strong> Mesmo produtos que não contenham intencionalmente um alergênico podem
										apresentar a frase "Pode conter" se houver risco de contaminação cruzada.
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-blue-200 dark:border-blue-800">
							<CardHeader>
								<CardTitle className="text-blue-600 dark:text-blue-400">Dicas Importantes</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{[
										{
											id: "tip1",
											text: "Sempre leia os rótulos dos produtos, mesmo de alimentos que você costuma consumir",
										},
										{ id: "tip2", text: "Fique atento às frases 'Contém' e 'Pode conter'" },
										{ id: "tip3", text: "Em restaurantes, sempre informe sobre suas alergias alimentares" },
										{ id: "tip4", text: "Ensine crianças com alergias a não aceitar alimentos de estranhos" },
										{ id: "tip5", text: "Porte sempre a medicação prescrita pelo médico (se aplicável)" },
										{ id: "tip6", text: "Consulte regularmente um alergologista para acompanhamento" },
									].map((tip) => (
										<div key={tip.id} className="flex items-start gap-3">
											<CheckCircle className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
											<p className="text-sm leading-relaxed">{tip.text}</p>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Footer */}
				<Card className="border-2 bg-gradient-to-r from-muted/50 to-background">
					<CardContent className="pt-6">
						<div className="text-center space-y-2">
							<p className="text-sm text-muted-foreground">
								Este guia é fornecido apenas para fins informativos e não substitui orientação médica profissional.
							</p>
							<p className="text-xs text-muted-foreground">
								Em caso de dúvidas ou reações alérgicas, consulte um médico alergologista.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
