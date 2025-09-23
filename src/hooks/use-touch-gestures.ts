"use client"

import { useCallback, useRef } from "react"

interface TouchGestureOptions {
	onSwipeLeft?: () => void
	onSwipeRight?: () => void
	onSwipeUp?: () => void
	onSwipeDown?: () => void
	onLongPress?: () => void
	onDoubleTap?: () => void
	onPinch?: (scale: number) => void
	swipeThreshold?: number
	longPressDelay?: number
	doubleTapDelay?: number
}

interface TouchData {
	startX: number
	startY: number
	startTime: number
	lastTap: number
	longPressTimer?: NodeJS.Timeout
	initialDistance?: number
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
	const {
		onSwipeLeft,
		onSwipeRight,
		onSwipeUp,
		onSwipeDown,
		onLongPress,
		onDoubleTap,
		onPinch,
		swipeThreshold = 50,
		longPressDelay = 500,
		doubleTapDelay = 300,
	} = options

	const touchData = useRef<TouchData>({
		startX: 0,
		startY: 0,
		startTime: 0,
		lastTap: 0,
	})

	const getDistance = useCallback((touches: React.TouchList) => {
		if (touches.length < 2) return 0
		const touch1 = touches[0]
		const touch2 = touches[1]
		return Math.sqrt((touch2.clientX - touch1.clientX) ** 2 + (touch2.clientY - touch1.clientY) ** 2)
	}, [])

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.touches[0]
			const now = Date.now()

			touchData.current = {
				...touchData.current,
				startX: touch.clientX,
				startY: touch.clientY,
				startTime: now,
			}

			// Multi-touch para pinch
			if (e.touches.length === 2) {
				touchData.current.initialDistance = getDistance(e.touches)
			}

			// Verificar double tap
			if (onDoubleTap && now - touchData.current.lastTap < doubleTapDelay) {
				onDoubleTap()
				touchData.current.lastTap = 0 // Reset para evitar triplo tap
				return
			}
			touchData.current.lastTap = now

			// Long press
			if (onLongPress) {
				touchData.current.longPressTimer = setTimeout(() => {
					onLongPress()
				}, longPressDelay)
			}
		},
		[onDoubleTap, onLongPress, doubleTapDelay, longPressDelay, getDistance],
	)

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			// Cancelar long press se o dedo se mover
			if (touchData.current.longPressTimer) {
				clearTimeout(touchData.current.longPressTimer)
				touchData.current.longPressTimer = undefined
			}

			// Pinch gesture
			if (onPinch && e.touches.length === 2 && touchData.current.initialDistance) {
				const currentDistance = getDistance(e.touches)
				const scale = currentDistance / touchData.current.initialDistance
				onPinch(scale)
			}
		},
		[onPinch, getDistance],
	)

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			// Limpar timer de long press
			if (touchData.current.longPressTimer) {
				clearTimeout(touchData.current.longPressTimer)
				touchData.current.longPressTimer = undefined
			}

			// Verificar se é um swipe (apenas para single touch)
			if (e.changedTouches.length === 1) {
				const touch = e.changedTouches[0]
				const deltaX = touch.clientX - touchData.current.startX
				const deltaY = touch.clientY - touchData.current.startY
				const deltaTime = Date.now() - touchData.current.startTime

				// Swipe deve ser rápido (menos de 500ms) e ter distância suficiente
				if (deltaTime < 500) {
					const absDeltaX = Math.abs(deltaX)
					const absDeltaY = Math.abs(deltaY)

					if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
						// Determinar direção predominante
						if (absDeltaX > absDeltaY) {
							// Swipe horizontal
							if (deltaX > 0 && onSwipeRight) {
								onSwipeRight()
							} else if (deltaX < 0 && onSwipeLeft) {
								onSwipeLeft()
							}
						} else {
							// Swipe vertical
							if (deltaY > 0 && onSwipeDown) {
								onSwipeDown()
							} else if (deltaY < 0 && onSwipeUp) {
								onSwipeUp()
							}
						}
					}
				}
			}

			// Reset pinch data
			touchData.current.initialDistance = undefined
		},
		[onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold],
	)

	return {
		onTouchStart: handleTouchStart,
		onTouchMove: handleTouchMove,
		onTouchEnd: handleTouchEnd,
	}
}
