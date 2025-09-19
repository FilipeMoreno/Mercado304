"use client"

import { create } from "zustand"
import { persist, subscribeWithSelector } from "zustand/middleware"

// ==================== INTERFACES ====================

interface SidebarState {
	collapsed: boolean
	expandedItems: string[]
	isMobile: boolean
}

interface AIChatState {
	isOpen: boolean
	messages: Array<{
		id: string
		content: string
		role: "user" | "assistant"
		timestamp: Date
		isError?: boolean
		isStreaming?: boolean
		selectionCard?: {
			type: "products" | "markets" | "categories" | "brands" | "shopping-lists" | "churrascometro"
			options: any[]
			searchTerm: string
			context?: any
		}
	}>
	isListening: boolean
	isSpeaking: boolean
	isLoading: boolean
}

interface ThemeState {
	mode: "dark" | "light" | "system"
}

interface ModalState {
	[key: string]: boolean
}

interface NotificationState {
	enabled: boolean
	expirationAlerts: boolean
	priceAlerts: boolean
	lowStockAlerts: boolean
	sound: boolean
}

interface UserPreferences {
	dashboard: {
		widgets: string[]
		layout: "grid" | "list"
		cardsPerRow: number
		showAiSummary: boolean
	}
	notifications: NotificationState
	voice: {
		enabled: boolean
		autoSpeak: boolean
		voice: string
		rate: number
		pitch: number
	}
	ui: {
		animationsEnabled: boolean
		compactMode: boolean
		showTooltips: boolean
	}
}

// ==================== MAIN STORE ====================

interface AppStore {
	// UI Global State
	sidebar: SidebarState
	aiChat: AIChatState
	theme: ThemeState
	modals: ModalState
	
	// User Preferences
	preferences: UserPreferences
	
	// Sidebar Actions
	setSidebarCollapsed: (collapsed: boolean) => void
	toggleSidebar: () => void
	setExpandedItem: (item: string, expanded: boolean) => void
	toggleExpandedItem: (item: string) => void
	setSidebarMobile: (isMobile: boolean) => void
	
	// AI Chat Actions
	setAIChatOpen: (isOpen: boolean) => void
	toggleAIChat: () => void
	addAIChatMessage: (content: string, role: "user" | "assistant", options?: {
		isError?: boolean
		isStreaming?: boolean
		selectionCard?: {
			type: "products" | "markets" | "categories" | "brands" | "shopping-lists" | "churrascometro"
			options: any[]
			searchTerm: string
			context?: any
		}
	}) => void
	clearAIChatMessages: () => void
	setAIChatListening: (isListening: boolean) => void
	setAIChatSpeaking: (isSpeaking: boolean) => void
	setAIChatLoading: (isLoading: boolean) => void
	
	// Theme Actions
	setTheme: (theme: ThemeState["mode"]) => void
	
	// Modal Actions
	setModal: (key: string, isOpen: boolean) => void
	toggleModal: (key: string) => void
	
	// Preferences Actions
	updateDashboardPreference: <K extends keyof UserPreferences["dashboard"]>(
		key: K,
		value: UserPreferences["dashboard"][K]
	) => void
	updateNotificationPreference: <K extends keyof UserPreferences["notifications"]>(
		key: K,
		value: UserPreferences["notifications"][K]
	) => void
	updateVoicePreference: <K extends keyof UserPreferences["voice"]>(
		key: K,
		value: UserPreferences["voice"][K]
	) => void
	updateUIPreference: <K extends keyof UserPreferences["ui"]>(
		key: K,
		value: UserPreferences["ui"][K]
	) => void
	resetPreferences: () => void
}

// ==================== DEFAULT VALUES ====================

const defaultSidebar: SidebarState = {
	collapsed: false,
	expandedItems: [],
	isMobile: false,
}

const defaultAIChat: AIChatState = {
	isOpen: false,
	messages: [],
	isListening: false,
	isSpeaking: false,
	isLoading: false,
}

