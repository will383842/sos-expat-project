/**
 * =============================================================================
 * SOS EXPAT — Export centralisé des Prompts
 * =============================================================================
 */

import type { ProviderType, AIRequestContext, AIMode } from "../core/types";
import {
  LAWYER_SYSTEM_PROMPT,
  LAWYER_DRAFT_PROMPT,
  LAWYER_ASSIST_PROMPT,
  buildLawyerPrompt,
} from "./lawyer";
import {
  EXPERT_SYSTEM_PROMPT,
  EXPERT_DRAFT_PROMPT,
  EXPERT_ASSIST_PROMPT,
  buildExpertPrompt,
} from "./expert";

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Templates et utilitaires
export {
  formatContextBlock,
  formatUrgency,
  buildSearchQuery,
  RESPONSE_SECTIONS,
  COMMON_RULES,
  DRAFT_OUTPUT_RULES,
  ASSIST_OUTPUT_RULES,
} from "./templates";

// Prompts Avocats
export {
  LAWYER_SYSTEM_PROMPT,
  LAWYER_DRAFT_PROMPT,
  LAWYER_ASSIST_PROMPT,
  LAWYER_SPECIALIZED_PROMPTS,
  LAWYER_SEARCH_PROMPT,
  buildLawyerPrompt,
} from "./lawyer";

// Prompts Experts
export {
  EXPERT_SYSTEM_PROMPT,
  EXPERT_DRAFT_PROMPT,
  EXPERT_ASSIST_PROMPT,
  EXPERT_SPECIALIZED_PROMPTS,
  EXPERT_SEARCH_PROMPT,
  buildExpertPrompt,
} from "./expert";

// =============================================================================
// FONCTION PRINCIPALE DE SÉLECTION DE PROMPT
// =============================================================================

/**
 * Retourne le system prompt de base (sans contexte) pour un providerType + mode.
 * Utilisé en fallback quand on n'a pas de contexte booking.
 *
 * @param providerType "lawyer" | "expat" — le type de prestataire
 * @param mode         "draft_for_client" | "assist_provider"
 *                     Default 'assist_provider' (sécurisé : un appel sans mode
 *                     est probablement un message interactif).
 */
export function getSystemPrompt(
  providerType: ProviderType | undefined,
  mode: AIMode = "assist_provider"
): string {
  if (providerType === "lawyer") {
    return mode === "draft_for_client" ? LAWYER_DRAFT_PROMPT : LAWYER_ASSIST_PROMPT;
  }
  return mode === "draft_for_client" ? EXPERT_DRAFT_PROMPT : EXPERT_ASSIST_PROMPT;
}

/**
 * Construit le system prompt complet (mode + contexte booking).
 * C'est la fonction utilisée en production par le service hybride.
 *
 * @param providerType "lawyer" | "expat"
 * @param context      Contexte booking (pays, nationalité, langue, urgence…)
 * @param mode         "draft_for_client" | "assist_provider" (default: 'assist_provider')
 */
export function buildPromptForProvider(
  providerType: ProviderType | undefined,
  context: AIRequestContext,
  mode: AIMode = "assist_provider"
): string {
  if (providerType === "lawyer") {
    return buildLawyerPrompt(context, mode);
  }
  return buildExpertPrompt(context, mode);
}
