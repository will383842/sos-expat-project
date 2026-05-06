/**
 * =============================================================================
 * SOS EXPAT — Détecteur d'intention pour adapter la longueur des réponses IA
 * =============================================================================
 *
 * Analyse le message du prestataire pour déterminer le type de réponse attendue.
 * Injecte une instruction de longueur dans le prompt avant l'appel LLM.
 */

import type { LLMMessage, AIMode } from "../core/types";

// =============================================================================
// TYPES
// =============================================================================

export type MessageIntent =
  | "confirmation"       // "Ok merci" / "D'accord" / "Compris"
  | "contact_request"    // "Donnez-moi le numéro du consulat"
  | "follow_up"          // "Et pour les délais ?" / "What about costs?"
  | "factual_short"      // Question courte factuelle < 10 mots
  | "legal_analysis"     // Analyse juridique complexe
  | "complex_analysis";  // Cas multi-aspects nécessitant plusieurs sections

// =============================================================================
// PATTERNS
// =============================================================================

const CONFIRMATION_PATTERNS = /^(ok|merci|d'accord|super|parfait|compris|bien|thanks|thank you|got it|understood|great|oui|yes|no|non|entendu|reçu|noté|c'est noté)/i;

const CONTACT_PATTERNS = /\b(numéro|téléphone|adresse|contact|email|e-mail|site web|website|horaires|phone|number|address|hours|coordonnées|joindre|appeler|contacter)\b/i;

const FOLLOW_UP_PATTERNS = /^(et |aussi |qu'en est-il|concernant |pour |à propos|what about |and |also |regarding |how about |qu'est-ce que|pour ce qui est|en ce qui concerne|côté |niveau )/i;

const LEGAL_ANALYSIS_PATTERNS = /\b(compétent|compétence|applicable|convention|bilatéral|conflit de lois|jurisprudence|tribunal|juridiction|recours|prescription|article|alinéa|décret|règlement|directive|jurisdiction|statute|ruling|precedent)\b/i;

// =============================================================================
// DÉTECTION D'INTENTION
// =============================================================================

export function detectIntent(
  message: string,
  previousMessages: LLMMessage[]
): MessageIntent {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = lower.split(/\s+/).length;

  // 1. Confirmations → réponse minimale
  if (wordCount <= 5 && CONFIRMATION_PATTERNS.test(lower)) {
    return "confirmation";
  }

  // 2. Demande de contact explicite
  if (CONTACT_PATTERNS.test(lower) && wordCount <= 15) {
    return "contact_request";
  }

  // 3. Question de suivi (référence au contexte précédent)
  if (FOLLOW_UP_PATTERNS.test(lower) && previousMessages.length >= 2) {
    return "follow_up";
  }

  // 4. Analyse juridique complexe
  if (LEGAL_ANALYSIS_PATTERNS.test(lower) && wordCount > 8) {
    return "legal_analysis";
  }

  // 5. Question courte factuelle
  if (wordCount <= 12 && /\?$/.test(trimmed)) {
    return "factual_short";
  }

  // 6. Par défaut : complexe si long, factuel si court
  return wordCount > 25 ? "complex_analysis" : "factual_short";
}

// =============================================================================
// INJECTION D'INSTRUCTION DE LONGUEUR
// =============================================================================

/**
 * Retourne une instruction à injecter comme message système juste avant
 * le dernier message user, pour guider la longueur de la réponse.
 * Retourne null si aucune contrainte spéciale n'est nécessaire.
 *
 * 🆕 2026-05-04 : la guidance dépend du mode :
 *   - assist_provider → consignes télégraphiques (collègue à collègue)
 *   - draft_for_client → consignes plus structurées (réponse client)
 */
export function getIntentGuidance(
  intent: MessageIntent,
  mode: AIMode = "assist_provider"
): string | null {
  if (mode === "assist_provider") {
    switch (intent) {
      case "confirmation":
        // Pas de double bloc utile pour un simple "ok merci"
        return "[INSTRUCTION: Le prestataire confirme. Réponse 1 ligne max, pas de blocs NOTE TECHNIQUE / À DIRE AU CLIENT.]";

      case "contact_request":
        // Pour des coordonnées brutes le prestataire les transmettra lui-même
        return "[INSTRUCTION: Le prestataire demande un contact officiel (organisme, ambassade, consulat, juridiction — JAMAIS un avocat / expert). Réponds en télégraphique: nom · téléphone · site, c'est tout. Pas de blocs NOTE TECHNIQUE / À DIRE AU CLIENT (le prestataire transmettra les coordonnées telles quelles).]";

      case "follow_up":
        return "[INSTRUCTION: Question de suivi. Réponds UNIQUEMENT à ce qui est demandé, en respectant le format à 2 blocs (NOTE TECHNIQUE + À DIRE AU CLIENT). Pas de répétition du contexte précédent. Pas de salutation.]";

      case "factual_short":
        return "[INSTRUCTION: Question courte. Format à 2 blocs OBLIGATOIRE : NOTE TECHNIQUE (1-3 lignes denses : chiffre/article/délai + source) puis À DIRE AU CLIENT (2-3 phrases en langage clair, vouvoiement). Pas de \"contactez un avocat\".]";

      case "legal_analysis":
        return "[INSTRUCTION: Analyse juridique demandée. Format à 2 blocs OBLIGATOIRE : NOTE TECHNIQUE complète (5-15 lignes) puis À DIRE AU CLIENT (3-6 phrases, langage accessible, jargon expliqué). Pas d'emojis décoratifs côté note, pas de sections client (📋💰).]";

      case "complex_analysis":
        return "[INSTRUCTION: Cas complexe. Format à 2 blocs OBLIGATOIRE : NOTE TECHNIQUE structurée si utile (mais pas en sections client style 📋💰⏱️) puis À DIRE AU CLIENT (4-8 phrases progressives qui guident le client, avec une action concrète à la fin).]";
    }
  }

  // Mode draft_for_client — guidance historique adaptée à la rédaction client
  switch (intent) {
    case "confirmation":
      return "[INSTRUCTION: Le prestataire confirme ou remercie. Réponse très courte (1-2 lignes max). Pas de nouveau contenu sauf si une question est implicite.]";

    case "contact_request":
      return "[INSTRUCTION: Le prestataire demande un contact officiel (organisme, ambassade, consulat — JAMAIS un avocat / expert tiers). Donne le nom + téléphone + site web, sans analyse superflue.]";

    case "follow_up":
      return "[INSTRUCTION: Question de suivi. Réponds UNIQUEMENT à ce qui est demandé. Ne répète RIEN de tes réponses précédentes. Pas de réintroduction du contexte.]";

    case "factual_short":
      return "[INSTRUCTION: Question factuelle courte. Réponse en 3-8 lignes max avec la source si juridique. Pas de sections sauf si vraiment nécessaire.]";

    case "legal_analysis":
      return null; // laisser développer

    case "complex_analysis":
      return null; // laisser développer
  }
}
