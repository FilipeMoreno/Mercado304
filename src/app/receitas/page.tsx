"use client"

import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"
import { ReceitasClient } from "./receitas-client"

export default function ReceitasPage() {
	return (
		<div className="space-y-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
			>
				<div className="flex items-center gap-4">
					<ChefHat className="size-8 text-orange-600" />
					<div>
						<motion.h1
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className="text-2xl sm:text-3xl font-bold"
						>
							Receitas
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="text-gray-600 mt-2 text-sm sm:text-base"
						>
							Descubra e gerencie suas receitas favoritas
						</motion.p>
					</div>
				</div>
			</motion.div>

			<ReceitasClient />
		</div>
	)
}
