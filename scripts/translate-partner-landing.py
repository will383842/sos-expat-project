#!/usr/bin/env python3
"""
Translate partner-landing v2 keys + seo.partner.* keys into 8 non-FR languages.
Run from sos-expat-project root.

Native, high-quality translations of the FR copy (validated 2026-04-26).
Updates both sos/public/helper/{lang}.json and sos/src/helper/{lang}.json.
Preserves the original file's key order; appends new keys (independent, smb,
corporates.subtitle) at the end if missing.
"""

import json
import sys
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).resolve().parent.parent
LOCATIONS = [ROOT / "sos" / "public" / "helper", ROOT / "sos" / "src" / "helper"]

# Map: {lang_code: {key: translated_value}}
TRANSLATIONS = {
    "en": {
        "partner.landing.v2.hero.highlight": "under 5 minutes",
        "partner.landing.v2.hero.title": "Wherever they are in the world, a lawyer in their language in {highlight}",
        "partner.landing.v2.hero.subtitle": "Give your clients peace of mind, wherever they are in the world. Travelers, holidaymakers, tourists, digital nomads, expats, students: for any need or emergency abroad, they reach a lawyer who speaks their language by phone. Or a local helping expat for practical matters. 24/7, every day of the year, public holidays included, in 197 countries. An exceptional offer that sets your brand apart, with zero logistics for your teams.",
        "partner.landing.v2.hero.trust.languages": "Every language",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 days/year",
        "partner.landing.v2.profiles.realestate": "International real estate",
        "partner.landing.v2.profiles.travel": "Travel agencies, tour operators & cruises",
        "partner.landing.v2.profiles.independent": "Independent firms & agencies",
        "partner.landing.v2.profiles.smb": "Shops, SMBs & freelancers",
        "partner.landing.v2.profiles.subtitle": "Any organisation in regular contact with travelers, holidaymakers, tourists, digital nomads, expats, students or professionals on international assignment, anywhere in the world. From the tour operator to the embassy, from the fintech to the works council.",
        "partner.landing.v2.faq.a2": "Each partnership is built bespoke. Based on your sector, your estimated volume and your needs, we agree the formula together (per-member, flat fee, tiered or custom), the onboarding modality for your clients (manual addition via dashboard, bulk CSV import, or REST API sync from your CRM), the commercial terms and the duration. All terms are recorded in an Order Form signed electronically, alongside the B2B Terms and the GDPR/CCPA/LGPD-compliant DPA.",
        "partner.landing.v2.faq.a4": "Three modalities to choose from depending on your technical maturity: (1) manual addition or CSV import from your partner dashboard, (2) REST API with Bearer authentication (granular scopes, bulk import up to 500 clients per call, ideal for syncing from your CRM), (3) activation email fully customisable to your brand, automatically sent to each client with their access code. A dedicated account manager supports you technically.",
        "partner.landing.v2.faq.a5": "Tour operators, travel agencies, cruise lines, concierge services, works councils, travel and expat insurers, embassies, consulates, banks, fintech, mutual insurers, movers, relocation firms, law firms, federations and associations, international schools, digital nomad platforms, corporates and international groups. Any organisation in regular contact with travelers, holidaymakers, tourists, digital nomads, expats, students or professionals on international assignment.",
        "partner.landing.v2.corporates.gdpr.title": "Global compliance",
        "partner.landing.v2.corporates.gdpr.desc": "DPA compliant with GDPR (EU), CCPA (California), LGPD (Brazil), PIPEDA (Canada), POPIA (South Africa), APP (Australia). Multi-region hosting, full audit trail, identified subprocessors. Built for demanding legal departments anywhere in the world.",
        "partner.landing.v2.corporates.overline": "For every size",
        "partner.landing.v2.corporates.title": "From the independent firm to the global group",
        "partner.landing.v2.corporates.subtitle": "Independents, add your clients one by one or via CSV from the dashboard: SOS-Expat automatically sends each client their activation email with their access code. Larger groups, plug into the REST API to sync from your CRM (up to 500 clients per call) and oversee multiple firms in a unified dashboard.",
        "partner.landing.v2.steps.integrate.desc": "Add your clients one by one, import them via CSV or sync from your CRM through the REST API. Each client then automatically receives their activation email with their personal access code. Our technical team supports you.",
        "partner.landing.v2.advantages.widget.title": "Automatic activation email",
        "partner.landing.v2.advantages.widget.desc": "Each of your clients automatically receives an email with their personal access code and the link to call. Templates fully customisable to your brand, in 9 languages.",
        "partner.landing.v2.value.tools.desc": "REST API with bulk import, partner dashboard to add and track your clients in real time, automatic activation email customisable to your brand, and a single account manager to oversee the partnership.",
        "partner.landing.v2.seo.description": "An exceptional offer to set your brand apart: wherever they are in the world, your clients reach a lawyer who speaks their language by phone in under 5 minutes. 197 countries, 24/7. Travelers, holidaymakers, digital nomads, expats. Monthly B2B subscription, REST API, real-time dashboard.",
        "seo.partner.keywords": "lawyer in their language 5 minutes, phone connection lawyer international emergency, SOS Expat partner, B2B partnership program travelers holidaymakers digital nomads expats, international phone assistance 24/7, emergency abroad, partner travel agency, tour operator, works council, travel insurance, partner embassy, partner bank, bespoke B2B agreement, exceptional brand offer",
        "seo.partner.ogDescription": "An exceptional offer to give your clients: wherever they are in the world, they reach a lawyer who speaks their language by phone in under 5 minutes. Travelers, holidaymakers, digital nomads, expats. 197 countries, 24/7. Bespoke partnership agreement, integration tools, dedicated account manager.",
        "seo.partner.ogTitle": "SOS-Expat Partner Program | A Lawyer in Their Language, Wherever They Are, in 5 Minutes",
        "seo.partner.twitterDescription": "An exceptional offer to set your brand apart: wherever they are in the world, your clients reach a lawyer who speaks their language by phone in under 5 minutes. 197 countries, 24/7. Tour operators, works councils, insurers, embassies, banks, associations.",
        "seo.partner.twitterTitle": "SOS-Expat Partner | A Lawyer in Their Language, Wherever They Are, in 5 min",
    },
    "es": {
        "partner.landing.v2.hero.highlight": "menos de 5 minutos",
        "partner.landing.v2.hero.title": "Estén donde estén en el mundo, un abogado en su idioma en {highlight}",
        "partner.landing.v2.hero.subtitle": "Ofrezca a sus clientes tranquilidad, estén donde estén en el mundo. Viajeros, vacacionistas, turistas, nómadas digitales, expatriados, estudiantes: para cualquier necesidad o urgencia en el extranjero, contactan por teléfono con un abogado que habla su idioma. O con un expatriado local de apoyo para los trámites prácticos. 24h/24, 7 días a la semana, todo el año, festivos incluidos, en 197 países. Una oferta excepcional que diferencia su marca, sin ninguna logística para sus equipos.",
        "partner.landing.v2.hero.trust.languages": "Todos los idiomas",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 días/año",
        "partner.landing.v2.profiles.realestate": "Inmobiliaria internacional",
        "partner.landing.v2.profiles.travel": "Agencias de viajes, turoperadores y cruceros",
        "partner.landing.v2.profiles.independent": "Despachos y agencias independientes",
        "partner.landing.v2.profiles.smb": "Comerciantes, pymes y autónomos",
        "partner.landing.v2.profiles.subtitle": "Toda organización en contacto regular con viajeros, vacacionistas, turistas, nómadas digitales, expatriados, estudiantes o profesionales en movilidad internacional, en cualquier parte del mundo. Del turoperador a la embajada, de la fintech al comité de empresa.",
        "partner.landing.v2.faq.a2": "Cada acuerdo se construye a medida. Según su sector, su volumen estimado y sus necesidades, definimos juntos la fórmula (por miembro, tarifa fija, escalado o a medida), la modalidad de incorporación de sus clientes (alta manual desde el panel, importación CSV en bloque o sincronización por API REST desde su CRM), las condiciones comerciales y la duración. Todos los términos se recogen en un Order Form firmado electrónicamente, junto con las CGV B2B y el DPA conforme con RGPD/CCPA/LGPD.",
        "partner.landing.v2.faq.a4": "Tres modalidades a elegir según su madurez técnica: (1) alta manual o importación CSV desde su panel de socio, (2) API REST con autenticación Bearer (scopes granulares, importación en bloque hasta 500 clientes por llamada, ideal para sincronizar desde su CRM), (3) email de activación totalmente personalizable a su marca, enviado automáticamente a cada cliente con su código de acceso. Un account manager dedicado le acompaña técnicamente.",
        "partner.landing.v2.faq.a5": "Turoperadores, agencias de viajes, navieras de cruceros, conserjerías, comités de empresa, aseguradoras de viaje y de expatriación, embajadas, consulados, bancos, fintech, mutuas, mudanzas, despachos de relocation, despachos de abogados, federaciones y asociaciones, escuelas internacionales, plataformas para nómadas digitales, empresas y grupos internacionales. Toda organización en contacto regular con viajeros, vacacionistas, turistas, nómadas digitales, expatriados, estudiantes o profesionales en movilidad internacional.",
        "partner.landing.v2.corporates.gdpr.title": "Conformidad internacional",
        "partner.landing.v2.corporates.gdpr.desc": "DPA conforme con RGPD (UE), CCPA (California), LGPD (Brasil), PIPEDA (Canadá), POPIA (Sudáfrica), APP (Australia). Hospedaje multi-región, registro de auditoría completo, subencargados identificados. Adaptado a los servicios jurídicos exigentes en todo el mundo.",
        "partner.landing.v2.corporates.overline": "Para todos los tamaños",
        "partner.landing.v2.corporates.title": "Del despacho independiente al gran grupo",
        "partner.landing.v2.corporates.subtitle": "Independientes, añadan a sus clientes uno a uno o por CSV desde el panel: SOS-Expat envía automáticamente a cada cliente su email de activación con su código de acceso. Grandes grupos, conecten con la API REST para sincronizar desde su CRM (hasta 500 clientes por llamada) y gestionen varios despachos en un panel unificado.",
        "partner.landing.v2.steps.integrate.desc": "Añadan a sus clientes uno a uno, impórtenlos por CSV o sincronicen desde su CRM mediante la API REST. Cada cliente recibe entonces automáticamente su email de activación con su código de acceso personal. Nuestro equipo técnico les acompaña.",
        "partner.landing.v2.advantages.widget.title": "Email de activación automático",
        "partner.landing.v2.advantages.widget.desc": "Cada uno de sus clientes recibe automáticamente un email con su código de acceso personal y el enlace para llamar. Plantillas totalmente personalizables a su marca, en 9 idiomas.",
        "partner.landing.v2.value.tools.desc": "API REST con importación en bloque, panel de socio para añadir y seguir a sus clientes en tiempo real, email de activación automático personalizable a su marca, y un account manager único para pilotar el partenariado.",
        "partner.landing.v2.seo.description": "Una oferta excepcional para diferenciar su marca: estén donde estén en el mundo, sus clientes contactan con un abogado que habla su idioma por teléfono en menos de 5 minutos. 197 países, 24h/24. Viajeros, vacacionistas, nómadas digitales, expatriados. Tarifa mensual B2B, API REST, panel en tiempo real.",
        "seo.partner.keywords": "abogado en su idioma 5 minutos, contacto telefónico abogado internacional urgencia, socio SOS Expat, programa partenariado B2B viajeros vacacionistas nómadas digitales expatriados, asistencia telefónica internacional 24/7, urgencia en el extranjero, agencia de viajes socio, turoperador, comité de empresa, seguro de viaje, embajada socio, banco socio, acuerdo B2B a medida, oferta excepcional marca",
        "seo.partner.ogDescription": "Una oferta excepcional para ofrecer a sus clientes: estén donde estén en el mundo, contactan con un abogado que habla su idioma por teléfono en menos de 5 minutos. Viajeros, vacacionistas, nómadas digitales, expatriados. 197 países, 24/7. Acuerdo de partenariado a medida, herramientas de integración, account manager dedicado.",
        "seo.partner.ogTitle": "Programa de Socios SOS-Expat | Un Abogado en Su Idioma, Estén Donde Estén, en 5 Minutos",
        "seo.partner.twitterDescription": "Una oferta excepcional para diferenciar su marca: estén donde estén en el mundo, sus clientes contactan con un abogado que habla su idioma por teléfono en menos de 5 minutos. 197 países, 24/7. Turoperadores, comités de empresa, aseguradoras, embajadas, bancos, asociaciones.",
        "seo.partner.twitterTitle": "Socio SOS-Expat | Un Abogado en Su Idioma, Estén Donde Estén, en 5 min",
    },
    "de": {
        "partner.landing.v2.hero.highlight": "weniger als 5 Minuten",
        "partner.landing.v2.hero.title": "Wo immer sie auf der Welt sind: ein Anwalt in ihrer Sprache in {highlight}",
        "partner.landing.v2.hero.subtitle": "Schenken Sie Ihren Kunden Sorgenfreiheit, wo immer sie auf der Welt sind. Reisende, Urlauber, Touristen, Digital Nomads, Expats, Studierende: bei jedem Anliegen oder Notfall im Ausland erreichen sie telefonisch einen Anwalt, der ihre Sprache spricht. Oder einen helfenden Expat vor Ort für praktische Anliegen. 24/7, 365 Tage im Jahr, Feiertage inklusive, in 197 Ländern. Ein außergewöhnliches Angebot, das Ihre Marke abhebt – ganz ohne Logistik für Ihre Teams.",
        "partner.landing.v2.hero.trust.languages": "Alle Sprachen",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 Tage/Jahr",
        "partner.landing.v2.profiles.realestate": "Internationale Immobilien",
        "partner.landing.v2.profiles.travel": "Reisebüros, Reiseveranstalter & Kreuzfahrten",
        "partner.landing.v2.profiles.independent": "Unabhängige Kanzleien & Agenturen",
        "partner.landing.v2.profiles.smb": "Händler, KMU & Freiberufler",
        "partner.landing.v2.profiles.subtitle": "Jede Organisation, die regelmäßig mit Reisenden, Urlaubern, Touristen, Digital Nomads, Expats, Studierenden oder Fachkräften im internationalen Einsatz zu tun hat – weltweit. Vom Reiseveranstalter bis zur Botschaft, von der Fintech bis zum Betriebsrat.",
        "partner.landing.v2.faq.a2": "Jede Partnerschaft wird maßgeschneidert aufgebaut. Auf Basis Ihrer Branche, Ihres geschätzten Volumens und Ihrer Bedürfnisse legen wir gemeinsam die Formel fest (per-member, Pauschale, Staffel oder individuell), die Onboarding-Modalität für Ihre Kunden (manuelle Anlage über das Dashboard, CSV-Bulk-Import oder REST-API-Synchronisation aus Ihrem CRM), die kommerziellen Bedingungen und die Laufzeit. Alle Bedingungen werden in einem elektronisch signierten Order Form festgehalten, zusammen mit den B2B-AGB und dem DSGVO/CCPA/LGPD-konformen DPA.",
        "partner.landing.v2.faq.a4": "Drei Modalitäten zur Wahl, je nach technischer Reife: (1) manuelle Anlage oder CSV-Import über Ihr Partner-Dashboard, (2) REST-API mit Bearer-Authentifizierung (granulare Scopes, Bulk-Import bis zu 500 Kunden pro Aufruf, ideal für die Synchronisation aus Ihrem CRM), (3) vollständig an Ihre Marke anpassbare Aktivierungs-E-Mail, die jedem Kunden automatisch mit seinem Zugangscode zugesendet wird. Ein Account Manager begleitet Sie technisch.",
        "partner.landing.v2.faq.a5": "Reiseveranstalter, Reisebüros, Kreuzfahrtgesellschaften, Concierge-Services, Betriebsräte, Reise- und Expat-Versicherer, Botschaften, Konsulate, Banken, Fintech, Versicherungsvereine, Umzugsfirmen, Relocation-Anbieter, Anwaltskanzleien, Verbände und Vereine, internationale Schulen, Plattformen für Digital Nomads, Unternehmen und internationale Konzerne. Jede Organisation, die regelmäßig mit Reisenden, Urlaubern, Touristen, Digital Nomads, Expats, Studierenden oder Fachkräften im internationalen Einsatz zu tun hat.",
        "partner.landing.v2.corporates.gdpr.title": "Internationale Konformität",
        "partner.landing.v2.corporates.gdpr.desc": "DPA konform mit DSGVO (EU), CCPA (Kalifornien), LGPD (Brasilien), PIPEDA (Kanada), POPIA (Südafrika), APP (Australien). Multiregion-Hosting, vollständiger Audit Trail, identifizierte Auftragsverarbeiter. Geeignet für anspruchsvolle Rechtsabteilungen weltweit.",
        "partner.landing.v2.corporates.overline": "Für jede Größe",
        "partner.landing.v2.corporates.title": "Von der unabhängigen Kanzlei bis zum Großkonzern",
        "partner.landing.v2.corporates.subtitle": "Unabhängige, fügen Sie Ihre Kunden einzeln oder per CSV aus dem Dashboard hinzu: SOS-Expat sendet jedem Kunden automatisch seine Aktivierungs-E-Mail mit Zugangscode. Großkonzerne, binden Sie die REST-API an, um aus Ihrem CRM zu synchronisieren (bis zu 500 Kunden pro Aufruf) und mehrere Kanzleien in einem einheitlichen Dashboard zu steuern.",
        "partner.landing.v2.steps.integrate.desc": "Fügen Sie Ihre Kunden einzeln hinzu, importieren Sie sie per CSV oder synchronisieren Sie aus Ihrem CRM über die REST-API. Jeder Kunde erhält daraufhin automatisch seine Aktivierungs-E-Mail mit seinem persönlichen Zugangscode. Unser technisches Team begleitet Sie.",
        "partner.landing.v2.advantages.widget.title": "Automatische Aktivierungs-E-Mail",
        "partner.landing.v2.advantages.widget.desc": "Jeder Ihrer Kunden erhält automatisch eine E-Mail mit seinem persönlichen Zugangscode und dem Link zum Anrufen. Vorlagen vollständig an Ihre Marke anpassbar, in 9 Sprachen.",
        "partner.landing.v2.value.tools.desc": "REST-API mit Bulk-Import, Partner-Dashboard zum Hinzufügen und Echtzeit-Tracking Ihrer Kunden, automatische Aktivierungs-E-Mail an Ihre Marke anpassbar, und ein Account Manager zur Steuerung der Partnerschaft.",
        "partner.landing.v2.seo.description": "Ein außergewöhnliches Angebot, das Ihre Marke abhebt: wo immer sie auf der Welt sind, erreichen Ihre Kunden in weniger als 5 Minuten telefonisch einen Anwalt, der ihre Sprache spricht. 197 Länder, 24/7. Reisende, Urlauber, Digital Nomads, Expats. B2B-Monatsabonnement, REST-API, Echtzeit-Dashboard.",
        "seo.partner.keywords": "Anwalt in ihrer Sprache 5 Minuten, telefonische Anwaltsvermittlung internationaler Notfall, SOS Expat Partner, B2B-Partnerprogramm Reisende Urlauber Digital Nomads Expats, internationale Telefonhilfe 24/7, Notfall im Ausland, Reisebüro Partner, Reiseveranstalter, Betriebsrat, Reiseversicherung, Botschaft Partner, Bank Partner, maßgeschneiderte B2B-Vereinbarung, außergewöhnliches Markenangebot",
        "seo.partner.ogDescription": "Ein außergewöhnliches Angebot für Ihre Kunden: wo immer sie auf der Welt sind, erreichen sie in weniger als 5 Minuten telefonisch einen Anwalt, der ihre Sprache spricht. Reisende, Urlauber, Digital Nomads, Expats. 197 Länder, 24/7. Maßgeschneiderte Partnerschaftsvereinbarung, Integrationswerkzeuge, dedizierter Account Manager.",
        "seo.partner.ogTitle": "SOS-Expat Partnerprogramm | Ein Anwalt in ihrer Sprache, wo immer sie sind, in 5 Minuten",
        "seo.partner.twitterDescription": "Ein außergewöhnliches Angebot, das Ihre Marke abhebt: wo immer sie auf der Welt sind, erreichen Ihre Kunden in weniger als 5 Minuten telefonisch einen Anwalt, der ihre Sprache spricht. 197 Länder, 24/7. Reiseveranstalter, Betriebsräte, Versicherer, Botschaften, Banken, Vereine.",
        "seo.partner.twitterTitle": "SOS-Expat Partner | Ein Anwalt in ihrer Sprache, wo immer sie sind, in 5 Min.",
    },
    "pt": {
        "partner.landing.v2.hero.highlight": "menos de 5 minutos",
        "partner.landing.v2.hero.title": "Onde quer que estejam no mundo, um advogado no seu idioma em {highlight}",
        "partner.landing.v2.hero.subtitle": "Ofereça aos seus clientes tranquilidade, onde quer que estejam no mundo. Viajantes, veraneantes, turistas, nómadas digitais, expatriados, estudantes: para qualquer necessidade ou urgência no estrangeiro, falam por telefone com um advogado que fala o seu idioma. Ou com um expatriado de apoio local para diligências práticas. 24h/24, 7 dias por semana, todo o ano, feriados incluídos, em 197 países. Uma oferta excecional que diferencia a sua marca, sem qualquer logística para as suas equipas.",
        "partner.landing.v2.hero.trust.languages": "Todos os idiomas",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 dias/ano",
        "partner.landing.v2.profiles.realestate": "Imobiliário internacional",
        "partner.landing.v2.profiles.travel": "Agências de viagens, operadoras turísticas e cruzeiros",
        "partner.landing.v2.profiles.independent": "Escritórios e agências independentes",
        "partner.landing.v2.profiles.smb": "Comerciantes, PME e freelancers",
        "partner.landing.v2.profiles.subtitle": "Qualquer organização em contacto regular com viajantes, veraneantes, turistas, nómadas digitais, expatriados, estudantes ou profissionais em mobilidade internacional, em qualquer parte do mundo. Do operador turístico à embaixada, da fintech à comissão de trabalhadores.",
        "partner.landing.v2.faq.a2": "Cada parceria é construída à medida. Com base no seu setor, no seu volume estimado e nas suas necessidades, definimos em conjunto a fórmula (por membro, tarifa fixa, por escalões ou personalizada), a modalidade de integração dos seus clientes (adição manual via dashboard, importação CSV em massa ou sincronização por API REST a partir do seu CRM), as condições comerciais e a duração. Todos os termos são registados num Order Form assinado eletronicamente, juntamente com os T&C B2B e o DPA conforme com RGPD/CCPA/LGPD.",
        "partner.landing.v2.faq.a4": "Três modalidades à escolha consoante a sua maturidade técnica: (1) adição manual ou importação CSV a partir do seu dashboard de parceiro, (2) API REST com autenticação Bearer (scopes granulares, importação em massa até 500 clientes por chamada, ideal para sincronizar a partir do seu CRM), (3) email de ativação totalmente personalizável à sua marca, enviado automaticamente a cada cliente com o seu código de acesso. Um account manager dedicado acompanha-o tecnicamente.",
        "partner.landing.v2.faq.a5": "Operadoras turísticas, agências de viagens, companhias de cruzeiros, concierges, comissões de trabalhadores, seguradoras de viagem e de expatriação, embaixadas, consulados, bancos, fintech, mútuas, transportadoras de mudanças, escritórios de relocation, escritórios de advogados, federações e associações, escolas internacionais, plataformas para nómadas digitais, empresas e grupos internacionais. Qualquer organização em contacto regular com viajantes, veraneantes, turistas, nómadas digitais, expatriados, estudantes ou profissionais em mobilidade internacional.",
        "partner.landing.v2.corporates.gdpr.title": "Conformidade internacional",
        "partner.landing.v2.corporates.gdpr.desc": "DPA conforme com RGPD (UE), CCPA (Califórnia), LGPD (Brasil), PIPEDA (Canadá), POPIA (África do Sul), APP (Austrália). Alojamento multirregião, audit trail completo, subcontratantes identificados. Adaptado a serviços jurídicos exigentes em qualquer parte do mundo.",
        "partner.landing.v2.corporates.overline": "Para todos os tamanhos",
        "partner.landing.v2.corporates.title": "Do escritório independente ao grande grupo",
        "partner.landing.v2.corporates.subtitle": "Independentes, adicionem os vossos clientes um a um ou por CSV a partir do dashboard: a SOS-Expat envia automaticamente a cada cliente o seu email de ativação com o código de acesso. Grandes grupos, liguem-se à API REST para sincronizar a partir do vosso CRM (até 500 clientes por chamada) e giram vários escritórios num dashboard unificado.",
        "partner.landing.v2.steps.integrate.desc": "Adicionem os vossos clientes um a um, importem-nos por CSV ou sincronizem a partir do vosso CRM através da API REST. Cada cliente recebe depois automaticamente o seu email de ativação com o seu código de acesso pessoal. A nossa equipa técnica acompanha-vos.",
        "partner.landing.v2.advantages.widget.title": "Email de ativação automático",
        "partner.landing.v2.advantages.widget.desc": "Cada um dos seus clientes recebe automaticamente um email com o seu código de acesso pessoal e o link para chamar. Modelos totalmente personalizáveis à sua marca, em 9 idiomas.",
        "partner.landing.v2.value.tools.desc": "API REST com importação em massa, dashboard de parceiro para adicionar e acompanhar os seus clientes em tempo real, email de ativação automático personalizável à sua marca, e um account manager único para gerir a parceria.",
        "partner.landing.v2.seo.description": "Uma oferta excecional para diferenciar a sua marca: onde quer que estejam no mundo, os seus clientes falam com um advogado que fala o seu idioma por telefone em menos de 5 minutos. 197 países, 24h/24. Viajantes, veraneantes, nómadas digitais, expatriados. Subscrição mensal B2B, API REST, dashboard em tempo real.",
        "seo.partner.keywords": "advogado no seu idioma 5 minutos, ligação telefónica advogado internacional urgência, parceiro SOS Expat, programa parceria B2B viajantes veraneantes nómadas digitais expatriados, assistência telefónica internacional 24/7, urgência no estrangeiro, agência de viagens parceira, operadora turística, comissão de trabalhadores, seguro de viagem, embaixada parceira, banco parceiro, acordo B2B à medida, oferta excecional marca",
        "seo.partner.ogDescription": "Uma oferta excecional para os seus clientes: onde quer que estejam no mundo, falam com um advogado que fala o seu idioma por telefone em menos de 5 minutos. Viajantes, veraneantes, nómadas digitais, expatriados. 197 países, 24/7. Acordo de parceria à medida, ferramentas de integração, account manager dedicado.",
        "seo.partner.ogTitle": "Programa de Parceiros SOS-Expat | Um Advogado no Seu Idioma, Onde Quer Que Estejam, em 5 Minutos",
        "seo.partner.twitterDescription": "Uma oferta excecional para diferenciar a sua marca: onde quer que estejam no mundo, os seus clientes falam com um advogado que fala o seu idioma por telefone em menos de 5 minutos. 197 países, 24/7. Operadoras turísticas, comissões de trabalhadores, seguradoras, embaixadas, bancos, associações.",
        "seo.partner.twitterTitle": "Parceiro SOS-Expat | Um Advogado no Seu Idioma, Onde Quer Que Estejam, em 5 min",
    },
    "ar": {
        "partner.landing.v2.hero.highlight": "أقل من 5 دقائق",
        "partner.landing.v2.hero.title": "أينما كانوا في العالم، محامٍ بلغتهم خلال {highlight}",
        "partner.landing.v2.hero.subtitle": "امنحوا عملاءكم راحة البال أينما كانوا في العالم. المسافرون، المصطافون، السياح، الرحّل الرقميون، المغتربون، الطلاب: لأي حاجة أو طارئ في الخارج، يتواصلون هاتفياً مع محامٍ يتحدث لغتهم. أو مع مغترب محلي مساعد للإجراءات العملية. 24/7، 365 يوماً في السنة، الأعياد ضمناً، في 197 دولة. عرض استثنائي يميّز علامتكم التجارية، دون أي لوجستيات على فرقكم.",
        "partner.landing.v2.hero.trust.languages": "جميع اللغات",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 يوم/سنة",
        "partner.landing.v2.profiles.realestate": "العقارات الدولية",
        "partner.landing.v2.profiles.travel": "وكالات السفر ومنظمو الرحلات والرحلات البحرية",
        "partner.landing.v2.profiles.independent": "المكاتب والوكالات المستقلة",
        "partner.landing.v2.profiles.smb": "التجار والشركات الصغيرة والمستقلون",
        "partner.landing.v2.profiles.subtitle": "أي منظمة على تواصل منتظم مع المسافرين، المصطافين، السياح، الرحّل الرقميين، المغتربين، الطلاب أو المهنيين في انتقال دولي، في أي مكان في العالم. من منظم الرحلات إلى السفارة، ومن الفينتك إلى لجنة الموظفين.",
        "partner.landing.v2.faq.a2": "كل شراكة تُبنى وفقاً لاحتياجاتكم. حسب قطاعكم، حجمكم المتوقع واحتياجاتكم، نحدد معاً الصيغة (لكل عضو، رسوم ثابتة، شرائح أو مخصصة)، طريقة إدراج عملائكم (إضافة يدوية عبر اللوحة، استيراد CSV بالجملة، أو مزامنة عبر REST API من نظام CRM لديكم)، الشروط التجارية والمدة. تُوثَّق جميع الشروط في Order Form موقّع إلكترونياً، إلى جانب الشروط العامة B2B واتفاقية معالجة البيانات المتوافقة مع GDPR/CCPA/LGPD.",
        "partner.landing.v2.faq.a4": "ثلاث طرق على اختياركم بحسب جاهزيتكم التقنية: (1) إضافة يدوية أو استيراد CSV من لوحة الشريك، (2) REST API بمصادقة Bearer (نطاقات دقيقة، استيراد بالجملة حتى 500 عميل لكل استدعاء، مثالي للمزامنة من نظام CRM لديكم)، (3) بريد إلكتروني للتفعيل قابل للتخصيص بالكامل لعلامتكم التجارية، يُرسل تلقائياً لكل عميل مع رمز الوصول الخاص به. يرافقكم مدير حساب مخصص تقنياً.",
        "partner.landing.v2.faq.a5": "منظمو الرحلات، وكالات السفر، شركات الرحلات البحرية، خدمات الكونسيرج، لجان الموظفين، شركات تأمين السفر والاغتراب، السفارات، القنصليات، البنوك، شركات الفينتك، شركات التأمين التعاوني، شركات النقل، مكاتب الانتقال الدولي، مكاتب المحاماة، الاتحادات والجمعيات، المدارس الدولية، منصات الرحّل الرقميين، الشركات والمجموعات الدولية. أي منظمة على تواصل منتظم مع المسافرين، المصطافين، السياح، الرحّل الرقميين، المغتربين، الطلاب أو المهنيين في انتقال دولي.",
        "partner.landing.v2.corporates.gdpr.title": "الامتثال الدولي",
        "partner.landing.v2.corporates.gdpr.desc": "اتفاقية معالجة البيانات متوافقة مع GDPR (الاتحاد الأوروبي)، CCPA (كاليفورنيا)، LGPD (البرازيل)، PIPEDA (كندا)، POPIA (جنوب إفريقيا)، APP (أستراليا). استضافة متعددة المناطق، سجل تدقيق كامل، مقاولون من الباطن محددون. ملائم للخدمات القانونية المتطلبة في أي مكان في العالم.",
        "partner.landing.v2.corporates.overline": "لجميع الأحجام",
        "partner.landing.v2.corporates.title": "من المكتب المستقل إلى المجموعة الكبرى",
        "partner.landing.v2.corporates.subtitle": "للمستقلين، أضيفوا عملاءكم واحداً تلو الآخر أو عبر CSV من اللوحة: ترسل SOS-Expat تلقائياً لكل عميل بريد التفعيل مع رمز الوصول. للمجموعات الكبرى، اربطوا REST API للمزامنة من نظام CRM لديكم (حتى 500 عميل لكل استدعاء) وأديروا عدة مكاتب في لوحة موحدة.",
        "partner.landing.v2.steps.integrate.desc": "أضيفوا عملاءكم واحداً تلو الآخر، استوردوهم عبر CSV أو زامنوا من نظام CRM لديكم عبر REST API. يتلقى كل عميل بعد ذلك تلقائياً بريد التفعيل مع رمز الوصول الشخصي. يرافقكم فريقنا التقني.",
        "partner.landing.v2.advantages.widget.title": "بريد تفعيل تلقائي",
        "partner.landing.v2.advantages.widget.desc": "يتلقى كل عميل من عملائكم تلقائياً بريداً إلكترونياً مع رمز الوصول الشخصي والرابط للاتصال. قوالب قابلة للتخصيص بالكامل لعلامتكم التجارية، بـ 9 لغات.",
        "partner.landing.v2.value.tools.desc": "REST API مع استيراد بالجملة، لوحة شريك لإضافة ومتابعة عملائكم في الوقت الفعلي، بريد تفعيل تلقائي قابل للتخصيص لعلامتكم، ومدير حساب وحيد لقيادة الشراكة.",
        "partner.landing.v2.seo.description": "عرض استثنائي يميّز علامتكم التجارية: أينما كانوا في العالم، يتواصل عملاؤكم مع محامٍ يتحدث لغتهم هاتفياً في أقل من 5 دقائق. 197 دولة، 24/7. مسافرون، مصطافون، رحّل رقميون، مغتربون. اشتراك شهري B2B، REST API، لوحة في الوقت الفعلي.",
        "seo.partner.keywords": "محامٍ بلغتهم 5 دقائق، اتصال هاتفي محامٍ دولي طارئ، شريك SOS Expat، برنامج شراكة B2B مسافرون مصطافون رحّل رقميون مغتربون، مساعدة هاتفية دولية 24/7، طارئ في الخارج، وكالة سفر شريكة، منظم رحلات، لجنة موظفين، تأمين السفر، سفارة شريكة، بنك شريك، اتفاقية B2B مخصصة، عرض علامة استثنائي",
        "seo.partner.ogDescription": "عرض استثنائي لعملائكم: أينما كانوا في العالم، يتواصلون مع محامٍ يتحدث لغتهم هاتفياً في أقل من 5 دقائق. مسافرون، مصطافون، رحّل رقميون، مغتربون. 197 دولة، 24/7. اتفاقية شراكة مخصصة، أدوات تكامل، مدير حساب مخصص.",
        "seo.partner.ogTitle": "برنامج الشركاء SOS-Expat | محامٍ بلغتهم، أينما كانوا، خلال 5 دقائق",
        "seo.partner.twitterDescription": "عرض استثنائي يميّز علامتكم التجارية: أينما كانوا في العالم، يتواصل عملاؤكم مع محامٍ يتحدث لغتهم هاتفياً في أقل من 5 دقائق. 197 دولة، 24/7. منظمو الرحلات، لجان الموظفين، شركات التأمين، السفارات، البنوك، الجمعيات.",
        "seo.partner.twitterTitle": "شريك SOS-Expat | محامٍ بلغتهم، أينما كانوا، خلال 5 د",
    },
    "ru": {
        "partner.landing.v2.hero.highlight": "менее чем за 5 минут",
        "partner.landing.v2.hero.title": "Где бы они ни находились в мире — адвокат на их языке за {highlight}",
        "partner.landing.v2.hero.subtitle": "Подарите клиентам спокойствие, где бы они ни находились в мире. Путешественники, отдыхающие, туристы, цифровые кочевники, экспаты, студенты: при любой потребности или экстренной ситуации за рубежом они по телефону связываются с адвокатом, говорящим на их языке. Или с местным экспатом-помощником для практических вопросов. 24/7, 365 дней в году, праздники включительно, в 197 странах. Исключительное предложение, выделяющее ваш бренд, без какой-либо логистики для ваших команд.",
        "partner.landing.v2.hero.trust.languages": "Все языки",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 дней/год",
        "partner.landing.v2.profiles.realestate": "Международная недвижимость",
        "partner.landing.v2.profiles.travel": "Туристические агентства, туроператоры и круизы",
        "partner.landing.v2.profiles.independent": "Независимые бюро и агентства",
        "partner.landing.v2.profiles.smb": "Малый бизнес, ИП и фрилансеры",
        "partner.landing.v2.profiles.subtitle": "Любая организация, регулярно работающая с путешественниками, отдыхающими, туристами, цифровыми кочевниками, экспатами, студентами или профессионалами в международной мобильности, в любой точке мира. От туроператора до посольства, от финтеха до совета трудового коллектива.",
        "partner.landing.v2.faq.a2": "Каждое партнёрство строится индивидуально. Исходя из вашего сектора, предполагаемого объёма и потребностей, мы вместе определяем формулу (per-member, фиксированный тариф, ступени или индивидуально), способ подключения ваших клиентов (ручное добавление через панель, массовый импорт CSV или синхронизация через REST API из вашего CRM), коммерческие условия и срок. Все условия фиксируются в Order Form, подписанном электронно, вместе с условиями B2B и DPA, соответствующим GDPR/CCPA/LGPD.",
        "partner.landing.v2.faq.a4": "Три варианта на выбор в зависимости от вашей технической зрелости: (1) ручное добавление или импорт CSV из вашей партнёрской панели, (2) REST API с авторизацией Bearer (детализированные scopes, массовый импорт до 500 клиентов за вызов, идеально для синхронизации из вашего CRM), (3) полностью настраиваемое под ваш бренд письмо активации, автоматически отправляемое каждому клиенту с его кодом доступа. Выделенный аккаунт-менеджер поддерживает вас технически.",
        "partner.landing.v2.faq.a5": "Туроператоры, туристические агентства, круизные компании, консьерж-сервисы, советы трудовых коллективов, страховые компании туризма и экспатов, посольства, консульства, банки, финтех, страховые общества взаимного страхования, перевозчики, релокейшен-агентства, юридические фирмы, федерации и ассоциации, международные школы, платформы для цифровых кочевников, компании и международные группы. Любая организация, регулярно работающая с путешественниками, отдыхающими, туристами, цифровыми кочевниками, экспатами, студентами или профессионалами в международной мобильности.",
        "partner.landing.v2.corporates.gdpr.title": "Международное соответствие",
        "partner.landing.v2.corporates.gdpr.desc": "DPA в соответствии с GDPR (ЕС), CCPA (Калифорния), LGPD (Бразилия), PIPEDA (Канада), POPIA (ЮАР), APP (Австралия). Многорегиональный хостинг, полный аудит-трейл, идентифицированные субподрядчики. Подходит для требовательных юридических служб по всему миру.",
        "partner.landing.v2.corporates.overline": "Для любого размера",
        "partner.landing.v2.corporates.title": "От независимого бюро до крупного концерна",
        "partner.landing.v2.corporates.subtitle": "Независимые, добавляйте клиентов поодиночке или по CSV из панели: SOS-Expat автоматически отправляет каждому клиенту его письмо активации с кодом доступа. Крупные группы, подключите REST API для синхронизации из вашего CRM (до 500 клиентов за вызов) и управляйте несколькими бюро в едином дашборде.",
        "partner.landing.v2.steps.integrate.desc": "Добавляйте клиентов поодиночке, импортируйте по CSV или синхронизируйте из вашего CRM через REST API. Каждый клиент затем автоматически получает письмо активации с личным кодом доступа. Наша техническая команда вас сопровождает.",
        "partner.landing.v2.advantages.widget.title": "Автоматическое письмо активации",
        "partner.landing.v2.advantages.widget.desc": "Каждый ваш клиент автоматически получает письмо со своим личным кодом доступа и ссылкой для звонка. Шаблоны полностью настраиваются под ваш бренд, на 9 языках.",
        "partner.landing.v2.value.tools.desc": "REST API с массовым импортом, партнёрский дашборд для добавления и отслеживания ваших клиентов в реальном времени, автоматическое письмо активации, настраиваемое под ваш бренд, и единый аккаунт-менеджер для управления партнёрством.",
        "partner.landing.v2.seo.description": "Исключительное предложение, выделяющее ваш бренд: где бы они ни находились в мире, ваши клиенты по телефону менее чем за 5 минут связываются с адвокатом, говорящим на их языке. 197 стран, 24/7. Путешественники, отдыхающие, цифровые кочевники, экспаты. Месячная B2B-подписка, REST API, дашборд в реальном времени.",
        "seo.partner.keywords": "адвокат на их языке 5 минут, телефонная связь адвокат международная экстренная, партнёр SOS Expat, программа партнёрства B2B путешественники отдыхающие цифровые кочевники экспаты, международная телефонная помощь 24/7, экстренная за рубежом, туристическое агентство партнёр, туроператор, совет трудового коллектива, страхование путешествий, посольство партнёр, банк партнёр, индивидуальное B2B-соглашение, исключительное предложение бренд",
        "seo.partner.ogDescription": "Исключительное предложение для ваших клиентов: где бы они ни находились в мире, они по телефону менее чем за 5 минут связываются с адвокатом, говорящим на их языке. Путешественники, отдыхающие, цифровые кочевники, экспаты. 197 стран, 24/7. Индивидуальное партнёрское соглашение, инструменты интеграции, выделенный аккаунт-менеджер.",
        "seo.partner.ogTitle": "Партнёрская Программа SOS-Expat | Адвокат на Их Языке, Где Бы Они Ни Были, За 5 Минут",
        "seo.partner.twitterDescription": "Исключительное предложение, выделяющее ваш бренд: где бы они ни находились, ваши клиенты по телефону менее чем за 5 минут связываются с адвокатом, говорящим на их языке. 197 стран, 24/7. Туроператоры, советы трудовых коллективов, страховщики, посольства, банки, ассоциации.",
        "seo.partner.twitterTitle": "Партнёр SOS-Expat | Адвокат на Их Языке, Где Бы Они Ни Были, За 5 мин",
    },
    "hi": {
        "partner.landing.v2.hero.highlight": "5 मिनट से कम में",
        "partner.landing.v2.hero.title": "वे दुनिया में कहीं भी हों, उनकी भाषा में एक वकील {highlight}",
        "partner.landing.v2.hero.subtitle": "अपने ग्राहकों को मन की शांति दें, वे दुनिया में कहीं भी हों। यात्री, छुट्टी मनाने वाले, पर्यटक, डिजिटल नोमैड, प्रवासी, छात्र: विदेश में किसी भी ज़रूरत या आपात स्थिति के लिए, वे फ़ोन पर ऐसे वकील से जुड़ते हैं जो उनकी भाषा बोलता है। या व्यावहारिक मामलों के लिए स्थानीय सहायक प्रवासी से। 24/7, साल के 365 दिन, छुट्टियों सहित, 197 देशों में। एक असाधारण पेशकश जो आपके ब्रांड को अलग करती है, आपकी टीमों के लिए शून्य लॉजिस्टिक्स के साथ।",
        "partner.landing.v2.hero.trust.languages": "सभी भाषाएँ",
        "partner.landing.v2.hero.trust.availability": "24/7 · 365 दिन/वर्ष",
        "partner.landing.v2.profiles.realestate": "अंतर्राष्ट्रीय रियल एस्टेट",
        "partner.landing.v2.profiles.travel": "ट्रैवल एजेंसियाँ, टूर ऑपरेटर और क्रूज़",
        "partner.landing.v2.profiles.independent": "स्वतंत्र फ़र्म और एजेंसियाँ",
        "partner.landing.v2.profiles.smb": "व्यापारी, छोटे व्यवसाय और फ्रीलांसर",
        "partner.landing.v2.profiles.subtitle": "कोई भी संगठन जो यात्रियों, छुट्टी मनाने वालों, पर्यटकों, डिजिटल नोमैड, प्रवासियों, छात्रों या अंतर्राष्ट्रीय गतिशीलता वाले पेशेवरों के साथ नियमित संपर्क में हो, दुनिया में कहीं भी। टूर ऑपरेटर से लेकर दूतावास तक, फिनटेक से लेकर कर्मचारी समिति तक।",
        "partner.landing.v2.faq.a2": "हर साझेदारी अनुकूलित बनाई जाती है। आपके क्षेत्र, अनुमानित मात्रा और आवश्यकताओं के आधार पर, हम साथ मिलकर फ़ॉर्मूला (per-member, फ़्लैट शुल्क, चरणबद्ध या कस्टम), आपके ग्राहकों के ऑनबोर्डिंग का तरीक़ा (डैशबोर्ड से मैन्युअल जोड़, बल्क CSV आयात या आपके CRM से REST API सिंक्रोनाइज़ेशन), वाणिज्यिक शर्तें और अवधि निर्धारित करते हैं। सभी शर्तें इलेक्ट्रॉनिक रूप से हस्ताक्षरित Order Form में दर्ज की जाती हैं, B2B शर्तों और GDPR/CCPA/LGPD-अनुपालक DPA के साथ।",
        "partner.landing.v2.faq.a4": "आपकी तकनीकी परिपक्वता के अनुसार तीन विकल्प: (1) आपके पार्टनर डैशबोर्ड से मैन्युअल जोड़ या CSV आयात, (2) Bearer ऑथेंटिकेशन वाला REST API (विस्तृत scopes, प्रति कॉल 500 ग्राहकों तक बल्क आयात, आपके CRM से सिंक्रोनाइज़ करने के लिए आदर्श), (3) आपके ब्रांड के लिए पूरी तरह अनुकूलनीय एक्टिवेशन ईमेल, हर ग्राहक को उसके एक्सेस कोड के साथ स्वचालित रूप से भेजा जाता है। एक समर्पित अकाउंट मैनेजर तकनीकी रूप से आपका साथ देता है।",
        "partner.landing.v2.faq.a5": "टूर ऑपरेटर, ट्रैवल एजेंसियाँ, क्रूज़ कंपनियाँ, कन्सीयर्ज सेवाएँ, कर्मचारी समितियाँ, यात्रा और प्रवासी बीमाकर्ता, दूतावास, वाणिज्य दूतावास, बैंक, फिनटेक, परस्पर बीमा कंपनियाँ, मूवर्स, रीलोकेशन फ़र्म, लॉ फ़र्म, संघ और संगठन, अंतर्राष्ट्रीय स्कूल, डिजिटल नोमैड प्लेटफ़ॉर्म, कंपनियाँ और अंतर्राष्ट्रीय समूह। कोई भी संगठन जो यात्रियों, छुट्टी मनाने वालों, पर्यटकों, डिजिटल नोमैड, प्रवासियों, छात्रों या अंतर्राष्ट्रीय गतिशीलता वाले पेशेवरों के साथ नियमित संपर्क में हो।",
        "partner.landing.v2.corporates.gdpr.title": "अंतर्राष्ट्रीय अनुपालन",
        "partner.landing.v2.corporates.gdpr.desc": "GDPR (EU), CCPA (कैलिफ़ोर्निया), LGPD (ब्राज़ील), PIPEDA (कनाडा), POPIA (दक्षिण अफ़्रीका), APP (ऑस्ट्रेलिया) के अनुरूप DPA। मल्टी-रीजन होस्टिंग, पूर्ण ऑडिट ट्रेल, पहचाने गए सब-प्रोसेसर। दुनिया भर में मांगने वाले क़ानूनी विभागों के लिए उपयुक्त।",
        "partner.landing.v2.corporates.overline": "हर आकार के लिए",
        "partner.landing.v2.corporates.title": "स्वतंत्र फ़र्म से लेकर बड़े समूह तक",
        "partner.landing.v2.corporates.subtitle": "स्वतंत्र, अपने ग्राहकों को डैशबोर्ड से एक-एक करके या CSV द्वारा जोड़ें: SOS-Expat स्वचालित रूप से प्रत्येक ग्राहक को उसके एक्सेस कोड के साथ एक्टिवेशन ईमेल भेजता है। बड़े समूह, अपने CRM से सिंक्रोनाइज़ करने के लिए REST API से जुड़ें (प्रति कॉल 500 ग्राहकों तक) और एकीकृत डैशबोर्ड में कई फ़र्मों का प्रबंधन करें।",
        "partner.landing.v2.steps.integrate.desc": "अपने ग्राहकों को एक-एक करके जोड़ें, उन्हें CSV द्वारा आयात करें या REST API के माध्यम से अपने CRM से सिंक्रोनाइज़ करें। प्रत्येक ग्राहक को फिर स्वचालित रूप से व्यक्तिगत एक्सेस कोड के साथ अपना एक्टिवेशन ईमेल मिलता है। हमारी तकनीकी टीम आपका साथ देती है।",
        "partner.landing.v2.advantages.widget.title": "स्वचालित एक्टिवेशन ईमेल",
        "partner.landing.v2.advantages.widget.desc": "आपके प्रत्येक ग्राहक को स्वचालित रूप से एक ईमेल मिलता है जिसमें उसका व्यक्तिगत एक्सेस कोड और कॉल करने का लिंक होता है। आपके ब्रांड के लिए पूरी तरह अनुकूलनीय टेम्पलेट, 9 भाषाओं में।",
        "partner.landing.v2.value.tools.desc": "बल्क आयात के साथ REST API, अपने ग्राहकों को रियल-टाइम में जोड़ने और ट्रैक करने के लिए पार्टनर डैशबोर्ड, आपके ब्रांड के लिए अनुकूलनीय स्वचालित एक्टिवेशन ईमेल, और साझेदारी संचालित करने के लिए एक समर्पित अकाउंट मैनेजर।",
        "partner.landing.v2.seo.description": "आपके ब्रांड को अलग करने वाली एक असाधारण पेशकश: वे दुनिया में कहीं भी हों, आपके ग्राहक 5 मिनट से कम में फ़ोन पर ऐसे वकील से जुड़ते हैं जो उनकी भाषा बोलता है। 197 देश, 24/7। यात्री, छुट्टी मनाने वाले, डिजिटल नोमैड, प्रवासी। मासिक B2B सब्सक्रिप्शन, REST API, रियल-टाइम डैशबोर्ड।",
        "seo.partner.keywords": "उनकी भाषा में वकील 5 मिनट, फ़ोन कनेक्शन वकील अंतर्राष्ट्रीय आपातकाल, SOS Expat पार्टनर, B2B साझेदारी कार्यक्रम यात्री छुट्टी मनाने वाले डिजिटल नोमैड प्रवासी, अंतर्राष्ट्रीय फ़ोन सहायता 24/7, विदेश में आपातकाल, पार्टनर ट्रैवल एजेंसी, टूर ऑपरेटर, कर्मचारी समिति, यात्रा बीमा, पार्टनर दूतावास, पार्टनर बैंक, अनुकूलित B2B समझौता, असाधारण ब्रांड पेशकश",
        "seo.partner.ogDescription": "अपने ग्राहकों को देने के लिए एक असाधारण पेशकश: वे दुनिया में कहीं भी हों, वे 5 मिनट से कम में फ़ोन पर ऐसे वकील से जुड़ते हैं जो उनकी भाषा बोलता है। यात्री, छुट्टी मनाने वाले, डिजिटल नोमैड, प्रवासी। 197 देश, 24/7। अनुकूलित साझेदारी समझौता, एकीकरण उपकरण, समर्पित अकाउंट मैनेजर।",
        "seo.partner.ogTitle": "SOS-Expat पार्टनर प्रोग्राम | उनकी भाषा में एक वकील, वे जहाँ भी हों, 5 मिनट में",
        "seo.partner.twitterDescription": "आपके ब्रांड को अलग करने वाली एक असाधारण पेशकश: वे दुनिया में कहीं भी हों, आपके ग्राहक 5 मिनट से कम में फ़ोन पर ऐसे वकील से जुड़ते हैं जो उनकी भाषा बोलता है। 197 देश, 24/7। टूर ऑपरेटर, कर्मचारी समितियाँ, बीमाकर्ता, दूतावास, बैंक, संघ।",
        "seo.partner.twitterTitle": "SOS-Expat पार्टनर | उनकी भाषा में एक वकील, वे जहाँ भी हों, 5 मिनट में",
    },
    "ch": {
        "partner.landing.v2.hero.highlight": "5分钟内",
        "partner.landing.v2.hero.title": "无论他们身在世界何处,{highlight}用他们的语言为他们提供律师",
        "partner.landing.v2.hero.subtitle": "无论客户身在世界何处,都为他们提供安心保障。旅行者、度假者、游客、数字游民、外籍人士、学生:无论在国外有任何需求或紧急情况,他们都可以通过电话联系到一位讲他们语言的律师。或一位当地的协助外籍人士处理实务事项。全年365天24小时全天候,包括节假日,覆盖197个国家。一项独特的产品,让您的品牌脱颖而出,且无需贵团队承担任何运营负担。",
        "partner.landing.v2.hero.trust.languages": "所有语言",
        "partner.landing.v2.hero.trust.availability": "24/7 · 全年365天",
        "partner.landing.v2.profiles.realestate": "国际房地产",
        "partner.landing.v2.profiles.travel": "旅行社、旅游运营商及邮轮公司",
        "partner.landing.v2.profiles.independent": "独立事务所与机构",
        "partner.landing.v2.profiles.smb": "商户、中小企业与自由职业者",
        "partner.landing.v2.profiles.subtitle": "任何与旅行者、度假者、游客、数字游民、外籍人士、学生或国际流动专业人员保持定期联系的组织,遍布全球。从旅游运营商到大使馆,从金融科技公司到企业员工委员会。",
        "partner.landing.v2.faq.a2": "每项合作均为定制化构建。根据您的行业、预估业务量及需求,我们共同确定方案模式(per-member 按人计费、固定套餐、阶梯式或定制),贵客户的接入方式(通过仪表盘手动添加、CSV 批量导入或通过 REST API 与您的 CRM 同步),商业条款及合作期限。所有条款均记录于电子签署的 Order Form,并附带 B2B 合同条款及符合 GDPR/CCPA/LGPD 标准的 DPA。",
        "partner.landing.v2.faq.a4": "根据贵方技术成熟度,可选择三种方式:(1) 通过合作伙伴仪表盘手动添加或 CSV 导入;(2) 带 Bearer 认证的 REST API(精细化 scopes 权限、单次调用最多 500 个客户的批量导入,适合从您的 CRM 同步);(3) 完全可按贵品牌定制的激活邮件,自动发送给每位客户及其访问代码。专属客户经理为您提供技术支持。",
        "partner.landing.v2.faq.a5": "旅游运营商、旅行社、邮轮公司、礼宾服务、企业员工委员会、旅行及外籍人士保险公司、大使馆、领事馆、银行、金融科技、互助保险、搬家公司、relocation 事务所、律师事务所、联合会及协会、国际学校、数字游民平台、企业及国际集团。任何与旅行者、度假者、游客、数字游民、外籍人士、学生或国际流动专业人员保持定期联系的组织。",
        "partner.landing.v2.corporates.gdpr.title": "国际合规",
        "partner.landing.v2.corporates.gdpr.desc": "DPA 符合 GDPR(欧盟)、CCPA(加州)、LGPD(巴西)、PIPEDA(加拿大)、POPIA(南非)、APP(澳大利亚)。多区域托管、完整审计追溯、子处理者明确标识。适合全球范围内对法务要求严格的部门。",
        "partner.landing.v2.corporates.overline": "适合各种规模",
        "partner.landing.v2.corporates.title": "从独立事务所到大型集团",
        "partner.landing.v2.corporates.subtitle": "独立事务所:从仪表盘逐个或通过 CSV 添加客户,SOS-Expat 自动向每位客户发送带访问代码的激活邮件。大型集团:接入 REST API 与 CRM 同步(单次调用最多 500 个客户),并在统一仪表盘中管理多个事务所。",
        "partner.landing.v2.steps.integrate.desc": "逐个添加客户、通过 CSV 导入或经由 REST API 与您的 CRM 同步。每位客户随后会自动收到包含个人访问代码的激活邮件。我们的技术团队为您全程提供支持。",
        "partner.landing.v2.advantages.widget.title": "自动激活邮件",
        "partner.landing.v2.advantages.widget.desc": "您的每位客户都会自动收到一封邮件,包含其个人访问代码及拨打电话的链接。模板可完全按贵品牌定制,提供 9 种语言版本。",
        "partner.landing.v2.value.tools.desc": "支持批量导入的 REST API、用于实时添加和跟踪客户的合作伙伴仪表盘、可按贵品牌定制的自动激活邮件,以及统一管理合作的专属客户经理。",
        "partner.landing.v2.seo.description": "一项让贵品牌脱颖而出的独特产品:无论客户身在世界何处,他们都可以通过电话在 5 分钟内联系到一位讲他们语言的律师。197 个国家、24/7 全天候服务。旅行者、度假者、数字游民、外籍人士。月度 B2B 订阅、REST API、实时仪表盘。",
        "seo.partner.keywords": "客户语言律师 5 分钟、电话连线国际紧急律师、SOS Expat 合作伙伴、B2B 合作计划 旅行者 度假者 数字游民 外籍人士、国际电话援助 24/7、海外紧急情况、合作旅行社、旅游运营商、企业员工委员会、旅行保险、合作大使馆、合作银行、定制 B2B 协议、独特品牌产品",
        "seo.partner.ogDescription": "一项可提供给客户的独特产品:无论身在世界何处,他们都可以通过电话在 5 分钟内联系到一位讲他们语言的律师。旅行者、度假者、数字游民、外籍人士。197 个国家、24/7。定制合作协议、集成工具、专属客户经理。",
        "seo.partner.ogTitle": "SOS-Expat 合作伙伴计划 | 客户身在何处,5 分钟内为他们提供讲其语言的律师",
        "seo.partner.twitterDescription": "一项让贵品牌脱颖而出的独特产品:无论客户身在世界何处,他们都可以通过电话在 5 分钟内联系到一位讲他们语言的律师。197 个国家、24/7。旅游运营商、企业员工委员会、保险公司、大使馆、银行、协会。",
        "seo.partner.twitterTitle": "SOS-Expat 合作伙伴 | 5 分钟内为客户提供讲其语言的律师",
    },
}

# Mirror ch → zh (Chinese variants live in both files for hreflang compatibility).
TRANSLATIONS["zh"] = TRANSLATIONS["ch"].copy()


def update_file(path: Path, lang: str) -> int:
    """Apply translations for one language to one file. Returns number of keys touched."""
    if not path.exists():
        return 0
    with path.open(encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=OrderedDict)
    n = 0
    for key, val in TRANSLATIONS[lang].items():
        if data.get(key) != val:
            data[key] = val
            n += 1
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return n


def main() -> int:
    total = 0
    for lang in TRANSLATIONS:
        for loc in LOCATIONS:
            path = loc / f"{lang}.json"
            n = update_file(path, lang)
            print(f"  {path.relative_to(ROOT)}: {n} keys updated")
            total += n
    print(f"\nTotal: {total} key-updates across all files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
