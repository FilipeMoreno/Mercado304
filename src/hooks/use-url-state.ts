import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface UrlStateConfig {
	basePath: string;
	initialValues: Record<string, any>;
}

export function useUrlState({ basePath, initialValues }: UrlStateConfig) {
	const router = useRouter();
	const urlSearchParams = useSearchParams();

	const [state, setState] = useState(() => {
		const initial: Record<string, any> = {};
		Object.entries(initialValues).forEach(([key, defaultValue]) => {
			const urlValue = urlSearchParams.get(key);
			initial[key] = urlValue || defaultValue;
		});
		return initial;
	});

	const updateState = (updates: Record<string, any>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	const updateSingleValue = (key: string, value: any) => {
		setState((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setState(initialValues);
	};

	useEffect(() => {
		const params = new URLSearchParams();

		Object.entries(state).forEach(([key, value]) => {
			const defaultValue = initialValues[key];
			if (value && value !== defaultValue && value !== "" && value !== "all") {
				params.set(key, String(value));
			}
		});

		const newUrl = params.toString()
			? `${basePath}?${params.toString()}`
			: basePath;
		router.push(newUrl, { scroll: false });
	}, [state, basePath, router, initialValues]);

	const hasActiveFilters = Object.entries(state).some(([key, value]) => {
		const defaultValue = initialValues[key];
		return value !== defaultValue && value !== "" && value !== "all";
	});

	return {
		state,
		updateState,
		updateSingleValue,
		clearFilters,
		hasActiveFilters,
	};
}
