"use client"

import { ReceitasClient } from "./receitas-client"

export default function ReceitasPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
				<p className="text-muted-foreground">
					Descubra e gerencie suas receitas favoritas
				</p>
			</div>

			<ReceitasClient />
		</div>
	)
}
