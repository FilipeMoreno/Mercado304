"use client"

import { useEffect, useState } from "react"

interface UsePullToRefreshOptions {
	onRefresh: () => Promise<void> | void
	threshold?: number
	isEnabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 100, isEnabled = true }: UsePullToRefreshOptions) {
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [_startY, setStartY] = useState(0)
	const [currentY, setCurrentY] = useState(0)
	const [isPulling, setIsPulling] = useState(false)

	useEffect(() => {
		if (!isEnabled) return

		let startTouch = 0
		let currentTouch = 0

		const handleTouchStart = (e: TouchEvent) => {
			if (window.scrollY === 0 && e.touches[0]) {
				startTouch = e.touches[0].clientY
				setStartY(startTouch)
			}
		}

		const handleTouchMove = (e: TouchEvent) => {
			if (window.scrollY === 0 && startTouch > 0 && e.touches[0]) {
				currentTouch = e.touches[0].clientY
				const distance = currentTouch - startTouch

				if (distance > 0 && distance < threshold * 2) {
					setCurrentY(distance)
					setIsPulling(distance > 20)
				}
			}
		}

		const handleTouchEnd = async () => {
			if (isPulling && currentY > threshold && !isRefreshing) {
				setIsRefreshing(true)
				try {
					await onRefresh()
				} finally {
					setIsRefreshing(false)
				}
			}

			setStartY(0)
			setCurrentY(0)
			setIsPulling(false)
			startTouch = 0
			currentTouch = 0
		}

		document.addEventListener("touchstart", handleTouchStart, {
			passive: true,
		})
		document.addEventListener("touchmove", handleTouchMove, { passive: true })
		document.addEventListener("touchend", handleTouchEnd, { passive: true })

		return () => {
			document.removeEventListener("touchstart", handleTouchStart)
			document.removeEventListener("touchmove", handleTouchMove)
			document.removeEventListener("touchend", handleTouchEnd)
		}
	}, [onRefresh, threshold, isEnabled, isPulling, currentY, isRefreshing])

	return {
		isRefreshing,
		isPulling,
		pullDistance: currentY,
		refreshProgress: Math.min(currentY / threshold, 1),
	}
}
