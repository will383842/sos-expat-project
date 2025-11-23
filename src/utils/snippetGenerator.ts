/**
 * 🎯 GÉNÉRATEUR DE FEATURED SNIPPETS (Position 0)
 * =================================================
 * 
 * Génère automatiquement des structured data optimisés pour
 * les Featured Snippets Google pour chaque prestataire.
 * 
 * Couvre :
 * - 197 pays
 * - 9 langues (fr, en, es, de, pt, ru, zh, ar, hi)
 * - Avocats + Expats
 * - Toutes spécialités
 */

import { formatPublicName } from './slugGenerator';
import { getCountryName } from './formatters';
import { getLawyerSpecialityLabel } from '../data/lawyer-specialties';
import { getExpatHelpTypeLabel } from '../data/expat-help-types';

// ==========================================
// 📊 TYPES
// ==========================================

export interface SnippetProvider {
  firstName: string;
  lastName: string;
  type: 'lawyer' | 'expat';
  country: string;
  city?: string;
  languages: string[];
  specialties: string[];
  helpTypes?: string[];
  yearsOfExperience: number;
  yearsAsExpat?: number;
  rating: number;
  reviewCount: number;
  successRate?: number;
  totalCalls?: number;
  description?: string;
}

export interface SnippetConfig {
  locale: string;
  includePrice?: boolean;
  includeFAQ?: boolean;
  includeHowTo?: boolean;
  includeReviews?: boolean;
}

export interface GeneratedSnippet {
  faqSchema: object;
  howToSchema?: object;
  breadcrumbSchema: object;
  metaDescription: string;
  h1: string;
  h2List: string[];
  faqContent: Array<{ question: string; answer: string }>;
  howToContent?: Array<{ step: string; description: string }>;
}

// ==========================================
// 📝 TEMPLATES DE QUESTIONS PAR LANGUE
// ==========================================

