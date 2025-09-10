// src/app/api/recipes/[id]/route.ts

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		await prisma.recipe.delete({
			where: { id: params.id },
		});
		return NextResponse.json({ success: true });
	} catch (error) {
		return handleApiError(error);
	}
}
