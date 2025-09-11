import { NextResponse } from "next/server";
import { toolFunctions } from "./tool-functions/index";

// Função para lidar com seleções do usuário
export async function handleSelection(selectionData: any, history: any[]) {
	const { type, selectedOption, originalContext, searchTerm } = selectionData;

	// Baseado no contexto original, executa a ação apropriada
	if (originalContext?.action === "addToList") {
		// Adiciona o produto selecionado à lista
		const result = await toolFunctions.addItemToShoppingList({
			listName: originalContext.listName,
			items: [selectedOption.name],
		});
		return NextResponse.json({
			reply:
				result.message ||
				`Produto "${selectedOption.name}" adicionado à lista "${originalContext.listName}" com sucesso!`,
		});
	}

	if (originalContext?.action === "comparePrice") {
		// Compara preço do produto selecionado
		const result = await toolFunctions.getProductPriceComparison({
			productName: selectedOption.name,
		});
		return NextResponse.json({
			reply: `Comparação de preços para "${selectedOption.name}":\n\n${JSON.stringify(result.prices, null, 2)}`,
		});
	}

	// Ação padrão: apenas confirma a seleção
	return NextResponse.json({
		reply: `Você selecionou: "${selectedOption.name}". Como posso ajudar com essa seleção?`,
	});
}