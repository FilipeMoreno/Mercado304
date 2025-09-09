import { prisma } from "@/lib/prisma";
import { sendPasswordResetRequest } from "@/lib/send-password-reset-request";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const token = (await randomBytes(32)).toString("hex");
  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  await sendPasswordResetRequest({
    email,
    url: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${passwordResetToken.token}`,
  });

  return new NextResponse("Password reset email sent", { status: 200 });
}
