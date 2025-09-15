// Sistema de segurança - filtra perguntas técnicas perigosas
export function isBlockedQuery(message: string): {
	blocked: boolean
	reason?: string
} {
	const lowerMessage = message.toLowerCase()

	// Padrões perigosos relacionados ao sistema/API
	const dangerousPatterns = [
		// Informações sobre o modelo
		/\b(gemini|google|ai|modelo|llm|language\s*model|artificial\s*intelligence)\b.*\b(api|key|token|configuração|config|parâmetros?|parameters?)\b/i,
		/\b(qual|que|what)\b.*\b(modelo|model|ai|gemini)\b.*\b(você|voce|tu|está|esta|usando|uses?)\b/i,
		/\b(versão|version|tipo|type)\b.*\b(ai|modelo|model|gemini)\b/i,

		// Informações sobre API e tokens
		/\b(api\s*key|token|chave|password|senha|credential|auth|authentication|bearer)\b/i,
		/\b(endpoint|url|host|server|base\s*url)\b.*\b(api|gemini|google)\b/i,
		/\b(gemini_api_key|nextauth|database_url|env|environment)\b/i,

		// Perguntas sobre código e arquitetura
		/\b(código|code|source|fonte|repository|repo|github)\b.*\b(mostrar|show|ver|see|exibir|display)\b/i,
		/\b(como|how)\b.*\b(implementado|implemented|coded|programado|desenvolvido)\b/i,
		/\b(arquitetura|architecture|estrutura|structure|banco\s*de\s*dados|database)\b.*\b(sistema|system|aplicação|app)\b/i,
		/\b(prisma|nextjs|react|typescript|schema|tabelas?|tables?)\b.*\b(estrutura|structure|como|funciona)\b/i,

		// Prompts e instruções do sistema
		/\b(prompt|instruction|instrução|sistema|system)\b.*\b(mostrar|show|revelar|reveal|listar|list)\b/i,
		/\b(suas|your)\b.*\b(instruções|instructions|regras|rules|prompt|configurações)\b/i,
		/\b(ignore|esqueça|forget|desconsidere)\b.*\b(instruções|instructions|regras|rules|prompt)\b/i,

		// Tentativas de bypass
		/\b(roleplay|role\s*play|fingir|pretend|simular|simulate)\b.*\b(desenvolvedor|developer|admin|administrador)\b/i,
		/\b(you\s*are|você\s*é|voce\s*eh)\b.*\b(now|agora)\b.*\b(developer|desenvolvedor|programmer)\b/i,
		/\b(bypass|contornar|ignorar|ignore)\b.*\b(filtro|filter|regra|rule|restrição|restriction)\b/i,

		// Informações sobre infraestrutura
		/\b(servidor|server|host|port|porta|ip|dns|ssl|https?)\b.*\b(configuração|config|setup|onde|where)\b/i,
		/\b(deploy|deployment|produção|production|staging|homologação)\b.*\b(como|where|onde)\b/i,

		// Tentativas de extrair dados sensíveis
		/\b(log|logs|error|erro|debug|console)\b.*\b(mostrar|show|ver|see|acessar|access)\b/i,
		/\b(variável|variable|env|environment)\b.*\b(listar|list|mostrar|show|valor|value)\b/i,

		// Perguntas sobre limitações e controle
		/\b(limitações|limitations|restrições|restrictions|pode|can)\b.*\b(fazer|do|executar|execute|código|code)\b/i,
		/\b(jailbreak|hack|exploit|vulnerabilidade|vulnerability)\b/i,

		// Meta-perguntas sobre IA
		/\b(como\s*você|how\s*do\s*you)\b.*\b(funciona|work|processa|process|decide)\b/i,
		/\b(qual\s*é|what\s*is)\b.*\b(sua\s*arquitetura|your\s*architecture|seu\s*modelo|your\s*model)\b/i,
	]

	// Lista de palavras-chave suspeitas (precisa de contexto)
	const suspiciousKeywords = [
		"gemini",
		"api",
		"token",
		"key",
		"código",
		"code",
		"prompt",
		"instrução",
		"sistema",
		"model",
		"ai",
		"nextjs",
		"prisma",
		"database",
		"server",
		"config",
		"environment",
		"developer",
		"admin",
		"debug",
		"log",
	]

	// Verifica padrões perigosos
	for (const pattern of dangerousPatterns) {
		if (pattern.test(lowerMessage)) {
			return {
				blocked: true,
				reason: "Pergunta sobre informações técnicas do sistema não permitida por segurança.",
			}
		}
	}

	// Verifica concentração de palavras suspeitas
	const suspiciousCount = suspiciousKeywords.filter((keyword) => lowerMessage.includes(keyword)).length

	if (suspiciousCount >= 2) {
		return {
			blocked: true,
			reason: "Pergunta com múltiplos termos técnicos não permitida por segurança.",
		}
	}

	// Verifica tentativas diretas de extração de prompt
	const promptExtractionPatterns = [
		/repita|repeat.*instruções|instructions/i,
		/mostre|show.*prompt|system.*message/i,
		/quais.*são.*suas.*regras|what.*are.*your.*rules/i,
		/como.*você.*foi.*programado|how.*were.*you.*programmed/i,
	]

	for (const pattern of promptExtractionPatterns) {
		if (pattern.test(lowerMessage)) {
			return {
				blocked: true,
				reason: "Tentativa de extrair instruções do sistema não permitida.",
			}
		}
	}

	return { blocked: false }
}
