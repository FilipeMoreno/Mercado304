"use client"

import { Suspense, lazy } from "react"
import { RecipeGenerationSkeleton } from "@/components/skeletons/recipe-generation-skeleton"

const GerarReceitasClient = lazy(() =>
	import("./gerar-receitas-client").then((module) => ({ default: module.GerarReceitasClient }))
)

export default function GerarReceitasPage() {
	return (
		<Suspense fallback={<RecipeGenerationSkeleton />}>
			<GerarReceitasClient />
		</Suspense>
	)
}
