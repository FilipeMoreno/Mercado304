"use client"

import { Database, Trash2, TrendingUp, Zap } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAiCache } from "@/hooks/use-ai-cache"

export function CacheStats() {
	const { getCacheInfo, clearCache, cacheStats } = useAiCache()
	const [isVisible, setIsVisible] = useState(false)

	if (!isVisible) {
		return (
			<Button variant="ghost" size="sm" onClick={() => setIsVisible(true)} className="text-xs text-muted-foreground">
				<Database className="h-3 w-3 mr-1" />
				Cache
			</Button>
		)
	}

	const cacheInfo = getCacheInfo()

	return (
		<Card className="w-80">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm flex items-center gap-2">
						<Zap className="size-4 text-primary" />
						Cache Inteligente
					</CardTitle>
					<Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="size-6 p-0">
						×
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* Estatísticas principais */}
				<div className="grid grid-cols-2 gap-3">
					<div className="text-center">
						<div className="text-2xl font-bold text-primary">{cacheInfo.hitRate}</div>
						<div className="text-xs text-muted-foreground">Taxa de Acerto</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold">{cacheInfo.size}</div>
						<div className="text-xs text-muted-foreground">Respostas Salvas</div>
					</div>
				</div>

				{/* Métricas detalhadas */}
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Cache Hits:</span>
						<Badge variant="secondary" className="text-green-600">
							<TrendingUp className="h-3 w-3 mr-1" />
							{cacheStats.hits}
						</Badge>
					</div>

					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Cache Misses:</span>
						<Badge variant="outline">{cacheStats.misses}</Badge>
					</div>

					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Total Queries:</span>
						<Badge variant="outline">{cacheStats.totalQueries}</Badge>
					</div>
				</div>

				{/* Barra de progresso do cache */}
				<div className="space-y-1">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>Uso do Cache</span>
						<span>
							{cacheInfo.size}/{cacheInfo.maxSize}
						</span>
					</div>
					<div className="w-full bg-muted rounded-full h-2">
						<div
							className="bg-primary rounded-full h-2 transition-all duration-300"
							style={{ width: `${(cacheInfo.size / cacheInfo.maxSize) * 100}%` }}
						/>
					</div>
				</div>

				{/* Benefícios */}
				<div className="bg-muted/50 rounded-lg p-3 space-y-1">
					<div className="text-xs font-medium text-foreground">Benefícios:</div>
					<div className="text-xs text-muted-foreground">
						• Respostas instantâneas para consultas frequentes
						<br />• Redução no uso de API
						<br />• Melhor experiência do usuário
					</div>
				</div>

				{/* Ações */}
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={clearCache} className="flex-1 text-xs">
						<Trash2 className="h-3 w-3 mr-1" />
						Limpar Cache
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
