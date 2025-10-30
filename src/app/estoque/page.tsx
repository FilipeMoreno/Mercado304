import { EstoqueClient } from "./estoque-client"

interface EstoquePageProps {
	searchParams: {
		location?: string
		search?: string
	}
}

export default function EstoquePage({ searchParams }: EstoquePageProps) {
	return (
		<div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
						Controle de Estoque
                    </h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">
						Gerencie seu estoque doméstico e validades
                    </p>
				</div>
            </div>

			<EstoqueClient searchParams={searchParams} />
		</div>
	)
}
