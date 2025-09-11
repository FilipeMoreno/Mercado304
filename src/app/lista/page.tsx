import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListaClient } from "./lista-client";

interface ListaPageProps {
	searchParams: {
		search?: string;
		sort?: string;
		page?: string;
		status?: string;
	};
}

export default function ListaPage({ searchParams }: ListaPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Listas de Compras</h1>
					<p className="text-gray-600 mt-2">Organize suas listas de compras</p>
				</div>
				<Link href="/lista/nova">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Nova Lista
					</Button>
				</Link>
			</div>

			<ListaClient searchParams={searchParams} />
		</div>
	);
}
