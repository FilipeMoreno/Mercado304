// Define a estrutura de um erro documentado
interface AppErrorDetails {
	message: string
	statusCode: number
}

// Documentação central de todos os erros da aplicação.
// Siga o padrão: [MÓDULO]_[CÓDIGO SEQUENCIAL]
export const ERROR_CODES: Record<string, AppErrorDetails> = {
	// GENERIC (GEN)
	GEN_001: { message: "Erro interno do servidor.", statusCode: 500 },
	GEN_002: { message: "Acesso não autorizado.", statusCode: 401 },
	GEN_003: { message: "Recurso não encontrado.", statusCode: 404 },

	// MARKETS (MKT)
	MKT_001: { message: "Nome do mercado é obrigatório.", statusCode: 400 },
	MKT_002: { message: "Erro ao criar mercado.", statusCode: 500 },
	MKT_003: { message: "Erro ao buscar mercados.", statusCode: 500 },
	MKT_004: { message: "Mercado não encontrado.", statusCode: 404 },

	// PRODUCTS (PRD)
	PRD_001: { message: "Nome do produto é obrigatório.", statusCode: 400 },
	PRD_002: { message: "Produto já existe com este nome.", statusCode: 409 },
	PRD_003: { message: "Erro ao criar produto.", statusCode: 500 },

	// CATEGORIES (CAT)
	CAT_001: { message: "Nome da categoria é obrigatório.", statusCode: 400 },
	CAT_002: { message: "Categoria já existe.", statusCode: 409 },

	// BRANDS (BND)
	BND_001: { message: "Nome da marca é obrigatório.", statusCode: 400 },
	BND_002: { message: "Marca já existe.", statusCode: 409 },

	// PURCHASES (PUR)
	PUR_001: {
		message: "Mercado e itens são obrigatórios para a compra.",
		statusCode: 400,
	},

	// Adicione outros códigos de erro aqui...
}

// Classe de Erro Personalizada que carrega nosso código de erro
export class AppError extends Error {
	public readonly errorCode: string
	public readonly statusCode: number

	constructor(errorCode: keyof typeof ERROR_CODES, message?: string) {
		// Busca a mensagem e o statusCode do nosso dicionário
		const errorDetails = ERROR_CODES[errorCode] || ERROR_CODES.GEN_001

		if (!errorDetails) {
			super(message || "Erro interno no servidor")
			this.name = "AppError"
			this.errorCode = errorCode
			this.statusCode = 500
			Object.setPrototypeOf(this, AppError.prototype)
			return
		}

		// Usa a mensagem personalizada se for fornecida, senão usa a padrão
		super(message || errorDetails.message)

		this.name = "AppError"
		this.errorCode = errorCode
		this.statusCode = errorDetails.statusCode

		// Garante que o stack trace seja capturado corretamente
		Object.setPrototypeOf(this, AppError.prototype)
	}
}
