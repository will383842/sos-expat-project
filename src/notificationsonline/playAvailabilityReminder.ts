// src/notificationsonline/playAvailabilityReminder.ts

import { NotificationPreferences } from '../notifications/notificationsDashboardProviders/types';
import voiceMessagesRaw from './voiceTranslateMessages';

// --- Typages stricts pour les données importées --------------------------------

type VoiceMessagesMap = Record<string, string>;
const voiceMessages: VoiceMessagesMap = voiceMessagesRaw as unknown as VoiceMessagesMap;

// --- Constantes ----------------------------------------------------------------

const LAST_VOICE_KEY = 'lastVoiceReminderTimestamp';
const LAST_SOUND_KEY = 'lastSoundReminderTimestamp';

const VOICE_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
const SOUND_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const DEFAULT_PREFS: NotificationPreferences = {
  enableSound: true,
  enableVoice: false,
  enableModal: true,
};

// --- Helpers sûrs pour l'environnement navigateur ------------------------------

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const getNow = (): number => Date.now();

const getLocalStorageNumber = (key: string): number => {
  if (!isBrowser()) return 0;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

const setLocalStorageNumber = (key: string, value: number): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // on ignore les erreurs de quota / privacy
  }
};

const getSpeechLocale = (langCode: string): string => {
  // mapping simple, extensible si besoin
  switch (langCode) {
    case 'fr':
      return 'fr-FR';
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    case 'pt':
      return 'pt-PT';
    case 'de':
      return 'de-DE';
    case 'it':
      return 'it-IT';
    default:
      // si on reçoit un code déjà localisé (ex: 'nl-NL'), on le renvoie tel quel
      return langCode;
  }
};

// --- API publique ---------------------------------------------------------------

/**
 * Joue une notification sonore OU vocale personnalisée, en respectant un intervalle minimal
 * entre deux lectures (30 min pour le son, 60 min pour la voix). Côté navigateur uniquement.
 *
 * @param langCode Code ISO langue simple (ex: 'fr', 'en', 'es') ou locale (ex: 'fr-FR')
 * @param prefs    Préférences de notification ; valeurs par défaut si non fourni
 */
export const playAvailabilityReminder = (
  langCode: string = 'fr',
  prefs: NotificationPreferences = DEFAULT_PREFS
): void => {
  if (!isBrowser()) return;

  const now = getNow();
  const lastVoice = getLocalStorageNumber(LAST_VOICE_KEY);
  const lastSound = getLocalStorageNumber(LAST_SOUND_KEY);

  const shouldPlayVoice = now - lastVoice > VOICE_INTERVAL_MS;
  const shouldPlaySound = now - lastSound > SOUND_INTERVAL_MS && !shouldPlayVoice;

  // --- 🔊 Son (toutes les 30 min si la voix ne doit pas jouer maintenant) ------
  if (prefs.enableSound && shouldPlaySound) {
    try {
      const audio = new Audio('/sounds/notification-online.wav');
      audio.volume = 0.3;
      // éviter les promesses non gérées
      void audio.play().catch((err: unknown) => {
        // Erreur lecture (autoplay policy, etc.)
        // On log en silencieux pour debug, sans interrompre l'exécution
        // eslint-disable-next-line no-console
        console.error('Erreur lecture audio:', err);
      });
      setLocalStorageNumber(LAST_SOUND_KEY, now);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Audio non supporté:', err);
    }
  }

  // --- 🗣️ Voix (toutes les 60 min) --------------------------------------------
  if (prefs.enableVoice && shouldPlayVoice) {
    const messageToRead: string | undefined =
      voiceMessages[langCode] ?? voiceMessages[getSpeechLocale(langCode)] ?? voiceMessages['en'];

    if (typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined' && messageToRead) {
      const utterance = new SpeechSynthesisUtterance(messageToRead);
      utterance.lang = getSpeechLocale(langCode);
      utterance.volume = 0.4;
      utterance.rate = 1;

      // petite latence pour laisser le moteur TTS s'initialiser correctement
      window.setTimeout((): void => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Erreur synthèse vocale:', err);
        }
      }, 800);
    }

    setLocalStorageNumber(LAST_VOICE_KEY, now);
  }
};
