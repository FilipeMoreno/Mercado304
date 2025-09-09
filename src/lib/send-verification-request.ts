import { SendVerificationRequestParams } from "next-auth/providers";
import { sendEmail } from "./email";

export async function sendVerificationRequest(
  params: SendVerificationRequestParams
) {
  const { identifier, url, provider } = params;
  await sendEmail({
    to: identifier,
    subject: "Verifique seu email",
    html: `<p>Clique no link para verificar seu email: <a href="${url}">${url}</a></p>`,
  });
}