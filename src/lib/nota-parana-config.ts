// src/lib/nota-parana-config.ts
// Configurações compartilhadas para API do Nota Paraná

/**
 * URL base da API do Nota Paraná
 */
export const NOTA_PARANA_BASE_URL = "https://menorpreco.notaparana.pr.gov.br/api/v1"

/**
 * Raio de busca padrão em km
 */
export const RAIO_PADRAO = 20

/**
 * Código de localização padrão (Maringá-PR)
 */
export const LOCAL_PADRAO = "6gg4dpecb"

/**
 * Período padrão de busca em dias
 */
export const PERIODO_PADRAO = 60 // 2 meses

/**
 * Regex para detectar código de barras
 * Aceita códigos de 8 a 14 dígitos (EAN-8, UPC-A, EAN-13, ITF-14)
 */
export const BARCODE_REGEX = /^\d{8,14}$/

/**
 * Todas as categorias disponíveis na API do Nota Paraná
 * Mapeamento completo de ID → Descrição
 */
export const TODAS_CATEGORIAS: Record<number, string> = {
	0: "Não catalogado",
	1: "Carnes e peixes",
	2: "Leite e derivados",
	3: "Plantas e flores",
	4: "Hortifruti",
	5: "Cafés e chás",
	6: "Cereais",
	7: "Farinhas",
	8: "Produtos de origem vegetal",
	9: "Ceras e gorduras",
	10: "Preparação de carnes e peixes",
	11: "Confeitaria e panificadora",
	12: "Conservas, extratos, geléias e sucos",
	13: "Preparos alimentícios",
	14: "Alimentos para animais",
	15: "Tabacaria",
	16: "Derivados minerais",
	17: "Combustíveis",
	18: "Produtos químicos",
	19: "Medicamentos",
	20: "Corantes, tintas e vernizes",
	21: "Perfumaria e Beleza",
	22: "Produtos de limpeza, ceras e pastas",
	23: "Colas",
	24: "Explosivos e fogos de artifícios",
	26: "Plásticos",
	27: "Borrachas",
	28: "Couros e peles",
	29: "Madeira",
	30: "Cestaria e palhas",
	31: "Celulose",
	32: "Papéis",
	33: "Livros, revistas, jornais e outros",
	34: "Tecidos",
	36: "Vestuário",
	37: "Calçados",
	38: "Utensílios",
	39: "Pedras e cerâmicas",
	40: "Metais",
	41: "Metais preciosos e bijuterias",
	42: "Ferramentas",
	43: "Máquinas, aparelhos e materiais elétricos",
	44: "Automóveis e acessórios",
	47: "Brinquedos",
	48: "Produtos ópticos",
	52: "Artigos mobiliários",
	53: "Outros produtos não categorizados",
	54: "Massas",
	55: "Bebidas",
	56: "Material escolar e escritório",
	58: "Carne bovina",
	59: "Carne suína",
	61: "Peixes e crustáceos, moluscos e outros",
	62: "Higiene e limpeza",
	63: "Chocolates / Alimentos e bebidas",
}

/**
 * Categorias de ALIMENTOS usadas na sincronização de preços
 * Focado em produtos de supermercado
 */
export const CATEGORIAS_ALIMENTOS = [
	1, // Carnes e peixes
	2, // Leite e derivados
	4, // Hortifruti
	5, // Cafés e chás
	6, // Cereais
	7, // Farinhas
	8, // Produtos de origem vegetal
	9, // Ceras e gorduras
	10, // Preparação de carnes e peixes
	11, // Confeitaria e panificadora
	12, // Conservas, extratos, geléias e sucos
	13, // Preparos alimentícios
	14, // Alimentos para animais
	54, // Massas
	55, // Bebidas
	58, // Carne bovina
	59, // Carne suína
	61, // Peixes e crustáceos, moluscos e outros
	63, // Chocolates / Alimentos e bebidas
	0, // Não catalogado
] as const

/**
 * Categorias de NÃO ALIMENTOS
 * Para produtos de limpeza, higiene, etc
 */
export const CATEGORIAS_NAO_ALIMENTOS = [
	15, // Tabacaria
	16, // Derivados minerais
	17, // Combustíveis
	18, // Produtos químicos
	19, // Medicamentos
	20, // Corantes, tintas e vernizes
	21, // Perfumaria e Beleza
	22, // Produtos de limpeza, ceras e pastas
	23, // Colas
	24, // Explosivos e fogos de artifícios
	26, // Plásticos
	27, // Borrachas
	28, // Couros e peles
	29, // Madeira
	30, // Cestaria e palhas
	31, // Celulose
	32, // Papéis
	38, // Utensílios
	39, // Pedras e cerâmicas
	40, // Metais
	41, // Metais preciosos e bijuterias
	42, // Ferramentas
	48, // Produtos ópticos
	52, // Artigos mobiliários
	56, // Material escolar e escritório
	62, // Higiene e limpeza
] as const

/**
 * Todas as categorias para busca completa
 * Usar quando não souber o tipo de produto
 */
export const CATEGORIAS_BUSCA_COMPLETA = [...CATEGORIAS_ALIMENTOS, ...CATEGORIAS_NAO_ALIMENTOS] as const

/**
 * Categorias para busca de ALIMENTOS
 * Otimizado para produtos alimentícios de supermercado
 * Total: 20 categorias
 */
