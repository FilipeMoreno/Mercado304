import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Painel esquerdo fixo - imagem e overlay */}
			<div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center lg:relative lg:overflow-hidden">
				{/* Imagem de fundo */}
				<Image src="/login-image.png" alt="Login Image" fill className="object-cover" priority />

				{/* Overlay de cor (gradiente) */}
				<div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 to-teal-600/40"></div>

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
