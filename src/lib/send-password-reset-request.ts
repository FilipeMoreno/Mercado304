import { sendEmail } from "./email";

export async function sendPasswordResetRequest(params: {
	email: string;
	url: string;
}) {
	const { email, url } = params;
	await sendEmail({
		to: email,
		subject: "Redefina sua senha",
		html: `<p>Clique no link para redefinir sua senha: <a href="${url}">${url}</a></p>`,
	});
}
