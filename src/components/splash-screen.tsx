"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Package, ShoppingCart, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { APP_VERSION } from "@/lib/version"

interface SplashScreenProps {
	onComplete: () => void
	duration?: number
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(false)
			setTimeout(onComplete, 400) // Aguarda animação de saída
		}, duration)

		return () => clearTimeout(timer)
	}, [onComplete, duration])

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 1 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
					style={{
						// Força o background para cobrir a splash nativa do PWA
						backgroundColor: "var(--background)",
					}}
				>
					{/* Subtle Grid Pattern */}
					<div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

					{/* Radial Gradient Overlay */}
					<div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent" />

					{/* Main Content */}
					<div className="relative flex flex-col items-center space-y-8 px-4">
						{/* Logo Container with animated background */}
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{
								duration: 0.6,
								ease: [0.34, 1.56, 0.64, 1],
								delay: 0.1,
							}}
							className="relative"
						>
							{/* Animated rings */}
							<motion.div
								animate={{
									scale: [1, 1.15, 1],
									opacity: [0.3, 0.15, 0.3],
								}}
								transition={{
									duration: 3,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
								className="absolute inset-0 rounded-3xl bg-blue-600 blur-2xl"
							/>

							{/* Logo Background Card */}
							<div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 shadow-2xl shadow-blue-600/20">
								<ShoppingCart className="size-12 text-white" strokeWidth={2.5} />
								<div className="h-10 w-0.5 bg-white/20" />
								<Package className="size-10 text-white" strokeWidth={2.5} />

								{/* Floating Sparkles */}
								<motion.div
									animate={{
										y: [-3, 3, -3],
										rotate: [0, 10, 0],
									}}
									transition={{
										duration: 2,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
									}}
									className="absolute -right-2 -top-2"
								>
									<Sparkles className="size-5 text-yellow-400 drop-shadow-lg" fill="currentColor" />
								</motion.div>

								<motion.div
									animate={{
										y: [3, -3, 3],
										rotate: [0, -10, 0],
									}}
									transition={{
										duration: 2.5,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
										delay: 0.5,
									}}
									className="absolute -bottom-1 -left-2"
								>
									<Sparkles className="size-4 text-blue-300 drop-shadow-lg" fill="currentColor" />
								</motion.div>
							</div>
						</motion.div>

						{/* App Name and Description */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.6,
								delay: 0.4,
								ease: "easeOut",
							}}
							className="space-y-2 text-center"
						>
							<h1 className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
								Mercado304
							</h1>
							<p className="text-sm font-medium text-muted-foreground md:text-base">Gestão Inteligente de Compras</p>
						</motion.div>

						{/* Loading Dots */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								duration: 0.4,
								delay: 0.8,
							}}
							className="flex gap-2"
						>
							{[0, 1, 2].map((index) => (
								<motion.div
									key={index}
									animate={{
										scale: [1, 1.3, 1],
										opacity: [0.4, 1, 0.4],
									}}
									transition={{
										duration: 1.2,
										repeat: Number.POSITIVE_INFINITY,
										delay: index * 0.15,
										ease: "easeInOut",
									}}
									className="h-2 w-2 rounded-full bg-blue-600"
								/>
							))}
						</motion.div>

						{/* Version Badge */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								duration: 0.4,
								delay: 1.2,
							}}
							className="absolute bottom-8"
						>
							<div className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xs">
								Versão {APP_VERSION}
							</div>
						</motion.div>
					</div>

					{/* Subtle floating elements */}
					<motion.div
						animate={{
							y: [-8, 8, -8],
							x: [-4, 4, -4],
							opacity: [0.3, 0.5, 0.3],
						}}
						transition={{
							duration: 6,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
						className="absolute left-[10%] top-[15%] size-16 rounded-full bg-blue-500/10 blur-xl"
					/>

					<motion.div
						animate={{
							y: [8, -8, 8],
							x: [4, -4, 4],
							opacity: [0.2, 0.4, 0.2],
						}}
						transition={{
							duration: 7,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
							delay: 1,
						}}
						className="absolute bottom-[20%] right-[15%] h-20 w-20 rounded-full bg-blue-600/10 blur-xl"
					/>

					<motion.div
						animate={{
							y: [-6, 6, -6],
							x: [6, -6, 6],
							opacity: [0.25, 0.45, 0.25],
						}}
						transition={{
							duration: 5,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
							delay: 0.5,
						}}
						className="absolute right-[10%] top-[30%] size-12 rounded-full bg-blue-400/10 blur-xl"
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
