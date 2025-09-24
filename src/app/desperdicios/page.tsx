"use client"

import { motion } from "framer-motion"
import DesperdiciosClient from "./desperdicios-client"

export default function DesperdiciosPage() {
	return (
		<div className="space-y-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
			>
				<div>
					<motion.h1
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="text-2xl sm:text-3xl font-bold"
					>
						Controle de Desperdício
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
						className="text-gray-600 mt-2 text-sm sm:text-base"
					>
						Registre e acompanhe o desperdício de alimentos
					</motion.p>
				</div>
			</motion.div>

			<DesperdiciosClient />
		</div>
	)
}