const FAQ_TEMPLATES: Record<string, {
  lawyer: Array<{ question: string; answer: string }>;
  expat: Array<{ question: string; answer: string }>;
}> = {
  fr: {
    lawyer: [
      {
        question: "Comment contacter {name} ?",
        answer: "{name} est disponible sur SOS Expat & Travelers pour des consultations en ligne. Vous pouvez réserver un appel vidéo sécurisé directement depuis son profil. {pronounHe} parle {languages} et {pronounIs} spécialisé{eAgreement} en {specialties}."
      },
      {
        question: "Quelles sont les spécialités de {name} ?",
        answer: "{name} est {title} en {country} avec {years} ans d'expérience. {pronounHis} spécialités incluent : {specialties}. {pronounHe} a traité {calls} dossiers avec un taux de réussite de {successRate}%."
      },
      {
        question: "Combien coûte une consultation avec {name} ?",
        answer: "Une consultation vidéo de 30 minutes avec {name} coûte {price}. Le paiement est sécurisé et vous pouvez réserver un créneau immédiatement si {pronounHe} est disponible en ligne."
      },
      {
        question: "Dans quels pays {name} peut-il intervenir ?",
        answer: "{name} intervient principalement en {country}{cityInfo}. {pronounHe} est également en mesure de vous conseiller sur des questions internationales liées à {specialties}."
      },
      {
        question: "Quels avis ont les clients de {name} ?",
        answer: "{name} a une note moyenne de {rating}/5 basée sur {reviewCount} avis clients. {pronounHis} clients apprécient particulièrement {pronounHis} expertise en {specialties} et {pronounHis} disponibilité."
      },
      {
        question: "Pourquoi choisir {name} comme avocat en {country} ?",
        answer: "Avec {years} ans d'expérience en {country}, {name} combine expertise juridique et connaissance approfondie du contexte local. {pronounHe} parle couramment {languages}, facilitant la communication avec les clients francophones et internationaux."
      }
    ],
    expat: [
      {
        question: "Comment {name} peut-il aider les expatriés en {country} ?",
        answer: "{name} est {title} en {country} avec {years} ans d'expérience d'expatriation. {pronounHe} peut vous aider sur : {helpTypes}. {pronounHe} parle {languages} et comprend parfaitement les défis de l'expatriation."
      },
      {
        question: "Quels services propose {name} aux expatriés ?",
        answer: "{name} propose des consultations personnalisées pour les expatriés, voyageurs et vacanciers en {country}. {pronounHis} domaines d'expertise incluent : {helpTypes}. {pronounHe} partage {pronounHis} expérience pratique acquise pendant {years} ans."
      },
      {
        question: "Combien coûte une consultation avec {name} ?",
        answer: "Une session de conseil de 30 minutes avec {name} coûte {price}. Vous bénéficiez de conseils pratiques basés sur {pronounHis} expérience personnelle de {years} ans en {country}."
      },
      {
        question: "Pourquoi faire appel à {name} pour s'expatrier en {country} ?",
        answer: "Ayant vécu {years} ans en {country}, {name} connaît tous les aspects pratiques de l'expatriation. {pronounHe} peut vous éviter les erreurs courantes et vous faire gagner un temps précieux sur : {helpTypes}."
      },
      {
        question: "Quels avis ont les expatriés sur {name} ?",
        answer: "{name} a aidé {calls} expatriés avec une satisfaction de {successRate}%. Les clients apprécient particulièrement {pronounHis} conseils pratiques sur {helpTypes} et {pronounHis} disponibilité pour répondre aux questions."
      },
      {
        question: "Dans quelle langue {name} peut-il conseiller ?",
        answer: "{name} parle couramment {languages}, ce qui permet de communiquer facilement avec les expatriés de différentes nationalités en {country}. Cette polyglossie est un atout majeur pour comprendre les nuances culturelles."
      }
    ]
  },
  en: {
    lawyer: [
      {
        question: "How to contact {name}?",
        answer: "{name} is available on SOS Expat & Travelers for online consultations. You can book a secure video call directly from {pronounHis} profile. {pronounHe} speaks {languages} and specializes in {specialties}."
      },
      {
        question: "What are {name}'s specialties?",
        answer: "{name} is {title} in {country} with {years} years of experience. {pronounHis} specialties include: {specialties}. {pronounHe} has handled {calls} cases with a {successRate}% success rate."
      },
      {
        question: "How much does a consultation with {name} cost?",
        answer: "A 30-minute video consultation with {name} costs {price}. Payment is secure and you can book a slot immediately if {pronounHe} is available online."
      },
      {
        question: "In which countries can {name} intervene?",
        answer: "{name} primarily operates in {country}{cityInfo}. {pronounHe} can also advise you on international matters related to {specialties}."
      },
      {
        question: "What reviews do {name}'s clients give?",
        answer: "{name} has an average rating of {rating}/5 based on {reviewCount} client reviews. Clients particularly appreciate {pronounHis} expertise in {specialties} and availability."
      },
      {
        question: "Why choose {name} as a lawyer in {country}?",
        answer: "With {years} years of experience in {country}, {name} combines legal expertise with deep local context knowledge. {pronounHe} speaks {languages} fluently, facilitating communication with francophone and international clients."
      }
    ],
    expat: [
      {
        question: "How can {name} help expats in {country}?",
        answer: "{name} is {title} in {country} with {years} years of expatriation experience. {pronounHe} can help you with: {helpTypes}. {pronounHe} speaks {languages} and understands expat challenges perfectly."
      },
      {
        question: "What services does {name} offer to expats?",
        answer: "{name} offers personalized consultations for expats, travelers, and vacationers in {country}. {pronounHis} areas of expertise include: {helpTypes}. {pronounHe} shares practical experience gained over {years} years."
      },
      {
        question: "How much does a consultation with {name} cost?",
        answer: "A 30-minute advice session with {name} costs {price}. You benefit from practical advice based on {pronounHis} {years} years of personal experience in {country}."
      },
      {
        question: "Why use {name} to relocate to {country}?",
        answer: "Having lived {years} years in {country}, {name} knows all practical aspects of expatriation. {pronounHe} can help you avoid common mistakes and save precious time on: {helpTypes}."
      },
      {
        question: "What reviews do expats give about {name}?",
        answer: "{name} has helped {calls} expats with {successRate}% satisfaction. Clients particularly appreciate {pronounHis} practical advice on {helpTypes} and availability to answer questions."
      },
      {
        question: "In what language can {name} advise?",
        answer: "{name} speaks {languages} fluently, which allows easy communication with expats of different nationalities in {country}. This multilingualism is a major asset for understanding cultural nuances."
      }
    ]
  },
  es: {
    lawyer: [
      {
        question: "¿Cómo contactar a {name}?",
        answer: "{name} está disponible en SOS Expat & Travelers para consultas en línea. Puede reservar una videollamada segura directamente desde su perfil. Habla {languages} y se especializa en {specialties}."
      },
      {
        question: "¿Cuáles son las especialidades de {name}?",
        answer: "{name} es {title} en {country} con {years} años de experiencia. Sus especialidades incluyen: {specialties}. Ha manejado {calls} casos con una tasa de éxito del {successRate}%."
      },
      {
        question: "¿Cuánto cuesta una consulta con {name}?",
        answer: "Una consulta de video de 30 minutos con {name} cuesta {price}. El pago es seguro y puede reservar inmediatamente si está disponible en línea."
      },
      {
        question: "¿En qué países puede intervenir {name}?",
        answer: "{name} opera principalmente en {country}{cityInfo}. También puede asesorarle sobre asuntos internacionales relacionados con {specialties}."
      },
      {
        question: "¿Qué opiniones tienen los clientes de {name}?",
        answer: "{name} tiene una calificación promedio de {rating}/5 basada en {reviewCount} opiniones de clientes. Los clientes aprecian especialmente su experiencia en {specialties} y disponibilidad."
      },
      {
        question: "¿Por qué elegir a {name} como abogado en {country}?",
        answer: "Con {years} años de experiencia en {country}, {name} combina experiencia legal con conocimiento profundo del contexto local. Habla {languages} con fluidez, facilitando la comunicación con clientes internacionales."
      }
    ],
    expat: [
      {
        question: "¿Cómo puede {name} ayudar a los expatriados en {country}?",
        answer: "{name} es {title} en {country} con {years} años de experiencia de expatriación. Puede ayudarle con: {helpTypes}. Habla {languages} y entiende perfectamente los desafíos de la expatriación."
      },
      {
        question: "¿Qué servicios ofrece {name} a los expatriados?",
        answer: "{name} ofrece consultas personalizadas para expatriados, viajeros y vacacionistas en {country}. Sus áreas de experiencia incluyen: {helpTypes}. Comparte experiencia práctica adquirida durante {years} años."
      },
      {
        question: "¿Cuánto cuesta una consulta con {name}?",
        answer: "Una sesión de asesoramiento de 30 minutos con {name} cuesta {price}. Obtiene consejos prácticos basados en {years} años de experiencia personal en {country}."
      },
      {
        question: "¿Por qué recurrir a {name} para expatriarse a {country}?",
        answer: "Habiendo vivido {years} años en {country}, {name} conoce todos los aspectos prácticos de la expatriación. Puede ayudarle a evitar errores comunes y ahorrar tiempo valioso en: {helpTypes}."
      },
      {
        question: "¿Qué opiniones tienen los expatriados sobre {name}?",
        answer: "{name} ha ayudado a {calls} expatriados con una satisfacción del {successRate}%. Los clientes aprecian especialmente sus consejos prácticos sobre {helpTypes} y su disponibilidad."
      },
      {
        question: "¿En qué idioma puede asesorar {name}?",
        answer: "{name} habla {languages} con fluidez, lo que permite una comunicación fácil con expatriados de diferentes nacionalidades en {country}. Este multilingüismo es una ventaja importante."
      }
    ]
  },
  de: {
    lawyer: [
      {
        question: "Wie kann ich {name} kontaktieren?",
        answer: "{name} ist auf SOS Expat & Travelers für Online-Beratungen verfügbar. Sie können direkt über sein Profil einen sicheren Videoanruf buchen. Er spricht {languages} und ist spezialisiert auf {specialties}."
      },
      {
        question: "Was sind die Spezialgebiete von {name}?",
        answer: "{name} ist {title} in {country} mit {years} Jahren Erfahrung. Seine Spezialgebiete umfassen: {specialties}. Er hat {calls} Fälle mit einer Erfolgsquote von {successRate}% bearbeitet."
      },
      {
        question: "Wie viel kostet eine Beratung mit {name}?",
        answer: "Eine 30-minütige Videoberatung mit {name} kostet {price}. Die Zahlung ist sicher und Sie können sofort einen Termin buchen, wenn er online verfügbar ist."
      },
      {
        question: "In welchen Ländern kann {name} tätig werden?",
        answer: "{name} ist hauptsächlich in {country}{cityInfo} tätig. Er kann Sie auch zu internationalen Angelegenheiten im Zusammenhang mit {specialties} beraten."
      },
      {
        question: "Welche Bewertungen geben die Kunden von {name}?",
        answer: "{name} hat eine Durchschnittsbewertung von {rating}/5 basierend auf {reviewCount} Kundenbewertungen. Kunden schätzen besonders seine Expertise in {specialties} und Verfügbarkeit."
      },
      {
        question: "Warum {name} als Anwalt in {country} wählen?",
        answer: "Mit {years} Jahren Erfahrung in {country} kombiniert {name} juristische Expertise mit tiefem lokalen Kontextwissen. Er spricht fließend {languages}, was die Kommunikation mit internationalen Kunden erleichtert."
      }
    ],
    expat: [
      {
        question: "Wie kann {name} Expats in {country} helfen?",
        answer: "{name} ist {title} in {country} mit {years} Jahren Expat-Erfahrung. Er kann Ihnen helfen bei: {helpTypes}. Er spricht {languages} und versteht die Herausforderungen der Expatriierung perfekt."
      },
      {
        question: "Welche Dienstleistungen bietet {name} Expats an?",
        answer: "{name} bietet personalisierte Beratungen für Expats, Reisende und Urlauber in {country} an. Seine Fachgebiete umfassen: {helpTypes}. Er teilt praktische Erfahrungen aus {years} Jahren."
      },
      {
        question: "Wie viel kostet eine Beratung mit {name}?",
        answer: "Eine 30-minütige Beratungssitzung mit {name} kostet {price}. Sie profitieren von praktischen Ratschlägen basierend auf {years} Jahren persönlicher Erfahrung in {country}."
      },
      {
        question: "Warum {name} für die Auswanderung nach {country} nutzen?",
        answer: "Nach {years} Jahren in {country} kennt {name} alle praktischen Aspekte der Expatriierung. Er kann Ihnen helfen, häufige Fehler zu vermeiden und wertvolle Zeit zu sparen bei: {helpTypes}."
      },
      {
        question: "Welche Bewertungen geben Expats über {name}?",
        answer: "{name} hat {calls} Expats mit {successRate}% Zufriedenheit geholfen. Kunden schätzen besonders seine praktischen Ratschläge zu {helpTypes} und seine Verfügbarkeit."
      },
      {
        question: "In welcher Sprache kann {name} beraten?",
        answer: "{name} spricht fließend {languages}, was eine einfache Kommunikation mit Expats verschiedener Nationalitäten in {country} ermöglicht. Diese Mehrsprachigkeit ist ein großer Vorteil."
      }
    ]
  },
  pt: {
    lawyer: [
      {
        question: "Como contactar {name}?",
        answer: "{name} está disponível no SOS Expat & Travelers para consultas online. Pode reservar uma videochamada segura diretamente do seu perfil. Fala {languages} e é especializado em {specialties}."
      },
      {
        question: "Quais são as especialidades de {name}?",
        answer: "{name} é {title} em {country} com {years} anos de experiência. As suas especialidades incluem: {specialties}. Tratou {calls} casos com uma taxa de sucesso de {successRate}%."
      },
      {
        question: "Quanto custa uma consulta com {name}?",
        answer: "Uma consulta de vídeo de 30 minutos com {name} custa {price}. O pagamento é seguro e pode reservar imediatamente se estiver disponível online."
      },
      {
        question: "Em que países {name} pode intervir?",
        answer: "{name} opera principalmente em {country}{cityInfo}. Também pode aconselhá-lo sobre assuntos internacionais relacionados com {specialties}."
      },
      {
        question: "Que avaliações os clientes de {name} dão?",
        answer: "{name} tem uma classificação média de {rating}/5 com base em {reviewCount} avaliações de clientes. Os clientes apreciam especialmente a sua experiência em {specialties} e disponibilidade."
      },
      {
        question: "Por que escolher {name} como advogado em {country}?",
        answer: "Com {years} anos de experiência em {country}, {name} combina expertise jurídica com conhecimento profundo do contexto local. Fala fluentemente {languages}, facilitando a comunicação com clientes internacionais."
      }
    ],
    expat: [
      {
        question: "Como {name} pode ajudar expatriados em {country}?",
        answer: "{name} é {title} em {country} com {years} anos de experiência de expatriação. Pode ajudá-lo com: {helpTypes}. Fala {languages} e compreende perfeitamente os desafios da expatriação."
      },
      {
        question: "Que serviços {name} oferece aos expatriados?",
        answer: "{name} oferece consultas personalizadas para expatriados, viajantes e turistas em {country}. As suas áreas de especialização incluem: {helpTypes}. Partilha experiência prática adquirida durante {years} anos."
      },
      {
        question: "Quanto custa uma consulta com {name}?",
        answer: "Uma sessão de aconselhamento de 30 minutos com {name} custa {price}. Beneficia de conselhos práticos baseados em {years} anos de experiência pessoal em {country}."
      },
      {
        question: "Por que recorrer a {name} para expatriar-se para {country}?",
        answer: "Tendo vivido {years} anos em {country}, {name} conhece todos os aspectos práticos da expatriação. Pode ajudá-lo a evitar erros comuns e poupar tempo precioso em: {helpTypes}."
      },
      {
        question: "Que avaliações os expatriados dão sobre {name}?",
        answer: "{name} ajudou {calls} expatriados com {successRate}% de satisfação. Os clientes apreciam especialmente os seus conselhos práticos sobre {helpTypes} e disponibilidade."
      },
      {
        question: "Em que língua {name} pode aconselhar?",
        answer: "{name} fala fluentemente {languages}, o que permite comunicação fácil com expatriados de diferentes nacionalidades em {country}. Este multilinguismo é uma grande vantagem."
      }
    ]
  },
  ru: {
    lawyer: [
      {
        question: "Как связаться с {name}?",
        answer: "{name} доступен на SOS Expat & Travelers для онлайн-консультаций. Вы можете забронировать безопасный видеозвонок прямо из его профиля. Он говорит на {languages} и специализируется на {specialties}."
      },
      {
        question: "Какие специализации у {name}?",
        answer: "{name} - {title} в {country} с опытом {years} лет. Его специализации включают: {specialties}. Он рассмотрел {calls} дел с показателем успеха {successRate}%."
      },
      {
        question: "Сколько стоит консультация с {name}?",
        answer: "30-минутная видеоконсультация с {name} стоит {price}. Оплата безопасна, и вы можете забронировать сразу, если он доступен онлайн."
      },
      {
        question: "В каких странах {name} может оказать помощь?",
        answer: "{name} работает в основном в {country}{cityInfo}. Он также может консультировать по международным вопросам, связанным с {specialties}."
      },
      {
        question: "Какие отзывы у клиентов {name}?",
        answer: "У {name} средний рейтинг {rating}/5 на основе {reviewCount} отзывов клиентов. Клиенты особенно ценят его опыт в {specialties} и доступность."
      },
      {
        question: "Почему выбрать {name} в качестве юриста в {country}?",
        answer: "С опытом {years} лет в {country}, {name} сочетает юридический опыт с глубоким знанием местного контекста. Он свободно говорит на {languages}, облегчая общение с международными клиентами."
      }
    ],
    expat: [
      {
        question: "Как {name} может помочь экспатам в {country}?",
        answer: "{name} - {title} в {country} с опытом экспатриации {years} лет. Он может помочь вам с: {helpTypes}. Он говорит на {languages} и прекрасно понимает проблемы экспатриации."
      },
      {
        question: "Какие услуги {name} предлагает экспатам?",
        answer: "{name} предлагает персонализированные консультации для экспатов, путешественников и отдыхающих в {country}. Его области экспертизы включают: {helpTypes}. Он делится практическим опытом, полученным за {years} лет."
      },
      {
        question: "Сколько стоит консультация с {name}?",
        answer: "30-минутная консультация с {name} стоит {price}. Вы получаете практические советы, основанные на {years} годах личного опыта в {country}."
      },
      {
        question: "Почему обратиться к {name} для переезда в {country}?",
        answer: "Прожив {years} лет в {country}, {name} знает все практические аспекты экспатриации. Он может помочь избежать типичных ошибок и сэкономить время на: {helpTypes}."
      },
      {
        question: "Какие отзывы экспаты дают о {name}?",
        answer: "{name} помог {calls} экспатам с удовлетворенностью {successRate}%. Клиенты особенно ценят его практические советы по {helpTypes} и доступность."
      },
      {
        question: "На каком языке {name} может консультировать?",
        answer: "{name} свободно говорит на {languages}, что позволяет легко общаться с экспатами разных национальностей в {country}. Это многоязычие - большое преимущество."
      }
    ]
  },
  // Ajouter zh, ar, hi...
};

