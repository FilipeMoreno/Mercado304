import { create } from "zustand"
import { persist } from "zustand/middleware"

export type SelectStyle = "traditional" | "dialog"

interface UIState {
  selectStyle: SelectStyle
  setSelectStyle: (style: SelectStyle) => void
  reset: () => void
}

const DEFAULT_STATE: Pick<UIState, "selectStyle"> = {
  selectStyle: "dialog",
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setSelectStyle: (style) => set({ selectStyle: style }),
      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "mercado304-ui-preferences",
      version: 1,
      partialize: (state) => ({ selectStyle: state.selectStyle }),
    },
  ),
)


