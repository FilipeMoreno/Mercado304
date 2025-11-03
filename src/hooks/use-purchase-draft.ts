"use client"

import { useEffect, useRef, useState } from "react"

interface PurchaseDraft {
	formData: {
		marketId: string
		purchaseDate: string
		paymentMethod: string
		totalDiscount: number
	}
	items: any[]
	timestamp: number
}

const DRAFT_KEY_PREFIX = "purchase_draft_"
const DRAFT_EXPIRY_HOURS = 24

export function usePurchaseDraft(pageType: "new" | "edit", purchaseId?: string) {
	const [hasDraft, setHasDraft] = useState(false)
	const [draftData, setDraftData] = useState<PurchaseDraft | null>(null)
	const isRestoringRef = useRef(false)

	const draftKey = pageType === "new" ? `${DRAFT_KEY_PREFIX}new` : `${DRAFT_KEY_PREFIX}edit_${purchaseId}`

	// Check for existing draft on mount
	useEffect(() => {
		const checkDraft = () => {
			try {
				const stored = localStorage.getItem(draftKey)
				if (stored) {
					const draft: PurchaseDraft = JSON.parse(stored)
					const hoursSinceCreation = (Date.now() - draft.timestamp) / (1000 * 60 * 60)

					if (hoursSinceCreation < DRAFT_EXPIRY_HOURS) {
						setDraftData(draft)
						setHasDraft(true)
					} else {
						// Draft expired, remove it
						localStorage.removeItem(draftKey)
					}
				}
			} catch (error) {
				console.error("Error checking draft:", error)
			}
		}

		checkDraft()
	}, [draftKey])

	// Save draft immediately when there are changes
	const saveDraft = (formData: PurchaseDraft["formData"], items: any[]) => {
		// Don't save if we're currently restoring
		if (isRestoringRef.current) {
			return
		}

		try {
			// Only save if there's at least one item with a selected product
			const hasValidItem = items.some((item) => item.productId !== "" && item.productId !== null && item.productId !== undefined)

			if (hasValidItem) {
				const draft: PurchaseDraft = {
					formData,
					items,
					timestamp: Date.now(),
				}
				localStorage.setItem(draftKey, JSON.stringify(draft))
				console.log("💾 Rascunho salvo automaticamente")
			} else {
				// Remove draft if no valid items
				localStorage.removeItem(draftKey)
			}
		} catch (error) {
			console.error("Error saving draft:", error)
		}
	}

	// Restore draft
	const restoreDraft = () => {
		isRestoringRef.current = true
		setHasDraft(false)
		// Return the draft data for the caller to use
		return draftData
	}

	// Discard draft
	const discardDraft = () => {
		try {
			localStorage.removeItem(draftKey)
			setHasDraft(false)
			setDraftData(null)
		} catch (error) {
			console.error("Error discarding draft:", error)
		}
	}

	// Clear draft (used after successful save)
	const clearDraft = () => {
		try {
			localStorage.removeItem(draftKey)
			setHasDraft(false)
			setDraftData(null)
		} catch (error) {
			console.error("Error clearing draft:", error)
		}
	}


	return {
		hasDraft,
		draftData,
		saveDraft,
		restoreDraft,
		discardDraft,
		clearDraft,
	}
}
