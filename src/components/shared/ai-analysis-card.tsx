"use client"

import { Lightbulb, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface AiAnalysisCardProps {
	title: string
	description?: string
	icon?: React.ElementType
	children: React.ReactNode
	loading?: boolean
	className?: string
}

export function AiAnalysisCard({
	title,
	description,
	icon: Icon = Lightbulb,
	children,
	loading = false,
	className = "",
}: AiAnalysisCardProps) {
	return (
		<Card
			className={`relative overflow-hidden bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 ${className}`}
		>
			{/* Background decoration */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
			</div>
			<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/20 to-cyan-200/20 rounded-full blur-xl" />
			<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-violet-200/20 rounded-full blur-lg" />

			<CardContent className="relative p-6">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
						<Icon className="h-6 w-6 text-white" />
					</div>
					<div className="flex-1 space-y-2">
						<div className="flex items-center justify-between gap-2">
							<h3 className="font-bold text-lg bg-gradient-to-r from-violet-700 to-cyan-700 bg-clip-text text-transparent">
								{title}
							</h3>
							<Badge
								variant="secondary"
								className="bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200"
							>
								<Sparkles className="h-3 w-3 mr-1" />
								IA
							</Badge>
						</div>
						{description && <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>}
						{loading ? (
							<div className="space-y-2 animate-pulse">
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
							</div>
						) : (
							<div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