const defaultTheme: ThemeState = {
	mode: "system",
}

const defaultPreferences: UserPreferences = {
	dashboard: {
		widgets: ["total-purchases", "total-spent", "total-products", "total-markets", "price-records"],
		layout: "grid",
		cardsPerRow: 5,
		showAiSummary: true,
	},
	notifications: {
		enabled: true,
		expirationAlerts: true,
		priceAlerts: true,
		lowStockAlerts: true,
		sound: true,
	},
	voice: {
		enabled: false,
		autoSpeak: false,
		voice: "default",
		rate: 1,
		pitch: 1,
	},
	ui: {
		animationsEnabled: true,
		compactMode: false,
		showTooltips: true,
	},
}

// ==================== STORE IMPLEMENTATION ====================

export const useAppStore = create<AppStore>()(
	subscribeWithSelector(
		persist(
			(set, get) => ({
				// Initial State
				sidebar: defaultSidebar,
				aiChat: { ...defaultAIChat, messages: [] }, // Don't persist messages
				theme: defaultTheme,
				modals: {},
				preferences: defaultPreferences,

				// Sidebar Actions
				setSidebarCollapsed: (collapsed) =>
					set((state) => ({
						sidebar: { ...state.sidebar, collapsed },
					})),

				toggleSidebar: () =>
					set((state) => ({
						sidebar: { ...state.sidebar, collapsed: !state.sidebar.collapsed },
					})),

				setExpandedItem: (item, expanded) =>
					set((state) => ({
						sidebar: {
							...state.sidebar,
							expandedItems: expanded
								? [...state.sidebar.expandedItems.filter((i) => i !== item), item]
								: state.sidebar.expandedItems.filter((i) => i !== item),
						},
					})),

				toggleExpandedItem: (item) => {
					const { sidebar } = get()
					const isExpanded = sidebar.expandedItems.includes(item)
					get().setExpandedItem(item, !isExpanded)
				},

				setSidebarMobile: (isMobile) =>
					set((state) => ({
						sidebar: { ...state.sidebar, isMobile },
					})),

				// AI Chat Actions
				setAIChatOpen: (isOpen) =>
					set((state) => ({
						aiChat: { ...state.aiChat, isOpen },
					})),

				toggleAIChat: () =>
					set((state) => ({
						aiChat: { ...state.aiChat, isOpen: !state.aiChat.isOpen },
					})),

				addAIChatMessage: (content, role, options = {}) =>
					set((state) => ({
						aiChat: {
							...state.aiChat,
							messages: [
								...state.aiChat.messages,
								{
									id: Date.now().toString(),
									content,
									role,
									timestamp: new Date(),
									...options,
								},
							],
						},
					})),

				clearAIChatMessages: () =>
					set((state) => ({
						aiChat: { ...state.aiChat, messages: [] },
					})),

				setAIChatListening: (isListening) =>
					set((state) => ({
						aiChat: { ...state.aiChat, isListening },
					})),

				setAIChatSpeaking: (isSpeaking) =>
					set((state) => ({
						aiChat: { ...state.aiChat, isSpeaking },
					})),

				setAIChatLoading: (isLoading) =>
					set((state) => ({
						aiChat: { ...state.aiChat, isLoading },
					})),

				// Theme Actions
				setTheme: (mode) =>
					set((state) => ({
						theme: { ...state.theme, mode },
					})),

				// Modal Actions
				setModal: (key, isOpen) =>
					set((state) => ({
						modals: { ...state.modals, [key]: isOpen },
					})),

				toggleModal: (key) => {
					const { modals } = get()
					get().setModal(key, !modals[key])
				},

				// Preferences Actions
				updateDashboardPreference: (key, value) =>
					set((state) => ({
						preferences: {
							...state.preferences,
							dashboard: { ...state.preferences.dashboard, [key]: value },
						},
					})),

				updateNotificationPreference: (key, value) =>
					set((state) => ({
						preferences: {
							...state.preferences,
							notifications: { ...state.preferences.notifications, [key]: value },
						},
					})),

				updateVoicePreference: (key, value) =>
					set((state) => ({
						preferences: {
							...state.preferences,
							voice: { ...state.preferences.voice, [key]: value },
						},
					})),

				updateUIPreference: (key, value) =>
					set((state) => ({
						preferences: {
							...state.preferences,
							ui: { ...state.preferences.ui, [key]: value },
						},
					})),

				resetPreferences: () =>
					set((state) => ({
						preferences: defaultPreferences,
					})),
			}),
			{
				name: "mercado304-app-store",
				partialize: (state) => ({
					sidebar: {
						collapsed: state.sidebar.collapsed,
						expandedItems: state.sidebar.expandedItems,
						// Don't persist isMobile as it should be detected at runtime
					},
					theme: state.theme,
					preferences: state.preferences,
					// Don't persist aiChat messages or modal states
				}),
			}
		)
	)
)

