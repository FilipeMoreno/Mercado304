"use client"

import { useState, useCallback, useEffect } from "react"
import {
	Grid3X3,
	List,
	Maximize2,
	Settings,
	Plus,
	Eye,
	EyeOff,
	RotateCcw,
	Save,
	X,
	Columns,
	Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { WIDGET_CONFIGS } from "@/config/widgets"
import type { ResponsiveWidgetLayouts, WidgetType } from "@/types/dashboard-widgets"
import { AppToasts } from "@/lib/toasts"

interface WidgetCustomizerProps {
	isEditing: boolean
	onEditingChange: (editing: boolean) => void
	layouts: ResponsiveWidgetLayouts
	enabledWidgets: WidgetType[]
	onToggleWidget: (widgetId: WidgetType) => void
	onAddWidget: (widgetId: WidgetType) => void
	onSave: () => Promise<void>
	onReset: () => Promise<void>
	gridColumns: number
	onGridColumnsChange: (cols: number) => void
	customTitle?: string
	customSubtitle?: string
	onCustomTitleChange: (title: string) => void
	onCustomSubtitleChange: (subtitle: string) => void
}

export function WidgetCustomizer({
	isEditing,
	onEditingChange,
	layouts,
	enabledWidgets,
	onToggleWidget,
	onAddWidget,
	onSave,
	onReset,
	gridColumns,
	onGridColumnsChange,
	customTitle,
	customSubtitle,
	onCustomTitleChange,
	onCustomSubtitleChange,
}: WidgetCustomizerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState<string>("all")

	const categories = [
		{ value: "all", label: "Todos" },
		{ value: "stats", label: "Estatísticas" },
		{ value: "charts", label: "Gráficos" },
		{ value: "lists", label: "Listas" },
		{ value: "alerts", label: "Alertas" },
		{ value: "analytics", label: "Análises" },
		{ value: "tools", label: "Ferramentas" },
	]

	const filteredWidgets = Object.values(WIDGET_CONFIGS).filter(
		(widget) => selectedCategory === "all" || widget.category === selectedCategory,
	)

	const handleSave = useCallback(async () => {
		setIsSaving(true)
		try {
			await onSave()
			AppToasts.success("Layout salvo com sucesso!")
			setIsOpen(false)
			onEditingChange(false)
		} catch (error) {
			AppToasts.error("Erro ao salvar layout")
		} finally {
			setIsSaving(false)
		}
	}, [onSave, onEditingChange])

	const handleReset = useCallback(async () => {
		try {
			await onReset()
			AppToasts.success("Layout restaurado para o padrão")
		} catch (error) {
			AppToasts.error("Erro ao restaurar layout")
		}
	}, [onReset])

	const toggleEditMode = useCallback(() => {
		onEditingChange(!isEditing)
		if (!isEditing) {
			AppToasts.info("Modo de edição ativado. Arraste e redimensione os widgets.")
		}
	}, [isEditing, onEditingChange])

	return (
		<>
			<div className="flex items-center gap-2">
				{/* Botão de modo de edição */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={isEditing ? "default" : "outline"}
								size="icon"
								onClick={toggleEditMode}
								className={isEditing ? "bg-orange-500 hover:bg-orange-600" : ""}
							>
								<Edit3 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{isEditing ? "Sair do modo de edição" : "Entrar no modo de edição"}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Botão de configurações */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline" size="icon" onClick={() => setIsOpen(true)}>
								<Settings className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Configurações do Dashboard</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Botão de salvar (visível apenas em modo de edição) */}
				{isEditing && (
					<Button onClick={handleSave} disabled={isSaving} className="gap-2">
						<Save className="h-4 w-4" />
						{isSaving ? "Salvando..." : "Salvar Layout"}
					</Button>
				)}
			</div>

			<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen} title="Personalizar Dashboard" maxWidth="2xl">
				<Tabs defaultValue="widgets" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="widgets">Widgets</TabsTrigger>
						<TabsTrigger value="layout">Layout</TabsTrigger>
						<TabsTrigger value="general">Geral</TabsTrigger>
					</TabsList>

					{/* Aba de Widgets */}
					<TabsContent value="widgets" className="space-y-4">
						<div>
							<h3 className="text-lg font-medium mb-2">Gerenciar Widgets</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Adicione ou remova widgets do seu dashboard. Widgets desativados não aparecerão no layout.
							</p>

							{/* Filtro por categoria */}
							<div className="mb-4">
								<Label>Filtrar por Categoria</Label>
								<Select value={selectedCategory} onValueChange={setSelectedCategory}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{categories.map((cat) => (
											<SelectItem key={cat.value} value={cat.value}>
												{cat.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Grid de widgets */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
								{filteredWidgets.map((widget) => {
									const isEnabled = enabledWidgets.includes(widget.id)
									return (
										<div
											key={widget.id}
											className={`border rounded-lg p-3 transition-all ${
												isEnabled ? "bg-primary/5 border-primary/50" : "bg-muted/30"
											}`}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<h4 className="font-medium text-sm">{widget.label}</h4>
														<Badge variant="outline" className="text-xs">
															{widget.category}
														</Badge>
													</div>
													<p className="text-xs text-muted-foreground">{widget.description}</p>
													<div className="text-xs text-muted-foreground mt-2">
														Tamanho: {widget.defaultSize.w}x{widget.defaultSize.h}
													</div>
												</div>
												<div className="flex flex-col gap-1">
													<Button
														variant={isEnabled ? "default" : "outline"}
														size="sm"
														onClick={() => onToggleWidget(widget.id)}
													>
														{isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
													</Button>
													{!isEnabled && (
														<Button variant="ghost" size="sm" onClick={() => onAddWidget(widget.id)}>
															<Plus className="h-3 w-3" />
														</Button>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</TabsContent>

					{/* Aba de Layout */}
					<TabsContent value="layout" className="space-y-4">
						<div>
							<h3 className="text-lg font-medium mb-2">Configurações de Layout</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Configure a estrutura do grid e o número de colunas.
							</p>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Número de Colunas no Grid</Label>
									<Select value={gridColumns.toString()} onValueChange={(val) => onGridColumnsChange(Number(val))}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[6, 8, 10, 12, 16, 24].map((num) => (
												<SelectItem key={num} value={num.toString()}>
													{num} colunas
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Mais colunas permitem posicionamento mais preciso dos widgets
									</p>
								</div>

								<Separator />

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<div>
											<Label>Informações do Layout Atual</Label>
											<p className="text-xs text-muted-foreground mt-1">
												{enabledWidgets.length} widgets ativos
											</p>
										</div>
										<Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
											<RotateCcw className="h-3 w-3" />
											Restaurar Padrão
										</Button>
									</div>
								</div>

								<div className="border rounded-lg p-4 bg-muted/30">
									<h4 className="text-sm font-medium mb-2">Layouts Responsivos</h4>
									<div className="space-y-1 text-xs text-muted-foreground">
										<div>Desktop (lg): {layouts.lg.length} widgets</div>
										<div>Desktop Médio (md): {layouts.md.length} widgets</div>
										<div>Tablet (sm): {layouts.sm.length} widgets</div>
										<div>Mobile (xs): {layouts.xs.length} widgets</div>
										<div>Mobile Pequeno (xxs): {layouts.xxs.length} widgets</div>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Aba Geral */}
					<TabsContent value="general" className="space-y-4">
						<div>
							<h3 className="text-lg font-medium mb-2">Configurações Gerais</h3>
							<p className="text-sm text-muted-foreground mb-4">Personalize títulos e outras configurações.</p>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="customTitle">Título Personalizado</Label>
									<Input
										id="customTitle"
										placeholder="Bem-vindo ao Mercado304"
										value={customTitle || ""}
										onChange={(e) => onCustomTitleChange(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="customSubtitle">Subtítulo Personalizado</Label>
									<Input
										id="customSubtitle"
										placeholder="Sistema completo de gerenciamento de compras de mercado"
										value={customSubtitle || ""}
										onChange={(e) => onCustomSubtitleChange(e.target.value)}
									/>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				{/* Botões de ação */}
				<div className="flex items-center justify-between mt-6 pt-4 border-t">
					<Button variant="outline" onClick={handleReset} className="gap-2">
						<RotateCcw className="h-4 w-4" />
						Restaurar Tudo
					</Button>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							<X className="h-4 w-4 mr-2" />
							Fechar
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							<Save className="h-4 w-4 mr-2" />
							{isSaving ? "Salvando..." : "Salvar Alterações"}
						</Button>
					</div>
				</div>
			</ResponsiveDialog>
		</>
	)
}
