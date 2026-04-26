#!/usr/bin/env python3
"""
Add bookingRequest.sosCall.* i18n keys to all 9 helper files
(sos/public/helper + sos/src/helper).

These keys cover the SOS-Call partner-code section embedded in the
B2C booking flow (BookingRequest.tsx) — the same UX that lets a B2C
client drop their partner code and skip the payment step. Without
these keys, every non-FR client landing on the regular booking page
sees the section in French.

Native, high-quality translations validated 2026-04-26.
Idempotent: existing bookingRequest.sosCall.* keys are overwritten with
the latest version.
"""

import json
import sys
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).resolve().parent.parent
LOCATIONS = [ROOT / "sos" / "public" / "helper", ROOT / "sos" / "src" / "helper"]

TRANSLATIONS = {
    "fr": {
        "bookingRequest.sosCall.gated.title": "Appel pris en charge par <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "Appel pris en charge par votre partenaire",
        "bookingRequest.sosCall.gated.subtitle": "Aucun paiement ne vous sera demandé.",
        "bookingRequest.sosCall.gated.hint": "Sélectionnez simplement le prestataire qui vous convient, remplissez vos coordonnées et déclenchez l'appel.",
        "bookingRequest.sosCall.checkbox.label": "J'ai un code SOS-Call",
        "bookingRequest.sosCall.checkbox.description": "Si votre entreprise, banque ou assurance vous a fourni un code personnel, votre appel est pris en charge par votre partenaire — pas de paiement.",
        "bookingRequest.sosCall.input.label": "Votre code partenaire",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "Vérifier",
        "bookingRequest.sosCall.button.verifying": "Vérification…",
        "bookingRequest.sosCall.button.retry": "Réessayer",
        "bookingRequest.sosCall.button.continueWithoutCode": "Continuer sans code (payer l'appel)",
        "bookingRequest.sosCall.validated.title": "Code validé — appel pris en charge par <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "Code validé — appel pris en charge par votre partenaire",
        "bookingRequest.sosCall.validated.subtitle": "Vous ne paierez rien.",
        "bookingRequest.sosCall.button.modify": "Modifier le code",
        "bookingRequest.sosCall.button.cancel": "Annuler et payer l'appel",
        "bookingRequest.sosCall.errors.codeInvalid": "Code non reconnu. Vérifiez votre saisie.",
        "bookingRequest.sosCall.errors.notFound": "Code introuvable. Contactez votre partenaire si vous pensez avoir un accès.",
        "bookingRequest.sosCall.errors.expired": "Votre accès a expiré. Contactez votre partenaire.",
        "bookingRequest.sosCall.errors.quotaReached": "Vous avez utilisé tous vos appels pour ce mois.",
        "bookingRequest.sosCall.errors.agreementInactive": "Service temporairement indisponible. Contactez votre partenaire.",
        "bookingRequest.sosCall.errors.rateLimited": "Trop de tentatives. Réessayez dans quelques minutes.",
        "bookingRequest.sosCall.errors.network": "Impossible de vérifier le code. Vérifiez votre connexion.",
        "bookingRequest.sosCall.codeRequired": "Veuillez saisir votre code.",
        "bookingRequest.sosCall.mustValidate": "Vérifiez votre code SOS-Call avant de continuer, ou décochez la case si vous préférez payer normalement.",
    },
    "en": {
        "bookingRequest.sosCall.gated.title": "Call covered by <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "Call covered by your partner",
        "bookingRequest.sosCall.gated.subtitle": "No payment will be charged.",
        "bookingRequest.sosCall.gated.hint": "Just pick the expert that suits you, fill in your details and start the call.",
        "bookingRequest.sosCall.checkbox.label": "I have an SOS-Call code",
        "bookingRequest.sosCall.checkbox.description": "If your company, bank or insurer gave you a personal code, your call is covered by your partner — no payment.",
        "bookingRequest.sosCall.input.label": "Your partner code",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "Verify",
        "bookingRequest.sosCall.button.verifying": "Verifying…",
        "bookingRequest.sosCall.button.retry": "Try again",
        "bookingRequest.sosCall.button.continueWithoutCode": "Continue without a code (pay for the call)",
        "bookingRequest.sosCall.validated.title": "Code validated — call covered by <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "Code validated — call covered by your partner",
        "bookingRequest.sosCall.validated.subtitle": "You won't be charged.",
        "bookingRequest.sosCall.button.modify": "Change code",
        "bookingRequest.sosCall.button.cancel": "Cancel and pay for the call",
        "bookingRequest.sosCall.errors.codeInvalid": "Code not recognized. Check what you typed.",
        "bookingRequest.sosCall.errors.notFound": "Code not found. Contact your partner if you believe you have access.",
        "bookingRequest.sosCall.errors.expired": "Your access has expired. Contact your partner.",
        "bookingRequest.sosCall.errors.quotaReached": "You have used all your calls for this month.",
        "bookingRequest.sosCall.errors.agreementInactive": "Service temporarily unavailable. Contact your partner.",
        "bookingRequest.sosCall.errors.rateLimited": "Too many attempts. Try again in a few minutes.",
        "bookingRequest.sosCall.errors.network": "Unable to verify the code. Check your connection.",
        "bookingRequest.sosCall.codeRequired": "Please enter your code.",
        "bookingRequest.sosCall.mustValidate": "Verify your SOS-Call code before continuing, or uncheck the box if you'd rather pay normally.",
    },
    "es": {
        "bookingRequest.sosCall.gated.title": "Llamada cubierta por <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "Llamada cubierta por tu partner",
        "bookingRequest.sosCall.gated.subtitle": "No se cobrará ningún importe.",
        "bookingRequest.sosCall.gated.hint": "Solo elige al experto que prefieras, completa tus datos y lanza la llamada.",
        "bookingRequest.sosCall.checkbox.label": "Tengo un código SOS-Call",
        "bookingRequest.sosCall.checkbox.description": "Si tu empresa, banco o aseguradora te dio un código personal, tu llamada está cubierta por tu partner — sin pago.",
        "bookingRequest.sosCall.input.label": "Tu código de partner",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "Verificar",
        "bookingRequest.sosCall.button.verifying": "Verificando…",
        "bookingRequest.sosCall.button.retry": "Reintentar",
        "bookingRequest.sosCall.button.continueWithoutCode": "Continuar sin código (pagar la llamada)",
        "bookingRequest.sosCall.validated.title": "Código validado — llamada cubierta por <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "Código validado — llamada cubierta por tu partner",
        "bookingRequest.sosCall.validated.subtitle": "No pagarás nada.",
        "bookingRequest.sosCall.button.modify": "Cambiar código",
        "bookingRequest.sosCall.button.cancel": "Cancelar y pagar la llamada",
        "bookingRequest.sosCall.errors.codeInvalid": "Código no reconocido. Comprueba lo que escribiste.",
        "bookingRequest.sosCall.errors.notFound": "Código no encontrado. Contacta a tu partner si crees tener acceso.",
        "bookingRequest.sosCall.errors.expired": "Tu acceso ha caducado. Contacta a tu partner.",
        "bookingRequest.sosCall.errors.quotaReached": "Has usado todas tus llamadas de este mes.",
        "bookingRequest.sosCall.errors.agreementInactive": "Servicio temporalmente no disponible. Contacta a tu partner.",
        "bookingRequest.sosCall.errors.rateLimited": "Demasiados intentos. Vuelve a intentar en unos minutos.",
        "bookingRequest.sosCall.errors.network": "No se puede verificar el código. Comprueba tu conexión.",
        "bookingRequest.sosCall.codeRequired": "Introduce tu código por favor.",
        "bookingRequest.sosCall.mustValidate": "Verifica tu código SOS-Call antes de continuar, o desmarca la casilla si prefieres pagar normalmente.",
    },
    "de": {
        "bookingRequest.sosCall.gated.title": "Anruf übernommen von <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "Anruf übernommen von Ihrem Partner",
        "bookingRequest.sosCall.gated.subtitle": "Es wird keine Zahlung erhoben.",
        "bookingRequest.sosCall.gated.hint": "Wählen Sie einfach den passenden Experten, ergänzen Sie Ihre Angaben und starten Sie den Anruf.",
        "bookingRequest.sosCall.checkbox.label": "Ich habe einen SOS-Call-Code",
        "bookingRequest.sosCall.checkbox.description": "Wenn Ihr Unternehmen, Ihre Bank oder Versicherung Ihnen einen persönlichen Code gegeben hat, übernimmt Ihr Partner den Anruf — keine Zahlung.",
        "bookingRequest.sosCall.input.label": "Ihr Partner-Code",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "Prüfen",
        "bookingRequest.sosCall.button.verifying": "Wird geprüft…",
        "bookingRequest.sosCall.button.retry": "Erneut versuchen",
        "bookingRequest.sosCall.button.continueWithoutCode": "Ohne Code fortfahren (Anruf bezahlen)",
        "bookingRequest.sosCall.validated.title": "Code bestätigt — Anruf übernommen von <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "Code bestätigt — Anruf übernommen von Ihrem Partner",
        "bookingRequest.sosCall.validated.subtitle": "Sie zahlen nichts.",
        "bookingRequest.sosCall.button.modify": "Code ändern",
        "bookingRequest.sosCall.button.cancel": "Abbrechen und Anruf bezahlen",
        "bookingRequest.sosCall.errors.codeInvalid": "Code nicht erkannt. Bitte Eingabe prüfen.",
        "bookingRequest.sosCall.errors.notFound": "Code nicht gefunden. Wenden Sie sich an Ihren Partner, falls Sie Zugang haben sollten.",
        "bookingRequest.sosCall.errors.expired": "Ihr Zugang ist abgelaufen. Wenden Sie sich an Ihren Partner.",
        "bookingRequest.sosCall.errors.quotaReached": "Sie haben alle Anrufe für diesen Monat aufgebraucht.",
        "bookingRequest.sosCall.errors.agreementInactive": "Dienst vorübergehend nicht verfügbar. Wenden Sie sich an Ihren Partner.",
        "bookingRequest.sosCall.errors.rateLimited": "Zu viele Versuche. Bitte in einigen Minuten erneut versuchen.",
        "bookingRequest.sosCall.errors.network": "Code lässt sich nicht prüfen. Bitte Internetverbindung kontrollieren.",
        "bookingRequest.sosCall.codeRequired": "Bitte geben Sie Ihren Code ein.",
        "bookingRequest.sosCall.mustValidate": "Prüfen Sie Ihren SOS-Call-Code vor dem Fortfahren oder deaktivieren Sie das Kästchen, wenn Sie normal bezahlen möchten.",
    },
    "pt": {
        "bookingRequest.sosCall.gated.title": "Chamada coberta por <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "Chamada coberta pelo seu parceiro",
        "bookingRequest.sosCall.gated.subtitle": "Nenhum pagamento será cobrado.",
        "bookingRequest.sosCall.gated.hint": "Basta escolher o especialista que lhe convém, preencher os seus dados e iniciar a chamada.",
        "bookingRequest.sosCall.checkbox.label": "Tenho um código SOS-Call",
        "bookingRequest.sosCall.checkbox.description": "Se a sua empresa, banco ou seguradora lhe deu um código pessoal, a chamada é coberta pelo seu parceiro — sem pagamento.",
        "bookingRequest.sosCall.input.label": "O seu código de parceiro",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "Verificar",
        "bookingRequest.sosCall.button.verifying": "A verificar…",
        "bookingRequest.sosCall.button.retry": "Tentar novamente",
        "bookingRequest.sosCall.button.continueWithoutCode": "Continuar sem código (pagar a chamada)",
        "bookingRequest.sosCall.validated.title": "Código validado — chamada coberta por <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "Código validado — chamada coberta pelo seu parceiro",
        "bookingRequest.sosCall.validated.subtitle": "Não vai pagar nada.",
        "bookingRequest.sosCall.button.modify": "Alterar código",
        "bookingRequest.sosCall.button.cancel": "Cancelar e pagar a chamada",
        "bookingRequest.sosCall.errors.codeInvalid": "Código não reconhecido. Verifique o que digitou.",
        "bookingRequest.sosCall.errors.notFound": "Código não encontrado. Contacte o seu parceiro se acredita ter acesso.",
        "bookingRequest.sosCall.errors.expired": "O seu acesso expirou. Contacte o seu parceiro.",
        "bookingRequest.sosCall.errors.quotaReached": "Já utilizou todas as suas chamadas deste mês.",
        "bookingRequest.sosCall.errors.agreementInactive": "Serviço temporariamente indisponível. Contacte o seu parceiro.",
        "bookingRequest.sosCall.errors.rateLimited": "Demasiadas tentativas. Tente novamente dentro de alguns minutos.",
        "bookingRequest.sosCall.errors.network": "Não foi possível verificar o código. Verifique a sua ligação.",
        "bookingRequest.sosCall.codeRequired": "Introduza o seu código, por favor.",
        "bookingRequest.sosCall.mustValidate": "Verifique o seu código SOS-Call antes de continuar ou desmarque a caixa se preferir pagar normalmente.",
    },
    "ru": {
        "bookingRequest.sosCall.gated.title": "Звонок покрыт <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "Звонок покрыт вашим партнёром",
        "bookingRequest.sosCall.gated.subtitle": "Оплата не взимается.",
        "bookingRequest.sosCall.gated.hint": "Просто выберите подходящего эксперта, заполните данные и запустите звонок.",
        "bookingRequest.sosCall.checkbox.label": "У меня есть код SOS-Call",
        "bookingRequest.sosCall.checkbox.description": "Если ваша компания, банк или страховая выдали вам персональный код, звонок покрывает ваш партнёр — оплаты нет.",
        "bookingRequest.sosCall.input.label": "Ваш партнёрский код",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "Проверить",
        "bookingRequest.sosCall.button.verifying": "Проверка…",
        "bookingRequest.sosCall.button.retry": "Повторить",
        "bookingRequest.sosCall.button.continueWithoutCode": "Продолжить без кода (оплатить звонок)",
        "bookingRequest.sosCall.validated.title": "Код подтверждён — звонок покрыт <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "Код подтверждён — звонок покрыт вашим партнёром",
        "bookingRequest.sosCall.validated.subtitle": "С вас ничего не спишут.",
        "bookingRequest.sosCall.button.modify": "Изменить код",
        "bookingRequest.sosCall.button.cancel": "Отменить и оплатить звонок",
        "bookingRequest.sosCall.errors.codeInvalid": "Код не распознан. Проверьте ввод.",
        "bookingRequest.sosCall.errors.notFound": "Код не найден. Свяжитесь с вашим партнёром, если считаете, что у вас есть доступ.",
        "bookingRequest.sosCall.errors.expired": "Ваш доступ истёк. Свяжитесь с вашим партнёром.",
        "bookingRequest.sosCall.errors.quotaReached": "Вы использовали все звонки за этот месяц.",
        "bookingRequest.sosCall.errors.agreementInactive": "Сервис временно недоступен. Свяжитесь с вашим партнёром.",
        "bookingRequest.sosCall.errors.rateLimited": "Слишком много попыток. Попробуйте через несколько минут.",
        "bookingRequest.sosCall.errors.network": "Не удаётся проверить код. Проверьте подключение.",
        "bookingRequest.sosCall.codeRequired": "Пожалуйста, введите ваш код.",
        "bookingRequest.sosCall.mustValidate": "Проверьте ваш код SOS-Call перед продолжением или снимите галочку, если хотите оплатить обычным способом.",
    },
    "ar": {
        "bookingRequest.sosCall.gated.title": "المكالمة على حساب <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.gated.titleNoPartner": "المكالمة على حساب شريككم",
        "bookingRequest.sosCall.gated.subtitle": "لن يتم تحصيل أي مبلغ.",
        "bookingRequest.sosCall.gated.hint": "اختاروا فقط الخبير المناسب لكم، عبّئوا بياناتكم وابدأوا المكالمة.",
        "bookingRequest.sosCall.checkbox.label": "لديّ رمز SOS-Call",
        "bookingRequest.sosCall.checkbox.description": "إذا منحتكم شركتكم أو بنككم أو شركة التأمين رمزًا شخصيًا، فإن مكالمتكم على حساب شريككم — بدون دفع.",
        "bookingRequest.sosCall.input.label": "رمز الشريك الخاص بكم",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "تحقّق",
        "bookingRequest.sosCall.button.verifying": "جارٍ التحقّق…",
        "bookingRequest.sosCall.button.retry": "حاولوا مجددًا",
        "bookingRequest.sosCall.button.continueWithoutCode": "المتابعة بدون رمز (الدفع للمكالمة)",
        "bookingRequest.sosCall.validated.title": "تم التحقق من الرمز — المكالمة على حساب <strong>{partnerName}</strong>",
        "bookingRequest.sosCall.validated.titleNoPartner": "تم التحقق من الرمز — المكالمة على حساب شريككم",
        "bookingRequest.sosCall.validated.subtitle": "لن تدفعوا شيئًا.",
        "bookingRequest.sosCall.button.modify": "تعديل الرمز",
        "bookingRequest.sosCall.button.cancel": "إلغاء والدفع للمكالمة",
        "bookingRequest.sosCall.errors.codeInvalid": "رمز غير معروف. تحقّقوا مما أدخلتموه.",
        "bookingRequest.sosCall.errors.notFound": "الرمز غير موجود. تواصلوا مع شريككم إذا كنتم تظنّون أنه لديكم وصول.",
        "bookingRequest.sosCall.errors.expired": "انتهت صلاحية وصولكم. تواصلوا مع شريككم.",
        "bookingRequest.sosCall.errors.quotaReached": "لقد استخدمتم جميع مكالماتكم لهذا الشهر.",
        "bookingRequest.sosCall.errors.agreementInactive": "الخدمة غير متاحة مؤقتًا. تواصلوا مع شريككم.",
        "bookingRequest.sosCall.errors.rateLimited": "محاولات كثيرة جدًا. أعيدوا المحاولة بعد بضع دقائق.",
        "bookingRequest.sosCall.errors.network": "تعذّر التحقق من الرمز. تحقّقوا من اتصالكم.",
        "bookingRequest.sosCall.codeRequired": "يرجى إدخال رمزكم.",
        "bookingRequest.sosCall.mustValidate": "تحقّقوا من رمز SOS-Call قبل المتابعة، أو ألغوا تحديد المربع إذا كنتم تفضّلون الدفع بشكل عادي.",
    },
    "hi": {
        "bookingRequest.sosCall.gated.title": "कॉल का खर्च <strong>{partnerName}</strong> द्वारा वहन किया गया",
        "bookingRequest.sosCall.gated.titleNoPartner": "कॉल का खर्च आपके पार्टनर द्वारा वहन किया गया",
        "bookingRequest.sosCall.gated.subtitle": "कोई भुगतान नहीं लिया जाएगा।",
        "bookingRequest.sosCall.gated.hint": "बस अपनी पसंद का विशेषज्ञ चुनें, अपनी जानकारी भरें और कॉल शुरू करें।",
        "bookingRequest.sosCall.checkbox.label": "मेरे पास SOS-Call कोड है",
        "bookingRequest.sosCall.checkbox.description": "अगर आपकी कंपनी, बैंक या बीमा ने आपको व्यक्तिगत कोड दिया है, तो आपकी कॉल का खर्च आपका पार्टनर वहन करता है — कोई भुगतान नहीं।",
        "bookingRequest.sosCall.input.label": "आपका पार्टनर कोड",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "सत्यापित करें",
        "bookingRequest.sosCall.button.verifying": "सत्यापन हो रहा है…",
        "bookingRequest.sosCall.button.retry": "फिर से प्रयास करें",
        "bookingRequest.sosCall.button.continueWithoutCode": "बिना कोड के जारी रखें (कॉल के लिए भुगतान करें)",
        "bookingRequest.sosCall.validated.title": "कोड सत्यापित — कॉल का खर्च <strong>{partnerName}</strong> द्वारा वहन किया गया",
        "bookingRequest.sosCall.validated.titleNoPartner": "कोड सत्यापित — कॉल का खर्च आपके पार्टनर द्वारा वहन किया गया",
        "bookingRequest.sosCall.validated.subtitle": "आप कुछ भी भुगतान नहीं करेंगे।",
        "bookingRequest.sosCall.button.modify": "कोड बदलें",
        "bookingRequest.sosCall.button.cancel": "रद्द करें और कॉल के लिए भुगतान करें",
        "bookingRequest.sosCall.errors.codeInvalid": "कोड पहचाना नहीं गया। अपनी प्रविष्टि जाँचें।",
        "bookingRequest.sosCall.errors.notFound": "कोड नहीं मिला। अगर आपको लगता है कि आपके पास पहुँच है तो अपने पार्टनर से संपर्क करें।",
        "bookingRequest.sosCall.errors.expired": "आपकी पहुँच समाप्त हो गई है। अपने पार्टनर से संपर्क करें।",
        "bookingRequest.sosCall.errors.quotaReached": "आपने इस महीने की सभी कॉलें उपयोग कर ली हैं।",
        "bookingRequest.sosCall.errors.agreementInactive": "सेवा अस्थायी रूप से अनुपलब्ध है। अपने पार्टनर से संपर्क करें।",
        "bookingRequest.sosCall.errors.rateLimited": "बहुत अधिक प्रयास। कुछ मिनट बाद पुनः प्रयास करें।",
        "bookingRequest.sosCall.errors.network": "कोड सत्यापित नहीं किया जा सका। अपना कनेक्शन जाँचें।",
        "bookingRequest.sosCall.codeRequired": "कृपया अपना कोड दर्ज करें।",
        "bookingRequest.sosCall.mustValidate": "जारी रखने से पहले अपना SOS-Call कोड सत्यापित करें, या यदि आप सामान्य रूप से भुगतान करना चाहते हैं तो बॉक्स को अनचेक करें।",
    },
    "ch": {
        "bookingRequest.sosCall.gated.title": "通话由 <strong>{partnerName}</strong> 承担",
        "bookingRequest.sosCall.gated.titleNoPartner": "通话由您的合作伙伴承担",
        "bookingRequest.sosCall.gated.subtitle": "不会向您收取任何费用。",
        "bookingRequest.sosCall.gated.hint": "只需选择您心仪的专家，填写您的资料并发起通话。",
        "bookingRequest.sosCall.checkbox.label": "我有一个 SOS-Call 代码",
        "bookingRequest.sosCall.checkbox.description": "如果您的公司、银行或保险公司向您提供了个人代码，您的通话由合作伙伴承担——无需付费。",
        "bookingRequest.sosCall.input.label": "您的合作伙伴代码",
        "bookingRequest.sosCall.input.placeholder": "XXX-2026-XXXXX",
        "bookingRequest.sosCall.button.verify": "验证",
        "bookingRequest.sosCall.button.verifying": "验证中…",
        "bookingRequest.sosCall.button.retry": "重试",
        "bookingRequest.sosCall.button.continueWithoutCode": "继续而不使用代码（自费通话）",
        "bookingRequest.sosCall.validated.title": "代码已验证 — 通话由 <strong>{partnerName}</strong> 承担",
        "bookingRequest.sosCall.validated.titleNoPartner": "代码已验证 — 通话由您的合作伙伴承担",
        "bookingRequest.sosCall.validated.subtitle": "您不会被收费。",
        "bookingRequest.sosCall.button.modify": "更改代码",
        "bookingRequest.sosCall.button.cancel": "取消并自费通话",
        "bookingRequest.sosCall.errors.codeInvalid": "代码无法识别。请检查您的输入。",
        "bookingRequest.sosCall.errors.notFound": "未找到代码。如果您认为自己有权限，请联系合作伙伴。",
        "bookingRequest.sosCall.errors.expired": "您的访问已过期。请联系合作伙伴。",
        "bookingRequest.sosCall.errors.quotaReached": "您已用完本月的全部通话。",
        "bookingRequest.sosCall.errors.agreementInactive": "服务暂时不可用。请联系合作伙伴。",
        "bookingRequest.sosCall.errors.rateLimited": "尝试次数过多。请几分钟后再试。",
        "bookingRequest.sosCall.errors.network": "无法验证代码。请检查您的网络连接。",
        "bookingRequest.sosCall.codeRequired": "请输入您的代码。",
        "bookingRequest.sosCall.mustValidate": "继续之前请验证您的 SOS-Call 代码，或取消勾选复选框（如您希望正常付款）。",
    },
}

# zh.json (legacy alias) gets the same Chinese content as ch.json
TRANSLATIONS["zh"] = TRANSLATIONS["ch"]


def update_file(file_path: Path, translations: dict) -> bool:
    """Add bookingRequest.sosCall keys to a JSON helper file. Returns True if file was changed."""
    if not file_path.exists():
        return False
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=OrderedDict)

    changed = False
    for key, val in translations.items():
        if data.get(key) != val:
            data[key] = val
            changed = True

    if changed:
        with file_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
    return changed


def main():
    total = 0
    for loc in LOCATIONS:
        if not loc.exists():
            print(f"SKIP {loc} (does not exist)")
            continue
        for lang_code, translations in TRANSLATIONS.items():
            file_path = loc / f"{lang_code}.json"
            if not file_path.exists():
                print(f"SKIP {file_path} (not found)")
                continue
            if update_file(file_path, translations):
                print(f"OK {file_path.relative_to(ROOT)}")
                total += 1
            else:
                print(f"   {file_path.relative_to(ROOT)} (no change)")
    print(f"\n{total} file(s) updated.")


if __name__ == "__main__":
    main()
