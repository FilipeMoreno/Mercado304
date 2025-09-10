import { toast } from "sonner";

// Interface para a estrutura do nosso erro padronizado
interface ApiErrorPayload {
	error: {
		code: string;
		message: string;
	};
}

// Função para verificar se o erro tem o nosso formato
function isApiError(payload: any): payload is ApiErrorPayload {
	return (
		typeof payload === "object" &&
		payload !== null &&
		"error" in payload &&
		typeof payload.error === "object" &&
		"code" in payload.error &&
		"message" in payload.error
	);
}

export const AppToasts = {
	success: (message: string) => {
		toast.success(message, {
			icon: "",
		});
	},

	info: (message: string) => {
		toast.info(message, {
			icon: "",
		});
	},

	// A função de erro agora é mais inteligente
	error: (error: unknown, defaultMessage = "Ocorreu um erro.") => {
		let message = defaultMessage;
		let code: string | null = null;

		if (isApiError(error)) {
			message = error.error.message;
			code = error.error.code;
		} else if (error instanceof Error) {
			message = error.message;
		}

		const finalMessage = code ? `${message} [${code}]` : message;

		toast.error(finalMessage, {
			icon: "❌",
		});
	},

	// Funções específicas para CRUD (opcional, mas recomendado)
	created: (itemName: string) =>
		AppToasts.success(`${itemName} criado(a) com sucesso!`),
	updated: (itemName: string) =>
		AppToasts.success(`${itemName} atualizado(a) com sucesso!`),
	deleted: (itemName: string) =>
		AppToasts.success(`${itemName} excluído(a) com sucesso!`),
};
