import { createAuthClient } from "better-auth/react";
import { passkeyClient, twoFactorClient, oneTapClient, adminClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
	plugins: [
		twoFactorClient({
			onTwoFactorRedirect() {
					window.location.href = "/auth/two-factor";
			},
		}),
		oneTapClient({
			clientId: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID as string,
			autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
			promptOptions: {
        baseDelay: 1000, 
        maxAttempts: 5
      }
		}),
		passkeyClient(),
		adminClient(),
		organizationClient(),
	],
});

export const {
	signIn,
	signUp,
	signOut,
	useSession,
	twoFactor,
	passkey,
	updateSession,
	oneTap
} = authClient;