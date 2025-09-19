"use client"

import { Suspense, lazy } from "react"
import { RecipesSkeleton } from "@/components/skeletons/recipes-skeleton"

const ReceitasClient = lazy(() =>
	import("./receitas-client").then((module) => ({ default: module.ReceitasClient }))
)

export default function ReceitasPage() {
	return (
		<Suspense fallback={<RecipesSkeleton />}>
			<ReceitasClient />
		</Suspense>
	)
}
