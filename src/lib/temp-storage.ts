interface TempStorageItem {
	data: any;
	expiresAt: number;
}

export class TempStorage {
	private static prefix = "mercado304_temp_";
	private static defaultExpiryHours = 1;

	static save(
		data: any,
		expiryHours: number = TempStorage.defaultExpiryHours,
	): string {
		const key = TempStorage.generateKey();
		const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000;

		const item: TempStorageItem = {
			data,
			expiresAt,
		};

		try {
			console.log("💾 Salvando no localStorage:", key, data);
			localStorage.setItem(TempStorage.prefix + key, JSON.stringify(item));
			TempStorage.cleanup(); // Limpar itens expirados
			return key;
		} catch (error) {
			console.error("Erro ao salvar no localStorage:", error);
			return "";
		}
	}

	static get(key: string): any | null {
		try {
			const item = localStorage.getItem(TempStorage.prefix + key);
			if (!item) {
				console.log("❌ Item não encontrado no localStorage:", key);
				return null;
			}

			const parsed: TempStorageItem = JSON.parse(item);

			if (Date.now() > parsed.expiresAt) {
				console.log("⏰ Item expirado:", key);
				localStorage.removeItem(TempStorage.prefix + key);
				return null;
			}

			console.log("✅ Dados recuperados do localStorage:", key, parsed.data);
			return parsed.data;
		} catch (error) {
			console.error("Erro ao ler do localStorage:", error);
			return null;
		}
	}

	static remove(key: string): void {
		try {
			localStorage.removeItem(TempStorage.prefix + key);
		} catch (error) {
			console.error("Erro ao remover do localStorage:", error);
		}
	}

	static cleanup(): void {
		try {
			const keys = Object.keys(localStorage).filter((key) =>
				key.startsWith(TempStorage.prefix),
			);

			keys.forEach((key) => {
				const item = localStorage.getItem(key);
				if (item) {
					try {
						const parsed: TempStorageItem = JSON.parse(item);
						if (Date.now() > parsed.expiresAt) {
							localStorage.removeItem(key);
						}
					} catch {
						localStorage.removeItem(key); // Remove malformed items
					}
				}
			});
		} catch (error) {
			console.error("Erro na limpeza do localStorage:", error);
		}
	}

	private static generateKey(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}
}
