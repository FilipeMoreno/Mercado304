"use client";

import { useEffect, useState } from "react";

const quotes = [
	{
		text: "Gerencie suas compras de forma inteligente e eficiente. Controle seu estoque, compare preços e nunca mais desperdice alimentos.",
		footer: "Sistema de Gestão de Compras",
	},
	{
		text: "Junte-se a milhares de usuários que já transformaram sua forma de fazer compras. Economize tempo, dinheiro e reduza o desperdício.",
		footer: "Comece sua jornada hoje",
	},
	{
		text: "Transforme sua lista de compras em uma experiência organizada. Nunca mais esqueça de comprar algo importante ou compre em excesso.",
		footer: "Organização inteligente",
	},
	{
		text: "Compare preços entre diferentes estabelecimentos e encontre as melhores ofertas. Sua carteira agradece!",
		footer: "Economia garantida",
	},
	{
		text: "Controle seu orçamento mensal de forma simples e eficaz. Saiba exatamente quanto gasta em cada categoria.",
		footer: "Controle financeiro",
	},
	{
		text: "Receba lembretes inteligentes sobre produtos que estão acabando e evite ficar sem os itens essenciais.",
		footer: "Nunca mais falte nada",
	},
	{
		text: "Organize suas compras por categorias e estabelecimentos. Planeje suas idas ao supermercado de forma otimizada.",
		footer: "Planejamento eficiente",
	},
	{
		text: "Acompanhe o histórico de suas compras e identifique padrões de consumo. Tome decisões mais conscientes.",
		footer: "Consumo consciente",
	},
];

export function AuthQuote() {
	const [randomQuote, setRandomQuote] = useState({
		text: "Carregando",
		footer: "Carregando...",
	});

	useEffect(() => {
		// Seleciona uma citação aleatória apenas no cliente
		const randomIndex = Math.floor(Math.random() * quotes.length);
		setRandomQuote(quotes[randomIndex]);
	}, []);

	return (
		<div className="relative flex flex-col bg-muted p-10 text-white">
			<div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700" />
			<div className="relative z-20 mt-auto">
				<blockquote className="space-y-2">
					<p className="text-lg">"{randomQuote.text}"</p>
					<footer className="text-sm">{randomQuote.footer}</footer>
				</blockquote>
			</div>
		</div>
	);
}
