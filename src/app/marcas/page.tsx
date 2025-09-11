import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarcasClient } from "./marcas-client";

interface MarcasPageProps {
	searchParams: {
		search?: string;
		sort?: string;
		page?: string;
	};
}

export default function MarcasPage({ searchParams }: MarcasPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Marcas</h1>
					<p className="text-gray-600 mt-2">
						Gerencie as marcas dos seus produtos
					</p>
				</div>
				<Link href="/marcas/nova">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Nova Marca
					</Button>
				</Link>
			</div>

			<MarcasClient searchParams={searchParams} />
		</div>
	);
}
