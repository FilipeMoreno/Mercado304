"use client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useEffect, useState } from "react"

export default function ReactQueryDevtoolsProvider() {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted || process.env.NODE_ENV !== "development") {
		return null
	}

	return <ReactQueryDevtools initialIsOpen={false} />
}

