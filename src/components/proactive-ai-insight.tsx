"use client"

import { motion } from "framer-motion"
import { Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProactiveAiStore } from "@/store/useProactiveAiStore"

export function ProactiveAiInsight() {
	const { insight, hideInsight } = useProactiveAiStore()

	if (!insight) {
		return null
	}

	const handleActionClick = () => {
		if (insight.onAction) {
			insight.onAction(insight.actionPayload)
		}
		hideInsight()
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -50, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -50, scale: 0.9 }}
			transition={{ duration: 0.3, ease: "easeInOut" }}
			className="fixed top-4 right-4 z-50 w-full max-w-sm"
		>
			<div className="rounded-sm bg-card border border-border p-4 shadow-md ring-3 ring-primary/10 dark:ring-primary/20">
				<div className="flex items-start gap-3">
					<div className="shrink-0">
						<div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xs">
							<Sparkles className="size-6 text-white" />
						</div>
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<h4 className="font-semibold text-foreground">Sugestão do Zé</h4>
							<Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={hideInsight}>
								<X className="size-4" />
							</Button>
						</div>
						<p className="mt-2 text-sm text-muted-foreground leading-relaxed">{insight.message}</p>
						{insight.onAction && insight.actionLabel && (
							<div className="mt-4 flex gap-2">
								<Button size="sm" onClick={handleActionClick}>
									{insight.actionLabel}
								</Button>
								<Button size="sm" variant="outline" onClick={hideInsight}>
									Ignorar
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	)
}
