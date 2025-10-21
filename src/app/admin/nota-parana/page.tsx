import { NotaParanaSearchAdvanced } from "@/components/nota-parana-search-advanced"

export default function NotaParanaAdminPage() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Comparador de Preços - Nota Paraná</h1>
				<p className="text-muted-foreground mt-2">
					Compare preços de produtos em estabelecimentos próximos usando dados do Nota Paraná
				</p>
			</div>

			<NotaParanaSearchAdvanced />
		</div>
	)
}
