// SendToOne.tsx
import React, { useState } from "react";
import { functions } from "@/config/firebase";
import { httpsCallable } from "firebase/functions";
import { newsletter } from "../../templates/newsletter";
import { getErrorMessage } from "../../../utils/errors";

const sendEmail = httpsCallable<
  { to: string; subject: string; html: string },
  { success: boolean }
>(functions, "admin_sendEmail"); // à implémenter côté Functions

const logEmail = httpsCallable<
  { type: string; count: number; error?: string },
  { logged: boolean }
>(functions, "admin_logEmail"); // à implémenter côté Functions

const SendToOne: React.FC = () => {
  const [email, setEmail] = useState("");
  const [greeting, setGreeting] = useState("Bonjour !");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  const handleSend = async (): Promise<void> => {
    if (!email) {
      setStatus("❌ Veuillez entrer une adresse email");
      return;
    }

    try {
      const html = newsletter({ greeting, content });

      await sendEmail({
        to: email,
        subject: "Newsletter personnalisée",
        html,
      });

      // ✅ log global (1 seul destinataire)
      await logEmail({ type: "newsletter", count: 1 });

      setStatus("Email envoyé ✅");
    } catch (err) {
      await logEmail({
        type: "newsletter",
        count: 0,
        error: getErrorMessage(err),
      });

      setStatus("Erreur lors de l’envoi ❌ " + getErrorMessage(err));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">👤 Envoi individuel</h2>
      <div className="grid gap-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
        />
        <input
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="Salutation"
          className="input"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu"
          className="textarea"
        />
        <button onClick={handleSend} className="btn btn-primary">
          Envoyer
        </button>
        {status && <p className="text-sm mt-2">{status}</p>}
      </div>
    </div>
  );
};

export default SendToOne;
