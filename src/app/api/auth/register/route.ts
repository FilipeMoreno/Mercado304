import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sendVerificationRequest } from "@/lib/send-verification-request";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return new NextResponse("User already exists", { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: user.email as string,
      token: (await randomBytes(32)).toString("hex"),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  await sendVerificationRequest({
    identifier: user.email as string,
    url: `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken.token}`,
    expires: verificationToken.expires,
    token: verificationToken.token,
    theme: {} as any,
    provider: {
      server: process.env.EMAIL_SERVER as string,
      from: process.env.EMAIL_FROM as string,
    } as any,
  });

  return new NextResponse("User created", { status: 201 });
}
