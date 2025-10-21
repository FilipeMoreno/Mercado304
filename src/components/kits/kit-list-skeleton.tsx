"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KitListSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i} className="w-full">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<Skeleton className="h-6 w-3/4 mb-2" />
								<Skeleton className="h-4 w-full" />
							</div>
							<Skeleton className="h-6 w-16" />
						</div>
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-32 mb-3" />
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
						<div className="mt-4 pt-4 border-t">
							<Skeleton className="h-10 w-full" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}

export function KitCardSkeleton() {
	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<Skeleton className="h-6 w-3/4 mb-2" />
						<Skeleton className="h-4 w-full" />
					</div>
					<Skeleton className="h-6 w-16" />
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="h-4 w-32 mb-3" />
				<div className="space-y-2">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
				<div className="mt-4 pt-4 border-t">
					<Skeleton className="h-10 w-full" />
				</div>
			</CardContent>
		</Card>
	)
}
