"use client";
import { use } from "react";

import { motion } from "framer-motion"
import { EstoqueClient } from "./estoque-client"

interface EstoquePageProps {
	searchParams: Promise<{
		location?: string
		search?: string
	}>
}

export default function EstoquePage(props: EstoquePageProps) {
    const searchParams = use(props.searchParams);
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
						Controle de Estoque
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
						className="text-gray-600 mt-2 text-sm sm:text-base"
					>
						Gerencie seu estoque doméstico e validades
					</motion.p>
				</div>
			</motion.div>

			<EstoqueClient searchParams={searchParams} />
		</div>
	)
}
