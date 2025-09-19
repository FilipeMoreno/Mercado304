"use client"

import { FixedSizeList, type ListChildComponentProps } from "react-window"
import { useMemo } from "react"

interface VirtualizedListProps<T> {
	items: T[]
	height: number
	itemHeight: number
	renderItem: (item: T, index: number) => React.ReactNode
	className?: string
}

export function VirtualizedList<T>({ 
	items, 
	height, 
	itemHeight, 
	renderItem, 
	className 
}: VirtualizedListProps<T>) {
	const Row = useMemo(() => {
		return ({ index, style }: ListChildComponentProps) => (
			<div style={style}>
				{renderItem(items[index], index)}
			</div>
		)
	}, [items, renderItem])

	if (items.length === 0) return null

	return (
		<FixedSizeList
			className={className}
			height={height}
			itemCount={items.length}
			itemSize={itemHeight}
			width="100%"
		>
			{Row}
		</FixedSizeList>
	)
}