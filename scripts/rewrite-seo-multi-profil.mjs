#!/usr/bin/env node
/**
 * Rewrite SEO meta keys in the 9 i18n JSON files to cover all 6
 * audience profiles (travelers, tourists, expats, digital nomads,
 * students, retirees) instead of expat-only.
 *
 * Pages covered per language:
 *   - consumers.seo.{title, description, keywords}
 *   - press.seo.{title, description, keywords}
 *   - providers.seo.{title, description, keywords}
 *   - pricing.seo.{aiSummary, keywords}
 *   - sosCall.seo.{professionalServiceName, serviceType, topic}
 *   - sosCall.faq.subtitle
 *   - og.title, og.description, twitter.title, twitter.description
 *
 * FR + EN already done manually — this script covers es/de/pt/ru/zh/hi/ar.
 *
 * Usage:
 *   node scripts/rewrite-seo-multi-profil.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const helperDir = path.join(__dirname, "..", "sos", "src", "helper");

// Localized copy per language
const TRANSLATIONS = {
  fr: {
    consumers_title: "Aide rapide & droits à l'étranger — voyageurs, expatriés, nomades | SOS-Expat",
    consumers_description: "Ressources, droits et aide téléphonique pour voyageurs, vacanciers, expatriés, digital nomades, étudiants et retraités à l'étranger. Avocats et expatriés aidants accessibles en 5 min dans 197 pays, 9 langues, 24h/24.",
    consumers_keywords: "droits voyageur étranger, droits consommateur expatrié, litige hôtel étranger, litige location vacances, aide consommateur voyage, protection consommateur international, assistance rapide étranger, avocat accessible voyageur, expatrié aidant, digital nomad droits, étudiant étranger droits, retraité étranger droits, urgence à l'étranger, 197 pays, 24h/24",
    press_title: "Espace Presse — SOS-Expat | Urgence à l'étranger, avocat ou expatrié aidant en 5 min",
    press_description: "Espace presse SOS-Expat. Communiqués, dossier, logos HD, photos, données Grand Sondage 2026 (CC BY). Plateforme d'aide téléphonique en 5 min à un avocat ou un expatrié aidant — voyageurs, vacanciers, expatriés, digital nomades, étudiants, retraités. 197 pays, 24h/24.",
    press_keywords: "espace presse SOS-Expat, communiqué de presse urgence étranger, aide voyageur bloqué à l'étranger, plateforme urgence 5 minutes, aide rapide expatrié, dossier de presse, logos HD, photos presse, avocat international téléphone, expatrié aidant, digital nomad aide, étudiant étranger aide, retraité étranger aide, start-up Tallinn, Grand Sondage Expat 2026",
    providers_title: "Avocats & expatriés aidants — 197 pays, 9 langues, téléphone en 5 min | SOS-Expat",
    providers_description: "Consultez nos avocats francophones et expatriés aidants vérifiés dans 197 pays, pour tous profils : voyageurs, vacanciers, expatriés, digital nomades, étudiants, retraités. Urgence, question juridique, renseignement administratif ou conseil rapide. Appel en 5 min, 9 langues, 24h/24.",
    providers_keywords: "avocat francophone étranger, avocat anglophone international, expatrié aidant, expatrié mentor, consultation téléphonique rapide, avocat 5 minutes, conseil expatrié, aide voyageur étranger, aide digital nomade, aide étudiant étranger, aide retraité étranger, aide backpacker, aide touriste étranger, avocat accessible, consultation rapide, 197 pays, 9 langues, 24h/24",
    pricing_aiSummary: "Tarifs transparents pour les consultations téléphoniques avec avocats et expatriés aidants sur SOS-Expat — de la question rapide au dossier complexe, pour tous profils à l'étranger",
    pricing_keywords: "tarifs consultation avocat étranger, prix avocat téléphone, tarifs expatrié aidant, tarifs aide urgence étranger, tarifs conseil voyageur, tarifs aide digital nomade, consultation pay-per-call, avocat sans abonnement, aide rapide étranger tarif, consultation rapide prix",
    sosCall_faq_subtitle: "Tout ce que vous devez savoir sur notre service d'aide téléphonique rapide à l'étranger — pour voyageurs, vacanciers, expatriés, digital nomades, étudiants et retraités",
    sosCall_professionalServiceName: "Service professionnel d'aide téléphonique à l'étranger — avocats et expatriés aidants",
    sosCall_serviceType: "Consultation téléphonique rapide à l'étranger — urgence, conseil, renseignement juridique ou administratif",
    sosCall_topic: "Aide rapide à l'étranger — urgence, conseil juridique, renseignement administratif pour voyageurs, vacanciers, expatriés, nomades digitaux, étudiants, retraités",
    og_title: "SOS-Expat · À l'étranger ? Avocat ou expatrié aidant au téléphone en 5 min",
    howItWorks_aiSummary: "Guide pas-à-pas : comment obtenir en moins de 5 minutes une aide téléphonique à l'étranger auprès d'un avocat ou d'un expatrié aidant. Pour voyageurs, vacanciers, expatriés, digital nomades, étudiants et retraités. Urgence ou simple question.",
    howItWorks_keywords: "comment joindre avocat à l'étranger, comment avoir aide rapide expatrié, comment contacter expatrié aidant, consultation téléphonique rapide, aide urgence étranger, procédure simple appel avocat, étapes aide expatrié, 5 minutes téléphone, question rapide avocat, consultation sans abonnement, comment fonctionne SOS-Expat",
    testy_description: "Témoignages de voyageurs, vacanciers, expatriés, digital nomades, étudiants et retraités aidés en moins de 5 minutes à l'étranger par un avocat ou un expatrié aidant. 197 pays, toutes langues.",
    testy_title: "Avis & Témoignages — Ils ont été aidés en 5 min à l'étranger | SOS-Expat",
  },
  en: {
    consumers_title: "Fast help & rights abroad — travelers, expats, nomads, students | SOS-Expat",
    consumers_description: "Resources, rights and phone help for travelers, tourists, expats, digital nomads, students and retirees abroad. Lawyers and helpful expats reachable in 5 min in 197 countries, 9 languages, 24/7.",
    consumers_keywords: "traveler rights abroad, expat consumer rights, hotel dispute abroad, vacation rental dispute, consumer protection abroad, quick help abroad, approachable lawyer traveler, helpful expat, digital nomad rights, student abroad rights, retiree abroad rights, emergency abroad, 197 countries, 24/7",
    press_title: "Press Room — SOS-Expat | Emergency abroad, lawyer or helpful expat in 5 min",
    press_description: "SOS-Expat Press Room. Releases, press kit, HD logos, photos, Grand Expat & Traveler Survey 2026 data (CC BY). Phone-help platform connecting travelers, tourists, expats, digital nomads, students and retirees to a lawyer or helpful expat in under 5 min. 197 countries, 24/7.",
    press_keywords: "SOS-Expat press room, press release abroad emergency, traveler stuck abroad help, 5-minute emergency platform, quick help expat, press kit, HD logos, press photos, international lawyer phone, helpful expat, digital nomad help, student abroad help, retiree abroad help, Tallinn startup, Grand Expat Survey 2026",
    providers_title: "Lawyers & helpful expats — 197 countries, 9 languages, phone in 5 min | SOS-Expat",
    providers_description: "Browse verified English-speaking lawyers and helpful expats in 197 countries, for all audiences: travelers, tourists, expats, digital nomads, students, retirees. Emergency, legal question, admin info or quick advice. Call in 5 min, 9 languages, 24/7.",
    providers_keywords: "english speaking lawyer abroad, multilingual lawyer international, helpful expat, expat mentor, quick phone consultation, lawyer 5 minutes, expat advice, traveler help abroad, digital nomad help, student abroad help, retiree abroad help, backpacker help, tourist abroad help, approachable lawyer, quick consultation, 197 countries, 9 languages, 24/7",
    pricing_aiSummary: "Transparent pricing for phone consultations with lawyers and helpful expats on SOS-Expat — from quick question to complex case, for all audiences abroad",
    pricing_keywords: "lawyer abroad consultation price, phone lawyer price, helpful expat price, emergency help abroad price, traveler advice price, digital nomad help price, pay-per-call consultation, lawyer no subscription, quick help abroad rate, fast consultation pricing",
    sosCall_faq_subtitle: "Everything you need to know about our fast phone-help service abroad — for travelers, tourists, expats, digital nomads, students and retirees",
    sosCall_professionalServiceName: "Professional phone-help service abroad — approachable lawyers and helpful expats",
    sosCall_serviceType: "Fast phone consultation abroad — emergency, advice, legal or administrative information",
    sosCall_topic: "Quick help abroad — emergency, legal advice, admin info for travelers, tourists, expats, digital nomads, students, retirees",
    og_title: "SOS-Expat · Abroad? Lawyer or helpful expat on the phone in 5 min",
    howItWorks_aiSummary: "Step-by-step guide: how to get phone help abroad in under 5 minutes from a lawyer or a helpful expat. For travelers, tourists, expats, digital nomads, students and retirees. Emergency or just a quick question.",
    howItWorks_keywords: "how to reach lawyer abroad, how to get quick expat help, how to contact helpful expat, fast phone consultation, emergency abroad help, simple call procedure, expat help steps, 5 minutes phone, quick lawyer question, consultation no subscription, how SOS-Expat works",
    testy_description: "Testimonials from travelers, tourists, expats, digital nomads, students and retirees who got help abroad in under 5 min from a lawyer or a helpful expat. 197 countries, all languages.",
    testy_title: "Reviews & Testimonials — They got help abroad in 5 min | SOS-Expat",
  },
  es: {
    consumers_title: "Ayuda rápida y derechos en el extranjero — viajeros, expatriados, nómadas, estudiantes | SOS-Expat",
    consumers_description: "Recursos, derechos y ayuda telefónica para viajeros, turistas, expatriados, nómadas digitales, estudiantes y jubilados en el extranjero. Abogados y expatriados ayudantes accesibles en 5 min, 197 países, 9 idiomas, 24/7.",
    consumers_keywords: "derechos viajero extranjero, derechos consumidor expatriado, disputa hotel extranjero, disputa alquiler vacacional, ayuda consumidor viaje, protección consumidor internacional, ayuda rápida extranjero, abogado accesible viajero, expatriado ayudante, derechos nómada digital, derechos estudiante extranjero, derechos jubilado extranjero, emergencia extranjero, 197 países, 24/7",
    press_title: "Sala de prensa — SOS-Expat | Emergencia en el extranjero, abogado o expatriado en 5 min",
    press_description: "Sala de prensa SOS-Expat. Comunicados, dossier, logos HD, fotos, datos Gran Encuesta Expat & Viajero 2026 (CC BY). Plataforma de ayuda telefónica que conecta a viajeros, turistas, expatriados, nómadas digitales, estudiantes y jubilados con un abogado o expatriado ayudante en menos de 5 min. 197 países, 24/7.",
    press_keywords: "sala de prensa SOS-Expat, comunicado emergencia extranjero, ayuda viajero bloqueado, plataforma urgencia 5 minutos, ayuda rápida expatriado, dossier de prensa, logos HD, fotos prensa, abogado internacional teléfono, expatriado ayudante, ayuda nómada digital, ayuda estudiante extranjero, ayuda jubilado extranjero, startup Tallinn, Gran Encuesta Expat 2026",
    providers_title: "Abogados y expatriados ayudantes — 197 países, 9 idiomas, teléfono en 5 min | SOS-Expat",
    providers_description: "Consulta nuestros abogados hispanohablantes y expatriados ayudantes verificados en 197 países, para todos los perfiles: viajeros, turistas, expatriados, nómadas digitales, estudiantes, jubilados. Emergencia, pregunta jurídica, información administrativa o consejo rápido. Llamada en 5 min, 9 idiomas, 24/7.",
    providers_keywords: "abogado hispanohablante extranjero, abogado multilingüe internacional, expatriado ayudante, expatriado mentor, consulta telefónica rápida, abogado 5 minutos, consejo expatriado, ayuda viajero extranjero, ayuda nómada digital, ayuda estudiante extranjero, ayuda jubilado extranjero, ayuda mochilero, ayuda turista, abogado accesible, consulta rápida, 197 países, 9 idiomas, 24/7",
    pricing_aiSummary: "Precios transparentes para consultas telefónicas con abogados y expatriados ayudantes en SOS-Expat — desde la pregunta rápida hasta el caso complejo, para todos los perfiles en el extranjero",
    pricing_keywords: "precio consulta abogado extranjero, precio abogado teléfono, precio expatriado ayudante, precio ayuda urgencia extranjero, precio consejo viajero, precio ayuda nómada digital, consulta pago por llamada, abogado sin suscripción, tarifa ayuda rápida extranjero, precio consulta rápida",
    sosCall_faq_subtitle: "Todo lo que necesitas saber sobre nuestro servicio de ayuda telefónica rápida en el extranjero — para viajeros, turistas, expatriados, nómadas digitales, estudiantes y jubilados",
    sosCall_professionalServiceName: "Servicio profesional de ayuda telefónica en el extranjero — abogados accesibles y expatriados ayudantes",
    sosCall_serviceType: "Consulta telefónica rápida en el extranjero — urgencia, consejo, información jurídica o administrativa",
    sosCall_topic: "Ayuda rápida en el extranjero — urgencia, consejo jurídico, información administrativa para viajeros, turistas, expatriados, nómadas digitales, estudiantes, jubilados",
    og_title: "SOS-Expat · ¿En el extranjero? Abogado o expatriado ayudante al teléfono en 5 min",
    howItWorks_aiSummary: "Guía paso a paso: cómo obtener ayuda telefónica en el extranjero en menos de 5 minutos con un abogado o un expatriado ayudante. Para viajeros, turistas, expatriados, nómadas digitales, estudiantes y jubilados. Urgencia o simple pregunta.",
    howItWorks_keywords: "cómo contactar abogado extranjero, cómo obtener ayuda rápida expatriado, cómo hablar con expatriado ayudante, consulta telefónica rápida, ayuda emergencia extranjero, procedimiento simple llamada abogado, pasos ayuda expatriado, 5 minutos teléfono, pregunta rápida abogado, consulta sin suscripción, cómo funciona SOS-Expat",
    testy_description: "Testimonios de viajeros, turistas, expatriados, nómadas digitales, estudiantes y jubilados ayudados en menos de 5 minutos en el extranjero por un abogado o un expatriado ayudante. 197 países, todos los idiomas.",
    testy_title: "Opiniones y Testimonios — Les ayudamos en 5 min en el extranjero | SOS-Expat",
  },
  de: {
    consumers_title: "Schnelle Hilfe & Rechte im Ausland — Reisende, Expats, Nomads, Studierende | SOS-Expat",
    consumers_description: "Ressourcen, Rechte und Telefonhilfe für Reisende, Touristen, Expats, Digital Nomads, Studierende und Rentner im Ausland. Anwälte und hilfsbereite Expats in 5 Min erreichbar, 197 Länder, 9 Sprachen, rund um die Uhr.",
    consumers_keywords: "Rechte Reisende Ausland, Verbraucherrechte Expat, Hotelstreit Ausland, Ferienwohnung Streit, Verbraucherschutz Ausland, schnelle Hilfe Ausland, zugänglicher Anwalt Reisende, hilfsbereiter Expat, Rechte Digital Nomad, Rechte Student Ausland, Rechte Rentner Ausland, Notfall Ausland, 197 Länder, 24/7",
    press_title: "Pressebereich — SOS-Expat | Notfall im Ausland, Anwalt oder hilfsbereiter Expat in 5 Min",
    press_description: "SOS-Expat Pressebereich. Pressemitteilungen, Pressemappe, HD-Logos, Fotos, Daten der Großen Expat & Reisenden-Umfrage 2026 (CC BY). Telefonhilfe-Plattform, die Reisende, Touristen, Expats, Digital Nomads, Studierende und Rentner in unter 5 Min mit einem Anwalt oder hilfsbereiten Expat verbindet. 197 Länder, 24/7.",
    press_keywords: "SOS-Expat Pressebereich, Pressemitteilung Notfall Ausland, Reisende Hilfe festgesteckt Ausland, 5-Minuten-Notfallplattform, schnelle Hilfe Expat, Pressemappe, HD-Logos, Pressefotos, internationaler Anwalt Telefon, hilfsbereiter Expat, Digital-Nomad-Hilfe, Studenten-Hilfe Ausland, Rentner-Hilfe Ausland, Tallinn Startup, Große Expat-Umfrage 2026",
    providers_title: "Anwälte & hilfsbereite Expats — 197 Länder, 9 Sprachen, Telefon in 5 Min | SOS-Expat",
    providers_description: "Durchsuchen Sie unsere verifizierten deutschsprachigen Anwälte und hilfsbereiten Expats in 197 Ländern, für alle Zielgruppen: Reisende, Touristen, Expats, Digital Nomads, Studierende, Rentner. Notfall, Rechtsfrage, Verwaltungsinfo oder schneller Rat. Anruf in 5 Min, 9 Sprachen, rund um die Uhr.",
    providers_keywords: "deutschsprachiger Anwalt Ausland, mehrsprachiger Anwalt international, hilfsbereiter Expat, Expat-Mentor, schnelle Telefonberatung, Anwalt 5 Minuten, Expat-Beratung, Reisende Hilfe Ausland, Digital-Nomad-Hilfe, Studenten-Hilfe Ausland, Rentner-Hilfe Ausland, Backpacker-Hilfe, Touristen-Hilfe, zugänglicher Anwalt, schnelle Beratung, 197 Länder, 9 Sprachen, 24/7",
    pricing_aiSummary: "Transparente Preise für Telefonberatungen mit Anwälten und hilfsbereiten Expats auf SOS-Expat — von der schnellen Frage bis zum komplexen Fall, für alle Zielgruppen im Ausland",
    pricing_keywords: "Anwalt Ausland Beratung Preis, Telefonanwalt Preis, hilfsbereiter Expat Preis, Notfallhilfe Ausland Preis, Reisenden-Beratung Preis, Digital-Nomad-Hilfe Preis, Pay-per-Call-Beratung, Anwalt ohne Abonnement, schnelle Hilfe Ausland Rate, schnelle Beratung Preise",
    sosCall_faq_subtitle: "Alles, was Sie über unseren schnellen Telefonhilfe-Service im Ausland wissen müssen — für Reisende, Touristen, Expats, Digital Nomads, Studierende und Rentner",
    sosCall_professionalServiceName: "Professioneller Telefonhilfe-Service im Ausland — zugängliche Anwälte und hilfsbereite Expats",
    sosCall_serviceType: "Schnelle Telefonberatung im Ausland — Notfall, Rat, rechtliche oder administrative Information",
    sosCall_topic: "Schnelle Hilfe im Ausland — Notfall, Rechtsberatung, Verwaltungsinfo für Reisende, Touristen, Expats, Digital Nomads, Studierende, Rentner",
    og_title: "SOS-Expat · Im Ausland? Anwalt oder hilfsbereiter Expat am Telefon in 5 Min",
    howItWorks_aiSummary: "Schritt-für-Schritt-Anleitung: Wie Sie in unter 5 Minuten Telefonhilfe im Ausland von einem Anwalt oder hilfsbereiten Expat erhalten. Für Reisende, Touristen, Expats, Digital Nomads, Studierende und Rentner. Notfall oder einfach schnelle Frage.",
    howItWorks_keywords: "wie Anwalt im Ausland erreichen, wie schnelle Expat-Hilfe bekommen, wie hilfsbereiten Expat kontaktieren, schnelle Telefonberatung, Notfallhilfe Ausland, einfacher Anrufablauf, Expat-Hilfe Schritte, 5 Minuten Telefon, schnelle Anwaltsfrage, Beratung ohne Abonnement, wie SOS-Expat funktioniert",
    testy_description: "Erfahrungsberichte von Reisenden, Touristen, Expats, Digital Nomads, Studierenden und Rentnern, denen in unter 5 Minuten im Ausland von einem Anwalt oder hilfsbereiten Expat geholfen wurde. 197 Länder, alle Sprachen.",
    testy_title: "Bewertungen & Erfahrungsberichte — Hilfe im Ausland in 5 Min | SOS-Expat",
  },
  pt: {
    consumers_title: "Ajuda rápida e direitos no estrangeiro — viajantes, expatriados, nómadas, estudantes | SOS-Expat",
    consumers_description: "Recursos, direitos e ajuda telefónica para viajantes, turistas, expatriados, nómadas digitais, estudantes e reformados no estrangeiro. Advogados e expatriados ajudantes acessíveis em 5 min, 197 países, 9 idiomas, 24/7.",
    consumers_keywords: "direitos viajante estrangeiro, direitos consumidor expatriado, disputa hotel estrangeiro, disputa aluguer férias, ajuda consumidor viagem, proteção consumidor internacional, ajuda rápida estrangeiro, advogado acessível viajante, expatriado ajudante, direitos nómada digital, direitos estudante estrangeiro, direitos reformado estrangeiro, emergência estrangeiro, 197 países, 24/7",
    press_title: "Sala de imprensa — SOS-Expat | Emergência no estrangeiro, advogado ou expatriado em 5 min",
    press_description: "Sala de imprensa SOS-Expat. Comunicados, dossier, logos HD, fotos, dados Grande Inquérito Expat & Viajante 2026 (CC BY). Plataforma de ajuda telefónica que liga viajantes, turistas, expatriados, nómadas digitais, estudantes e reformados a um advogado ou expatriado ajudante em menos de 5 min. 197 países, 24/7.",
    press_keywords: "sala imprensa SOS-Expat, comunicado emergência estrangeiro, ajuda viajante bloqueado estrangeiro, plataforma urgência 5 minutos, ajuda rápida expatriado, dossier de imprensa, logos HD, fotos imprensa, advogado internacional telefone, expatriado ajudante, ajuda nómada digital, ajuda estudante estrangeiro, ajuda reformado estrangeiro, startup Tallinn, Grande Inquérito Expat 2026",
    providers_title: "Advogados e expatriados ajudantes — 197 países, 9 idiomas, telefone em 5 min | SOS-Expat",
    providers_description: "Consulte os nossos advogados lusófonos e expatriados ajudantes verificados em 197 países, para todos os perfis: viajantes, turistas, expatriados, nómadas digitais, estudantes, reformados. Emergência, questão jurídica, informação administrativa ou conselho rápido. Chamada em 5 min, 9 idiomas, 24/7.",
    providers_keywords: "advogado lusófono estrangeiro, advogado multilingue internacional, expatriado ajudante, expatriado mentor, consulta telefónica rápida, advogado 5 minutos, conselho expatriado, ajuda viajante estrangeiro, ajuda nómada digital, ajuda estudante estrangeiro, ajuda reformado estrangeiro, ajuda mochileiro, ajuda turista, advogado acessível, consulta rápida, 197 países, 9 idiomas, 24/7",
    pricing_aiSummary: "Preços transparentes para consultas telefónicas com advogados e expatriados ajudantes no SOS-Expat — da pergunta rápida ao caso complexo, para todos os perfis no estrangeiro",
    pricing_keywords: "preço consulta advogado estrangeiro, preço advogado telefone, preço expatriado ajudante, preço ajuda urgência estrangeiro, preço conselho viajante, preço ajuda nómada digital, consulta pay-per-call, advogado sem subscrição, tarifa ajuda rápida estrangeiro, preço consulta rápida",
    sosCall_faq_subtitle: "Tudo o que precisa de saber sobre o nosso serviço de ajuda telefónica rápida no estrangeiro — para viajantes, turistas, expatriados, nómadas digitais, estudantes e reformados",
    sosCall_professionalServiceName: "Serviço profissional de ajuda telefónica no estrangeiro — advogados acessíveis e expatriados ajudantes",
    sosCall_serviceType: "Consulta telefónica rápida no estrangeiro — urgência, conselho, informação jurídica ou administrativa",
    sosCall_topic: "Ajuda rápida no estrangeiro — urgência, conselho jurídico, informação administrativa para viajantes, turistas, expatriados, nómadas digitais, estudantes, reformados",
    og_title: "SOS-Expat · No estrangeiro? Advogado ou expatriado ao telefone em 5 min",
    howItWorks_aiSummary: "Guia passo a passo: como obter ajuda telefónica no estrangeiro em menos de 5 minutos com um advogado ou um expatriado ajudante. Para viajantes, turistas, expatriados, nómadas digitais, estudantes e reformados. Emergência ou simples questão.",
    howItWorks_keywords: "como contactar advogado estrangeiro, como obter ajuda rápida expatriado, como falar com expatriado ajudante, consulta telefónica rápida, ajuda emergência estrangeiro, procedimento simples chamada advogado, passos ajuda expatriado, 5 minutos telefone, pergunta rápida advogado, consulta sem subscrição, como funciona SOS-Expat",
    testy_description: "Testemunhos de viajantes, turistas, expatriados, nómadas digitais, estudantes e reformados ajudados em menos de 5 minutos no estrangeiro por um advogado ou um expatriado ajudante. 197 países, todos os idiomas.",
    testy_title: "Opiniões e Testemunhos — Foram ajudados em 5 min no estrangeiro | SOS-Expat",
  },
  ru: {
    consumers_title: "Быстрая помощь и права за границей — путешественники, экспаты, кочевники, студенты | SOS-Expat",
    consumers_description: "Ресурсы, права и телефонная помощь для путешественников, туристов, экспатов, цифровых кочевников, студентов и пенсионеров за границей. Юристы и помогающие экспаты доступны за 5 минут, 197 стран, 9 языков, 24/7.",
    consumers_keywords: "права путешественника за границей, права потребителя экспата, спор отель за границей, спор аренда отпуск, помощь потребителю путешествие, защита потребителя международная, быстрая помощь за границей, доступный юрист путешественника, помогающий экспат, права цифрового кочевника, права студента за границей, права пенсионера за границей, срочная помощь за границей, 197 стран, 24/7",
    press_title: "Пресс-центр — SOS-Expat | Срочная помощь за границей, юрист или экспат за 5 мин",
    press_description: "Пресс-центр SOS-Expat. Релизы, пресс-кит, HD-логотипы, фото, данные Большого опроса экспатов и путешественников 2026 (CC BY). Платформа телефонной помощи, соединяющая путешественников, туристов, экспатов, цифровых кочевников, студентов и пенсионеров с юристом или помогающим экспатом менее чем за 5 минут. 197 стран, 24/7.",
    press_keywords: "пресс-центр SOS-Expat, пресс-релиз срочная помощь за границей, помощь путешественнику застрял за границей, платформа срочной помощи 5 минут, быстрая помощь экспату, пресс-кит, HD-логотипы, пресс-фото, международный юрист телефон, помогающий экспат, помощь цифровому кочевнику, помощь студенту за границей, помощь пенсионеру за границей, стартап Таллин, Большой опрос экспатов 2026",
    providers_title: "Юристы и помогающие экспаты — 197 стран, 9 языков, телефон за 5 мин | SOS-Expat",
    providers_description: "Просмотрите наших проверенных русскоязычных юристов и помогающих экспатов в 197 странах, для всех аудиторий: путешественников, туристов, экспатов, цифровых кочевников, студентов, пенсионеров. Срочная ситуация, юридический вопрос, административная информация или быстрый совет. Звонок за 5 минут, 9 языков, 24/7.",
    providers_keywords: "русскоязычный юрист за границей, многоязычный юрист международный, помогающий экспат, экспат-ментор, быстрая телефонная консультация, юрист 5 минут, совет экспата, помощь путешественнику за границей, помощь цифровому кочевнику, помощь студенту за границей, помощь пенсионеру за границей, помощь бэкпекеру, помощь туристу, доступный юрист, быстрая консультация, 197 стран, 9 языков, 24/7",
    pricing_aiSummary: "Прозрачные цены на телефонные консультации с юристами и помогающими экспатами на SOS-Expat — от быстрого вопроса до сложного дела, для всех аудиторий за границей",
    pricing_keywords: "цена консультации юриста за границей, цена юриста по телефону, цена помогающего экспата, цена срочной помощи за границей, цена совета путешественнику, цена помощи цифровому кочевнику, консультация pay-per-call, юрист без подписки, тариф быстрой помощи за границей, цена быстрой консультации",
    sosCall_faq_subtitle: "Всё, что вам нужно знать о нашем сервисе быстрой телефонной помощи за границей — для путешественников, туристов, экспатов, цифровых кочевников, студентов и пенсионеров",
    sosCall_professionalServiceName: "Профессиональный сервис телефонной помощи за границей — доступные юристы и помогающие экспаты",
    sosCall_serviceType: "Быстрая телефонная консультация за границей — срочная ситуация, совет, юридическая или административная информация",
    sosCall_topic: "Быстрая помощь за границей — срочная ситуация, юридическая консультация, административная информация для путешественников, туристов, экспатов, цифровых кочевников, студентов, пенсионеров",
    og_title: "SOS-Expat · За границей? Юрист или помогающий экспат по телефону за 5 мин",
    howItWorks_aiSummary: "Пошаговое руководство: как получить телефонную помощь за границей менее чем за 5 минут от юриста или помогающего экспата. Для путешественников, туристов, экспатов, цифровых кочевников, студентов и пенсионеров. Срочная ситуация или просто быстрый вопрос.",
    howItWorks_keywords: "как связаться с юристом за границей, как получить быструю помощь экспата, как связаться с помогающим экспатом, быстрая телефонная консультация, экстренная помощь за границей, простая процедура звонка юристу, шаги помощи экспата, 5 минут телефон, быстрый вопрос юристу, консультация без подписки, как работает SOS-Expat",
    testy_description: "Отзывы путешественников, туристов, экспатов, цифровых кочевников, студентов и пенсионеров, которым была оказана помощь за границей менее чем за 5 минут юристом или помогающим экспатом. 197 стран, все языки.",
    testy_title: "Отзывы — Им помогли за 5 минут за границей | SOS-Expat",
  },
  ch: {
    consumers_title: "海外快速援助与权利 — 旅行者、海外华人、数字游民、留学生 | SOS-Expat",
    consumers_description: "为海外旅行者、游客、海外华人、数字游民、留学生和退休人员提供资源、权利和电话援助。律师和热心海外同胞5分钟内可联系，覆盖197个国家，9种语言，全天候24/7。",
    consumers_keywords: "海外旅行者权利, 海外华人消费者权利, 海外酒店纠纷, 度假租赁纠纷, 旅行消费者援助, 国际消费者保护, 海外快速援助, 平易近人律师 旅行者, 热心海外同胞, 数字游民权利, 海外留学生权利, 海外退休人员权利, 海外紧急情况, 197个国家, 24/7",
    press_title: "新闻中心 — SOS-Expat | 海外紧急情况，律师或海外同胞5分钟电话支援",
    press_description: "SOS-Expat新闻中心。新闻稿、媒体资料包、HD标志、图片、《2026年海外侨民与旅行者大调查》数据（CC BY）。电话援助平台，在5分钟内将旅行者、游客、海外华人、数字游民、留学生和退休人员与律师或热心海外同胞对接。覆盖197个国家，全天候24/7。",
    press_keywords: "SOS-Expat新闻中心, 海外紧急新闻稿, 旅行者滞留海外援助, 5分钟紧急平台, 海外华人快速援助, 媒体资料包, HD标志, 新闻图片, 国际律师电话, 热心海外同胞, 数字游民援助, 海外留学生援助, 海外退休人员援助, 塔林创业公司, 2026年海外侨民大调查",
    providers_title: "律师与热心海外同胞 — 197个国家，9种语言，5分钟电话支援 | SOS-Expat",
    providers_description: "浏览我们在197个国家经过验证的华语律师和热心海外同胞，服务所有群体：旅行者、游客、海外华人、数字游民、留学生、退休人员。紧急情况、法律问题、行政信息或快速建议。5分钟电话，9种语言，全天候24/7。",
    providers_keywords: "海外华语律师, 国际多语言律师, 热心海外同胞, 海外同胞导师, 快速电话咨询, 5分钟律师, 海外华人建议, 海外旅行者援助, 数字游民援助, 海外留学生援助, 海外退休人员援助, 背包客援助, 游客援助, 平易近人律师, 快速咨询, 197个国家, 9种语言, 24/7",
    pricing_aiSummary: "SOS-Expat上律师和热心海外同胞电话咨询的透明价格——从快速问题到复杂案件，服务所有海外群体",
    pricing_keywords: "海外律师咨询价格, 电话律师价格, 热心海外同胞价格, 海外紧急援助价格, 旅行者建议价格, 数字游民援助价格, 按次付费咨询, 无需订阅律师, 海外快速援助费率, 快速咨询定价",
    sosCall_faq_subtitle: "关于我们海外快速电话援助服务您需要知道的一切——为旅行者、游客、海外华人、数字游民、留学生和退休人员服务",
    sosCall_professionalServiceName: "专业海外电话援助服务——平易近人的律师和热心海外同胞",
    sosCall_serviceType: "海外快速电话咨询——紧急情况、建议、法律或行政信息",
    sosCall_topic: "海外快速援助——紧急情况、法律建议、行政信息，为旅行者、游客、海外华人、数字游民、留学生、退休人员服务",
    og_title: "SOS-Expat · 在海外？律师或热心海外同胞5分钟内电话支援",
    howItWorks_aiSummary: "分步指南：如何在5分钟内通过电话从律师或热心海外同胞处获得海外援助。为旅行者、游客、海外华人、数字游民、留学生和退休人员服务。紧急情况或简单问题均可。",
    howItWorks_keywords: "如何联系海外律师, 如何获得快速海外同胞援助, 如何联系热心海外同胞, 快速电话咨询, 海外紧急援助, 简单律师通话流程, 海外同胞援助步骤, 5分钟电话, 快速律师提问, 无需订阅咨询, SOS-Expat运作方式",
    testy_description: "旅行者、游客、海外华人、数字游民、留学生和退休人员的感言——他们在海外5分钟内获得律师或热心海外同胞的帮助。覆盖197个国家，所有语言。",
    testy_title: "客户评价与感言 — 5分钟内在海外获得帮助 | SOS-Expat",
  },
  hi: {
    consumers_title: "विदेश में तेज़ मदद और अधिकार — यात्री, प्रवासी, नोमैड, छात्र | SOS-Expat",
    consumers_description: "विदेश में यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों और सेवानिवृत्त लोगों के लिए संसाधन, अधिकार और फ़ोन मदद। 5 मिनट में वकील और मददगार प्रवासी पहुंच योग्य, 197 देश, 9 भाषाएं, 24/7।",
    consumers_keywords: "विदेश यात्री अधिकार, प्रवासी उपभोक्ता अधिकार, विदेश होटल विवाद, छुट्टी किराया विवाद, यात्रा उपभोक्ता मदद, अंतर्राष्ट्रीय उपभोक्ता संरक्षण, विदेश त्वरित मदद, सुलभ वकील यात्री, मददगार प्रवासी, डिजिटल नोमैड अधिकार, विदेश छात्र अधिकार, विदेश सेवानिवृत्त अधिकार, विदेश आपातकाल, 197 देश, 24/7",
    press_title: "प्रेस रूम — SOS-Expat | विदेश आपातकाल, वकील या प्रवासी 5 मिनट में",
    press_description: "SOS-Expat प्रेस रूम। प्रेस विज्ञप्तियाँ, प्रेस किट, HD लोगो, तस्वीरें, ग्रैंड एक्सपैट और ट्रैवलर सर्वे 2026 डेटा (CC BY)। फ़ोन मदद मंच जो यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों और सेवानिवृत्त लोगों को 5 मिनट से कम में वकील या मददगार प्रवासी से जोड़ता है। 197 देश, 24/7।",
    press_keywords: "SOS-Expat प्रेस रूम, विदेश आपातकाल प्रेस विज्ञप्ति, विदेश फंसा यात्री मदद, 5 मिनट आपातकालीन मंच, प्रवासी त्वरित मदद, प्रेस किट, HD लोगो, प्रेस तस्वीरें, अंतर्राष्ट्रीय वकील फ़ोन, मददगार प्रवासी, डिजिटल नोमैड मदद, विदेश छात्र मदद, विदेश सेवानिवृत्त मदद, टालिन स्टार्टअप, ग्रैंड एक्सपैट सर्वे 2026",
    providers_title: "वकील और मददगार प्रवासी — 197 देश, 9 भाषाएं, 5 मिनट में फ़ोन | SOS-Expat",
    providers_description: "197 देशों में हमारे सत्यापित हिंदी भाषी वकीलों और मददगार प्रवासियों की जांच करें, सभी दर्शकों के लिए: यात्री, पर्यटक, प्रवासी, डिजिटल नोमैड, छात्र, सेवानिवृत्त। आपातकाल, कानूनी प्रश्न, प्रशासनिक जानकारी या त्वरित सलाह। 5 मिनट में कॉल, 9 भाषाएं, 24/7।",
    providers_keywords: "विदेश हिंदी वकील, अंतर्राष्ट्रीय बहुभाषी वकील, मददगार प्रवासी, प्रवासी मेंटर, त्वरित फ़ोन परामर्श, 5 मिनट वकील, प्रवासी सलाह, विदेश यात्री मदद, डिजिटल नोमैड मदद, विदेश छात्र मदद, विदेश सेवानिवृत्त मदद, बैकपैकर मदद, पर्यटक मदद, सुलभ वकील, त्वरित परामर्श, 197 देश, 9 भाषाएं, 24/7",
    pricing_aiSummary: "SOS-Expat पर वकीलों और मददगार प्रवासियों के साथ फ़ोन परामर्श के लिए पारदर्शी मूल्य निर्धारण — त्वरित प्रश्न से जटिल मामले तक, विदेश में सभी दर्शकों के लिए",
    pricing_keywords: "विदेश वकील परामर्श मूल्य, फ़ोन वकील मूल्य, मददगार प्रवासी मूल्य, विदेश आपातकालीन मदद मूल्य, यात्री सलाह मूल्य, डिजिटल नोमैड मदद मूल्य, पे-पर-कॉल परामर्श, बिना सदस्यता वकील, विदेश त्वरित मदद दर, त्वरित परामर्श मूल्य",
    sosCall_faq_subtitle: "विदेश में हमारी तेज़ फ़ोन मदद सेवा के बारे में जो कुछ आपको जानने की ज़रूरत है — यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों और सेवानिवृत्त लोगों के लिए",
    sosCall_professionalServiceName: "पेशेवर विदेश फ़ोन मदद सेवा — सुलभ वकील और मददगार प्रवासी",
    sosCall_serviceType: "विदेश में त्वरित फ़ोन परामर्श — आपातकाल, सलाह, कानूनी या प्रशासनिक जानकारी",
    sosCall_topic: "विदेश में त्वरित मदद — आपातकाल, कानूनी सलाह, यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों, सेवानिवृत्त के लिए प्रशासनिक जानकारी",
    og_title: "SOS-Expat · विदेश में? वकील या मददगार प्रवासी फ़ोन पर 5 मिनट में",
    howItWorks_aiSummary: "चरण-दर-चरण गाइड: 5 मिनट से कम में विदेश में वकील या मददगार प्रवासी से फ़ोन पर सहायता कैसे प्राप्त करें। यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों और सेवानिवृत्त लोगों के लिए। आपातकाल या बस एक त्वरित प्रश्न।",
    howItWorks_keywords: "विदेश में वकील से कैसे संपर्क करें, प्रवासी से त्वरित सहायता कैसे लें, मददगार प्रवासी से कैसे संपर्क करें, त्वरित फ़ोन परामर्श, विदेश में आपातकालीन सहायता, सरल वकील कॉल प्रक्रिया, प्रवासी सहायता चरण, 5 मिनट फ़ोन, त्वरित वकील प्रश्न, बिना सदस्यता परामर्श, SOS-Expat कैसे काम करता है",
    testy_description: "यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों और सेवानिवृत्त लोगों के प्रशंसापत्र जिन्हें 5 मिनट से कम में विदेश में वकील या मददगार प्रवासी से मदद मिली। 197 देश, सभी भाषाएं।",
    testy_title: "समीक्षाएं और प्रशंसापत्र — 5 मिनट में विदेश में मदद मिली | SOS-Expat",
  },
  ar: {
    consumers_title: "مساعدة سريعة وحقوق في الخارج — مسافرون، مغتربون، بدو، طلاب | SOS-Expat",
    consumers_description: "موارد وحقوق ومساعدة هاتفية للمسافرين والسياح والمغتربين والبدو الرقميين والطلاب والمتقاعدين في الخارج. محامون ومغتربون مساعدون يمكن الوصول إليهم في 5 دقائق، 197 دولة، 9 لغات، على مدار الساعة.",
    consumers_keywords: "حقوق المسافر في الخارج, حقوق المستهلك المغترب, نزاع فندق في الخارج, نزاع إيجار عطلات, مساعدة المستهلك السفر, حماية المستهلك الدولي, مساعدة سريعة في الخارج, محامٍ ميسور الوصول للمسافرين, مغترب مساعد, حقوق البدو الرقميين, حقوق الطالب في الخارج, حقوق المتقاعد في الخارج, طوارئ في الخارج, 197 دولة, على مدار الساعة",
    press_title: "غرفة الصحافة — SOS-Expat | طوارئ في الخارج، محامٍ أو مغترب في 5 دقائق",
    press_description: "غرفة صحافة SOS-Expat. البيانات الصحفية، حقيبة الصحافة، شعارات عالية الدقة، صور، بيانات استطلاع المغتربين والمسافرين الكبير 2026 (CC BY). منصة المساعدة الهاتفية التي تربط المسافرين والسياح والمغتربين والبدو الرقميين والطلاب والمتقاعدين بمحامٍ أو مغترب مساعد في أقل من 5 دقائق. 197 دولة، على مدار الساعة.",
    press_keywords: "غرفة صحافة SOS-Expat, بيان صحفي طوارئ في الخارج, مساعدة المسافر العالق في الخارج, منصة طوارئ 5 دقائق, مساعدة سريعة مغترب, حقيبة الصحافة, شعارات HD, صور صحفية, محامٍ دولي بالهاتف, مغترب مساعد, مساعدة البدو الرقميين, مساعدة طالب في الخارج, مساعدة متقاعد في الخارج, شركة تالين الناشئة, استطلاع المغتربين الكبير 2026",
    providers_title: "محامون ومغتربون مساعدون — 197 دولة، 9 لغات، هاتف في 5 دقائق | SOS-Expat",
    providers_description: "تصفح المحامين الناطقين بالعربية والمغتربين المساعدين المعتمدين في 197 دولة، لجميع الفئات: المسافرون، السياح، المغتربون، البدو الرقميون، الطلاب، المتقاعدون. طوارئ، سؤال قانوني، معلومات إدارية أو نصيحة سريعة. مكالمة في 5 دقائق، 9 لغات، على مدار الساعة.",
    providers_keywords: "محامٍ ناطق بالعربية في الخارج, محامٍ متعدد اللغات دولي, مغترب مساعد, مرشد مغترب, استشارة هاتفية سريعة, محامٍ 5 دقائق, نصيحة مغترب, مساعدة المسافر في الخارج, مساعدة البدو الرقميين, مساعدة الطالب في الخارج, مساعدة المتقاعد في الخارج, مساعدة البكباكر, مساعدة السائح, محامٍ ميسور الوصول, استشارة سريعة, 197 دولة, 9 لغات, على مدار الساعة",
    pricing_aiSummary: "أسعار شفافة للاستشارات الهاتفية مع محامين ومغتربين مساعدين على SOS-Expat — من السؤال السريع إلى الحالة المعقدة، لجميع الفئات في الخارج",
    pricing_keywords: "سعر استشارة محامٍ في الخارج, سعر محامٍ بالهاتف, سعر مغترب مساعد, سعر المساعدة الطارئة في الخارج, سعر نصيحة المسافر, سعر مساعدة البدو الرقميين, استشارة الدفع لكل مكالمة, محامٍ بدون اشتراك, معدل المساعدة السريعة في الخارج, سعر الاستشارة السريعة",
    sosCall_faq_subtitle: "كل ما تحتاج معرفته عن خدمة المساعدة الهاتفية السريعة لدينا في الخارج — للمسافرين والسياح والمغتربين والبدو الرقميين والطلاب والمتقاعدين",
    sosCall_professionalServiceName: "خدمة المساعدة الهاتفية المهنية في الخارج — محامون ميسورو الوصول ومغتربون مساعدون",
    sosCall_serviceType: "استشارة هاتفية سريعة في الخارج — طوارئ، نصيحة، معلومات قانونية أو إدارية",
    sosCall_topic: "مساعدة سريعة في الخارج — طوارئ، استشارة قانونية، معلومات إدارية للمسافرين والسياح والمغتربين والبدو الرقميين والطلاب والمتقاعدين",
    og_title: "SOS-Expat · في الخارج؟ محامٍ أو مغترب مساعد بالهاتف في 5 دقائق",
    howItWorks_aiSummary: "دليل خطوة بخطوة: كيفية الحصول على مساعدة هاتفية في الخارج في أقل من 5 دقائق من محامٍ أو مغترب مساعد. للمسافرين والسياح والمغتربين والبدو الرقميين والطلاب والمتقاعدين. طوارئ أو مجرد سؤال سريع.",
    howItWorks_keywords: "كيفية التواصل مع محامٍ في الخارج, كيفية الحصول على مساعدة سريعة من مغترب, كيفية التواصل مع مغترب مساعد, استشارة هاتفية سريعة, مساعدة طارئة في الخارج, إجراء اتصال بسيط بالمحامي, خطوات مساعدة المغترب, 5 دقائق هاتف, سؤال سريع للمحامي, استشارة بدون اشتراك, كيف يعمل SOS-Expat",
    testy_description: "شهادات من مسافرين وسياح ومغتربين وبدو رقميين وطلاب ومتقاعدين حصلوا على مساعدة في الخارج في أقل من 5 دقائق من محامٍ أو مغترب مساعد. 197 دولة، جميع اللغات.",
    testy_title: "التقييمات والشهادات — حصلوا على المساعدة في 5 دقائق في الخارج | SOS-Expat",
  },
};

// Mapping: key in JSON → field in translations table
const KEY_MAP = {
  "consumers.seo.title": "consumers_title",
  "consumers.seo.description": "consumers_description",
  "consumers.seo.keywords": "consumers_keywords",
  "press.seo.title": "press_title",
  "press.seo.description": "press_description",
  "press.seo.keywords": "press_keywords",
  "providers.seo.title": "providers_title",
  "providers.seo.description": "providers_description",
  "providers.seo.keywords": "providers_keywords",
  "pricing.seo.aiSummary": "pricing_aiSummary",
  "pricing.seo.keywords": "pricing_keywords",
  "sosCall.faq.subtitle": "sosCall_faq_subtitle",
  "sosCall.seo.professionalServiceName": "sosCall_professionalServiceName",
  "sosCall.seo.serviceType": "sosCall_serviceType",
  "sosCall.seo.topic": "sosCall_topic",
  "og.title": "og_title",
  "howItWorks.seo.aiSummary": "howItWorks_aiSummary",
  "howItWorks.seo.keywords": "howItWorks_keywords",
  "testy.meta.description": "testy_description",
  "testy.meta.title": "testy_title",
};

let totalChanges = 0;

for (const [lang, translations] of Object.entries(TRANSLATIONS)) {
  const file = path.join(helperDir, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.log(`⚠  ${lang}.json not found, skipping`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  let changes = 0;
  for (const [jsonKey, translationKey] of Object.entries(KEY_MAP)) {
    const newValue = translations[translationKey];
    if (newValue === undefined) continue;
    if (jsonKey in data && data[jsonKey] !== newValue) {
      data[jsonKey] = newValue;
      changes++;
    }
  }
  if (changes > 0) {
    // Write keeping key order by rebuilding with Object.entries
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`✓ ${lang}.json — ${changes} keys updated`);
    totalChanges += changes;
  } else {
    console.log(`— ${lang}.json — no changes`);
  }
}

console.log(`\nTotal: ${totalChanges} keys updated across 7 languages.`);
