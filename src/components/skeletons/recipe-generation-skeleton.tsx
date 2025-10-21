import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RecipeGenerationSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<Skeleton className="h-10 w-48" />
			</div>

			{/* Search Form */}
			<Card>
				<CardContent className="pt-6">
					<div className="space-y-4">
						{/* Surprise Me Button */}
						<div className="flex justify-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
							<Skeleton className="h-12 w-80" />
						</div>

						{/* Search Input */}
						<Skeleton className="h-10 w-full" />

						{/* Ingredients Input */}
						<Skeleton className="h-10 w-full" />

						{/* Action Buttons */}
						<div className="flex gap-2">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="size-5 rounded-sm" />
						<Skeleton className="h-6 w-48" />
					</div>
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					{/* Loading State */}
					<div className="text-center py-12">
						<div className="flex justify-center mb-4">
							<div className="relative">
								<Skeleton className="size-16 rounded-full" />
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="animate-spin rounded-full size-8 border-b-2 border-yellow-500"></div>
								</div>
							</div>
						</div>
						<Skeleton className="h-5 w-48 mx-auto mb-2" />
						<Skeleton className="h-4 w-64 mx-auto" />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export function RecipeCardsSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-6">
			{/* Loading indicator */}
			<div className="text-center py-8">
				<div className="flex justify-center mb-4">
					<div className="relative">
						<div className="size-16 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 flex items-center justify-center">
							<div className="animate-spin rounded-full size-8 border-b-2 border-yellow-500"></div>
						</div>
					</div>
				</div>
				<div className="space-y-2">
					<p className="text-lg font-medium text-gray-700 animate-pulse">🧠 IA está criando receitas incríveis...</p>
					<p className="text-sm text-gray-500 animate-pulse">Analisando ingredientes e combinações especiais</p>
					<div className="flex justify-center gap-1 mt-3">
						<div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
						<div
							className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
							style={{ animationDelay: "150ms" }}
						></div>
						<div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
					</div>
				</div>
			</div>

			{/* Recipe cards skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: count }).map((_, i) => (
					<Card key={i} className="hover:shadow-md transition-shadow-sm opacity-50">
						<CardHeader>
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-20" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-10 w-full mb-3" />

							{/* Ingredientes */}
							<div className="mb-3">
								<Skeleton className="h-3 w-20 mb-1" />
								<div className="flex flex-wrap gap-1">
									<Skeleton className="h-6 w-16 rounded-sm" />
									<Skeleton className="h-6 w-20 rounded-sm" />
									<Skeleton className="h-6 w-14 rounded-sm" />
									<Skeleton className="h-6 w-12 rounded-sm" />
								</div>
							</div>

							<div className="flex gap-2">
								<Skeleton className="h-8 flex-1" />
								<Skeleton className="h-8 w-20" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
