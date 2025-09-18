import { baseTemplate } from './baseTemplate';
export const contactReply = ({
  firstName,
  userMessage,
  adminReply,
}: {
  firstName: string;
  userMessage: string;
  adminReply: string;
}) =>
  baseTemplate(`
    <h2>Bonjour ${firstName},</h2>
    <p>Nous avons bien reçu votre message :</p>
    <blockquote style="color: #555; margin: 1em 0;">"${userMessage}"</blockquote>
    <p>Voici notre réponse :</p>
    <p><strong>${adminReply}</strong></p>

    <hr style="margin: 30px 0;"/>

    <p>🙏 <strong>Vous avez aimé notre service ?</strong></p>
    <p>👉 <a href="https://wa.me/?text=Je%20recommande%20vivement%20SOS%20Expat%20pour%20les%20urgences%20à%20l’étranger%20!%20https://sos-expat.com" target="_blank" rel="noopener noreferrer">
      Cliquez ici pour le recommander à un proche sur WhatsApp
    </a> ❤️</p>

    <p>📢 <strong>Vous êtes prestataire ?</strong></p>
    <p>🎯 <a href="https://sos-expat.com/widgets/avis" target="_blank" rel="noopener noreferrer">
      Ajoutez notre widget d’avis SOS Expat sur votre site et boostez votre visibilité !
    </a></p>

    <hr style="margin: 30px 0;"/>
    <p>📱 Téléchargez notre application PWA pour un accès rapide :<br/>
    👉 <a href="https://sos-expat.com" target="_blank" rel="noopener noreferrer">sos-expat.com</a></p>

    <p style="margin-top: 40px;">Merci pour votre confiance,<br/>L’équipe <strong>Ulixai - SOS Expat</strong></p>
  `);