// ==========================================
// 🔧 FONCTIONS UTILITAIRES
// ==========================================

/**
 * Obtient les pronoms selon le genre (par défaut neutre/masculin)
 */
function getPronouns(locale: string): {
  pronounHe: string;
  pronounHis: string;
  pronounIs: string;
  eAgreement: string;
} {
  const pronouns: Record<string, any> = {
    fr: { pronounHe: 'Il', pronounHis: 'Ses', pronounIs: 'est', eAgreement: '' },
    en: { pronounHe: 'He', pronounHis: 'His', pronounIs: 'is', eAgreement: '' },
    es: { pronounHe: 'Él', pronounHis: 'Sus', pronounIs: 'está', eAgreement: 'o' },
    de: { pronounHe: 'Er', pronounHis: 'Seine', pronounIs: 'ist', eAgreement: '' },
    pt: { pronounHe: 'Ele', pronounHis: 'Seus', pronounIs: 'está', eAgreement: '' },
    ru: { pronounHe: 'Он', pronounHis: 'Его', pronounIs: 'является', eAgreement: '' },
  };
  return pronouns[locale] || pronouns['en'];
}

/**
 * Remplace les placeholders dans un template
 */
function replacePlaceholders(
  template: string,
  provider: SnippetProvider,
  locale: string,
  additionalVars: Record<string, string> = {}
): string {
  const name = formatPublicName(provider);
  const country = getCountryName(provider.country, locale as any);
  const pronouns = getPronouns(locale);
  
  const title = provider.type === 'lawyer'
    ? (locale === 'fr' ? 'avocat' : locale === 'en' ? 'lawyer' : 'abogado')
    : (locale === 'fr' ? 'expert expatrié' : locale === 'en' ? 'expat expert' : 'experto expatriado');
  
  const languages = provider.languages.join(', ');
  
  // ✅ CORRECTION BUG 3 : Traduire les codes en labels
  const specialties = (provider.specialties || [])
    .map(code => getLawyerSpecialityLabel(code, locale as any))
    .join(', ');
  
  const helpTypes = (provider.helpTypes || [])
    .map(code => getExpatHelpTypeLabel(code, locale as any))
    .join(', ');
  
  const years = provider.yearsAsExpat || provider.yearsOfExperience || 0;
  const rating = provider.rating || 0;
  const reviewCount = provider.reviewCount || 0;
  const successRate = provider.successRate || 95;
  const calls = provider.totalCalls || 0;
  const cityInfo = provider.city ? ` (${provider.city})` : '';
  
  let result = template
    .replace(/{name}/g, name)
    .replace(/{country}/g, country)
    .replace(/{title}/g, title)
    .replace(/{languages}/g, languages)
    .replace(/{specialties}/g, specialties)
    .replace(/{helpTypes}/g, helpTypes)
    .replace(/{years}/g, String(years))
    .replace(/{rating}/g, String(rating.toFixed(1)))
    .replace(/{reviewCount}/g, String(reviewCount))
    .replace(/{successRate}/g, String(successRate))
    .replace(/{calls}/g, String(calls))
    .replace(/{cityInfo}/g, cityInfo)
    .replace(/{pronounHe}/g, pronouns.pronounHe)
    .replace(/{pronounHis}/g, pronouns.pronounHis)
    .replace(/{pronounIs}/g, pronouns.pronounIs)
    .replace(/{eAgreement}/g, pronouns.eAgreement);
  
  // Remplacer les variables additionnelles
  Object.keys(additionalVars).forEach(key => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), additionalVars[key]);
  });
  
  return result;
}

