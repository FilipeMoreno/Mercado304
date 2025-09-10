import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	const { token, password } = await req.json();

	if (!token || !password) {
		return new NextResponse("Invalid request", { status: 400 });
	}

	const passwordResetToken = await prisma.passwordResetToken.findUnique({
		where: { token },
	});

	if (!passwordResetToken) {
		return new NextResponse("Invalid token", { status: 400 });
	}

	if (new Date() > passwordResetToken.expires) {
		return new NextResponse("Token expired", { status: 400 });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	await prisma.user.update({
		where: { id: passwordResetToken.userId },
		data: { password: hashedPassword },
	});

	await prisma.passwordResetToken.delete({
		where: { token },
	});

	return new NextResponse("Password updated", { status: 200 });
}
