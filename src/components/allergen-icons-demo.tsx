"use client"

/**
 * Componente de demonstração dos ícones de alergênicos
 * Este arquivo serve como exemplo e pode ser usado para testes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	AllergenIcon,
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
} from "./AllergenIcons"

const allergens = [
	{ name: "Amêndoa", icon: AlmondIcon, key: "amendoa" },
	{ name: "Amendoim", icon: PeanutIcon, key: "amendoim" },
	{ name: "Aveia", icon: OatIcon, key: "aveia" },
	{ name: "Avelã", icon: HazelnutIcon, key: "avela" },
	{ name: "Castanha-de-caju", icon: CashewIcon, key: "castanha-de-caju" },
	{ name: "Castanha-do-Pará", icon: BrazilNutIcon, key: "castanha-do-para" },
	{ name: "Centeio", icon: RyeIcon, key: "centeio" },
	{ name: "Cevada", icon: BarleyIcon, key: "cevada" },
	{ name: "Crustáceos", icon: CrustaceanIcon, key: "crustaceos" },
	{ name: "Glúten", icon: GlutenIcon, key: "gluten" },
	{ name: "Látex", icon: LatexIcon, key: "latex" },
	{ name: "Leite", icon: MilkIcon, key: "leite" },
	{ name: "Macadâmia", icon: MacadamiaIcon, key: "macadamia" },
	{ name: "Nozes", icon: WalnutsIcon, key: "nozes" },
	{ name: "Ovos", icon: EggIcon, key: "ovos" },
	{ name: "Pecã", icon: PecanIcon, key: "peca" },
	{ name: "Peixe", icon: FishIcon, key: "peixe" },
	{ name: "Pistache", icon: PistachioIcon, key: "pistache" },
	{ name: "Soja", icon: SoyIcon, key: "soja" },
	{ name: "Trigo", icon: WheatIcon, key: "trigo" },
	{ name: "Triticale", icon: TriticaleIcon, key: "triticale" },
]

export function AllergenIconsDemo() {
	return (
		<div className="container mx-auto p-6 space-y-8">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Biblioteca de Ícones de Alergênicos</h1>
				<p className="text-muted-foreground">Demonstração dos ícones SVG customizados para alergênicos alimentares</p>
			</div>

			<Tabs defaultValue="grid" className="w-full">
				<TabsList className="grid w-full grid-cols-3 max-w-md">
					<TabsTrigger value="grid">Grade</TabsTrigger>
					<TabsTrigger value="variants">Variantes</TabsTrigger>
					<TabsTrigger value="sizes">Tamanhos</TabsTrigger>
				</TabsList>

				<TabsContent value="grid" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Todos os Ícones</CardTitle>
							<CardDescription>21 ícones únicos de alergênicos em estilo outline</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
								{allergens.map(({ name, icon: Icon, key }) => (
									<div key={key} className="flex flex-col items-center gap-2 group">
										<div className="flex size-16 items-center justify-center rounded-xl bg-muted/50 transition-all group-hover:bg-muted group-hover:scale-110">
											<Icon size={32} variant="outline" className="text-foreground" />
										</div>
										<span className="text-xs text-center font-medium">{name}</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="variants" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Outline (Padrão)</CardTitle>
								<CardDescription>Ícones com contorno</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-4">
									<MilkIcon size={40} variant="outline" className="text-blue-600" />
									<EggIcon size={40} variant="outline" className="text-amber-600" />
									<FishIcon size={40} variant="outline" className="text-cyan-600" />
									<WheatIcon size={40} variant="outline" className="text-yellow-600" />
									<PeanutIcon size={40} variant="outline" className="text-amber-700" />
									<SoyIcon size={40} variant="outline" className="text-green-600" />
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Filled</CardTitle>
								<CardDescription>Ícones preenchidos</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-4">
									<MilkIcon size={40} variant="filled" className="text-blue-600" />
									<EggIcon size={40} variant="filled" className="text-amber-600" />
									<FishIcon size={40} variant="filled" className="text-cyan-600" />
									<WheatIcon size={40} variant="filled" className="text-yellow-600" />
									<PeanutIcon size={40} variant="filled" className="text-amber-700" />
									<SoyIcon size={40} variant="filled" className="text-green-600" />
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="sizes" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Tamanhos Disponíveis</CardTitle>
							<CardDescription>Os ícones são escaláveis e mantêm a qualidade em qualquer tamanho</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium w-20">16px</span>
									<MilkIcon size={16} variant="outline" />
									<EggIcon size={16} variant="outline" />
									<FishIcon size={16} variant="outline" />
									<WheatIcon size={16} variant="outline" />
								</div>
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium w-20">20px</span>
									<MilkIcon size={20} variant="outline" />
									<EggIcon size={20} variant="outline" />
									<FishIcon size={20} variant="outline" />
									<WheatIcon size={20} variant="outline" />
								</div>
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium w-20">24px</span>
									<MilkIcon size={24} variant="outline" />
									<EggIcon size={24} variant="outline" />
									<FishIcon size={24} variant="outline" />
									<WheatIcon size={24} variant="outline" />
								</div>
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium w-20">32px</span>
									<MilkIcon size={32} variant="outline" />
									<EggIcon size={32} variant="outline" />
									<FishIcon size={32} variant="outline" />
									<WheatIcon size={32} variant="outline" />
								</div>
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium w-20">48px</span>
									<MilkIcon size={48} variant="outline" />
									<EggIcon size={48} variant="outline" />
									<FishIcon size={48} variant="outline" />
									<WheatIcon size={48} variant="outline" />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Card>
				<CardHeader>
					<CardTitle>Uso Programático</CardTitle>
					<CardDescription>
						Use o componente <code className="text-xs bg-muted px-1 py-0.5 rounded-sm">AllergenIcon</code> para
						renderizar ícones dinamicamente
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex flex-wrap gap-4">
							{["leite", "ovos", "peixe", "trigo", "soja", "amendoim"].map((type) => (
								<div key={type} className="flex flex-col items-center gap-2">
									<AllergenIcon type={type} size={32} variant="outline" />
									<span className="text-xs">{type}</span>
								</div>
							))}
						</div>
						<pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
							<code>{`<AllergenIcon type="leite" size={32} variant="outline" />`}</code>
						</pre>
					</div>
				</CardContent>
			</Card>

			<Card className="border-amber-200 dark:border-amber-800">
				<CardHeader>
					<CardTitle className="text-amber-600 dark:text-amber-400">💡 Dica</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-sm">
						Para usar em produção, importe o componente{" "}
						<code className="bg-muted px-1 py-0.5 rounded-sm">AllergenIcons</code> que já vem com o layout completo e
						estilizado.
					</p>
					<pre className="bg-muted p-3 rounded-sm text-xs overflow-x-auto">
						<code>{`import { AllergenIcons } from "@/components/allergen-icons"\n\n<AllergenIcons nutritionalInfo={nutritionalInfo} />`}</code>
					</pre>
				</CardContent>
			</Card>
		</div>
	)
}
