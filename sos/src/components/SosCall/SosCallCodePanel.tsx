import React from 'react';

/**
 * Small banner shown at the top of the CallCheckout page.
 *
 * Invites users covered by a B2B partner (SOS-Call subscribers) to use
 * their personal code for a free call instead of paying.
 *
 * Behavior:
 *   - Shows a compact "I have a code" card with a CTA
 *   - On CTA click, redirects to the Blade /sos-call page (separate subdomain)
 *     where the full code-entry + call-trigger flow lives.
 *   - The Blade page handles code validation, phone confirmation, and call scheduling.
 *
 * This banner is intentionally non-intrusive: it coexists with the normal
 * Stripe payment flow without modifying any payment logic.
 *
 * Can be dismissed — dismissal persists to localStorage so users who already
 * declined it once aren't repeatedly nagged.
 */
interface SosCallCodePanelProps {
  /** The SOS-Call landing URL. Defaults to sos-call.sos-expat.com. */
  sosCallUrl?: string;
  /** Language for labels. Defaults to 'fr'. */
  language?: 'fr' | 'en' | 'es' | 'de' | 'pt' | 'ar' | 'zh' | 'ru' | 'hi';
  /** Optional className for outer wrapper. */
  className?: string;
}

const LABELS: Record<string, { title: string; desc: string; cta: string; dismiss: string }> = {
  fr: {
    title: '💡 Vous avez un code SOS-Call ?',
    desc: 'Si votre entreprise, banque ou assurance vous a fourni un code, votre appel est déjà pris en charge.',
    cta: 'Utiliser mon code',
    dismiss: 'Non merci',
  },
  en: {
    title: '💡 Do you have an SOS-Call code?',
    desc: 'If your employer, bank, or insurance gave you a code, your call is already covered.',
    cta: 'Use my code',
    dismiss: 'No thanks',
  },
  es: {
    title: '💡 ¿Tiene un código SOS-Call?',
    desc: 'Si su empresa, banco o seguro le dio un código, su llamada ya está cubierta.',
    cta: 'Usar mi código',
    dismiss: 'No, gracias',
  },
  de: {
    title: '💡 Haben Sie einen SOS-Call-Code?',
    desc: 'Wenn Ihr Arbeitgeber, Ihre Bank oder Versicherung Ihnen einen Code gegeben hat, ist Ihr Anruf bereits abgedeckt.',
    cta: 'Meinen Code verwenden',
    dismiss: 'Nein, danke',
  },
  pt: {
    title: '💡 Você tem um código SOS-Call?',
    desc: 'Se sua empresa, banco ou seguro lhe forneceu um código, sua chamada já está coberta.',
    cta: 'Usar meu código',
    dismiss: 'Não, obrigado',
  },
  ar: {
    title: '💡 هل لديك رمز SOS-Call؟',
    desc: 'إذا قدمت لك شركتك أو مصرفك أو تأمينك رمزًا، فإن مكالمتك مدعومة بالفعل.',
    cta: 'استخدم رمزي',
    dismiss: 'لا، شكرًا',
  },
  zh: {
    title: '💡 您有 SOS-Call 代码吗？',
    desc: '如果您的公司、银行或保险公司给了您代码，您的通话已经被涵盖。',
    cta: '使用我的代码',
    dismiss: '不用了',
  },
  ru: {
    title: '💡 У вас есть код SOS-Call?',
    desc: 'Если ваша компания, банк или страховая дала вам код, ваш звонок уже оплачен.',
    cta: 'Использовать мой код',
    dismiss: 'Нет, спасибо',
  },
  hi: {
    title: '💡 क्या आपके पास SOS-Call कोड है?',
    desc: 'यदि आपकी कंपनी, बैंक या बीमा ने आपको कोड दिया है, तो आपकी कॉल पहले से ही कवर है।',
    cta: 'मेरा कोड उपयोग करें',
    dismiss: 'नहीं, धन्यवाद',
  },
};

const DISMISS_KEY = 'sos_call_panel_dismissed';

export const SosCallCodePanel: React.FC<SosCallCodePanelProps> = ({
  sosCallUrl = 'https://sos-call.sos-expat.com',
  language = 'fr',
  className = '',
}) => {
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const labels = LABELS[language] || LABELS.fr;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore storage errors */
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="SOS-Call code"
      className={`rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-blue-900">{labels.title}</h3>
          <p className="mt-1 text-sm text-blue-800">{labels.desc}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-blue-600/70 hover:text-blue-800 underline underline-offset-2 whitespace-nowrap"
          aria-label={labels.dismiss}
        >
          {labels.dismiss}
        </button>
      </div>
      <div className="mt-4">
        <a
          href={sosCallUrl}
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition shadow-sm"
        >
          {labels.cta} →
        </a>
      </div>
    </div>
  );
};

export default SosCallCodePanel;