export const CATEGORIAS_BUSCA_ALIMENTOS = [
	// Bebidas e Chocolates
	55, // Bebidas
	63, // Chocolates / Alimentos e bebidas

	// Carnes e Proteínas
	1, // Carnes e peixes
	58, // Carne bovina
	59, // Carne suína
	61, // Peixes e crustáceos
	10, // Preparação de carnes

	// Alimentos Básicos
	2, // Leite e derivados
	4, // Hortifruti
	5, // Cafés e chás
	6, // Cereais

	// Preparados e Massas
	7, // Farinhas
	9, // Ceras e gorduras
	11, // Confeitaria
	12, // Conservas
	13, // Preparos alimentícios
	54, // Massas

	// Outros
	8, // Produtos vegetais
	14, // Alimentos animais
	0, // Não catalogado
] as const

/**
 * Categorias para busca de NÃO ALIMENTOS
 * Produtos de limpeza, higiene, utilidades
 * Total: 26 categorias
 */
export const CATEGORIAS_BUSCA_NAO_ALIMENTOS = [
	// Higiene e Beleza
	21, // Perfumaria e Beleza
	22, // Produtos de limpeza
	62, // Higiene e limpeza
	19, // Medicamentos

	// Utilidades Domésticas
	38, // Utensílios
	40, // Metais
	27, // Borrachas
	30, // Cestaria e palhas

	// Vestuário e Acessórios
	36, // Vestuário
	37, // Calçados
	34, // Tecidos
	28, // Couros e peles
	41, // Metais preciosos e bijuterias
	48, // Produtos ópticos

	// Eletrônicos e Ferramentas
	43, // Máquinas e elétricos
	42, // Ferramentas

	// Construção e Materiais
	26, // Plásticos
	29, // Madeira
	31, // Celulose
	32, // Papéis
	39, // Pedras e cerâmicas

	// Outros
	15, // Tabacaria
	16, // Derivados minerais
	17, // Combustíveis
	18, // Produtos químicos
	20, // Corantes e tintas
	23, // Colas
	24, // Explosivos
	44, // Automóveis
	47, // Brinquedos
	52, // Artigos mobiliários
	56, // Material escolar
	33, // Livros
	53, // Outros não categorizados
] as const

/**
 * Categorias principais para busca (ALIMENTOS - padrão para sincronização)
 * Otimizado para produtos mais comuns de supermercado
 */
export const CATEGORIAS_BUSCA = CATEGORIAS_BUSCA_ALIMENTOS

/**
 * Palavras-chave que indicam produtos ALIMENTÍCIOS
 */
export const PALAVRAS_CHAVE_ALIMENTOS = [
	// Carnes
	"carne",
	"boi",
	"frango",
	"peixe",
	"linguica",
	"linguiça",
	"salsicha",
	"hamburguer",
	"hamburger",
	"picanha",
	"alcatra",
	"costela",
	"bacon",
	"presunto",
	"mortadela",
	"salame",
	"ostra",

	// Laticínios
	"leite",
	"queijo",
	"iogurte",
	"manteiga",
	"margarina",
	"requeijao",
	"requeijão",
	"cream cheese",

	// Hortifruti
	"banana",
	"maça",
	"maca",
	"laranja",
	"tomate",
	"alface",
	"cebola",
	"batata",
	"cenoura",
	"melancia",
	"abacaxi",
	"morango",

	// Bebidas
	"coca",
	"pepsi",
	"guarana",
	"guaraná",
	"agua",
	"água",
	"suco",
	"refrigerante",
	"cerveja",
	"vinho",
	"vodka",
	"whisky",
	"gin",
	"energetico",
	"energético",

	// Massas e Grãos
	"macarrao",
	"macarrão",
	"massa",
	"pizza",
	"lasanha",
	"arroz",
	"feijao",
	"feijão",
	"lentilha",
	"grao",
	"grão",
	"cereal",
	"aveia",
	"granola",
	"pipoca",

	// Preparos
	"molho",
	"tempero",
	"sal",
	"açucar",
	"acucar",
	"oleo",
	"óleo",
	"azeite",
	"vinagre",
	"ketchup",
	"maionese",
	"mostarda",

	// Doces e Chocolates
	"chocolate",
	"achocolatado",
	"toddy",
	"nescau",
	"bolo",
	"biscoito",
	"bolacha",

	// Café e Chá
	"cafe",
	"café",
	"cha",
	"chá",
	"capuccino",

	// Conservas
	"extrato",
	"geleia",
	"compota",
	"conserva",

	// Pães
	"pao",
	"pão",
] as const

/**
 * Detecta se um termo de busca é provavelmente um produto alimentício
 * @param termo - Termo de busca (nome do produto)
 * @returns true se parecer ser alimento
 */
export function isProvavelmenteAlimento(termo: string): boolean {
	const termoLower = termo.toLowerCase().trim()

	// Se for código de barras, não tem como saber - usa alimentos por padrão
	if (BARCODE_REGEX.test(termoLower)) {
		return true // Padrão: alimentos (mais comum em supermercado)
	}

	// Verifica se contém alguma palavra-chave de alimentos
	return PALAVRAS_CHAVE_ALIMENTOS.some((palavra) => termoLower.includes(palavra))
}

/**
 * Retorna as categorias apropriadas baseado no termo de busca
 * @param termo - Termo de busca
 * @returns Array de categorias para buscar
 */
export function getCategoriasParaBusca(termo: string): readonly number[] {
	return isProvavelmenteAlimento(termo) ? CATEGORIAS_BUSCA_ALIMENTOS : CATEGORIAS_BUSCA_NAO_ALIMENTOS
}
