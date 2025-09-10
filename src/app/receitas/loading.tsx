"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Cabeçalho da página */}
			<div className="flex justify-between items-center">
				<div>
					<Skeleton className="h-9 w-48 mb-2" />
					<Skeleton className="h-5 w-80" />
				</div>
				<Skeleton className="h-10 w-44" />
			</div>

			{/* Card principal */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-64 mt-2" />
				</CardHeader>
				<CardContent>
					{/* Grid para os cards de receitas */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className="h-6 w-3/4" />
									<Skeleton className="h-4 w-1/4 mt-1" />
								</CardHeader>
								<CardContent className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-full" />
									<div className="flex gap-2 pt-2">
										<Skeleton className="h-8 w-20" />
										<Skeleton className="h-8 w-8" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
