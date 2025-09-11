import { EstoqueClient } from "./estoque-client";

interface EstoquePageProps {
	searchParams: {
		location?: string;
		search?: string;
	};
}

export default function EstoquePage({ searchParams }: EstoquePageProps) {
	return <EstoqueClient searchParams={searchParams} />;
}
