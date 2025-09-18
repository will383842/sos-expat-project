import { transporter } from './emailClient';

/**
 * Envoie un email HTML via nodemailer (SMTP Zoho).
 *
 * @param to - Adresse email du destinataire
 * @param subject - Objet de l’email
 * @param html - Contenu HTML de l’email
 */
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  await transporter.sendMail({
    from: `"SOS Expats" <${process.env.ZOHO_EMAIL}>`, // 🔁 Adresse dynamique depuis .env
    to,
    subject,
    html,
  });
};
