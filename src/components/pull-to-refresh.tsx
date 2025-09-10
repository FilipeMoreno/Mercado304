"use client";

import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
	onRefresh: () => Promise<void> | void;
	children: ReactNode;
	isEnabled?: boolean;
}

export function PullToRefresh({
	onRefresh,
	children,
	isEnabled = true,
}: PullToRefreshProps) {
	const { isRefreshing, isPulling, pullDistance, refreshProgress } =
		usePullToRefresh({
			onRefresh,
			isEnabled,
		});

	return (
		<div className="relative">
			{/* Pull Indicator */}
			<div
				className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 ${
					isPulling || isRefreshing
						? "transform translate-y-0 opacity-100"
						: "transform -translate-y-full opacity-0"
				}`}
				style={{
					height: Math.min(pullDistance, 80),
					background: "linear-gradient(to bottom, #f3f4f6, #ffffff)",
				}}
			>
				<div className="flex flex-col items-center gap-2">
					<RefreshCw
						className={`h-6 w-6 text-gray-600 transition-transform duration-200 ${
							isRefreshing ? "animate-spin" : ""
						}`}
						style={{
							transform: `rotate(${refreshProgress * 360}deg)`,
						}}
					/>
					<span className="text-xs text-gray-600 font-medium">
						{isRefreshing
							? "Atualizando..."
							: refreshProgress >= 1
								? "Solte para atualizar"
								: "Puxe para atualizar"}
					</span>
				</div>
			</div>

			{/* Content */}
			<div
				className="transition-transform duration-200"
				style={{
					transform:
						isPulling || isRefreshing
							? `translateY(${Math.min(pullDistance, 80)}px)`
							: "translateY(0)",
				}}
			>
				{children}
			</div>
		</div>
	);
}