// ==================== SELECTORS ====================

// Sidebar selectors
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebar.collapsed)
export const useSidebarExpandedItems = () => useAppStore((state) => state.sidebar.expandedItems)
export const useSidebarMobile = () => useAppStore((state) => state.sidebar.isMobile)

// AI Chat selectors
export const useAIChatOpen = () => useAppStore((state) => state.aiChat.isOpen)
export const useAIChatMessages = () => useAppStore((state) => state.aiChat.messages)
export const useAIChatListening = () => useAppStore((state) => state.aiChat.isListening)
export const useAIChatSpeaking = () => useAppStore((state) => state.aiChat.isSpeaking)
export const useAIChatLoading = () => useAppStore((state) => state.aiChat.isLoading)

// Theme selectors
export const useTheme = () => useAppStore((state) => state.theme.mode)

// Modal selectors
export const useModal = (key: string) => useAppStore((state) => state.modals[key] || false)

// Preferences selectors
export const useDashboardPreferences = () => useAppStore((state) => state.preferences.dashboard)
export const useNotificationPreferences = () => useAppStore((state) => state.preferences.notifications)
export const useVoicePreferences = () => useAppStore((state) => state.preferences.voice)
export const useUIPreferences = () => useAppStore((state) => state.preferences.ui)

// ==================== ACTIONS SELECTORS ====================

// Sidebar actions
export const useSidebarActions = () => useAppStore((state) => ({
	setSidebarCollapsed: state.setSidebarCollapsed,
	toggleSidebar: state.toggleSidebar,
	setExpandedItem: state.setExpandedItem,
	toggleExpandedItem: state.toggleExpandedItem,
	setSidebarMobile: state.setSidebarMobile,
}))

// AI Chat actions
export const useAIChatActions = () => useAppStore((state) => ({
	setAIChatOpen: state.setAIChatOpen,
	toggleAIChat: state.toggleAIChat,
	addAIChatMessage: state.addAIChatMessage,
	clearAIChatMessages: state.clearAIChatMessages,
	setAIChatListening: state.setAIChatListening,
	setAIChatSpeaking: state.setAIChatSpeaking,
	setAIChatLoading: state.setAIChatLoading,
}))

// Theme actions
export const useThemeActions = () => useAppStore((state) => ({
	setTheme: state.setTheme,
}))

// Modal actions
export const useModalActions = () => useAppStore((state) => ({
	setModal: state.setModal,
	toggleModal: state.toggleModal,
}))

// Preferences actions
export const usePreferencesActions = () => useAppStore((state) => ({
	updateDashboardPreference: state.updateDashboardPreference,
	updateNotificationPreference: state.updateNotificationPreference,
	updateVoicePreference: state.updateVoicePreference,
	updateUIPreference: state.updateUIPreference,
	resetPreferences: state.resetPreferences,
}))