// ==========================================
// 🎯 GÉNÉRATION DES SNIPPETS
// ==========================================

/**
 * Génère tous les snippets optimisés pour un prestataire
 */
export function generateSnippets(
  provider: SnippetProvider,
  config: SnippetConfig
): GeneratedSnippet {
  const { locale, includePrice = true, includeFAQ = true } = config;
  
  const baseLang = locale.split('-')[0];
  const templates = FAQ_TEMPLATES[baseLang] || FAQ_TEMPLATES['en'];
  const providerTemplates = provider.type === 'lawyer' ? templates.lawyer : templates.expat;
  
  // Générer les FAQ
  const faqContent = providerTemplates.map(template => ({
    question: replacePlaceholders(template.question, provider, baseLang),
    answer: replacePlaceholders(template.answer, provider, baseLang, {
      price: includePrice ? '49€' : 'contactez-nous'
    })
  }));
  
  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqContent.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  
  // Breadcrumb Schema
  const name = formatPublicName(provider);
  const country = getCountryName(provider.country, baseLang as any);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://sos-expat.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": provider.type === 'lawyer' ? 'Lawyers' : 'Expats',
        "item": `https://sos-expat.com/${provider.type === 'lawyer' ? 'lawyers' : 'expats'}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": country,
        "item": `https://sos-expat.com/${provider.type === 'lawyer' ? 'lawyers' : 'expats'}/${provider.country.toLowerCase()}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": name
      }
    ]
  };
  
  // Meta Description optimisée
  const metaDescription = faqContent[0]?.answer.slice(0, 160) || '';
  
  // H1 optimisé
  const h1 = baseLang === 'fr'
    ? `${name} - ${provider.type === 'lawyer' ? 'Avocat' : 'Expert Expatrié'} ${provider.languages[0]} en ${country}`
    : `${name} - ${provider.type === 'lawyer' ? 'Lawyer' : 'Expat Expert'} in ${country}`;
  
  // H2 optimisés
  const h2List = [
    baseLang === 'fr' ? `Spécialités de ${name}` : `${name}'s Specialties`,
    baseLang === 'fr' ? `Pourquoi choisir ${name} ?` : `Why choose ${name}?`,
    baseLang === 'fr' ? `Avis clients` : `Client Reviews`,
    baseLang === 'fr' ? `Réserver une consultation` : `Book a Consultation`,
    baseLang === 'fr' ? `Questions fréquentes` : `Frequently Asked Questions`
  ];
  
  return {
    faqSchema,
    breadcrumbSchema,
    metaDescription,
    h1,
    h2List,
    faqContent
  };
}

/**
 * Génère le JSON-LD complet pour injection dans <head>
 */
export function generateJSONLD(provider: SnippetProvider, config: SnippetConfig): string {
  const snippets = generateSnippets(provider, config);
  
  const jsonLDArray = [
    snippets.faqSchema,
    snippets.breadcrumbSchema
  ];
  
  return JSON.stringify(jsonLDArray);
}