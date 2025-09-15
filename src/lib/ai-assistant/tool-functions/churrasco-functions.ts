export const churrascoFunctions = {
	promptChurrascoCalculator: async () => {
		return {
			success: true,
			showCards: true,
			cardType: "churrascometro",
			message: "Claro! Vamos calcular tudo para o seu churrasco. Por favor, preencha os detalhes abaixo.",
			options: {},
		}
	},

	calculateChurrasco: async ({ adults, children, drinkers, preferences }: any) => {
		try {
			const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/churrascometro`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ adults, children, drinkers, preferences }),
			})
			if (!response.ok) {
				return {
					success: false,
					message: "Não foi possível calcular o churrasco no momento.",
				}
			}
			const data = await response.json()

			// Formata a resposta para uma apresentação mais limpa
			let message = `🔥 **Churrasco calculado para ${data.summary.totalPeople} pessoas!**\n\n`

			// Adiciona resumo das quantidades por categoria
			Object.entries(data.shoppingList).forEach(([category, items]: [string, any]) => {
				message += `**${category}:**\n`
				items.forEach((item: any) => {
					message += `• ${item.item}: ${item.quantity}\n`
				})
				message += "\n"
			})

			message += `💡 **Dica do Chef:** ${data.chefTip}\n\n`
			message += `📝 Posso criar uma lista de compras com estes itens se você quiser!`

			return {
				success: true,
				message,
				result: data,
				canCreateList: true,
			}
		} catch (error) {
			return {
				success: false,
				message: `Erro ao calcular churrasco: ${error}`,
			}
		}
	},
}
