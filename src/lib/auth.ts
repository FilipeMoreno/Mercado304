import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { sendVerificationRequest } from "@/lib/send-verification-request";

const prisma = new PrismaClient();

async function refreshAccessToken(token: any) {
	try {
		const url =
			"https://oauth2.googleapis.com/token?" +
			new URLSearchParams({
				client_id: process.env.AUTH_GOOGLE_ID as string,
				client_secret: process.env.AUTH_GOOGLE_SECRET as string,
				grant_type: "refresh_token",
				refresh_token: token.refreshToken as string,
			});

		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "POST",
		});

		const refreshedTokens = await response.json();

		if (!response.ok) {
			throw refreshedTokens;
		}

		return {
			...token,
			accessToken: refreshedTokens.access_token,
			accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
		};
	} catch (error) {
		console.log(error);

		return {
			...token,
			error: "RefreshAccessTokenError",
		};
	}
}

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.AUTH_GOOGLE_ID as string,
			clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: {
					label: "Email",
					type: "text",
					placeholder: "jsmith@example.com",
				},
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials, req) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				});

				if (!user || !user.password) {
					return null;
				}

				if (!user.emailVerified) {
					throw new Error("Email not verified");
				}

				const isPasswordValid = await bcrypt.compare(
					credentials.password,
					user.password,
				);

				if (isPasswordValid) {
					return {
						id: user.id,
						email: user.email,
						name: user.name,
					};
				}

				return null;
			},
		}),
	],
	session: {
		strategy: "jwt",
	},
	callbacks: {
		async jwt({ token, user, account }) {
			// Initial sign in
			if (account && user) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.accessTokenExpires = (account.expires_at ?? 0) * 1000;
				token.id = user.id;
				return token;
			}

			// Return previous token if the access token has not expired yet
			if (Date.now() < (token.accessTokenExpires as number)) {
				return token;
			}

			// Access token has expired, try to update it
			return refreshAccessToken(token);
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as any).id = token.id as string;
			}
			(session as any).accessToken = token.accessToken;
			(session as any).error = token.error;
			return session;
		},
		async redirect({ url, baseUrl }) {
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
	},
	events: {
		async createUser(message) {
			const user = message.user;
			// Create a verification token
			const verificationToken = await prisma.verificationToken.create({
				data: {
					identifier: user.email as string,
					token: (await randomBytes(32)).toString("hex"),
					expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
				},
			});

			// Send the verification email
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
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: "/auth/signin",
		verifyRequest: "/auth/verify-request",
	},
};
