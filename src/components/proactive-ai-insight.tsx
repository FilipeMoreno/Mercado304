"use client";

import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProactiveAiStore } from "@/store/useProactiveAiStore";

export function ProactiveAiInsight() {
	const { insight, hideInsight } = useProactiveAiStore();

	if (!insight) {
		return null;
	}

	const handleActionClick = () => {
		if (insight.onAction) {
			insight.onAction(insight.actionPayload);
		}
		hideInsight();
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -50, scale: 0.9 }} // y: -50 para vir de cima
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -50, scale: 0.9 }} // y: -50 e scale: 0.9 para ser o inverso
			transition={{ duration: 0.3, ease: "easeInOut" }}
			className="fixed top-4 right-4 z-50 w-full max-w-sm" // Posição alterada para o topo
		>
			<div className="rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-white/10">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
							<Sparkles className="h-6 w-6 text-white" />
						</div>
					</div>
					<div className="flex-1">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold text-gray-900 dark:text-white">
								Sugestão do Zé
							</h4>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={hideInsight}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
							{insight.message}
						</p>
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
	);
}