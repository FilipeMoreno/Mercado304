import { create } from "zustand";

interface Insight {
	id: string;
	message: string;
	actionLabel?: string;
	onAction?: (payload?: any) => void;
	actionPayload?: any;
	duration?: number;
}

interface ProactiveAiState {
	insight: Insight | null;
	showInsight: (insight: Omit<Insight, "id">) => void;
	hideInsight: () => void;
}

export const useProactiveAiStore = create<ProactiveAiState>((set, get) => ({
	insight: null,
	showInsight: (insightData) => {
		const newInsight: Insight = {
			id: new Date().toISOString(),
			...insightData,
		};
		set({ insight: newInsight });

		if (newInsight.duration) {
			setTimeout(() => {
				// Apenas esconde se o insight atual ainda estiver visível
				if (get().insight?.id === newInsight.id) {
					set({ insight: null });
				}
			}, newInsight.duration);
		}
	},
	hideInsight: () => set({ insight: null }),
}));
