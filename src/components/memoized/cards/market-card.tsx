"use client"

import { Store } from "lucide-react"
import Image from "next/image"
import { memo, useCallback, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardActions } from "../shared/card-actions"
import { CardFooter } from "../shared/card-footer"

interface MarketCardMemoProps {
	market: any
	onDelete: (market: any) => void
	onEdit?: (market: any) => void
}

export const MarketCardMemo = memo<MarketCardMemoProps>(
	({ market, onDelete, onEdit }) => {
		const [imageError, setImageError] = useState(false)

		const handleDelete = useCallback(() => {
			onDelete(market)
		}, [market, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(market)
		}, [market, onEdit])

		const handleCardClick = useCallback(() => {
			window.location.href = `/mercados/${market.id}`
		}, [market.id])

		const marketName = useMemo(() => {
			return market.name || "Mercado sem nome"
		}, [market.name])

		const marketLocation = useMemo(() => {
			return market.location || null
		}, [market.location])

		return (
			<Card
				className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-card"
				onClick={handleCardClick}
			>
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
					{market.imageUrl && !imageError ? (
						<>
							<Image
								src={market.imageUrl}
								alt={marketName}
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-110"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
								onError={() => setImageError(true)}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
						</>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
							<Store className="h-16 w-16 text-primary/20" />
						</div>
					)}

					<CardActions onEdit={onEdit ? handleEdit : undefined} onDelete={handleDelete} entityName="Mercado" />
				</div>

				<CardContent className="flex-1 flex flex-col p-4">
					<h3 className="font-semibold text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors">
						{marketName}
					</h3>

					{marketLocation && (
						<div className="inline-flex items-center gap-1.5 py-1.5 rounded-full text-xs font-medium">
							<span className="line-clamp-1">{marketLocation}</span>
						</div>
					)}

					{!marketLocation && <p className="text-sm text-muted-foreground">Clique para ver detalhes</p>}

					<CardFooter />
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.market.id === nextProps.market.id &&
			prevProps.market.name === nextProps.market.name &&
			prevProps.market.location === nextProps.market.location &&
			prevProps.market.imageUrl === nextProps.market.imageUrl &&
			prevProps.market.updatedAt === nextProps.market.updatedAt
		)
	},
)

MarketCardMemo.displayName = "MarketCardMemo"
