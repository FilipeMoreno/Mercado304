export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Painel esquerdo fixo - imagem e texto */}
			<div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center lg:bg-gradient-to-br lg:from-blue-600 lg:to-teal-600 lg:p-12 lg:relative lg:overflow-hidden">
				<div className="text-center text-white z-10">
					<h1 className="text-4xl font-bold mb-6">Mercado304</h1>
					<blockquote className="text-xl mb-4 leading-relaxed">
						"Organize suas compras por categorias e estabelecimentos. Planeje suas idas ao supermercado de forma
						otimizada."
					</blockquote>
					<p className="text-lg opacity-90">Planejamento eficiente</p>
				</div>
				{/* Elementos decorativos */}
				<div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
				<div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
				<div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
			</div>

			{/* Painel direito com scroll */}
			<div className="flex flex-col justify-center items-center p-8 overflow-y-auto">
				<div className="w-full max-w-[400px]">{children}</div>
			</div>
		</div>
	)
}
