import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

// GET /api/waste/[id] - Buscar registro específico
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getSession();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const wasteRecord = await prisma.wasteRecord.findUnique({
			where: { id: params.id },
		});

		if (!wasteRecord) {
			return NextResponse.json(
				{ error: "Waste record not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(wasteRecord);
	} catch (error) {
		console.error("Error fetching waste record:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PUT /api/waste/[id] - Atualizar registro
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getSession();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			productId,
			productName,
			quantity,
			unit,
			wasteReason,
			wasteDate,
			expirationDate,
			location,
			unitCost,
			totalValue,
			notes,
			category,
			brand,
			batchNumber,
		} = body;

		// Verificar se o registro existe
		const existingRecord = await prisma.wasteRecord.findUnique({
			where: { id: params.id },
		});

		if (!existingRecord) {
			return NextResponse.json(
				{ error: "Waste record not found" },
				{ status: 404 },
			);
		}

		// Atualizar registro
		const updatedRecord = await prisma.wasteRecord.update({
			where: { id: params.id },
			data: {
				productId,
				productName,
				quantity: quantity ? parseFloat(quantity) : existingRecord.quantity,
				unit: unit || existingRecord.unit,
				wasteReason: wasteReason || existingRecord.wasteReason,
				wasteDate: wasteDate ? new Date(wasteDate) : existingRecord.wasteDate,
				expirationDate: expirationDate
					? new Date(expirationDate)
					: existingRecord.expirationDate,
				location,
				unitCost: unitCost ? parseFloat(unitCost) : existingRecord.unitCost,
				totalValue: totalValue
					? parseFloat(totalValue)
					: existingRecord.totalValue,
				notes,
				category,
				brand,
				batchNumber,
			},
		});

		return NextResponse.json(updatedRecord);
	} catch (error) {
		console.error("Error updating waste record:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/waste/[id] - Remover registro
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getSession();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verificar se o registro existe
		const existingRecord = await prisma.wasteRecord.findUnique({
			where: { id: params.id },
		});

		if (!existingRecord) {
			return NextResponse.json(
				{ error: "Waste record not found" },
				{ status: 404 },
			);
		}

		// Remover registro
		await prisma.wasteRecord.delete({
			where: { id: params.id },
		});

		return NextResponse.json({ message: "Waste record deleted successfully" });
	} catch (error) {
		console.error("Error deleting waste record:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
