// Script à exécuter dans la console Firebase ou via Node.js
// Collection: app_faq — 20 nouvelles FAQ (orders 11 à 30)
//
// Usage Node.js:
//   npm install firebase-admin
//   node faq-20-nouvelles.js
//
// Usage console Firebase (onglet Firestore → ... → Run query → Script):
//   Coller le tableau faqs et la boucle d'insertion

const faqs = [

  // ─────────────────────────────────────────────
  // DISCOVER (orders 11-13)
  // ─────────────────────────────────────────────

  {
    order: 11,
    category: "discover",
    isActive: true,
    isFooter: false,
    tags: ["coverage", "countries", "worldwide", "expat", "global"],
    question: {
      fr: "Quels pays sont couverts par SOS-Expat ?",
      en: "What countries does SOS-Expat cover?",
      es: "¿En qué países está disponible SOS-Expat?",
      de: "In welchen Ländern ist SOS-Expat verfügbar?",
      pt: "Em quais países o SOS-Expat está disponível?",
      ru: "В каких странах работает SOS-Expat?",
      hi: "SOS-Expat किन देशों में उपलब्ध है?",
      ar: "في أي دول يتوفر SOS-Expat؟",
      ch: "SOS-Expat覆盖哪些国家？"
    },
    answer: {
      fr: "SOS-Expat couvre 197 pays dans le monde entier, ce qui en fait l'un des services d'assistance aux expatriés les plus complets disponibles. Que vous soyez en Europe, en Amérique, en Afrique, au Moyen-Orient ou en Asie, un prestataire local peut vous répondre en moins de 5 minutes.\n<ul>\n<li><strong>Europe</strong> : tous les pays de l'UE, Suisse, Royaume-Uni, Turquie, pays des Balkans</li>\n<li><strong>Amériques</strong> : États-Unis, Canada, Mexique, Brésil, Argentine, Colombie et plus de 30 autres pays</li>\n<li><strong>Afrique</strong> : 54 pays couverts, dont Maroc, Côte d'Ivoire, Sénégal, Kenya, Afrique du Sud</li>\n<li><strong>Moyen-Orient</strong> : Émirats arabes unis, Arabie Saoudite, Qatar, Koweït, Bahreïn, Liban</li>\n<li><strong>Asie-Pacifique</strong> : Inde, Chine, Japon, Singapour, Thaïlande, Australie, Nouvelle-Zélande</li>\n</ul>\nCette couverture mondiale est rendue possible par notre réseau de prestataires locaux vérifiés — des avocats et des expatriés aidants qui connaissent parfaitement les réglementations, les démarches et les usages de leur pays. Au moment de votre recherche, vous pouvez filtrer par pays pour trouver le prestataire le plus adapté à votre situation.",
      en: "SOS-Expat covers 197 countries worldwide, making it one of the most comprehensive expat assistance services available. Whether you are in Europe, the Americas, Africa, the Middle East, or Asia, a local expert can respond to you in under 5 minutes.\n<ul>\n<li><strong>Europe</strong>: all EU countries, Switzerland, United Kingdom, Turkey, Balkan countries</li>\n<li><strong>Americas</strong>: USA, Canada, Mexico, Brazil, Argentina, Colombia, and over 30 more countries</li>\n<li><strong>Africa</strong>: 54 countries including Morocco, Ivory Coast, Senegal, Kenya, South Africa</li>\n<li><strong>Middle East</strong>: UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Lebanon</li>\n<li><strong>Asia-Pacific</strong>: India, China, Japan, Singapore, Thailand, Australia, New Zealand</li>\n</ul>\nThis global coverage is made possible by our network of verified local providers — lawyers and helping expats who have deep knowledge of regulations, administrative procedures, and local customs in their country. When searching, you can filter by country to find the most relevant provider for your situation.",
      es: "SOS-Expat cubre 197 países en todo el mundo, lo que lo convierte en uno de los servicios de asistencia a expatriados más completos disponibles. Tanto si estás en Europa, América, África, Oriente Medio o Asia, un experto local puede responderte en menos de 5 minutos.\n<ul>\n<li><strong>Europa</strong>: todos los países de la UE, Suiza, Reino Unido, Turquía</li>\n<li><strong>Américas</strong>: EE.UU., Canadá, México, Brasil, Argentina, Colombia y más de 30 países</li>\n<li><strong>África</strong>: 54 países, incluyendo Marruecos, Costa de Marfil, Kenia, Sudáfrica</li>\n<li><strong>Oriente Medio</strong>: Emiratos Árabes, Arabia Saudita, Qatar, Kuwait, Bahréin</li>\n<li><strong>Asia-Pacífico</strong>: India, China, Japón, Singapur, Tailandia, Australia</li>\n</ul>\nEsta cobertura global es posible gracias a nuestra red de proveedores locales verificados: abogados y expatriados que conocen a fondo las regulaciones y procedimientos de su país.",
      de: "SOS-Expat deckt 197 Länder weltweit ab und ist damit einer der umfassendsten Expat-Hilfsdienste. Egal ob Sie in Europa, Amerika, Afrika, dem Nahen Osten oder Asien sind – ein lokaler Experte kann Ihnen in weniger als 5 Minuten antworten.\n<ul>\n<li><strong>Europa</strong>: alle EU-Länder, Schweiz, Vereinigtes Königreich, Türkei</li>\n<li><strong>Amerika</strong>: USA, Kanada, Mexiko, Brasilien, Argentinien, Kolumbien</li>\n<li><strong>Afrika</strong>: 54 Länder, darunter Marokko, Senegal, Kenia, Südafrika</li>\n<li><strong>Naher Osten</strong>: VAE, Saudi-Arabien, Katar, Kuwait, Bahrain</li>\n<li><strong>Asien-Pazifik</strong>: Indien, China, Japan, Singapur, Thailand, Australien</li>\n</ul>\nDiese weltweite Abdeckung wird durch unser Netzwerk geprüfter lokaler Anbieter ermöglicht, die die Gesetze und Gepflogenheiten ihres Landes bestens kennen.",
      pt: "O SOS-Expat cobre 197 países em todo o mundo, tornando-o um dos serviços de assistência a expatriados mais completos disponíveis. Seja na Europa, nas Américas, na África, no Oriente Médio ou na Ásia, um especialista local pode responder em menos de 5 minutos.\n<ul>\n<li><strong>Europa</strong>: todos os países da UE, Suíça, Reino Unido, Turquia</li>\n<li><strong>Américas</strong>: EUA, Canadá, México, Brasil, Argentina, Colômbia e mais de 30 países</li>\n<li><strong>África</strong>: 54 países, incluindo Marrocos, Senegal, Quênia, África do Sul</li>\n<li><strong>Oriente Médio</strong>: Emirados Árabes, Arábia Saudita, Qatar, Kuwait, Bahrein</li>\n<li><strong>Ásia-Pacífico</strong>: Índia, China, Japão, Singapura, Tailândia, Austrália</li>\n</ul>\nEssa cobertura global é possível graças à nossa rede de prestadores locais verificados — advogados e expatriados que conhecem profundamente as regulamentações e práticas do seu país.",
      ru: "SOS-Expat охватывает 197 стран по всему миру, что делает его одним из наиболее полных сервисов помощи экспатам. Где бы вы ни находились — в Европе, Америке, Африке, на Ближнем Востоке или в Азии — местный эксперт ответит вам менее чем за 5 минут.\n<ul>\n<li><strong>Европа</strong>: все страны ЕС, Швейцария, Великобритания, Турция, Балканы</li>\n<li><strong>Америка</strong>: США, Канада, Мексика, Бразилия, Аргентина, Колумбия</li>\n<li><strong>Африка</strong>: 54 страны, включая Марокко, Кот-д'Ивуар, Кению, ЮАР</li>\n<li><strong>Ближний Восток</strong>: ОАЭ, Саудовская Аравия, Катар, Кувейт, Бахрейн</li>\n<li><strong>Азия-Тихоокеанский регион</strong>: Индия, Китай, Япония, Сингапур, Таиланд, Австралия</li>\n</ul>\nТакой глобальный охват обеспечивается сетью проверенных местных специалистов — юристов и экспатов-помощников, хорошо знакомых с законами и практикой своей страны.",
      hi: "SOS-Expat दुनिया भर के 197 देशों को कवर करता है, जो इसे प्रवासियों के लिए सबसे व्यापक सहायता सेवाओं में से एक बनाता है। चाहे आप यूरोप, अमेरिका, अफ्रीका, मध्य-पूर्व या एशिया में हों, एक स्थानीय विशेषज्ञ 5 मिनट से कम समय में आपको जवाब दे सकता है।\n<ul>\n<li><strong>यूरोप</strong>: सभी EU देश, स्विट्ज़रलैंड, यूके, तुर्की</li>\n<li><strong>अमेरिका</strong>: अमेरिका, कनाडा, मैक्सिको, ब्राज़ील, अर्जेंटीना</li>\n<li><strong>अफ्रीका</strong>: 54 देश, मोरक्को, केन्या, दक्षिण अफ्रीका सहित</li>\n<li><strong>मध्य-पूर्व</strong>: UAE, सऊदी अरब, कतर, कुवैत, बहरीन</li>\n<li><strong>एशिया-प्रशांत</strong>: भारत, चीन, जापान, सिंगापुर, थाईलैंड, ऑस्ट्रेलिया</li>\n</ul>\nयह वैश्विक कवरेज हमारे सत्यापित स्थानीय प्रदाताओं के नेटवर्क द्वारा संभव है — वकील और सहायक प्रवासी जो अपने देश के कानूनों और प्रक्रियाओं से भली-भांति परिचित हैं।",
      ar: "يغطي SOS-Expat 197 دولة حول العالم، مما يجعله أحد أشمل خدمات المساعدة للمغتربين. سواء كنت في أوروبا أو أمريكا أو أفريقيا أو الشرق الأوسط أو آسيا، يمكن لخبير محلي الرد عليك في أقل من 5 دقائق.\n<ul>\n<li><strong>أوروبا</strong>: جميع دول الاتحاد الأوروبي، سويسرا، المملكة المتحدة، تركيا</li>\n<li><strong>الأمريكتان</strong>: الولايات المتحدة، كندا، المكسيك، البرازيل، الأرجنتين</li>\n<li><strong>أفريقيا</strong>: 54 دولة، منها المغرب، السنغال، كينيا، جنوب أفريقيا</li>\n<li><strong>الشرق الأوسط</strong>: الإمارات، المملكة العربية السعودية، قطر، الكويت، البحرين</li>\n<li><strong>آسيا والمحيط الهادئ</strong>: الهند، الصين، اليابان، سنغافورة، تايلاند، أستراليا</li>\n</ul>\nيتيح هذا التغطية العالمية شبكتنا من المقدمين المحليين الموثوقين — محامين ومغتربين مساعدين يعرفون جيداً أنظمة وإجراءات بلدانهم.",
      ch: "SOS-Expat覆盖全球197个国家，是最全面的海外华人及外籍人士援助服务之一。无论您身处欧洲、美洲、非洲、中东还是亚洲，本地专家均可在5分钟内为您提供帮助。\n<ul>\n<li><strong>欧洲</strong>：所有欧盟国家、瑞士、英国、土耳其</li>\n<li><strong>美洲</strong>：美国、加拿大、墨西哥、巴西、阿根廷</li>\n<li><strong>非洲</strong>：54个国家，包括摩洛哥、塞内加尔、肯尼亚、南非</li>\n<li><strong>中东</strong>：阿联酋、沙特阿拉伯、卡塔尔、科威特、巴林</li>\n<li><strong>亚太地区</strong>：中国、印度、日本、新加坡、泰国、澳大利亚</li>\n</ul>\n这一全球覆盖得益于我们经过严格审核的本地服务商网络——他们是深谙当地法律法规和风俗习惯的律师及华人助理。"
    },
    slug: {
      fr: "pays-couverts-sos-expat-197-pays",
      en: "countries-covered-sos-expat-worldwide",
      es: "paises-cubiertos-sos-expat-mundial",
      de: "laender-sos-expat-weltweite-abdeckung",
      pt: "paises-cobertos-sos-expat-mundial",
      ru: "ru-strany-pokrytye-sos-expat",
      hi: "hi-desh-sos-expat-uplabdh",
      ar: "ar-duwal-mutaha-sos-expat",
      ch: "ch-guojia-fugai-sos-expat"
    }
  },

  {
    order: 12,
    category: "discover",
    isActive: true,
    isFooter: false,
    tags: ["languages", "multilingual", "support", "translation", "expat"],
    question: {
      fr: "Dans quelles langues SOS-Expat est-il disponible ?",
      en: "What languages does SOS-Expat support?",
      es: "¿En qué idiomas está disponible SOS-Expat?",
      de: "In welchen Sprachen ist SOS-Expat verfügbar?",
      pt: "Em quais idiomas o SOS-Expat está disponível?",
      ru: "На каких языках доступен SOS-Expat?",
      hi: "SOS-Expat कितनी भाषाओं में उपलब्ध है?",
      ar: "ما هي اللغات التي يدعمها SOS-Expat؟",
      ch: "SOS-Expat支持哪些语言？"
    },
    answer: {
      fr: "SOS-Expat est disponible en 9 langues, couvrant les principaux groupes linguistiques du monde. L'interface, les profils des prestataires, les FAQ et les avis clients sont tous traduits dans ces langues pour vous offrir la meilleure expérience possible.\n<ul>\n<li>🇫🇷 Français</li>\n<li>🇬🇧 Anglais</li>\n<li>🇪🇸 Espagnol</li>\n<li>🇩🇪 Allemand</li>\n<li>🇧🇷 Portugais</li>\n<li>🇷🇺 Russe</li>\n<li>🇮🇳 Hindi</li>\n<li>🇸🇦 Arabe</li>\n<li>🇨🇳 Chinois (mandarin)</li>\n</ul>\nLorsque vous vous connectez, la langue est automatiquement détectée selon les paramètres de votre navigateur. Vous pouvez à tout moment changer de langue via le sélecteur en haut de la page. Nos prestataires indiquent également les langues dans lesquelles ils peuvent vous répondre, ce qui vous permet de trouver quelqu'un qui parle votre langue maternelle.",
      en: "SOS-Expat is available in 9 languages, covering the world's major linguistic groups. The interface, provider profiles, FAQs, and customer reviews are all translated to offer you the best possible experience.\n<ul>\n<li>🇫🇷 French</li>\n<li>🇬🇧 English</li>\n<li>🇪🇸 Spanish</li>\n<li>🇩🇪 German</li>\n<li>🇧🇷 Portuguese</li>\n<li>🇷🇺 Russian</li>\n<li>🇮🇳 Hindi</li>\n<li>🇸🇦 Arabic</li>\n<li>🇨🇳 Chinese (Mandarin)</li>\n</ul>\nWhen you log in, the language is automatically detected based on your browser settings. You can change the language at any time using the selector at the top of the page. Providers also indicate which languages they can communicate in, so you can find someone who speaks your native language.",
      es: "SOS-Expat está disponible en 9 idiomas, cubriendo los principales grupos lingüísticos del mundo. La interfaz, los perfiles de proveedores, las preguntas frecuentes y las reseñas de clientes están todos traducidos.\n<ul>\n<li>🇫🇷 Francés</li><li>🇬🇧 Inglés</li><li>🇪🇸 Español</li><li>🇩🇪 Alemán</li><li>🇧🇷 Portugués</li><li>🇷🇺 Ruso</li><li>🇮🇳 Hindi</li><li>🇸🇦 Árabe</li><li>🇨🇳 Chino (mandarín)</li>\n</ul>\nEl idioma se detecta automáticamente según la configuración de tu navegador y puedes cambiarlo en cualquier momento. Los proveedores también indican los idiomas en los que pueden atenderte.",
      de: "SOS-Expat ist in 9 Sprachen verfügbar und deckt die wichtigsten Sprachgruppen der Welt ab. Die Benutzeroberfläche, Anbieterprofile, FAQs und Kundenbewertungen sind vollständig übersetzt.\n<ul>\n<li>🇫🇷 Französisch</li><li>🇬🇧 Englisch</li><li>🇪🇸 Spanisch</li><li>🇩🇪 Deutsch</li><li>🇧🇷 Portugiesisch</li><li>🇷🇺 Russisch</li><li>🇮🇳 Hindi</li><li>🇸🇦 Arabisch</li><li>🇨🇳 Chinesisch (Mandarin)</li>\n</ul>\nDie Sprache wird automatisch anhand Ihrer Browsereinstellungen erkannt und kann jederzeit über den Sprachschalter oben auf der Seite geändert werden.",
      pt: "O SOS-Expat está disponível em 9 idiomas, cobrindo os principais grupos linguísticos do mundo. A interface, perfis de prestadores, perguntas frequentes e avaliações de clientes estão todos traduzidos.\n<ul>\n<li>🇫🇷 Francês</li><li>🇬🇧 Inglês</li><li>🇪🇸 Espanhol</li><li>🇩🇪 Alemão</li><li>🇧🇷 Português</li><li>🇷🇺 Russo</li><li>🇮🇳 Hindi</li><li>🇸🇦 Árabe</li><li>🇨🇳 Chinês (mandarim)</li>\n</ul>\nO idioma é detectado automaticamente com base nas configurações do seu navegador e pode ser alterado a qualquer momento pelo seletor no topo da página.",
      ru: "SOS-Expat доступен на 9 языках, охватывая основные языковые группы мира. Интерфейс, профили специалистов, часто задаваемые вопросы и отзывы клиентов — всё переведено.\n<ul>\n<li>🇫🇷 Французский</li><li>🇬🇧 Английский</li><li>🇪🇸 Испанский</li><li>🇩🇪 Немецкий</li><li>🇧🇷 Португальский</li><li>🇷🇺 Русский</li><li>🇮🇳 Хинди</li><li>🇸🇦 Арабский</li><li>🇨🇳 Китайский (мандаринский)</li>\n</ul>\nЯзык определяется автоматически по настройкам браузера и может быть изменён в любой момент. Специалисты также указывают языки, на которых они могут общаться.",
      hi: "SOS-Expat 9 भाषाओं में उपलब्ध है, जो दुनिया के प्रमुख भाषाई समूहों को कवर करती है। इंटरफ़ेस, प्रदाता प्रोफ़ाइल, FAQ और ग्राहक समीक्षाएँ सभी अनुवादित हैं।\n<ul>\n<li>🇫🇷 फ्रेंच</li><li>🇬🇧 अंग्रेज़ी</li><li>🇪🇸 स्पेनिश</li><li>🇩🇪 जर्मन</li><li>🇧🇷 पुर्तगाली</li><li>🇷🇺 रूसी</li><li>🇮🇳 हिंदी</li><li>🇸🇦 अरबी</li><li>🇨🇳 चीनी (मंदारिन)</li>\n</ul>\nआपके ब्राउज़र सेटिंग के अनुसार भाषा स्वचालित रूप से पहचानी जाती है और पृष्ठ के ऊपर सिलेक्टर से बदली जा सकती है।",
      ar: "يتوفر SOS-Expat بـ9 لغات، تغطي المجموعات اللغوية الرئيسية في العالم. الواجهة وملفات المقدمين والأسئلة الشائعة وتقييمات العملاء — كلها مترجمة.\n<ul>\n<li>🇫🇷 الفرنسية</li><li>🇬🇧 الإنجليزية</li><li>🇪🇸 الإسبانية</li><li>🇩🇪 الألمانية</li><li>🇧🇷 البرتغالية</li><li>🇷🇺 الروسية</li><li>🇮🇳 الهندية</li><li>🇸🇦 العربية</li><li>🇨🇳 الصينية (الماندرين)</li>\n</ul>\nيتم تحديد اللغة تلقائياً بناءً على إعدادات المتصفح ويمكن تغييرها في أي وقت. كما يحدد المقدمون اللغات التي يمكنهم التواصل بها.",
      ch: "SOS-Expat提供9种语言服务，涵盖全球主要语言群体。界面、服务商资料、常见问题和客户评价均已翻译。\n<ul>\n<li>🇫🇷 法语</li><li>🇬🇧 英语</li><li>🇪🇸 西班牙语</li><li>🇩🇪 德语</li><li>🇧🇷 葡萄牙语</li><li>🇷🇺 俄语</li><li>🇮🇳 印地语</li><li>🇸🇦 阿拉伯语</li><li>🇨🇳 中文（普通话）</li>\n</ul>\n系统会根据您的浏览器设置自动检测语言，您也可以随时通过页面顶部的选择器切换语言。服务商还会标注他们能够使用的语言，方便您找到母语服务。"
    },
    slug: {
      fr: "langues-disponibles-sos-expat-9-langues",
      en: "languages-supported-sos-expat",
      es: "idiomas-disponibles-sos-expat",
      de: "verfuegbare-sprachen-sos-expat",
      pt: "idiomas-disponiveis-sos-expat",
      ru: "ru-yazyki-dostupnye-sos-expat",
      hi: "hi-bhasha-sos-expat-uplabdh",
      ar: "ar-lughat-mutaha-sos-expat",
      ch: "ch-yuyan-sos-expat-zhichi"
    }
  },

  {
    order: 13,
    category: "discover",
    isActive: true,
    isFooter: false,
    tags: ["speed", "connection", "5-minutes", "expert", "how-it-works"],
    question: {
      fr: "Comment SOS-Expat connecte-t-il un expert local en moins de 5 minutes ?",
      en: "How does SOS-Expat connect you with a local expert in under 5 minutes?",
      es: "¿Cómo conecta SOS-Expat con un experto local en menos de 5 minutos?",
      de: "Wie verbindet SOS-Expat Sie in weniger als 5 Minuten mit einem lokalen Experten?",
      pt: "Como o SOS-Expat conecta você a um especialista local em menos de 5 minutos?",
      ru: "Как SOS-Expat соединяет вас с местным экспертом менее чем за 5 минут?",
      hi: "SOS-Expat 5 मिनट से कम में स्थानीय विशेषज्ञ से कैसे जोड़ता है?",
      ar: "كيف يربطك SOS-Expat بخبير محلي في أقل من 5 دقائق؟",
      ch: "SOS-Expat如何在5分钟内为您连接本地专家？"
    },
    answer: {
      fr: "SOS-Expat fonctionne comme un service de mise en relation instantanée : vous choisissez un prestataire disponible, vous payez en ligne, et vous recevez un appel téléphonique en moins de 5 minutes. Voici le fonctionnement étape par étape :\n<ul>\n<li><strong>1. Choisissez votre pays et votre problème</strong> : sélectionnez le pays concerné et le type d'aide souhaité (juridique, administratif, logement, santé…)</li>\n<li><strong>2. Consultez les profils disponibles</strong> : chaque prestataire affiche ses compétences, ses langues, ses avis clients et sa disponibilité en temps réel</li>\n<li><strong>3. Sélectionnez un prestataire disponible</strong> : le statut vert indique qu'il est prêt à répondre immédiatement</li>\n<li><strong>4. Effectuez le paiement sécurisé</strong> : par carte bancaire via Stripe, en quelques secondes</li>\n<li><strong>5. Attendez l'appel</strong> : le prestataire vous rappelle directement sur votre numéro, généralement en moins de 5 minutes</li>\n</ul>\nIl n'y a pas d'application à télécharger, pas de rendez-vous à fixer, pas d'attente en salle virtuelle. Notre réseau de prestataires est réparti dans 197 pays et actif 24h/24, 7j/7.",
      en: "SOS-Expat works as an instant connection service: you choose an available provider, pay online, and receive a phone call in under 5 minutes. Here is how it works step by step:\n<ul>\n<li><strong>1. Choose your country and issue</strong>: select the relevant country and type of help needed (legal, administrative, housing, health…)</li>\n<li><strong>2. Browse available profiles</strong>: each provider shows their skills, languages, customer reviews, and real-time availability</li>\n<li><strong>3. Select an available provider</strong>: green status means they are ready to answer immediately</li>\n<li><strong>4. Make a secure payment</strong>: by credit card via Stripe, in a few seconds</li>\n<li><strong>5. Wait for the call</strong>: the provider calls you directly on your number, usually within 5 minutes</li>\n</ul>\nNo app to download, no appointment to schedule, no virtual waiting room. Our provider network spans 197 countries and is active 24/7.",
      es: "SOS-Expat funciona como un servicio de conexión instantánea: eliges un proveedor disponible, pagas en línea y recibes una llamada telefónica en menos de 5 minutos.\n<ul>\n<li><strong>1. Elige tu país y problema</strong>: selecciona el país y el tipo de ayuda (legal, administrativa, vivienda, salud…)</li>\n<li><strong>2. Consulta los perfiles disponibles</strong>: cada proveedor muestra sus habilidades, idiomas, reseñas y disponibilidad en tiempo real</li>\n<li><strong>3. Selecciona un proveedor disponible</strong>: el estado verde indica que está listo para responder</li>\n<li><strong>4. Realiza el pago seguro</strong>: por tarjeta bancaria vía Stripe</li>\n<li><strong>5. Espera la llamada</strong>: el proveedor te llama directamente, generalmente en menos de 5 minutos</li>\n</ul>\nSin aplicación que descargar, sin cita previa, sin sala de espera virtual. Disponible 24/7 en 197 países.",
      de: "SOS-Expat funktioniert als sofortiger Vermittlungsdienst: Sie wählen einen verfügbaren Anbieter, zahlen online und erhalten innerhalb von 5 Minuten einen Anruf.\n<ul>\n<li><strong>1. Land und Problem wählen</strong>: Wählen Sie das betreffende Land und die gewünschte Hilfsart</li>\n<li><strong>2. Profile durchsuchen</strong>: Jeder Anbieter zeigt Fähigkeiten, Sprachen, Bewertungen und Echtzeit-Verfügbarkeit</li>\n<li><strong>3. Verfügbaren Anbieter auswählen</strong>: Grüner Status bedeutet sofortige Bereitschaft</li>\n<li><strong>4. Sichere Zahlung vornehmen</strong>: per Kreditkarte über Stripe</li>\n<li><strong>5. Auf den Anruf warten</strong>: Der Anbieter ruft Sie direkt an, meist in unter 5 Minuten</li>\n</ul>\nKeine App nötig, kein Termin, kein virtueller Warteraum. Verfügbar 24/7 in 197 Ländern.",
      pt: "O SOS-Expat funciona como um serviço de conexão instantânea: você escolhe um prestador disponível, paga online e recebe uma ligação em menos de 5 minutos.\n<ul>\n<li><strong>1. Escolha seu país e problema</strong>: selecione o país e o tipo de ajuda desejada</li>\n<li><strong>2. Consulte os perfis disponíveis</strong>: cada prestador mostra habilidades, idiomas, avaliações e disponibilidade em tempo real</li>\n<li><strong>3. Selecione um prestador disponível</strong>: status verde indica que está pronto para atender imediatamente</li>\n<li><strong>4. Faça o pagamento seguro</strong>: por cartão via Stripe</li>\n<li><strong>5. Aguarde a ligação</strong>: o prestador liga diretamente para você, geralmente em menos de 5 minutos</li>\n</ul>\nSem aplicativo para baixar, sem agendamento, sem sala de espera virtual. Disponível 24/7 em 197 países.",
      ru: "SOS-Expat работает как сервис мгновенного подключения: вы выбираете доступного специалиста, оплачиваете онлайн и получаете звонок менее чем за 5 минут.\n<ul>\n<li><strong>1. Выберите страну и проблему</strong>: укажите нужную страну и тип помощи</li>\n<li><strong>2. Просмотрите доступные профили</strong>: каждый специалист показывает навыки, языки, отзывы и доступность в реальном времени</li>\n<li><strong>3. Выберите доступного специалиста</strong>: зелёный статус означает готовность ответить немедленно</li>\n<li><strong>4. Выполните безопасную оплату</strong>: картой через Stripe</li>\n<li><strong>5. Ожидайте звонка</strong>: специалист позвонит вам напрямую, обычно в течение 5 минут</li>\n</ul>\nНет приложения для скачивания, записи на приём или виртуального зала ожидания. Доступно 24/7 в 197 странах.",
      hi: "SOS-Expat एक तत्काल कनेक्शन सेवा की तरह काम करता है: आप एक उपलब्ध प्रदाता चुनें, ऑनलाइन भुगतान करें और 5 मिनट से कम में फोन कॉल प्राप्त करें।\n<ul>\n<li><strong>1. अपना देश और समस्या चुनें</strong>: संबंधित देश और सहायता का प्रकार चुनें</li>\n<li><strong>2. उपलब्ध प्रोफ़ाइल देखें</strong>: प्रत्येक प्रदाता कौशल, भाषाएँ, समीक्षाएँ और रियल-टाइम उपलब्धता दिखाता है</li>\n<li><strong>3. उपलब्ध प्रदाता चुनें</strong>: हरा स्टेटस तुरंत उत्तर देने की तैयारी दर्शाता है</li>\n<li><strong>4. सुरक्षित भुगतान करें</strong>: Stripe के माध्यम से कार्ड द्वारा</li>\n<li><strong>5. कॉल का इंतज़ार करें</strong>: प्रदाता सीधे आपके नंबर पर कॉल करता है, आमतौर पर 5 मिनट से कम में</li>\n</ul>\nकोई ऐप डाउनलोड नहीं, कोई अपॉइंटमेंट नहीं, कोई वर्चुअल वेटिंग रूम नहीं। 197 देशों में 24/7 उपलब्ध।",
      ar: "يعمل SOS-Expat كخدمة اتصال فوري: تختار مقدماً متاحاً، تدفع عبر الإنترنت، وتتلقى مكالمة هاتفية في أقل من 5 دقائق.\n<ul>\n<li><strong>1. اختر بلدك ومشكلتك</strong>: حدد الدولة المعنية ونوع المساعدة المطلوبة</li>\n<li><strong>2. تصفح الملفات المتاحة</strong>: كل مقدم يعرض مهاراته ولغاته وتقييماته وتوفره في الوقت الفعلي</li>\n<li><strong>3. اختر مقدماً متاحاً</strong>: الحالة الخضراء تعني الاستعداد للرد فوراً</li>\n<li><strong>4. أجرِ الدفع الآمن</strong>: ببطاقة ائتمانية عبر Stripe</li>\n<li><strong>5. انتظر المكالمة</strong>: يتصل بك المقدم مباشرة، عادةً في أقل من 5 دقائق</li>\n</ul>\nلا تطبيق للتنزيل، ولا موعد للحجز، ولا غرفة انتظار افتراضية. الخدمة متاحة 24/7 في 197 دولة.",
      ch: "SOS-Expat是一项即时连接服务：您选择一位可用的服务商，在线付款，5分钟内即可接到电话。\n<ul>\n<li><strong>1. 选择您的国家和问题</strong>：选择相关国家和所需帮助类型（法律、行政、住房、健康等）</li>\n<li><strong>2. 浏览可用资料</strong>：每位服务商展示其技能、语言、客户评价和实时可用状态</li>\n<li><strong>3. 选择可用的服务商</strong>：绿色状态表示他们随时可以接听</li>\n<li><strong>4. 安全付款</strong>：通过Stripe刷卡，几秒钟即可完成</li>\n<li><strong>5. 等待电话</strong>：服务商直接拨打您的号码，通常在5分钟内</li>\n</ul>\n无需下载应用，无需预约，无需虚拟等候室。在197个国家全天候24/7提供服务。"
    },
    slug: {
      fr: "connexion-expert-local-5-minutes-fonctionnement",
      en: "connect-local-expert-under-5-minutes-how",
      es: "conectar-experto-local-5-minutos-como",
      de: "verbindung-lokaler-experte-5-minuten",
      pt: "conectar-especialista-local-5-minutos",
      ru: "ru-kak-svyazatsya-ekspert-5-minut",
      hi: "hi-5-minute-local-expert-connection",
      ar: "ar-kayfa-tasil-khabir-mahali-5-daqaiq",
      ch: "ch-5fenzhong-lianxi-dangdi-zhuanjia"
    }
  },

  // ─────────────────────────────────────────────
  // CLIENTS (orders 14-18)
  // ─────────────────────────────────────────────

  {
    order: 14,
    category: "clients",
    isActive: true,
    isFooter: false,
    tags: ["emergency", "weekend", "lawyer", "urgent", "24-7"],
    question: {
      fr: "Peut-on contacter un avocat en urgence un dimanche soir ou un jour férié ?",
      en: "Can I reach a lawyer urgently on a Sunday evening or public holiday?",
      es: "¿Puedo contactar a un abogado de urgencia un domingo por la noche o festivo?",
      de: "Kann ich in einem Notfall an einem Sonntagabend oder Feiertag einen Anwalt erreichen?",
      pt: "Posso contactar um advogado em urgência num domingo à noite ou feriado?",
      ru: "Можно ли срочно связаться с юристом в воскресенье вечером или в праздник?",
      hi: "क्या रविवार शाम या सार्वजनिक अवकाश पर तुरंत वकील से संपर्क किया जा सकता है?",
      ar: "هل يمكنني التواصل مع محامٍ بشكل عاجل في مساء الأحد أو أيام العطلات؟",
      ch: "周日晚上或节假日能紧急联系到律师吗？"
    },
    answer: {
      fr: "Oui, SOS-Expat est disponible 24h/24, 7j/7, y compris les dimanches, jours fériés et nuits. C'est précisément pour les situations d'urgence que le service a été conçu. Si vous faites face à une arrestation, une expulsion locative, une garde à vue, un accident ou un litige urgent à l'étranger, vous n'avez pas à attendre le lundi matin.\n<ul>\n<li><strong>Disponibilité permanente</strong> : nos avocats et experts sont actifs en dehors des horaires de bureau classiques</li>\n<li><strong>Réponse en moins de 5 minutes</strong> : choisissez un prestataire avec le statut vert (disponible maintenant)</li>\n<li><strong>Couverture mondiale</strong> : grâce aux fuseaux horaires, il y a toujours un prestataire actif quelque part dans le monde</li>\n<li><strong>Appel direct</strong> : vous recevez un appel téléphonique, pas un chat ou un email</li>\n</ul>\nPour les urgences les plus critiques (arrestation, garde à vue), pensez à mentionner dès le début de l'appel la nature urgente de la situation pour que le prestataire adapte son accompagnement en conséquence.",
      en: "Yes, SOS-Expat is available 24 hours a day, 7 days a week, including Sundays, public holidays, and nights. The service was designed specifically for emergency situations. If you face an arrest, eviction, detention, accident, or urgent dispute abroad, you do not have to wait until Monday morning.\n<ul>\n<li><strong>Always available</strong>: our lawyers and experts are active outside regular business hours</li>\n<li><strong>Response in under 5 minutes</strong>: choose a provider with green status (available now)</li>\n<li><strong>Global coverage</strong>: thanks to time zones, there is always an active provider somewhere in the world</li>\n<li><strong>Direct phone call</strong>: you receive a phone call, not a chat or email</li>\n</ul>\nFor the most critical emergencies (arrest, detention), mention the urgent nature of the situation at the start of the call so the provider can tailor their assistance accordingly.",
      es: "Sí, SOS-Expat está disponible las 24 horas del día, los 7 días de la semana, incluidos domingos, festivos y noches. El servicio fue diseñado precisamente para emergencias. Si te enfrentas a una detención, desahucio, accidente o litigio urgente en el extranjero, no tienes que esperar al lunes.\n<ul>\n<li><strong>Siempre disponible</strong>: nuestros abogados y expertos están activos fuera del horario comercial</li>\n<li><strong>Respuesta en menos de 5 minutos</strong>: elige un proveedor con estado verde (disponible ahora)</li>\n<li><strong>Cobertura global</strong>: gracias a los husos horarios, siempre hay un proveedor activo en algún lugar</li>\n<li><strong>Llamada telefónica directa</strong>: recibes una llamada, no un chat</li>\n</ul>\nPara las emergencias más críticas, menciona la urgencia al inicio de la llamada.",
      de: "Ja, SOS-Expat ist 24 Stunden am Tag, 7 Tage die Woche verfügbar, auch sonntags, an Feiertagen und nachts. Der Dienst wurde genau für Notfallsituationen konzipiert. Bei einer Verhaftung, Zwangsräumung, einem Unfall oder einem dringenden Rechtsstreit im Ausland müssen Sie nicht bis Montag warten.\n<ul>\n<li><strong>Immer verfügbar</strong>: Unsere Anwälte sind außerhalb der regulären Geschäftszeiten aktiv</li>\n<li><strong>Antwort in unter 5 Minuten</strong>: Wählen Sie einen Anbieter mit grünem Status</li>\n<li><strong>Globale Abdeckung</strong>: Dank Zeitzonen ist immer ein Anbieter irgendwo aktiv</li>\n<li><strong>Direkter Telefonanruf</strong>: Sie erhalten einen Anruf, keinen Chat</li>\n</ul>",
      pt: "Sim, o SOS-Expat está disponível 24 horas por dia, 7 dias por semana, inclusive domingos, feriados e noites. O serviço foi criado precisamente para situações de emergência.\n<ul>\n<li><strong>Sempre disponível</strong>: nossos advogados estão ativos fora do horário comercial</li>\n<li><strong>Resposta em menos de 5 minutos</strong>: escolha um prestador com status verde</li>\n<li><strong>Cobertura global</strong>: graças aos fusos horários, sempre há um prestador ativo</li>\n<li><strong>Ligação direta</strong>: você recebe uma ligação, não um chat ou e-mail</li>\n</ul>\nPara emergências críticas, mencione a urgência no início da ligação.",
      ru: "Да, SOS-Expat доступен 24 часа в сутки, 7 дней в неделю, включая воскресенья, праздники и ночное время. Сервис создан именно для экстренных ситуаций. Если вы столкнулись с арестом, выселением, задержанием или срочным спором за рубежом, вам не нужно ждать понедельника.\n<ul>\n<li><strong>Всегда доступно</strong>: наши юристы работают вне обычных рабочих часов</li>\n<li><strong>Ответ менее чем за 5 минут</strong>: выберите специалиста с зелёным статусом</li>\n<li><strong>Глобальное покрытие</strong>: благодаря часовым поясам всегда найдётся активный специалист</li>\n<li><strong>Прямой звонок</strong>: вы получаете звонок, а не чат или письмо</li>\n</ul>",
      hi: "हाँ, SOS-Expat रविवार, सार्वजनिक अवकाश और रात सहित 24 घंटे, 7 दिन उपलब्ध है। यह सेवा विशेष रूप से आपातकालीन स्थितियों के लिए बनाई गई है।\n<ul>\n<li><strong>हमेशा उपलब्ध</strong>: हमारे वकील और विशेषज्ञ नियमित व्यावसायिक घंटों के बाहर भी सक्रिय हैं</li>\n<li><strong>5 मिनट से कम में जवाब</strong>: हरे स्टेटस वाले प्रदाता को चुनें</li>\n<li><strong>वैश्विक कवरेज</strong>: टाइम जोन की वजह से दुनिया में हमेशा कोई न कोई प्रदाता सक्रिय रहता है</li>\n<li><strong>सीधी फोन कॉल</strong>: आपको कॉल आती है, चैट या ईमेल नहीं</li>\n</ul>",
      ar: "نعم، SOS-Expat متاح على مدار 24 ساعة في اليوم، 7 أيام في الأسبوع، بما في ذلك الأحد والأعياد والليالي. صُمِّمت الخدمة خصيصاً لحالات الطوارئ.\n<ul>\n<li><strong>متاح دائماً</strong>: محامونا وخبراؤنا نشطون خارج ساعات العمل الرسمية</li>\n<li><strong>رد في أقل من 5 دقائق</strong>: اختر مقدماً بالحالة الخضراء</li>\n<li><strong>تغطية عالمية</strong>: بفضل المناطق الزمنية، يوجد دائماً مقدم نشط في مكان ما</li>\n<li><strong>مكالمة هاتفية مباشرة</strong>: تتلقى مكالمة وليس دردشة</li>\n</ul>",
      ch: "是的，SOS-Expat全天候24小时、每周7天提供服务，包括周日、节假日和夜间。该服务专为紧急情况而设计。\n<ul>\n<li><strong>全时可用</strong>：我们的律师和专家在正常工作时间之外也处于活跃状态</li>\n<li><strong>5分钟内响应</strong>：选择绿色状态（立即可用）的服务商</li>\n<li><strong>全球覆盖</strong>：得益于时区分布，世界某处总有活跃的服务商</li>\n<li><strong>直接电话</strong>：您会收到电话，而非聊天或邮件</li>\n</ul>"
    },
    slug: {
      fr: "avocat-urgence-dimanche-jour-ferie-expatrie",
      en: "reach-lawyer-urgently-sunday-public-holiday",
      es: "abogado-urgencia-domingo-festivo-extranjero",
      de: "anwalt-notfall-sonntag-feiertag-ausland",
      pt: "advogado-urgencia-domingo-feriado",
      ru: "ru-yurist-srocno-voskresenye-prazdnik",
      hi: "hi-vakil-urgent-ravivar-chutti-videsh",
      ar: "ar-muhami-aajil-ahad-ijaaza",
      ch: "ch-jinjiqingkuang-lianxi-lushi-zhoumo"
    }
  },

  {
    order: 15,
    category: "clients",
    isActive: true,
    isFooter: false,
    tags: ["visa", "immigration", "legal", "refusal", "expat"],
    question: {
      fr: "SOS-Expat peut-il m'aider en cas de refus de visa ou de problème d'immigration ?",
      en: "Can SOS-Expat help me with a visa refusal or immigration issue?",
      es: "¿Puede SOS-Expat ayudarme con una denegación de visado o un problema de inmigración?",
      de: "Kann SOS-Expat mir bei einer Visumablehnung oder einem Einwanderungsproblem helfen?",
      pt: "O SOS-Expat pode me ajudar com recusa de visto ou problema de imigração?",
      ru: "Может ли SOS-Expat помочь при отказе в визе или проблемах с иммиграцией?",
      hi: "क्या SOS-Expat वीज़ा अस्वीकृति या आप्रवासन समस्या में मदद कर सकता है?",
      ar: "هل يمكن لـ SOS-Expat مساعدتي في رفض التأشيرة أو مشكلة الهجرة؟",
      ch: "SOS-Expat能帮助处理签证拒签或移民问题吗？"
    },
    answer: {
      fr: "Oui, l'immigration et les questions de visa font partie des spécialités les plus demandées sur SOS-Expat. Nos avocats spécialisés en droit de l'immigration peuvent vous conseiller immédiatement, que vous soyez encore dans votre pays d'origine ou déjà à l'étranger.\n<ul>\n<li><strong>Refus de visa</strong> : comprendre les motifs du refus, préparer un recours ou une nouvelle demande</li>\n<li><strong>Titre de séjour</strong> : renouvellement, changement de statut, refus de carte de résidence</li>\n<li><strong>Expulsion ou OQTF</strong> : que faire en cas d'obligation de quitter le territoire, recours possibles</li>\n<li><strong>Naturalisation et citoyenneté</strong> : conditions, dossiers, délais</li>\n<li><strong>Regroupement familial</strong> : procédures pour faire venir conjoint ou enfants</li>\n<li><strong>Visa travail et entrepreneur</strong> : obtenir un visa de travail, créer une entreprise à l'étranger</li>\n</ul>\nL'avocat vous donnera une analyse de votre situation en droit local et vous indiquera les démarches prioritaires à effectuer. Pour les cas urgents (OQTF, rétention administrative), la mise en relation est prioritaire.",
      en: "Yes, immigration and visa issues are among the most requested specialties on SOS-Expat. Our immigration law specialists can advise you immediately, whether you are still in your home country or already abroad.\n<ul>\n<li><strong>Visa refusal</strong>: understanding the reasons for refusal, preparing an appeal or new application</li>\n<li><strong>Residence permit</strong>: renewal, change of status, refusal of residence card</li>\n<li><strong>Deportation order</strong>: what to do, possible appeals</li>\n<li><strong>Naturalization and citizenship</strong>: conditions, documents, timelines</li>\n<li><strong>Family reunification</strong>: procedures to bring spouse or children</li>\n<li><strong>Work visa and entrepreneur visa</strong>: obtaining a work visa, starting a business abroad</li>\n</ul>\nThe lawyer will analyze your situation under local law and identify the priority steps to take. For urgent cases (deportation order, immigration detention), the connection is prioritized.",
      es: "Sí, la inmigración y los visados son de las especialidades más solicitadas en SOS-Expat. Nuestros abogados especializados en derecho de inmigración pueden asesorarte de inmediato.\n<ul>\n<li><strong>Denegación de visado</strong>: entender los motivos, preparar recurso o nueva solicitud</li>\n<li><strong>Permiso de residencia</strong>: renovación, cambio de estatus, denegación</li>\n<li><strong>Orden de expulsión</strong>: qué hacer, recursos posibles</li>\n<li><strong>Naturalización y ciudadanía</strong>: condiciones, documentos, plazos</li>\n<li><strong>Reagrupación familiar</strong>: procedimientos</li>\n<li><strong>Visado de trabajo y emprendedor</strong>: obtener visado, crear empresa en el extranjero</li>\n</ul>",
      de: "Ja, Einwanderung und Visafragen gehören zu den am häufigsten nachgefragten Spezialgebieten bei SOS-Expat.\n<ul>\n<li><strong>Visumablehnung</strong>: Ablehnungsgründe verstehen, Einspruch einlegen</li>\n<li><strong>Aufenthaltstitel</strong>: Verlängerung, Statusänderung, Ablehnung</li>\n<li><strong>Abschiebungsanordnung</strong>: Was tun, mögliche Rechtsmittel</li>\n<li><strong>Einbürgerung und Staatsbürgerschaft</strong>: Voraussetzungen, Fristen</li>\n<li><strong>Familienzusammenführung</strong>: Verfahren</li>\n<li><strong>Arbeitsvisum</strong>: Beantragung, Gründung eines Unternehmens im Ausland</li>\n</ul>",
      pt: "Sim, imigração e vistos são das especialidades mais solicitadas no SOS-Expat.\n<ul>\n<li><strong>Recusa de visto</strong>: entender motivos, preparar recurso ou nova solicitação</li>\n<li><strong>Autorização de residência</strong>: renovação, mudança de status, recusa</li>\n<li><strong>Ordem de deportação</strong>: o que fazer, recursos possíveis</li>\n<li><strong>Naturalização e cidadania</strong>: condições, documentos, prazos</li>\n<li><strong>Reagrupamento familiar</strong>: procedimentos</li>\n<li><strong>Visto de trabalho</strong>: obtenção, criação de empresa no exterior</li>\n</ul>",
      ru: "Да, иммиграция и визовые вопросы — одни из наиболее востребованных специальностей на SOS-Expat.\n<ul>\n<li><strong>Отказ в визе</strong>: понять причины, подготовить апелляцию или новое заявление</li>\n<li><strong>Вид на жительство</strong>: продление, смена статуса, отказ</li>\n<li><strong>Приказ о депортации</strong>: что делать, возможные апелляции</li>\n<li><strong>Натурализация и гражданство</strong>: условия, документы, сроки</li>\n<li><strong>Воссоединение семьи</strong>: процедуры</li>\n<li><strong>Рабочая виза и предпринимательская виза</strong>: получение, открытие бизнеса за рубежом</li>\n</ul>",
      hi: "हाँ, आप्रवासन और वीज़ा प्रश्न SOS-Expat पर सबसे अधिक मांगी जाने वाली विशेषज्ञताओं में से हैं।\n<ul>\n<li><strong>वीज़ा अस्वीकृति</strong>: कारण समझें, अपील या नई आवेदन तैयार करें</li>\n<li><strong>निवास परमिट</strong>: नवीनीकरण, स्टेटस परिवर्तन, अस्वीकृति</li>\n<li><strong>निर्वासन आदेश</strong>: क्या करें, संभावित अपील</li>\n<li><strong>नागरिकता और राष्ट्रीयकरण</strong>: शर्तें, दस्तावेज़, समय-सीमा</li>\n<li><strong>पारिवारिक पुनर्मिलन</strong>: प्रक्रियाएँ</li>\n<li><strong>वर्क वीज़ा</strong>: प्राप्त करना, विदेश में व्यवसाय शुरू करना</li>\n</ul>",
      ar: "نعم، تعد قضايا الهجرة والتأشيرات من أكثر التخصصات طلباً في SOS-Expat.\n<ul>\n<li><strong>رفض التأشيرة</strong>: فهم أسباب الرفض، التحضير للطعن أو تقديم طلب جديد</li>\n<li><strong>تصريح الإقامة</strong>: التجديد، تغيير الوضع، الرفض</li>\n<li><strong>أمر الترحيل</strong>: ماذا تفعل، الطعون الممكنة</li>\n<li><strong>التجنيس والجنسية</strong>: الشروط، المستندات، المواعيد</li>\n<li><strong>لم شمل الأسرة</strong>: الإجراءات</li>\n<li><strong>تأشيرة العمل</strong>: الحصول عليها، إنشاء شركة في الخارج</li>\n</ul>",
      ch: "是的，移民和签证问题是SOS-Expat上最受欢迎的专业领域之一。\n<ul>\n<li><strong>签证拒签</strong>：了解拒签原因，准备上诉或重新申请</li>\n<li><strong>居留许可</strong>：续签、变更身份、拒绝</li>\n<li><strong>驱逐令</strong>：如何应对，可能的上诉途径</li>\n<li><strong>入籍和国籍</strong>：条件、材料、时限</li>\n<li><strong>家庭团聚</strong>：相关程序</li>\n<li><strong>工作签证和创业签证</strong>：获取方法，在海外创业</li>\n</ul>"
    },
    slug: {
      fr: "aide-refus-visa-probleme-immigration-avocat",
      en: "help-visa-refusal-immigration-issue-lawyer",
      es: "ayuda-denegacion-visado-inmigracion-abogado",
      de: "hilfe-visumablehnung-einwanderungsproblem",
      pt: "ajuda-recusa-visto-imigracao-advogado",
      ru: "ru-otkaz-vize-immigratsiya-pomoshch",
      hi: "hi-visa-asvikruti-immigration-madad",
      ar: "ar-rafad-tashira-hijra-musa3ada",
      ch: "ch-qianzheng-jujue-yimin-bangzhu"
    }
  },

  {
    order: 16,
    category: "clients",
    isActive: true,
    isFooter: false,
    tags: ["housing", "accommodation", "expat", "abroad", "rental"],
    question: {
      fr: "Comment SOS-Expat peut-il m'aider pour trouver un logement à l'étranger ?",
      en: "How can SOS-Expat help me find housing abroad?",
      es: "¿Cómo puede SOS-Expat ayudarme a encontrar vivienda en el extranjero?",
      de: "Wie kann SOS-Expat mir bei der Wohnungssuche im Ausland helfen?",
      pt: "Como o SOS-Expat pode me ajudar a encontrar moradia no exterior?",
      ru: "Как SOS-Expat может помочь мне найти жильё за рубежом?",
      hi: "SOS-Expat विदेश में आवास खोजने में कैसे मदद कर सकता है?",
      ar: "كيف يمكن لـ SOS-Expat مساعدتي في إيجاد مسكن في الخارج؟",
      ch: "SOS-Expat如何帮助我在海外找到住所？"
    },
    answer: {
      fr: "SOS-Expat peut vous mettre en relation avec un expatrié aidant local qui connaît parfaitement le marché immobilier, les règles locales de location et les démarches administratives liées au logement dans votre pays de destination. Un appel de 30 minutes à 19€ peut vous éviter de nombreuses erreurs coûteuses.\n<ul>\n<li><strong>Trouver un logement à distance</strong> : les meilleures plateformes locales, les quartiers recommandés, les prix du marché</li>\n<li><strong>Comprendre le contrat de bail local</strong> : clauses importantes, dépôt de garantie, durée, conditions de résiliation</li>\n<li><strong>Droits et obligations du locataire</strong> : règles spécifiques à chaque pays (état des lieux, charges, préavis)</li>\n<li><strong>Colocation et logement temporaire</strong> : options disponibles pour les premières semaines</li>\n<li><strong>Litiges avec un propriétaire</strong> : loyer impayé, expulsion abusive, travaux non effectués — faire appel à un avocat local</li>\n<li><strong>Aide à l'achat immobilier</strong> : conseils juridiques sur les conditions d'accès à la propriété pour étrangers</li>\n</ul>\nNotre réseau inclut des expatriés aidants qui sont eux-mêmes passés par l'expérience de s'installer dans un nouveau pays.",
      en: "SOS-Expat can connect you with a local helping expat who knows the local rental market, regulations, and housing procedures in your destination country.\n<ul>\n<li><strong>Finding housing remotely</strong>: best local platforms, recommended neighborhoods, market prices</li>\n<li><strong>Understanding the local lease</strong>: key clauses, deposit, duration, termination conditions</li>\n<li><strong>Tenant rights and obligations</strong>: rules specific to each country</li>\n<li><strong>Flatsharing and temporary housing</strong>: options for the first weeks</li>\n<li><strong>Landlord disputes</strong>: unpaid rent, wrongful eviction, unfinished repairs — connect with a local lawyer</li>\n<li><strong>Property purchase advice</strong>: legal advice on conditions for foreigners buying property</li>\n</ul>\nOur network includes helping expats who have personally gone through the experience of settling in a new country.",
      es: "SOS-Expat puede conectarte con un expatriado asesor local que conoce el mercado inmobiliario, las normas de alquiler y los trámites en tu país de destino.\n<ul>\n<li><strong>Encontrar vivienda a distancia</strong>: mejores plataformas locales, barrios recomendados, precios de mercado</li>\n<li><strong>Entender el contrato de arrendamiento local</strong>: cláusulas, depósito, duración, resolución</li>\n<li><strong>Derechos y obligaciones del inquilino</strong>: normas específicas por país</li>\n<li><strong>Piso compartido y alojamiento temporal</strong>: opciones para las primeras semanas</li>\n<li><strong>Conflictos con el propietario</strong>: recurrir a un abogado local</li>\n<li><strong>Compra de inmueble</strong>: condiciones para extranjeros</li>\n</ul>",
      de: "SOS-Expat kann Sie mit einem lokalen Expat-Helfer verbinden, der den lokalen Mietmarkt und die Wohnungsverfahren in Ihrem Zielland kennt.\n<ul>\n<li><strong>Fernsuche nach Wohnungen</strong>: beste lokale Plattformen, empfohlene Viertel, Marktpreise</li>\n<li><strong>Lokalen Mietvertrag verstehen</strong>: wichtige Klauseln, Kaution, Laufzeit</li>\n<li><strong>Mieterrechte und -pflichten</strong>: länderspezifische Regeln</li>\n<li><strong>WG und vorübergehende Unterkunft</strong>: Optionen für die ersten Wochen</li>\n<li><strong>Streitigkeiten mit Vermieter</strong>: lokalen Anwalt einschalten</li>\n</ul>",
      pt: "O SOS-Expat pode conectar você a um expatriado assistente local que conhece o mercado imobiliário e os procedimentos de locação no seu país de destino.\n<ul>\n<li><strong>Encontrar imóvel à distância</strong>: melhores plataformas locais, bairros recomendados, preços</li>\n<li><strong>Entender o contrato de locação local</strong>: cláusulas, depósito, duração</li>\n<li><strong>Direitos e deveres do locatário</strong>: regras específicas por país</li>\n<li><strong>Quarto compartilhado e moradia temporária</strong>: opções</li>\n<li><strong>Disputas com proprietário</strong>: acionar advogado local</li>\n</ul>",
      ru: "SOS-Expat может связать вас с местным экспатом-помощником, знающим рынок аренды и жилищные процедуры в вашей стране назначения.\n<ul>\n<li><strong>Поиск жилья дистанционно</strong>: лучшие местные платформы, рекомендуемые районы, рыночные цены</li>\n<li><strong>Понимание местного договора аренды</strong>: ключевые пункты, залог, срок</li>\n<li><strong>Права и обязанности арендатора</strong>: специфические правила каждой страны</li>\n<li><strong>Совместная аренда и временное жильё</strong>: варианты</li>\n<li><strong>Споры с арендодателем</strong>: обращение к местному юристу</li>\n</ul>",
      hi: "SOS-Expat आपको एक स्थानीय सहायक प्रवासी से जोड़ सकता है जो आपके गंतव्य देश में किराए के बाज़ार और आवास प्रक्रियाओं से परिचित है।\n<ul>\n<li><strong>दूर से आवास खोजना</strong>: स्थानीय प्लेटफॉर्म, अनुशंसित इलाके, बाज़ार मूल्य</li>\n<li><strong>स्थानीय किराया अनुबंध समझना</strong>: महत्वपूर्ण धाराएँ, जमानत, अवधि</li>\n<li><strong>किरायेदार के अधिकार और दायित्व</strong>: देश-विशिष्ट नियम</li>\n<li><strong>शेयर्ड हाउसिंग और अस्थायी आवास</strong>: विकल्प</li>\n<li><strong>मकान-मालिक से विवाद</strong>: स्थानीय वकील से सहायता</li>\n</ul>",
      ar: "يمكن لـ SOS-Expat ربطك بمغترب مساعد محلي يعرف سوق الإيجار والإجراءات السكنية في بلد وجهتك.\n<ul>\n<li><strong>البحث عن مسكن عن بُعد</strong>: أفضل المنصات المحلية، الأحياء الموصى بها، أسعار السوق</li>\n<li><strong>فهم عقد الإيجار المحلي</strong>: البنود المهمة، التأمين، المدة</li>\n<li><strong>حقوق وواجبات المستأجر</strong>: قواعد خاصة بكل دولة</li>\n<li><strong>السكن المشترك والإقامة المؤقتة</strong>: خيارات للأسابيع الأولى</li>\n<li><strong>النزاعات مع المالك</strong>: الاستعانة بمحامٍ محلي</li>\n</ul>",
      ch: "SOS-Expat可以为您联系一位了解当地租房市场和住房程序的本地华人助理。\n<ul>\n<li><strong>远程找房</strong>：最佳本地平台、推荐社区、市场价格</li>\n<li><strong>了解当地租赁合同</strong>：重要条款、押金、期限</li>\n<li><strong>租户权利与义务</strong>：各国特定规定</li>\n<li><strong>合租和临时住宿</strong>：初期选择</li>\n<li><strong>与房东纠纷</strong>：联系当地律师</li>\n</ul>"
    },
    slug: {
      fr: "aide-logement-etranger-expat-location",
      en: "help-find-housing-abroad-expat",
      es: "ayuda-vivienda-extranjero-expat",
      de: "hilfe-wohnung-ausland-expat",
      pt: "ajuda-moradia-exterior-expat",
      ru: "ru-pomoshch-zhilye-zarubezhom",
      hi: "hi-aawas-khojne-mein-madad-videsh",
      ar: "ar-musa3ada-iijad-maskan-kharij",
      ch: "ch-haiwai-zhaofang-bangzhu"
    }
  },

  {
    order: 17,
    category: "clients",
    isActive: true,
    isFooter: false,
    tags: ["health", "insurance", "abroad", "medical", "expat"],
    question: {
      fr: "Puis-je obtenir des conseils sur l'assurance santé ou la couverture médicale à l'étranger ?",
      en: "Can I get advice on health insurance or medical coverage abroad?",
      es: "¿Puedo obtener asesoramiento sobre seguro de salud o cobertura médica en el extranjero?",
      de: "Kann ich Ratschläge zur Krankenversicherung oder medizinischen Versorgung im Ausland erhalten?",
      pt: "Posso obter conselhos sobre seguro saúde ou cobertura médica no exterior?",
      ru: "Могу ли я получить совет по медицинской страховке за рубежом?",
      hi: "क्या मुझे विदेश में स्वास्थ्य बीमा पर सलाह मिल सकती है?",
      ar: "هل يمكنني الحصول على نصائح حول التأمين الصحي في الخارج؟",
      ch: "我可以获得关于海外医疗保险的建议吗？"
    },
    answer: {
      fr: "Oui, les questions de santé et d'assurance médicale à l'étranger font partie des sujets traités par les expatriés aidants sur SOS-Expat. Ces prestataires vivent ou ont vécu dans le pays concerné et peuvent vous orienter concrètement sur le système de santé local.\n<ul>\n<li><strong>Choisir une mutuelle ou assurance expatrié</strong> : quelles couvertures sont indispensables selon le pays</li>\n<li><strong>Comprendre le système de santé local</strong> : sécurité sociale locale, remboursements, médecins conventionnés</li>\n<li><strong>Trouver un médecin ou un hôpital francophone</strong> : contacts recommandés dans de nombreuses villes</li>\n<li><strong>Accident ou hospitalisation d'urgence</strong> : comment être pris en charge, que dire à l'hôpital, gestion de la barrière de la langue</li>\n<li><strong>Rapatriement médical</strong> : démarches à suivre si votre état de santé nécessite un retour dans votre pays d'origine</li>\n</ul>\nPour les questions purement médicales (diagnostic, traitement), SOS-Expat n'est pas un service médical et ne remplace pas un médecin. Mais pour les questions d'orientation, d'assurance et de démarches administratives liées à la santé, nos experts peuvent vous faire gagner un temps précieux.",
      en: "Yes, health and medical insurance questions abroad are among the topics covered by helping expats on SOS-Expat. These providers live or have lived in the relevant country and can give you concrete guidance.\n<ul>\n<li><strong>Choosing expat health insurance</strong>: what coverage is essential depending on the country</li>\n<li><strong>Understanding the local healthcare system</strong>: local social security, reimbursements, approved doctors</li>\n<li><strong>Finding a doctor or hospital in your language</strong>: recommended contacts in many cities</li>\n<li><strong>Accident or emergency hospitalization</strong>: how to be treated, what to tell the hospital, language barrier management</li>\n<li><strong>Medical repatriation</strong>: steps to take if your health requires returning to your home country</li>\n</ul>\nNote: for purely medical questions (diagnosis, treatment), SOS-Expat is not a medical service and does not replace a doctor.",
      es: "Sí, los temas de salud y seguros médicos en el extranjero son cubiertos por los expatriados asesores en SOS-Expat.\n<ul>\n<li><strong>Elegir seguro médico expatriado</strong>: coberturas esenciales según el país</li>\n<li><strong>Entender el sistema sanitario local</strong>: seguridad social, reembolsos, médicos</li>\n<li><strong>Encontrar médico u hospital en tu idioma</strong>: contactos recomendados</li>\n<li><strong>Accidente u hospitalización urgente</strong>: cómo ser atendido, gestión de la barrera idiomática</li>\n<li><strong>Repatriación médica</strong>: pasos a seguir</li>\n</ul>",
      de: "Ja, Gesundheits- und Krankenversicherungsfragen im Ausland werden von Expat-Helfern bei SOS-Expat behandelt.\n<ul>\n<li><strong>Auswahl einer Expat-Krankenversicherung</strong>: notwendige Deckungen je nach Land</li>\n<li><strong>Lokales Gesundheitssystem verstehen</strong>: Sozialversicherung, Erstattungen</li>\n<li><strong>Arzt oder Krankenhaus in Ihrer Sprache finden</strong></li>\n<li><strong>Unfall oder Notaufnahme</strong>: wie man versorgt wird, Sprachbarriere</li>\n<li><strong>Medizinische Rückführung</strong>: Schritte, die zu unternehmen sind</li>\n</ul>",
      pt: "Sim, questões de saúde e seguro médico no exterior são cobertas pelos expatriados assistentes no SOS-Expat.\n<ul>\n<li><strong>Escolher seguro saúde expatriado</strong>: coberturas essenciais por país</li>\n<li><strong>Entender o sistema de saúde local</strong>: previdência, reembolsos</li>\n<li><strong>Encontrar médico no seu idioma</strong>: contatos recomendados</li>\n<li><strong>Acidente ou hospitalização urgente</strong>: como ser atendido, barreira linguística</li>\n<li><strong>Repatriação médica</strong>: passos a seguir</li>\n</ul>",
      ru: "Да, вопросы здоровья и медицинского страхования за рубежом рассматриваются экспатами-помощниками на SOS-Expat.\n<ul>\n<li><strong>Выбор страховки для экспатов</strong>: необходимые покрытия в зависимости от страны</li>\n<li><strong>Понимание местной системы здравоохранения</strong>: соцстрах, возмещения</li>\n<li><strong>Поиск врача на вашем языке</strong>: рекомендуемые контакты</li>\n<li><strong>Несчастный случай или экстренная госпитализация</strong>: как получить помощь</li>\n<li><strong>Медицинская репатриация</strong>: необходимые шаги</li>\n</ul>",
      hi: "हाँ, विदेश में स्वास्थ्य और चिकित्सा बीमा के सवाल SOS-Expat के सहायक प्रवासियों द्वारा कवर किए जाते हैं।\n<ul>\n<li><strong>प्रवासी स्वास्थ्य बीमा चुनना</strong>: देश के अनुसार आवश्यक कवरेज</li>\n<li><strong>स्थानीय स्वास्थ्य प्रणाली समझना</strong>: सामाजिक सुरक्षा, प्रतिपूर्ति</li>\n<li><strong>अपनी भाषा में डॉक्टर या अस्पताल खोजना</strong></li>\n<li><strong>दुर्घटना या आपातकालीन अस्पताल में भर्ती</strong>: इलाज कैसे पाएं</li>\n<li><strong>चिकित्सा प्रत्यावर्तन</strong>: अनुसरण किए जाने वाले कदम</li>\n</ul>",
      ar: "نعم، تُغطى مسائل الصحة والتأمين الطبي في الخارج من قِبل المغتربين المساعدين على SOS-Expat.\n<ul>\n<li><strong>اختيار تأمين صحي للمغتربين</strong>: التغطيات الضرورية حسب البلد</li>\n<li><strong>فهم نظام الرعاية الصحية المحلي</strong>: التأمين الاجتماعي، المبالغ المستردة</li>\n<li><strong>إيجاد طبيب أو مستشفى بلغتك</strong>: جهات اتصال موصى بها</li>\n<li><strong>حادث أو دخول المستشفى بصفة طارئة</strong>: كيفية الحصول على الرعاية</li>\n<li><strong>الإعادة الطبية</strong>: الخطوات الواجب اتباعها</li>\n</ul>",
      ch: "是的，海外健康和医疗保险问题由SOS-Expat的华人助理服务商负责解答。\n<ul>\n<li><strong>选择外籍人员医疗保险</strong>：根据国家确定必要的保障范围</li>\n<li><strong>了解当地医疗体系</strong>：社会保障、报销</li>\n<li><strong>用您的语言寻找医生或医院</strong>：推荐联系方式</li>\n<li><strong>事故或紧急住院</strong>：如何获得治疗，语言障碍处理</li>\n<li><strong>医疗回国</strong>：需要遵循的步骤</li>\n</ul>"
    },
    slug: {
      fr: "conseils-assurance-sante-couverture-medicale-etranger",
      en: "advice-health-insurance-medical-coverage-abroad",
      es: "consejos-seguro-salud-cobertura-medica-extranjero",
      de: "ratschlaege-krankenversicherung-ausland-expat",
      pt: "conselhos-seguro-saude-cobertura-medica-exterior",
      ru: "ru-sovet-meditsinskaya-strahovka-zarubezhom",
      hi: "hi-swasthya-bima-salah-videsh",
      ar: "ar-nasihah-tamin-sihi-kharij",
      ch: "ch-haiwai-yiliao-baoxian-jianyi"
    }
  },

  {
    order: 18,
    category: "clients",
    isActive: true,
    isFooter: false,
    tags: ["legal", "urgent", "abroad", "police", "detention"],
    question: {
      fr: "Que faire si j'ai un problème juridique urgent à l'étranger (arrestation, litige, fraude) ?",
      en: "What should I do if I have an urgent legal problem abroad (arrest, dispute, fraud)?",
      es: "¿Qué debo hacer si tengo un problema legal urgente en el extranjero?",
      de: "Was soll ich tun, wenn ich ein dringendes rechtliches Problem im Ausland habe?",
      pt: "O que fazer se tiver um problema jurídico urgente no exterior?",
      ru: "Что делать при срочной юридической проблеме за рубежом?",
      hi: "विदेश में तत्काल कानूनी समस्या होने पर क्या करें?",
      ar: "ماذا أفعل إذا واجهت مشكلة قانونية عاجلة في الخارج؟",
      ch: "在海外遇到紧急法律问题（逮捕、纠纷、欺诈）该怎么办？"
    },
    answer: {
      fr: "En cas de problème juridique urgent à l'étranger, agir vite et consulter un avocat local est essentiel. SOS-Expat vous permet de joindre un avocat spécialisé en droit local en moins de 5 minutes, 24h/24. Voici les situations les plus fréquentes :\n<ul>\n<li><strong>Arrestation ou garde à vue</strong> : droit de vous taire, droit à un avocat — l'avocat SOS-Expat peut vous expliquer vos droits dans le pays concerné et coordonner avec un cabinet local</li>\n<li><strong>Litige commercial ou contrat</strong> : arnaque, non-paiement, rupture abusive de contrat — évaluation rapide de vos recours</li>\n<li><strong>Fraude ou vol</strong> : déclaration à la police locale, démarches auprès de votre ambassade, blocage de comptes bancaires</li>\n<li><strong>Accident de la route</strong> : que faire sur place, comment interagir avec la police locale, déclaration d'assurance</li>\n<li><strong>Expulsion locative</strong> : procédure légale, délais, recours d'urgence</li>\n<li><strong>Harcèlement ou menace</strong> : dépôt de plainte, mesures de protection</li>\n</ul>\nDans tous ces cas, ne signez aucun document avant d'avoir parlé à un avocat. SOS-Expat vous met en relation avec un professionnel qui connaît les droits et procédures locales.",
      en: "In case of an urgent legal problem abroad, acting quickly and consulting a local lawyer is essential. SOS-Expat connects you with a local law specialist in under 5 minutes, 24/7.\n<ul>\n<li><strong>Arrest or detention</strong>: right to remain silent, right to a lawyer — the SOS-Expat lawyer can explain your rights and coordinate with a local firm</li>\n<li><strong>Commercial dispute or contract</strong>: scam, non-payment, wrongful contract breach — quick assessment of your options</li>\n<li><strong>Fraud or theft</strong>: filing a police report, embassy contact, bank account blocking</li>\n<li><strong>Road accident</strong>: what to do on the scene, police interaction, insurance claim</li>\n<li><strong>Wrongful eviction</strong>: legal procedure, deadlines, emergency appeal</li>\n<li><strong>Harassment or threats</strong>: filing a complaint, protective measures</li>\n</ul>\nIn all these cases, do not sign any document before speaking to a lawyer.",
      es: "En caso de problema legal urgente en el extranjero, actuar rápido y consultar un abogado local es esencial.\n<ul>\n<li><strong>Detención o arresto</strong>: derecho a guardar silencio, derecho a un abogado</li>\n<li><strong>Disputa comercial o contrato</strong>: estafa, impago, ruptura abusiva de contrato</li>\n<li><strong>Fraude o robo</strong>: denuncia a la policía, gestiones consulares</li>\n<li><strong>Accidente de tráfico</strong>: qué hacer, interacción con policía, declaración de seguro</li>\n<li><strong>Desahucio abusivo</strong>: procedimiento legal, plazos, recurso urgente</li>\n<li><strong>Acoso o amenazas</strong>: denuncia, medidas de protección</li>\n</ul>\nNunca firmes ningún documento antes de hablar con un abogado.",
      de: "Bei einem dringenden rechtlichen Problem im Ausland ist schnelles Handeln und die Beratung durch einen lokalen Anwalt unerlässlich.\n<ul>\n<li><strong>Verhaftung oder Gewahrsam</strong>: Schweigerecht, Recht auf Anwalt</li>\n<li><strong>Handelsstreit oder Vertrag</strong>: Betrug, Nichtzahlung, Vertragsbruch</li>\n<li><strong>Betrug oder Diebstahl</strong>: Polizeimeldung, Botschaftsweg, Kontosperrung</li>\n<li><strong>Verkehrsunfall</strong>: Vor-Ort-Verhalten, Polizeiinteraktion, Versicherungsmeldung</li>\n<li><strong>Unrechtmäßige Räumung</strong>: Verfahren, Fristen, Noteinspruch</li>\n</ul>\nUnterzeichnen Sie keine Dokumente, bevor Sie mit einem Anwalt gesprochen haben.",
      pt: "Em caso de problema jurídico urgente no exterior, agir rapidamente e consultar um advogado local é essencial.\n<ul>\n<li><strong>Prisão ou detenção</strong>: direito de ficar em silêncio, direito a advogado</li>\n<li><strong>Disputa comercial ou contrato</strong>: golpe, inadimplência, rescisão abusiva</li>\n<li><strong>Fraude ou roubo</strong>: registro na polícia, contato com consulado</li>\n<li><strong>Acidente de trânsito</strong>: o que fazer, interação com polícia, declaração de seguro</li>\n<li><strong>Despejo indevido</strong>: procedimento legal, prazos, recurso de emergência</li>\n</ul>\nNunca assine documentos antes de falar com um advogado.",
      ru: "В случае срочной юридической проблемы за рубежом быстрые действия и консультация местного юриста критически важны.\n<ul>\n<li><strong>Арест или задержание</strong>: право хранить молчание, право на адвоката</li>\n<li><strong>Коммерческий спор или контракт</strong>: мошенничество, неоплата, нарушение договора</li>\n<li><strong>Мошенничество или кража</strong>: заявление в полицию, консульская помощь</li>\n<li><strong>ДТП</strong>: действия на месте, взаимодействие с полицией, страховое требование</li>\n<li><strong>Незаконное выселение</strong>: правовая процедура, сроки, экстренная апелляция</li>\n</ul>\nНе подписывайте никаких документов до консультации с юристом.",
      hi: "विदेश में तत्काल कानूनी समस्या के मामले में, तेज़ी से कार्रवाई करना और स्थानीय वकील से परामर्श करना आवश्यक है।\n<ul>\n<li><strong>गिरफ्तारी या हिरासत</strong>: चुप रहने का अधिकार, वकील का अधिकार</li>\n<li><strong>व्यावसायिक विवाद या अनुबंध</strong>: धोखाधड़ी, गैर-भुगतान</li>\n<li><strong>धोखाधड़ी या चोरी</strong>: पुलिस रिपोर्ट, दूतावास से संपर्क</li>\n<li><strong>सड़क दुर्घटना</strong>: मौके पर क्या करें, बीमा दावा</li>\n<li><strong>अन्यायपूर्ण बेदखली</strong>: कानूनी प्रक्रिया, आपातकालीन अपील</li>\n</ul>\nकोई भी दस्तावेज़ पर हस्ताक्षर करने से पहले वकील से बात करें।",
      ar: "في حال وجود مشكلة قانونية عاجلة في الخارج، التصرف السريع واستشارة محامٍ محلي أمر ضروري.\n<ul>\n<li><strong>الاعتقال أو الاحتجاز</strong>: حق الصمت، حق التمثيل القانوني</li>\n<li><strong>نزاع تجاري أو عقد</strong>: احتيال، عدم دفع</li>\n<li><strong>الاحتيال أو السرقة</strong>: تقديم البلاغ للشرطة، التواصل مع السفارة</li>\n<li><strong>حادث مرور</strong>: ماذا تفعل، التعامل مع الشرطة</li>\n<li><strong>الإخلاء التعسفي</strong>: الإجراء القانوني، المواعيد</li>\n</ul>\nلا توقع أي وثيقة قبل التحدث إلى محامٍ.",
      ch: "在海外遇到紧急法律问题时，迅速行动并咨询当地律师至关重要。\n<ul>\n<li><strong>逮捕或拘留</strong>：保持沉默的权利，获得律师的权利</li>\n<li><strong>商业纠纷或合同</strong>：诈骗、拒付款、违约</li>\n<li><strong>欺诈或盗窃</strong>：报警、联系大使馆、冻结银行账户</li>\n<li><strong>交通事故</strong>：现场处理、与警察互动、保险索赔</li>\n<li><strong>非法驱逐</strong>：法律程序、期限、紧急上诉</li>\n</ul>\n在与律师交谈之前，切勿签署任何文件。"
    },
    slug: {
      fr: "probleme-juridique-urgent-etranger-arrestation-fraude",
      en: "urgent-legal-problem-abroad-arrest-fraud",
      es: "problema-legal-urgente-extranjero-arresto",
      de: "dringendes-rechtsproblem-ausland-verhaftung",
      pt: "problema-juridico-urgente-exterior-prisao",
      ru: "ru-srochnaya-yuridicheskaya-problema-zarubezhom",
      hi: "hi-urgent-kanuni-samasya-videsh",
      ar: "ar-mushkila-qanuniya-aajila-kharij-bilad",
      ch: "ch-haiwai-jinjifalu-wenti-daibao"
    }
  },

  // ─────────────────────────────────────────────
  // PROVIDERS (orders 19-21)
  // ─────────────────────────────────────────────

  {
    order: 19,
    category: "providers",
    isActive: true,
    isFooter: false,
    tags: ["provider", "approval", "registration", "kyc", "onboarding"],
    question: {
      fr: "Combien de temps faut-il pour être approuvé comme prestataire sur SOS-Expat ?",
      en: "How long does it take to be approved as a provider on SOS-Expat?",
      es: "¿Cuánto tiempo se tarda en ser aprobado como proveedor en SOS-Expat?",
      de: "Wie lange dauert die Genehmigung als Anbieter bei SOS-Expat?",
      pt: "Quanto tempo leva para ser aprovado como prestador no SOS-Expat?",
      ru: "Сколько времени занимает одобрение как специалиста на SOS-Expat?",
      hi: "SOS-Expat पर प्रदाता के रूप में अनुमोदित होने में कितना समय लगता है?",
      ar: "كم من الوقت يستغرق الموافقة كمقدم خدمة على SOS-Expat؟",
      ch: "在SOS-Expat上作为服务商获批需要多长时间？"
    },
    answer: {
      fr: "Le processus d'approbation sur SOS-Expat est rapide et entièrement en ligne. Une fois votre inscription terminée et vos documents transmis, le délai d'approbation est généralement de 24 à 72 heures ouvrées. Voici les étapes du processus :\n<ul>\n<li><strong>Étape 1 — Inscription</strong> : création de compte, choix du rôle (avocat ou expatrié aidant), informations personnelles</li>\n<li><strong>Étape 2 — Vérification KYC</strong> : soumission d'une pièce d'identité valide et d'un justificatif de domicile (ou de diplôme pour les avocats)</li>\n<li><strong>Étape 3 — Revue par l'équipe SOS-Expat</strong> : vérification manuelle des documents pour garantir la qualité du réseau</li>\n<li><strong>Étape 4 — Activation du profil</strong> : vous recevez un email de confirmation, votre profil devient visible et vous pouvez recevoir vos premiers appels</li>\n</ul>\nUne fois approuvé, vous pouvez immédiatement commencer à recevoir des appels et à générer des commissions. Votre profil affiche vos avis, vos langues et vos disponibilités en temps réel.",
      en: "The approval process on SOS-Expat is fast and fully online. Once your registration is complete and your documents submitted, the approval usually takes 24 to 72 business hours.\n<ul>\n<li><strong>Step 1 — Registration</strong>: account creation, role selection, personal information</li>\n<li><strong>Step 2 — KYC verification</strong>: submitting valid ID and proof of address (or diploma for lawyers)</li>\n<li><strong>Step 3 — SOS-Expat team review</strong>: manual document verification to ensure network quality</li>\n<li><strong>Step 4 — Profile activation</strong>: you receive a confirmation email, your profile becomes visible and you can start receiving calls</li>\n</ul>\nOnce approved, you can immediately start receiving calls and earning commissions.",
      es: "El proceso de aprobación en SOS-Expat es rápido y completamente en línea. Una vez completado el registro y enviados los documentos, la aprobación suele tardar entre 24 y 72 horas hábiles.\n<ul>\n<li><strong>Paso 1 — Registro</strong>: creación de cuenta, selección de rol, datos personales</li>\n<li><strong>Paso 2 — Verificación KYC</strong>: envío de DNI y justificante de domicilio</li>\n<li><strong>Paso 3 — Revisión del equipo</strong>: verificación manual de documentos</li>\n<li><strong>Paso 4 — Activación del perfil</strong>: email de confirmación, perfil visible</li>\n</ul>",
      de: "Der Genehmigungsprozess bei SOS-Expat ist schnell und vollständig online. Nach abgeschlossener Registrierung und Dokumenteneinreichung dauert die Genehmigung normalerweise 24 bis 72 Wertstunden.\n<ul>\n<li><strong>Schritt 1 — Registrierung</strong>: Kontoerstellung, Rollenwahl, persönliche Daten</li>\n<li><strong>Schritt 2 — KYC-Verifizierung</strong>: Ausweis und Adressnachweis</li>\n<li><strong>Schritt 3 — Teamprüfung</strong>: manuelle Dokumentenprüfung</li>\n<li><strong>Schritt 4 — Profilaktivierung</strong>: Bestätigungs-E-Mail, Profil sichtbar</li>\n</ul>",
      pt: "O processo de aprovação no SOS-Expat é rápido e totalmente online. Após concluir o cadastro e enviar os documentos, a aprovação geralmente leva de 24 a 72 horas úteis.\n<ul>\n<li><strong>Etapa 1 — Cadastro</strong>: criação de conta, escolha de papel, dados pessoais</li>\n<li><strong>Etapa 2 — Verificação KYC</strong>: envio de documento de identidade e comprovante</li>\n<li><strong>Etapa 3 — Revisão da equipe</strong>: verificação manual dos documentos</li>\n<li><strong>Etapa 4 — Ativação do perfil</strong>: e-mail de confirmação, perfil visível</li>\n</ul>",
      ru: "Процесс одобрения на SOS-Expat быстрый и полностью онлайн. После завершения регистрации и подачи документов одобрение обычно занимает от 24 до 72 рабочих часов.\n<ul>\n<li><strong>Шаг 1 — Регистрация</strong>: создание аккаунта, выбор роли, личные данные</li>\n<li><strong>Шаг 2 — Верификация KYC</strong>: удостоверение личности и подтверждение адреса</li>\n<li><strong>Шаг 3 — Проверка командой</strong>: ручная проверка документов</li>\n<li><strong>Шаг 4 — Активация профиля</strong>: письмо с подтверждением, профиль становится видимым</li>\n</ul>",
      hi: "SOS-Expat पर अनुमोदन प्रक्रिया तेज़ और पूरी तरह ऑनलाइन है। पंजीकरण पूरा करने और दस्तावेज़ जमा करने के बाद, अनुमोदन आमतौर पर 24 से 72 व्यावसायिक घंटों में होता है।\n<ul>\n<li><strong>चरण 1 — पंजीकरण</strong>: खाता बनाएं, भूमिका चुनें, व्यक्तिगत जानकारी</li>\n<li><strong>चरण 2 — KYC सत्यापन</strong>: वैध ID और पता प्रमाण जमा करें</li>\n<li><strong>चरण 3 — टीम समीक्षा</strong>: मैनुअल दस्तावेज़ सत्यापन</li>\n<li><strong>चरण 4 — प्रोफ़ाइल सक्रियण</strong>: पुष्टि ईमेल, प्रोफ़ाइल दृश्यमान</li>\n</ul>",
      ar: "عملية الموافقة على SOS-Expat سريعة وتتم بالكامل عبر الإنترنت. بعد إتمام التسجيل وإرسال المستندات، تستغرق الموافقة عادةً من 24 إلى 72 ساعة عمل.\n<ul>\n<li><strong>الخطوة 1 — التسجيل</strong>: إنشاء حساب، اختيار الدور، المعلومات الشخصية</li>\n<li><strong>الخطوة 2 — التحقق من KYC</strong>: تقديم هوية سارية وإثبات العنوان</li>\n<li><strong>الخطوة 3 — مراجعة الفريق</strong>: التحقق اليدوي من المستندات</li>\n<li><strong>الخطوة 4 — تفعيل الملف</strong>: بريد إلكتروني بالتأكيد، يصبح الملف مرئياً</li>\n</ul>",
      ch: "SOS-Expat的审批流程快速且完全在线。完成注册并提交文件后，审批通常需要24至72个工作小时。\n<ul>\n<li><strong>第一步 — 注册</strong>：创建账户、选择角色、填写个人信息</li>\n<li><strong>第二步 — KYC验证</strong>：提交有效身份证件和地址证明</li>\n<li><strong>第三步 — 团队审核</strong>：人工文件核验</li>\n<li><strong>第四步 — 资料激活</strong>：收到确认邮件，资料公开可见，可开始接单</li>\n</ul>"
    },
    slug: {
      fr: "delai-approbation-prestataire-sos-expat",
      en: "approval-time-provider-sos-expat",
      es: "tiempo-aprobacion-proveedor-sos-expat",
      de: "genehmigungsdauer-anbieter-sos-expat",
      pt: "tempo-aprovacao-prestador-sos-expat",
      ru: "ru-vremya-odobreniya-spetsialist-sos-expat",
      hi: "hi-pradata-anumati-samay-sos-expat",
      ar: "ar-muddat-almuwafaqa-muqaddim-sos-expat",
      ch: "ch-fuwushang-pizhun-shijian-sos-expat"
    }
  },

  {
    order: 20,
    category: "providers",
    isActive: true,
    isFooter: false,
    tags: ["provider", "schedule", "availability", "flexible", "timezone"],
    question: {
      fr: "Puis-je choisir mes horaires de disponibilité en tant que prestataire ?",
      en: "Can I choose my availability hours as a provider?",
      es: "¿Puedo elegir mis horarios de disponibilidad como proveedor?",
      de: "Kann ich als Anbieter meine Verfügbarkeitszeiten selbst wählen?",
      pt: "Posso escolher meus horários de disponibilidade como prestador?",
      ru: "Могу ли я выбирать часы доступности как специалист?",
      hi: "क्या मैं प्रदाता के रूप में अपनी उपलब्धता के घंटे चुन सकता हूँ?",
      ar: "هل يمكنني اختيار ساعات توفري كمقدم خدمة؟",
      ch: "作为服务商，我可以自主选择可用时间吗？"
    },
    answer: {
      fr: "Oui, SOS-Expat offre une flexibilité totale sur vos horaires de disponibilité. Vous gérez votre statut en temps réel depuis votre tableau de bord : disponible, occupé ou hors ligne. Il n'y a aucun planning fixe à respecter.\n<ul>\n<li><strong>Statut disponible</strong> : vous apparaissez dans les recherches et pouvez recevoir des appels. Votre profil s'affiche avec un indicateur vert</li>\n<li><strong>Statut occupé</strong> : vous êtes temporairement indisponible (en appel, en réunion, etc.) sans être déconnecté</li>\n<li><strong>Statut hors ligne</strong> : votre profil est masqué des recherches, aucun appel ne peut vous parvenir</li>\n</ul>\nVous pouvez passer d'un statut à l'autre en un clic, depuis n'importe quel appareil. Il n'y a pas de minimum d'heures à effectuer par semaine. Certains prestataires sont disponibles quelques heures par semaine, d'autres travaillent à temps plein sur la plateforme. La plateforme s'adapte à votre rythme de vie et à votre fuseau horaire.",
      en: "Yes, SOS-Expat offers complete flexibility over your availability schedule. You manage your status in real time from your dashboard: available, busy, or offline. There is no fixed schedule to follow.\n<ul>\n<li><strong>Available status</strong>: you appear in searches and can receive calls. Your profile shows a green indicator</li>\n<li><strong>Busy status</strong>: you are temporarily unavailable without going offline</li>\n<li><strong>Offline status</strong>: your profile is hidden from searches, no calls can reach you</li>\n</ul>\nYou can switch status with one click from any device. There is no minimum number of hours per week. The platform adapts to your lifestyle and time zone.",
      es: "Sí, SOS-Expat ofrece total flexibilidad en tus horarios de disponibilidad. Gestionas tu estado en tiempo real desde tu panel de control: disponible, ocupado o sin conexión.\n<ul>\n<li><strong>Estado disponible</strong>: apareces en las búsquedas y puedes recibir llamadas</li>\n<li><strong>Estado ocupado</strong>: temporalmente no disponible sin desconectarte</li>\n<li><strong>Estado sin conexión</strong>: tu perfil queda oculto en las búsquedas</li>\n</ul>\nPuedes cambiar de estado con un clic desde cualquier dispositivo. Sin mínimo de horas semanales.",
      de: "Ja, SOS-Expat bietet vollständige Flexibilität bei Ihren Verfügbarkeitszeiten. Sie verwalten Ihren Status in Echtzeit über Ihr Dashboard: verfügbar, beschäftigt oder offline.\n<ul>\n<li><strong>Verfügbar</strong>: Sie erscheinen in Suchergebnissen und können Anrufe erhalten</li>\n<li><strong>Beschäftigt</strong>: vorübergehend nicht verfügbar, ohne offline zu gehen</li>\n<li><strong>Offline</strong>: Ihr Profil wird in der Suche ausgeblendet</li>\n</ul>\nEin Klick genügt zum Statuswechsel. Kein wöchentliches Mindeststundenkontingent.",
      pt: "Sim, o SOS-Expat oferece total flexibilidade nos seus horários de disponibilidade. Você gerencia seu status em tempo real pelo painel: disponível, ocupado ou offline.\n<ul>\n<li><strong>Disponível</strong>: aparece nas buscas e pode receber ligações</li>\n<li><strong>Ocupado</strong>: temporariamente indisponível sem sair offline</li>\n<li><strong>Offline</strong>: perfil oculto nas buscas</li>\n</ul>\nMude de status com um clique. Sem mínimo de horas semanais.",
      ru: "Да, SOS-Expat предлагает полную гибкость в расписании доступности. Вы управляете своим статусом в режиме реального времени через панель управления: доступен, занят или офлайн.\n<ul>\n<li><strong>Доступен</strong>: отображаетесь в поиске и можете принимать звонки</li>\n<li><strong>Занят</strong>: временно недоступен без выхода офлайн</li>\n<li><strong>Офлайн</strong>: профиль скрыт из поиска</li>\n</ul>\nОдин клик для смены статуса. Нет минимального количества часов в неделю.",
      hi: "हाँ, SOS-Expat आपकी उपलब्धता के घंटों पर पूरी लचीलापन देता है। आप अपने डैशबोर्ड से रियल-टाइम में स्टेटस प्रबंधित करते हैं: उपलब्ध, व्यस्त या ऑफलाइन।\n<ul>\n<li><strong>उपलब्ध स्टेटस</strong>: आप खोज में दिखते हैं और कॉल प्राप्त कर सकते हैं</li>\n<li><strong>व्यस्त स्टेटस</strong>: अस्थायी रूप से अनुपलब्ध बिना ऑफलाइन हुए</li>\n<li><strong>ऑफलाइन स्टेटस</strong>: आपकी प्रोफ़ाइल खोज से छुपी रहती है</li>\n</ul>\nकिसी भी डिवाइस से एक क्लिक में स्टेटस बदलें। प्रति सप्ताह न्यूनतम घंटों की कोई बाध्यता नहीं।",
      ar: "نعم، يوفر SOS-Expat مرونة تامة في جدول توفرك. تدير حالتك في الوقت الفعلي من لوحة التحكم: متاح، مشغول، أو غير متصل.\n<ul>\n<li><strong>حالة متاح</strong>: تظهر في نتائج البحث ويمكنك استقبال المكالمات</li>\n<li><strong>حالة مشغول</strong>: غير متاح مؤقتاً دون قطع الاتصال</li>\n<li><strong>حالة غير متصل</strong>: يخفى ملفك من نتائج البحث</li>\n</ul>\nnقير واحد لتغيير الحالة. لا يوجد حد أدنى للساعات الأسبوعية.",
      ch: "是的，SOS-Expat在您的可用时间安排上提供完全灵活性。您可以从仪表板实时管理状态：可用、忙碌或离线。\n<ul>\n<li><strong>可用状态</strong>：您出现在搜索结果中，可接听电话，个人资料显示绿色标识</li>\n<li><strong>忙碌状态</strong>：暂时不可用，但不会离线</li>\n<li><strong>离线状态</strong>：您的资料在搜索中隐藏，无法接到电话</li>\n</ul>\n一键切换状态，适用于任何设备。无每周最低工时要求，平台适应您的生活节奏和时区。"
    },
    slug: {
      fr: "choisir-horaires-disponibilite-prestataire",
      en: "choose-availability-hours-provider",
      es: "elegir-horarios-disponibilidad-proveedor",
      de: "verfuegbarkeitszeiten-waehlen-anbieter",
      pt: "escolher-horarios-disponibilidade-prestador",
      ru: "ru-vybrat-chasy-dostupnosti-spetsialist",
      hi: "hi-uplabdhata-samay-chune-pradata",
      ar: "ar-ikhtiyar-awqat-tawafur-muqaddim",
      ch: "ch-xuanze-keyon-shijian-fuwushang"
    }
  },

  {
    order: 21,
    category: "providers",
    isActive: true,
    isFooter: false,
    tags: ["provider", "profile", "tips", "visibility", "calls"],
    question: {
      fr: "Comment optimiser son profil prestataire pour recevoir plus d'appels ?",
      en: "How can I optimize my provider profile to receive more calls?",
      es: "¿Cómo puedo optimizar mi perfil de proveedor para recibir más llamadas?",
      de: "Wie kann ich mein Anbieterprofil optimieren, um mehr Anrufe zu erhalten?",
      pt: "Como posso otimizar meu perfil de prestador para receber mais ligações?",
      ru: "Как оптимизировать профиль специалиста для получения большего числа звонков?",
      hi: "अधिक कॉल प्राप्त करने के लिए प्रदाता प्रोफ़ाइल को कैसे अनुकूलित करें?",
      ar: "كيف يمكنني تحسين ملف مقدم الخدمة للحصول على المزيد من المكالمات؟",
      ch: "如何优化服务商资料以接到更多电话？"
    },
    answer: {
      fr: "Un profil bien complété reçoit jusqu'à 5 fois plus d'appels qu'un profil incomplet. Voici les éléments clés pour maximiser votre visibilité sur SOS-Expat :\n<ul>\n<li><strong>Photo professionnelle</strong> : les profils avec une vraie photo de profil sont cliqués 3x plus souvent</li>\n<li><strong>Biographie détaillée</strong> : décrivez votre expérience, vos spécialités et les pays dans lesquels vous pouvez aider (150 mots minimum)</li>\n<li><strong>Langues complètes</strong> : ajoutez toutes les langues dans lesquelles vous pouvez répondre — c'est un critère de filtre important pour les clients</li>\n<li><strong>Disponibilité régulière</strong> : les prestataires actifs régulièrement (même quelques heures par jour) remontent mieux dans les résultats</li>\n<li><strong>Réponse rapide</strong> : les prestataires qui répondent dans les 2 premières minutes reçoivent de meilleures notes et plus de rappels</li>\n<li><strong>Avis clients positifs</strong> : après chaque appel, un email encourage le client à laisser un avis — la qualité de votre écoute fait la différence</li>\n</ul>\nLe système de ranking SOS-Expat tient compte de votre taux de réponse, de vos avis et de votre activité récente pour déterminer votre position dans les résultats de recherche.",
      en: "A well-completed profile receives up to 5 times more calls than an incomplete one. Here are the key elements to maximize your visibility on SOS-Expat:\n<ul>\n<li><strong>Professional photo</strong>: profiles with a real profile picture are clicked 3x more often</li>\n<li><strong>Detailed biography</strong>: describe your experience, specialties, and countries you can help with</li>\n<li><strong>Complete languages</strong>: add all languages you can respond in — this is an important filter for clients</li>\n<li><strong>Regular availability</strong>: regularly active providers rank better in results</li>\n<li><strong>Fast response</strong>: providers who answer within the first 2 minutes receive better ratings</li>\n<li><strong>Positive reviews</strong>: after each call, clients are encouraged to leave a review — quality listening makes the difference</li>\n</ul>\nThe SOS-Expat ranking considers your response rate, reviews, and recent activity.",
      es: "Un perfil bien completado recibe hasta 5 veces más llamadas que uno incompleto.\n<ul>\n<li><strong>Foto profesional</strong>: los perfiles con foto real se clican 3 veces más</li>\n<li><strong>Biografía detallada</strong>: experiencia, especialidades, países en los que puedes ayudar</li>\n<li><strong>Idiomas completos</strong>: filtro importante para los clientes</li>\n<li><strong>Disponibilidad regular</strong>: mejor posicionamiento en resultados</li>\n<li><strong>Respuesta rápida</strong>: mejores valoraciones y más rellamadas</li>\n<li><strong>Reseñas positivas</strong>: la calidad de escucha marca la diferencia</li>\n</ul>",
      de: "Ein gut ausgefülltes Profil erhält bis zu 5-mal mehr Anrufe als ein unvollständiges.\n<ul>\n<li><strong>Professionelles Foto</strong>: Profile mit echtem Foto werden 3x häufiger angeklickt</li>\n<li><strong>Detaillierte Biografie</strong>: Erfahrung, Spezialgebiete, Länder</li>\n<li><strong>Vollständige Sprachen</strong>: wichtiges Filterkriterium</li>\n<li><strong>Regelmäßige Verfügbarkeit</strong>: bessere Platzierung in Ergebnissen</li>\n<li><strong>Schnelle Reaktion</strong>: bessere Bewertungen und mehr Rückrufe</li>\n</ul>",
      pt: "Um perfil bem preenchido recebe até 5 vezes mais ligações que um incompleto.\n<ul>\n<li><strong>Foto profissional</strong>: perfis com foto real são clicados 3x mais</li>\n<li><strong>Biografia detalhada</strong>: experiência, especialidades, países</li>\n<li><strong>Idiomas completos</strong>: critério de filtro importante</li>\n<li><strong>Disponibilidade regular</strong>: melhor posicionamento</li>\n<li><strong>Resposta rápida</strong>: melhores avaliações</li>\n<li><strong>Avaliações positivas</strong>: qualidade no atendimento faz diferença</li>\n</ul>",
      ru: "Хорошо заполненный профиль получает до 5 раз больше звонков, чем неполный.\n<ul>\n<li><strong>Профессиональное фото</strong>: профили с реальным фото просматривают в 3 раза чаще</li>\n<li><strong>Подробная биография</strong>: опыт, специализации, страны</li>\n<li><strong>Полный список языков</strong>: важный фильтр для клиентов</li>\n<li><strong>Регулярная доступность</strong>: лучший рейтинг в результатах</li>\n<li><strong>Быстрый ответ</strong>: более высокие оценки</li>\n</ul>",
      hi: "एक अच्छी तरह से भरी हुई प्रोफ़ाइल अधूरी प्रोफ़ाइल की तुलना में 5 गुना अधिक कॉल प्राप्त करती है।\n<ul>\n<li><strong>पेशेवर फोटो</strong>: वास्तविक फोटो वाली प्रोफ़ाइल 3 गुना अधिक क्लिक होती है</li>\n<li><strong>विस्तृत जीवनी</strong>: अनुभव, विशेषज्ञता, देश</li>\n<li><strong>पूर्ण भाषाएँ</strong>: ग्राहकों के लिए महत्वपूर्ण फ़िल्टर</li>\n<li><strong>नियमित उपलब्धता</strong>: परिणामों में बेहतर रैंकिंग</li>\n<li><strong>त्वरित प्रतिक्रिया</strong>: बेहतर रेटिंग</li>\n</ul>",
      ar: "ملف مكتمل جيداً يحصل على 5 أضعاف المكالمات مقارنةً بملف غير مكتمل.\n<ul>\n<li><strong>صورة احترافية</strong>: الملفات ذات الصور الحقيقية تُنقر 3 مرات أكثر</li>\n<li><strong>سيرة ذاتية تفصيلية</strong>: الخبرة والتخصصات والدول</li>\n<li><strong>اللغات الكاملة</strong>: معيار تصفية مهم للعملاء</li>\n<li><strong>التوفر المنتظم</strong>: ترتيب أفضل في نتائج البحث</li>\n<li><strong>الرد السريع</strong>: تقييمات أفضل وإعادة اتصال أكثر</li>\n</ul>",
      ch: "完善的资料比不完整的资料接到的电话多达5倍。\n<ul>\n<li><strong>专业照片</strong>：有真实头像的资料被点击的频率高3倍</li>\n<li><strong>详细自我介绍</strong>：描述您的经验、专业领域和可帮助的国家</li>\n<li><strong>完整语言列表</strong>：客户搜索的重要筛选条件</li>\n<li><strong>定期在线</strong>：定期活跃的服务商在搜索结果中排名更高</li>\n<li><strong>快速接听</strong>：2分钟内接听可获得更好评价</li>\n<li><strong>积极评价</strong>：通话质量决定评价好坏</li>\n</ul>"
    },
    slug: {
      fr: "optimiser-profil-prestataire-recevoir-plus-appels",
      en: "optimize-provider-profile-receive-more-calls",
      es: "optimizar-perfil-proveedor-mas-llamadas",
      de: "anbieterprofil-optimieren-mehr-anrufe",
      pt: "otimizar-perfil-prestador-mais-ligacoes",
      ru: "ru-optimizirovat-profil-specialista-bolshe-zvonkov",
      hi: "hi-pradata-profile-behtar-adhik-call",
      ar: "ar-tahsin-ملف-muqaddim-mazid-mukalamat",
      ch: "ch-youhua-fuwushang-ziliao-jie-geng-duo-dianhua"
    }
  },

  // ─────────────────────────────────────────────
  // PAYMENTS (orders 22-24)
  // ─────────────────────────────────────────────

  {
    order: 22,
    category: "payments",
    isActive: true,
    isFooter: false,
    tags: ["refund", "payment", "guarantee", "satisfaction", "policy"],
    question: {
      fr: "Peut-on obtenir un remboursement si l'appel ne s'est pas bien déroulé ?",
      en: "Can I get a refund if the call did not go well?",
      es: "¿Puedo obtener un reembolso si la llamada no fue satisfactoria?",
      de: "Kann ich eine Erstattung erhalten, wenn der Anruf nicht gut verlaufen ist?",
      pt: "Posso obter reembolso se a ligação não correu bem?",
      ru: "Могу ли я получить возврат средств, если звонок прошёл неудачно?",
      hi: "अगर कॉल अच्छी नहीं रही तो क्या रिफंड मिल सकता है?",
      ar: "هل يمكنني استرداد المبلغ إذا لم تسر المكالمة بشكل جيد؟",
      ch: "如果通话效果不好，可以申请退款吗？"
    },
    answer: {
      fr: "SOS-Expat dispose d'une politique de remboursement pour les cas où l'appel ne s'est pas déroulé dans des conditions satisfaisantes. Voici les situations couvertes :\n<ul>\n<li><strong>Problème technique grave</strong> : si la qualité audio était inacceptable et empêchait la communication, un remboursement peut être accordé</li>\n<li><strong>Appel non abouti</strong> : si le prestataire n'a pas rappelé dans les délais attendus, vous pouvez demander un remboursement ou un crédit</li>\n<li><strong>Prestataire non qualifié</strong> : si le prestataire était manifestement incompétent pour votre problème, signalez-le via l'interface de notation</li>\n</ul>\nEn revanche, les remboursements ne sont pas accordés pour :\n<ul>\n<li>Un appel correctement effectué dont la réponse ne correspondait pas à ce que vous espériez</li>\n<li>Un problème technique côté client (connexion internet, micro défaillant)</li>\n</ul>\nPour demander un remboursement, contactez le support via la page d'aide de votre compte dans les 48 heures suivant l'appel. Notre équipe examine chaque demande individuellement. Le remboursement, s'il est accordé, est traité dans les 5 à 10 jours ouvrés.",
      en: "SOS-Expat has a refund policy for cases where the call did not take place under satisfactory conditions.\n<ul>\n<li><strong>Serious technical problem</strong>: if audio quality was unacceptable and prevented communication, a refund may be granted</li>\n<li><strong>Unanswered call</strong>: if the provider did not call back within expected timeframes, you can request a refund or credit</li>\n<li><strong>Unqualified provider</strong>: if the provider was clearly unqualified for your issue, report it through the rating interface</li>\n</ul>\nRefunds are not granted for:\n<ul>\n<li>A properly conducted call whose answer did not meet your expectations</li>\n<li>A technical problem on the client side (internet connection, microphone)</li>\n</ul>\nTo request a refund, contact support within 48 hours of the call. Refunds, if granted, are processed within 5-10 business days.",
      es: "SOS-Expat tiene una política de reembolso para casos en que la llamada no se realizó en condiciones satisfactorias.\n<ul>\n<li><strong>Problema técnico grave</strong>: si la calidad de audio era inaceptable</li>\n<li><strong>Llamada no contestada</strong>: si el proveedor no devolvió la llamada a tiempo</li>\n<li><strong>Proveedor no cualificado</strong>: si era claramente incompetente para tu problema</li>\n</ul>\nNo se reembolsan: llamadas correctamente realizadas cuya respuesta no cumplió expectativas ni problemas técnicos del cliente.\nContacta al soporte en 48 horas tras la llamada.",
      de: "SOS-Expat hat eine Erstattungsrichtlinie für Fälle, in denen der Anruf nicht unter zufriedenstellenden Bedingungen stattgefunden hat.\n<ul>\n<li><strong>Schwerwiegendes technisches Problem</strong>: inakzeptable Audioqualität</li>\n<li><strong>Nicht entgegengenommener Anruf</strong>: Anbieter hat nicht innerhalb der erwarteten Zeit zurückgerufen</li>\n<li><strong>Nicht qualifizierter Anbieter</strong>: offensichtlich inkompetent für Ihr Problem</li>\n</ul>\nKeine Erstattung bei korrekt durchgeführten Anrufen oder clientseitigen Problemen.\nKontaktieren Sie den Support innerhalb von 48 Stunden.",
      pt: "O SOS-Expat tem política de reembolso para casos em que a ligação não ocorreu em condições satisfatórias.\n<ul>\n<li><strong>Problema técnico grave</strong>: qualidade de áudio inaceitável</li>\n<li><strong>Ligação não atendida</strong>: prestador não retornou no prazo esperado</li>\n<li><strong>Prestador não qualificado</strong>: claramente incompetente para seu problema</li>\n</ul>\nNão há reembolso para ligações corretamente realizadas ou problemas técnicos do lado do cliente.\nContate o suporte em 48 horas.",
      ru: "SOS-Expat имеет политику возврата средств для случаев, когда звонок не прошёл в удовлетворительных условиях.\n<ul>\n<li><strong>Серьёзная техническая проблема</strong>: неприемлемое качество звука</li>\n<li><strong>Неотвеченный звонок</strong>: специалист не перезвонил в ожидаемые сроки</li>\n<li><strong>Неквалифицированный специалист</strong>: явно некомпетентен для вашей проблемы</li>\n</ul>\nВозврат не предоставляется за: правильно проведённый звонок, ответ которого не соответствовал ожиданиям; технические проблемы на стороне клиента.\nОбратитесь в поддержку в течение 48 часов.",
      hi: "SOS-Expat में उन मामलों के लिए रिफंड नीति है जहां कॉल संतोषजनक परिस्थितियों में नहीं हुई।\n<ul>\n<li><strong>गंभीर तकनीकी समस्या</strong>: अस्वीकार्य ऑडियो गुणवत्ता</li>\n<li><strong>अनुत्तरित कॉल</strong>: प्रदाता ने समय पर वापस कॉल नहीं किया</li>\n<li><strong>अयोग्य प्रदाता</strong>: आपकी समस्या के लिए स्पष्ट रूप से अक्षम</li>\n</ul>\nरिफंड नहीं मिलता: सही तरीके से की गई कॉल जिसका जवाब अपेक्षाओं पर खरा नहीं उतरा; क्लाइंट साइड तकनीकी समस्याएं।\nकॉल के 48 घंटे के भीतर सपोर्ट से संपर्क करें।",
      ar: "يمتلك SOS-Expat سياسة استرداد للحالات التي لم تجرِ فيها المكالمة في ظروف مُرضية.\n<ul>\n<li><strong>مشكلة تقنية خطيرة</strong>: جودة صوت غير مقبولة</li>\n<li><strong>مكالمة لم يُرَدّ عليها</strong>: لم يعاود المقدم الاتصال في الوقت المتوقع</li>\n<li><strong>مقدم غير مؤهل</strong>: غير كفء بشكل واضح لمشكلتك</li>\n</ul>\nلا يُمنح الاسترداد: لمكالمة أُجريت بشكل صحيح، أو لمشاكل تقنية من جهة العميل.\nتواصل مع الدعم في غضون 48 ساعة.",
      ch: "SOS-Expat针对通话未在满意条件下进行的情况制定了退款政策。\n<ul>\n<li><strong>严重技术问题</strong>：音频质量无法接受，妨碍了通信</li>\n<li><strong>未接听的电话</strong>：服务商未在预期时间内回电</li>\n<li><strong>不合格的服务商</strong>：明显不具备处理您问题的能力</li>\n</ul>\n以下情况不予退款：正常进行的通话（即使结果不符合期望）；客户端技术问题。\n请在通话后48小时内联系客服。退款将在5-10个工作日内处理。"
    },
    slug: {
      fr: "remboursement-appel-probleme-politique-sos-expat",
      en: "refund-call-problem-policy-sos-expat",
      es: "reembolso-llamada-problema-politica",
      de: "erstattung-anruf-problem-richtlinie",
      pt: "reembolso-ligacao-problema-politica",
      ru: "ru-vozvrat-sredstv-problemnyi-zvonok",
      hi: "hi-refund-call-samasya-niti",
      ar: "ar-istirjaa-maal-mushkila-mukalama",
      ch: "ch-tuikuan-tonghua-wenti-zhengce"
    }
  },

  {
    order: 23,
    category: "payments",
    isActive: true,
    isFooter: false,
    tags: ["currency", "payment", "euro", "international", "pricing"],
    question: {
      fr: "Dans quelle devise sont facturés les appels sur SOS-Expat ?",
      en: "What currency are calls billed in on SOS-Expat?",
      es: "¿En qué divisa se facturan las llamadas en SOS-Expat?",
      de: "In welcher Währung werden Anrufe bei SOS-Expat abgerechnet?",
      pt: "Em qual moeda as ligações são cobradas no SOS-Expat?",
      ru: "В какой валюте выставляются счета за звонки на SOS-Expat?",
      hi: "SOS-Expat पर कॉल किस मुद्रा में बिल किए जाते हैं?",
      ar: "بأي عملة تُفوتَر المكالمات على SOS-Expat؟",
      ch: "SOS-Expat上的通话费用以哪种货币结算？"
    },
    answer: {
      fr: "Les appels sur SOS-Expat sont facturés en euros (€). Les tarifs sont fixes et transparents : 49€ pour une session de 20 minutes avec un avocat, et 19€ pour une session de 30 minutes avec un expatrié aidant. Il n'y a pas de frais cachés ni de facturation à la minute.\n<ul>\n<li><strong>Paiement par carte bancaire</strong> : Visa, Mastercard, American Express, via la plateforme sécurisée Stripe</li>\n<li><strong>Conversion automatique</strong> : si votre carte est libellée dans une autre devise (USD, GBP, CHF, etc.), votre banque effectue la conversion au taux du jour</li>\n<li><strong>Frais de change</strong> : les éventuels frais de change sont appliqués par votre banque, pas par SOS-Expat</li>\n<li><strong>Reçu automatique</strong> : un reçu de paiement en euros est envoyé par email après chaque appel</li>\n</ul>\nSOS-Expat ne stocke jamais vos coordonnées bancaires : le traitement des paiements est entièrement délégué à Stripe, certifié PCI-DSS niveau 1.",
      en: "Calls on SOS-Expat are billed in euros (€). Prices are fixed and transparent: €49 for a 20-minute session with a lawyer, and €19 for a 30-minute session with a helping expat. There are no hidden fees or per-minute billing.\n<ul>\n<li><strong>Credit card payment</strong>: Visa, Mastercard, American Express, via Stripe</li>\n<li><strong>Automatic conversion</strong>: if your card is in another currency (USD, GBP, CHF, etc.), your bank converts at the daily rate</li>\n<li><strong>Exchange fees</strong>: any exchange fees are applied by your bank, not SOS-Expat</li>\n<li><strong>Automatic receipt</strong>: a payment receipt in euros is emailed after each call</li>\n</ul>\nSOS-Expat never stores your bank details: payment processing is fully delegated to Stripe, PCI-DSS Level 1 certified.",
      es: "Las llamadas en SOS-Expat se facturan en euros (€). Los precios son fijos y transparentes: 49€ para una sesión de 20 min con abogado y 19€ para 30 min con expatriado asesor.\n<ul>\n<li><strong>Pago con tarjeta</strong>: Visa, Mastercard, Amex, vía Stripe</li>\n<li><strong>Conversión automática</strong>: si tu tarjeta es en otra divisa, tu banco realiza la conversión</li>\n<li><strong>Gastos de cambio</strong>: los aplica tu banco, no SOS-Expat</li>\n<li><strong>Recibo automático</strong>: se envía por email tras cada llamada</li>\n</ul>",
      de: "Anrufe bei SOS-Expat werden in Euro (€) abgerechnet. Die Preise sind fest und transparent: 49€ für eine 20-minütige Anwaltssitzung und 19€ für 30 Minuten mit einem Expat-Helfer.\n<ul>\n<li><strong>Kreditkartenzahlung</strong>: Visa, Mastercard, Amex, über Stripe</li>\n<li><strong>Automatische Konvertierung</strong>: Ihre Bank rechnet bei anderer Kartenwährung um</li>\n<li><strong>Wechselgebühren</strong>: von Ihrer Bank erhoben</li>\n<li><strong>Automatische Quittung</strong>: nach jedem Anruf per E-Mail</li>\n</ul>",
      pt: "As ligações no SOS-Expat são cobradas em euros (€). Os preços são fixos e transparentes: €49 para sessão de 20 min com advogado e €19 para 30 min com expatriado assistente.\n<ul>\n<li><strong>Pagamento por cartão</strong>: Visa, Mastercard, Amex, via Stripe</li>\n<li><strong>Conversão automática</strong>: seu banco converte se o cartão for em outra moeda</li>\n<li><strong>Taxas de câmbio</strong>: cobradas pelo seu banco</li>\n<li><strong>Recibo automático</strong>: enviado por e-mail após cada ligação</li>\n</ul>",
      ru: "Звонки на SOS-Expat выставляются в евро (€). Цены фиксированные и прозрачные: 49€ за 20-минутную сессию с юристом и 19€ за 30 минут с экспатом-помощником.\n<ul>\n<li><strong>Оплата картой</strong>: Visa, Mastercard, Amex через Stripe</li>\n<li><strong>Автоматическая конвертация</strong>: ваш банк конвертирует по курсу дня, если карта в другой валюте</li>\n<li><strong>Комиссия за обмен</strong>: взимается вашим банком</li>\n<li><strong>Автоматическая квитанция</strong>: отправляется по email после каждого звонка</li>\n</ul>",
      hi: "SOS-Expat पर कॉल यूरो (€) में बिल किए जाते हैं। मूल्य निश्चित और पारदर्शी हैं: वकील के साथ 20 मिनट के लिए €49 और सहायक प्रवासी के साथ 30 मिनट के लिए €19।\n<ul>\n<li><strong>कार्ड भुगतान</strong>: Visa, Mastercard, Amex, Stripe के माध्यम से</li>\n<li><strong>स्वचालित रूपांतरण</strong>: यदि कार्ड अन्य मुद्रा में है, तो आपका बैंक रूपांतरण करता है</li>\n<li><strong>विनिमय शुल्क</strong>: आपके बैंक द्वारा लागू</li>\n<li><strong>स्वचालित रसीद</strong>: प्रत्येक कॉल के बाद ईमेल द्वारा भेजी जाती है</li>\n</ul>",
      ar: "تُفوتَر المكالمات على SOS-Expat باليورو (€). الأسعار ثابتة وشفافة: 49€ لجلسة 20 دقيقة مع محامٍ، و19€ لـ30 دقيقة مع مغترب مساعد.\n<ul>\n<li><strong>الدفع ببطاقة ائتمانية</strong>: فيزا، ماستركارد، أمريكان إكسبريس عبر Stripe</li>\n<li><strong>التحويل التلقائي</strong>: إذا كانت بطاقتك بعملة أخرى، يحول بنكك المبلغ</li>\n<li><strong>رسوم الصرف</strong>: يطبقها بنكك</li>\n<li><strong>إيصال تلقائي</strong>: يُرسل بالبريد الإلكتروني بعد كل مكالمة</li>\n</ul>",
      ch: "SOS-Expat上的通话费用以欧元（€）结算。价格固定透明：与律师20分钟收费€49，与华人助理30分钟收费€19。\n<ul>\n<li><strong>信用卡支付</strong>：Visa、Mastercard、美国运通，通过Stripe处理</li>\n<li><strong>自动换算</strong>：如果您的卡为其他货币（美元、英镑、人民币等），您的银行将按当日汇率换算</li>\n<li><strong>汇率手续费</strong>：由您的银行收取，SOS-Expat不收取</li>\n<li><strong>自动收据</strong>：每次通话后通过邮件发送</li>\n</ul>"
    },
    slug: {
      fr: "devise-facturation-appels-euros-sos-expat",
      en: "currency-billing-calls-euros-sos-expat",
      es: "divisa-facturacion-llamadas-euros",
      de: "waehrung-abrechnung-anrufe-euro",
      pt: "moeda-cobranca-ligacoes-euros",
      ru: "ru-valyuta-oplaty-zvonkov-evro",
      hi: "hi-mudra-billing-call-euro",
      ar: "ar-umla-faturat-mukalama-yuro",
      ch: "ch-tonghua-jiezhang-huobi-ouryuan"
    }
  },

  {
    order: 24,
    category: "payments",
    isActive: true,
    isFooter: false,
    tags: ["invoice", "receipt", "payment", "professional", "tax"],
    question: {
      fr: "Puis-je obtenir une facture officielle pour mes appels SOS-Expat ?",
      en: "Can I get an official invoice for my SOS-Expat calls?",
      es: "¿Puedo obtener una factura oficial por mis llamadas en SOS-Expat?",
      de: "Kann ich eine offizielle Rechnung für meine SOS-Expat-Anrufe erhalten?",
      pt: "Posso obter fatura oficial pelas minhas ligações no SOS-Expat?",
      ru: "Могу ли я получить официальный счёт за звонки через SOS-Expat?",
      hi: "क्या मैं SOS-Expat कॉल के लिए आधिकारिक चालान प्राप्त कर सकता हूँ?",
      ar: "هل يمكنني الحصول على فاتورة رسمية لمكالماتي على SOS-Expat؟",
      ch: "我可以获得SOS-Expat通话的正式发票吗？"
    },
    answer: {
      fr: "Oui, un reçu de paiement est automatiquement envoyé par email après chaque appel. Ce document contient toutes les informations nécessaires pour votre comptabilité ou vos notes de frais :\n<ul>\n<li>Date et heure de la transaction</li>\n<li>Montant en euros (TTC)</li>\n<li>Description du service (session d'assistance téléphonique)</li>\n<li>Numéro de transaction unique</li>\n<li>Informations SOS-Expat (entreprise, adresse, TVA)</li>\n</ul>\nSi vous avez besoin d'une facture plus formelle avec vos coordonnées professionnelles, vous pouvez en faire la demande auprès de notre support en précisant :\n<ul>\n<li>Votre nom ou raison sociale</li>\n<li>Votre adresse de facturation</li>\n<li>Votre numéro de TVA intracommunautaire (si applicable)</li>\n</ul>\nPour les entreprises ou professionnels qui utilisent SOS-Expat régulièrement pour leurs équipes expatriées, des arrangements de facturation mensuelle peuvent être discutés avec notre équipe commerciale.",
      en: "Yes, a payment receipt is automatically sent by email after each call. This document contains all the information needed for your accounting or expense reports:\n<ul>\n<li>Date and time of the transaction</li>\n<li>Amount in euros (including tax)</li>\n<li>Service description (phone assistance session)</li>\n<li>Unique transaction number</li>\n<li>SOS-Expat information (company, address, VAT)</li>\n</ul>\nIf you need a more formal invoice with your professional details, you can request one from our support team, specifying your name/company, billing address, and VAT number (if applicable).\nFor companies that use SOS-Expat regularly for their expat teams, monthly billing arrangements can be discussed.",
      es: "Sí, se envía automáticamente un recibo de pago por email tras cada llamada.\n<ul>\n<li>Fecha y hora de la transacción</li>\n<li>Importe en euros (IVA incluido)</li>\n<li>Descripción del servicio</li>\n<li>Número de transacción único</li>\n<li>Datos de SOS-Expat</li>\n</ul>\nSi necesitas una factura más formal con tus datos profesionales, contacta con soporte indicando tu razón social, dirección y NIF/VAT.",
      de: "Ja, nach jedem Anruf wird automatisch eine Zahlungsquittung per E-Mail gesendet.\n<ul>\n<li>Datum und Uhrzeit der Transaktion</li>\n<li>Betrag in Euro (inkl. MwSt.)</li>\n<li>Servicebeschreibung</li>\n<li>Eindeutige Transaktionsnummer</li>\n<li>SOS-Expat Informationen</li>\n</ul>\nFür eine formelle Rechnung mit Ihren beruflichen Daten wenden Sie sich an den Support.",
      pt: "Sim, um recibo de pagamento é enviado automaticamente por e-mail após cada ligação.\n<ul>\n<li>Data e hora da transação</li>\n<li>Valor em euros (com impostos)</li>\n<li>Descrição do serviço</li>\n<li>Número de transação único</li>\n<li>Dados do SOS-Expat</li>\n</ul>\nPara fatura mais formal com seus dados profissionais, contate o suporte.",
      ru: "Да, квитанция об оплате автоматически отправляется по email после каждого звонка.\n<ul>\n<li>Дата и время транзакции</li>\n<li>Сумма в евро (с НДС)</li>\n<li>Описание услуги</li>\n<li>Уникальный номер транзакции</li>\n<li>Данные SOS-Expat</li>\n</ul>\nДля официального счёта с вашими профессиональными данными обратитесь в поддержку.",
      hi: "हाँ, प्रत्येक कॉल के बाद भुगतान रसीद स्वचालित रूप से ईमेल द्वारा भेजी जाती है।\n<ul>\n<li>लेनदेन की तारीख और समय</li>\n<li>यूरो में राशि (टैक्स सहित)</li>\n<li>सेवा विवरण</li>\n<li>अद्वितीय लेनदेन संख्या</li>\n<li>SOS-Expat जानकारी</li>\n</ul>\nपेशेवर विवरण के साथ अधिक औपचारिक चालान के लिए, समर्थन से संपर्क करें।",
      ar: "نعم، يُرسَل إيصال دفع تلقائياً بالبريد الإلكتروني بعد كل مكالمة.\n<ul>\n<li>تاريخ ووقت المعاملة</li>\n<li>المبلغ باليورو (شامل الضريبة)</li>\n<li>وصف الخدمة</li>\n<li>رقم المعاملة الفريد</li>\n<li>معلومات SOS-Expat</li>\n</ul>\nللحصول على فاتورة رسمية بياناتك المهنية، تواصل مع الدعم.",
      ch: "是的，每次通话后系统会自动通过邮件发送付款收据。该文件包含以下信息：\n<ul>\n<li>交易日期和时间</li>\n<li>欧元金额（含税）</li>\n<li>服务描述（电话咨询服务）</li>\n<li>唯一交易编号</li>\n<li>SOS-Expat公司信息</li>\n</ul>\n如需包含您公司信息的正式发票，请联系客服，提供您的公司名称、账单地址和增值税号（如适用）。"
    },
    slug: {
      fr: "facture-officielle-appels-sos-expat",
      en: "official-invoice-calls-sos-expat",
      es: "factura-oficial-llamadas-sos-expat",
      de: "offizielle-rechnung-anrufe-sos-expat",
      pt: "fatura-oficial-ligacoes-sos-expat",
      ru: "ru-ofitsialnyi-schet-zvonki-sos-expat",
      hi: "hi-adhikarik-chalaan-call-sos-expat",
      ar: "ar-fatura-rasmiya-mukalama-sos-expat",
      ch: "ch-zhengshi-fapiao-tonghua-sos-expat"
    }
  },

  // ─────────────────────────────────────────────
  // ACCOUNT (orders 25-27)
  // ─────────────────────────────────────────────

  {
    order: 25,
    category: "account",
    isActive: true,
    isFooter: false,
    tags: ["registration", "account", "signup", "email", "new-user"],
    question: {
      fr: "Comment créer un compte sur SOS-Expat ?",
      en: "How do I create an account on SOS-Expat?",
      es: "¿Cómo creo una cuenta en SOS-Expat?",
      de: "Wie erstelle ich ein Konto bei SOS-Expat?",
      pt: "Como criar uma conta no SOS-Expat?",
      ru: "Как создать аккаунт на SOS-Expat?",
      hi: "SOS-Expat पर अकाउंट कैसे बनाएं?",
      ar: "كيف أنشئ حساباً على SOS-Expat؟",
      ch: "如何在SOS-Expat上创建账户？"
    },
    answer: {
      fr: "Créer un compte sur SOS-Expat est gratuit et prend moins de 2 minutes. Vous n'avez pas besoin de télécharger une application : tout se passe sur le site web sos-expat.com.\n<ul>\n<li><strong>Étape 1</strong> : cliquez sur \"S'inscrire\" en haut à droite de la page d'accueil</li>\n<li><strong>Étape 2</strong> : entrez votre adresse email et choisissez un mot de passe sécurisé</li>\n<li><strong>Étape 3</strong> : vérifiez votre email via le lien de confirmation envoyé</li>\n<li><strong>Étape 4</strong> : complétez votre profil (nom, pays, langue préférée)</li>\n</ul>\nUne fois inscrit en tant que client, vous pouvez immédiatement parcourir les prestataires disponibles et passer votre premier appel. Aucune information de paiement n'est requise lors de l'inscription — vous ne payez qu'au moment de l'appel.\n\nSi vous souhaitez vous inscrire en tant que prestataire (avocat ou expatrié aidant), le processus est légèrement différent et nécessite une vérification d'identité (KYC). Consultez la section \"Je suis prestataire\" pour plus de détails.",
      en: "Creating an account on SOS-Expat is free and takes less than 2 minutes. No app download needed — everything happens on sos-expat.com.\n<ul>\n<li><strong>Step 1</strong>: click \"Sign up\" at the top right of the homepage</li>\n<li><strong>Step 2</strong>: enter your email address and choose a secure password</li>\n<li><strong>Step 3</strong>: verify your email via the confirmation link sent</li>\n<li><strong>Step 4</strong>: complete your profile (name, country, preferred language)</li>\n</ul>\nOnce registered as a client, you can immediately browse available providers and make your first call. No payment information is required at registration — you only pay at the time of the call.",
      es: "Crear una cuenta en SOS-Expat es gratuito y lleva menos de 2 minutos. Sin descarga de app — todo en sos-expat.com.\n<ul>\n<li><strong>Paso 1</strong>: haz clic en \"Registrarse\" arriba a la derecha</li>\n<li><strong>Paso 2</strong>: introduce tu email y elige una contraseña segura</li>\n<li><strong>Paso 3</strong>: verifica tu email con el enlace enviado</li>\n<li><strong>Paso 4</strong>: completa tu perfil (nombre, país, idioma)</li>\n</ul>\nUna vez registrado, puedes explorar proveedores y hacer tu primera llamada. No se requiere información de pago en el registro.",
      de: "Ein Konto bei SOS-Expat zu erstellen ist kostenlos und dauert weniger als 2 Minuten. Kein App-Download — alles auf sos-expat.com.\n<ul>\n<li><strong>Schritt 1</strong>: Klicken Sie auf \"Registrieren\" oben rechts</li>\n<li><strong>Schritt 2</strong>: E-Mail-Adresse eingeben und sicheres Passwort wählen</li>\n<li><strong>Schritt 3</strong>: E-Mail über den Bestätigungslink verifizieren</li>\n<li><strong>Schritt 4</strong>: Profil vervollständigen</li>\n</ul>\nNach der Registrierung können Sie sofort Anbieter durchsuchen. Keine Zahlungsinformationen bei der Registrierung nötig.",
      pt: "Criar uma conta no SOS-Expat é gratuito e leva menos de 2 minutos. Sem download de app — tudo em sos-expat.com.\n<ul>\n<li><strong>Passo 1</strong>: clique em \"Cadastrar\" no canto superior direito</li>\n<li><strong>Passo 2</strong>: insira seu e-mail e escolha uma senha segura</li>\n<li><strong>Passo 3</strong>: verifique o e-mail pelo link de confirmação</li>\n<li><strong>Passo 4</strong>: complete seu perfil</li>\n</ul>\nApós o cadastro, você pode explorar prestadores imediatamente. Nenhuma informação de pagamento é necessária no cadastro.",
      ru: "Создать аккаунт на SOS-Expat бесплатно и занимает менее 2 минут. Приложение скачивать не нужно — всё происходит на sos-expat.com.\n<ul>\n<li><strong>Шаг 1</strong>: нажмите «Зарегистрироваться» в правом верхнем углу</li>\n<li><strong>Шаг 2</strong>: введите email и выберите надёжный пароль</li>\n<li><strong>Шаг 3</strong>: подтвердите email по ссылке</li>\n<li><strong>Шаг 4</strong>: заполните профиль</li>\n</ul>\nПосле регистрации вы можете сразу просматривать специалистов. Платёжные данные при регистрации не требуются.",
      hi: "SOS-Expat पर खाता बनाना मुफ़्त है और 2 मिनट से कम समय लेता है। कोई ऐप डाउनलोड नहीं — सब कुछ sos-expat.com पर होता है।\n<ul>\n<li><strong>चरण 1</strong>: होमपेज के ऊपर दाईं ओर \"साइन अप\" पर क्लिक करें</li>\n<li><strong>चरण 2</strong>: अपना ईमेल दर्ज करें और सुरक्षित पासवर्ड चुनें</li>\n<li><strong>चरण 3</strong>: भेजे गए लिंक से ईमेल सत्यापित करें</li>\n<li><strong>चरण 4</strong>: अपनी प्रोफ़ाइल पूरी करें</li>\n</ul>\nपंजीकरण के बाद आप तुरंत प्रदाताओं को देख सकते हैं। पंजीकरण के समय भुगतान जानकारी आवश्यक नहीं।",
      ar: "إنشاء حساب على SOS-Expat مجاني ويستغرق أقل من دقيقتين. لا تنزيل تطبيق — كل شيء على sos-expat.com.\n<ul>\n<li><strong>الخطوة 1</strong>: انقر على \"إنشاء حساب\" في أعلى اليمين</li>\n<li><strong>الخطوة 2</strong>: أدخل بريدك الإلكتروني واختر كلمة مرور آمنة</li>\n<li><strong>الخطوة 3</strong>: تحقق من البريد الإلكتروني عبر الرابط المرسل</li>\n<li><strong>الخطوة 4</strong>: أكمل ملفك الشخصي</li>\n</ul>\nبعد التسجيل، يمكنك استعراض المقدمين فوراً. لا تلزمك معلومات الدفع عند التسجيل.",
      ch: "在SOS-Expat上创建账户免费，只需不到2分钟。无需下载应用——一切在sos-expat.com完成。\n<ul>\n<li><strong>第一步</strong>：点击首页右上角的「注册」</li>\n<li><strong>第二步</strong>：输入邮箱并选择安全密码</li>\n<li><strong>第三步</strong>：通过发送的链接验证邮箱</li>\n<li><strong>第四步</strong>：完善个人资料（姓名、国家、语言偏好）</li>\n</ul>\n注册后，您可以立即浏览可用服务商并进行第一次通话。注册时无需提供支付信息——只在通话时付款。"
    },
    slug: {
      fr: "creer-compte-sos-expat-inscription",
      en: "create-account-sos-expat-signup",
      es: "crear-cuenta-sos-expat-registro",
      de: "konto-erstellen-sos-expat-registrierung",
      pt: "criar-conta-sos-expat-cadastro",
      ru: "ru-sozdat-akkaunt-sos-expat",
      hi: "hi-account-banane-sos-expat",
      ar: "ar-insha-hisab-sos-expat",
      ch: "ch-zhuce-zhanghao-sos-expat"
    }
  },

  {
    order: 26,
    category: "account",
    isActive: true,
    isFooter: false,
    tags: ["privacy", "data", "gdpr", "security", "personal"],
    question: {
      fr: "Comment SOS-Expat protège-t-il mes données personnelles ?",
      en: "How does SOS-Expat protect my personal data?",
      es: "¿Cómo protege SOS-Expat mis datos personales?",
      de: "Wie schützt SOS-Expat meine persönlichen Daten?",
      pt: "Como o SOS-Expat protege meus dados pessoais?",
      ru: "Как SOS-Expat защищает мои персональные данные?",
      hi: "SOS-Expat मेरे व्यक्तिगत डेटा की सुरक्षा कैसे करता है?",
      ar: "كيف يحمي SOS-Expat بياناتي الشخصية؟",
      ch: "SOS-Expat如何保护我的个人数据？"
    },
    answer: {
      fr: "SOS-Expat applique les normes les plus élevées en matière de protection des données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne.\n<ul>\n<li><strong>Données collectées</strong> : uniquement les données nécessaires au fonctionnement du service (nom, email, pays, numéro de téléphone pour l'appel)</li>\n<li><strong>Appels non enregistrés</strong> : vos conversations téléphoniques ne sont jamais enregistrées ni stockées</li>\n<li><strong>Paiements sécurisés</strong> : vos coordonnées bancaires ne transitent jamais par nos serveurs — elles sont traitées directement par Stripe (certifié PCI-DSS niveau 1)</li>\n<li><strong>Données chiffrées</strong> : toutes les données sont stockées de manière chiffrée sur des serveurs sécurisés</li>\n<li><strong>Pas de revente de données</strong> : vos données personnelles ne sont jamais vendues ni partagées avec des tiers à des fins commerciales</li>\n<li><strong>Vos droits RGPD</strong> : accès, rectification, suppression, portabilité et opposition — exercez-les à tout moment via votre compte ou par email</li>\n</ul>\nPour toute question relative à vos données, vous pouvez contacter notre délégué à la protection des données (DPO) via la page de contact.",
      en: "SOS-Expat applies the highest standards for personal data protection, in compliance with the European Union's General Data Protection Regulation (GDPR).\n<ul>\n<li><strong>Data collected</strong>: only what is necessary for the service (name, email, country, phone number)</li>\n<li><strong>Calls not recorded</strong>: your phone conversations are never recorded or stored</li>\n<li><strong>Secure payments</strong>: your banking details never pass through our servers — processed directly by Stripe (PCI-DSS Level 1)</li>\n<li><strong>Encrypted data</strong>: all data is stored encrypted on secure servers</li>\n<li><strong>No data resale</strong>: your personal data is never sold or shared with third parties for commercial purposes</li>\n<li><strong>Your GDPR rights</strong>: access, correction, deletion, portability, and objection — exercise them anytime via your account</li>\n</ul>",
      es: "SOS-Expat aplica los más altos estándares de protección de datos personales, cumpliendo con el RGPD de la UE.\n<ul>\n<li><strong>Datos recopilados</strong>: solo los necesarios para el servicio</li>\n<li><strong>Llamadas no grabadas</strong>: tus conversaciones nunca se graban ni almacenan</li>\n<li><strong>Pagos seguros</strong>: tus datos bancarios no pasan por nuestros servidores (Stripe PCI-DSS nivel 1)</li>\n<li><strong>Datos cifrados</strong>: almacenados cifrados en servidores seguros</li>\n<li><strong>Sin reventa de datos</strong>: nunca se venden a terceros</li>\n<li><strong>Tus derechos RGPD</strong>: acceso, rectificación, supresión, portabilidad</li>\n</ul>",
      de: "SOS-Expat wendet die höchsten Standards für den Schutz personenbezogener Daten an und hält die DSGVO ein.\n<ul>\n<li><strong>Erhobene Daten</strong>: nur die für den Dienst notwendigen Daten</li>\n<li><strong>Keine Anrufaufzeichnung</strong>: Ihre Gespräche werden nie aufgezeichnet</li>\n<li><strong>Sichere Zahlungen</strong>: Bankdaten laufen nie über unsere Server (Stripe PCI-DSS Stufe 1)</li>\n<li><strong>Verschlüsselte Daten</strong>: auf sicheren Servern gespeichert</li>\n<li><strong>Keine Datenweitergabe</strong>: nie an Dritte verkauft</li>\n<li><strong>Ihre DSGVO-Rechte</strong>: Zugriff, Berichtigung, Löschung, Portabilität</li>\n</ul>",
      pt: "O SOS-Expat aplica os mais altos padrões de proteção de dados pessoais, em conformidade com o RGPD da UE.\n<ul>\n<li><strong>Dados coletados</strong>: apenas os necessários para o serviço</li>\n<li><strong>Ligações não gravadas</strong>: suas conversas nunca são gravadas</li>\n<li><strong>Pagamentos seguros</strong>: dados bancários não passam pelos nossos servidores (Stripe PCI-DSS nível 1)</li>\n<li><strong>Dados criptografados</strong>: armazenados em servidores seguros</li>\n<li><strong>Sem revenda de dados</strong>: nunca vendidos a terceiros</li>\n<li><strong>Direitos RGPD</strong>: acesso, correção, exclusão, portabilidade</li>\n</ul>",
      ru: "SOS-Expat применяет высочайшие стандарты защиты персональных данных в соответствии с GDPR ЕС.\n<ul>\n<li><strong>Собираемые данные</strong>: только необходимые для сервиса</li>\n<li><strong>Звонки не записываются</strong>: ваши разговоры никогда не сохраняются</li>\n<li><strong>Безопасные платежи</strong>: банковские данные не проходят через наши серверы (Stripe PCI-DSS уровень 1)</li>\n<li><strong>Зашифрованные данные</strong>: хранятся на защищённых серверах</li>\n<li><strong>Нет перепродажи данных</strong>: никогда не продаются третьим сторонам</li>\n<li><strong>Ваши права GDPR</strong>: доступ, исправление, удаление, переносимость</li>\n</ul>",
      hi: "SOS-Expat EU के GDPR के अनुपालन में व्यक्तिगत डेटा सुरक्षा के उच्चतम मानकों को लागू करता है।\n<ul>\n<li><strong>एकत्र किया गया डेटा</strong>: केवल सेवा के लिए आवश्यक</li>\n<li><strong>कॉल रिकॉर्ड नहीं</strong>: आपकी बातचीत कभी रिकॉर्ड नहीं होती</li>\n<li><strong>सुरक्षित भुगतान</strong>: बैंकिंग विवरण हमारे सर्वर से नहीं गुजरते (Stripe PCI-DSS स्तर 1)</li>\n<li><strong>एन्क्रिप्टेड डेटा</strong>: सुरक्षित सर्वर पर संग्रहीत</li>\n<li><strong>डेटा पुनर्विक्रय नहीं</strong>: तीसरे पक्ष को कभी नहीं बेचा जाता</li>\n<li><strong>GDPR अधिकार</strong>: पहुँच, सुधार, हटाना, पोर्टेबिलिटी</li>\n</ul>",
      ar: "يطبق SOS-Expat أعلى معايير حماية البيانات الشخصية وفق اللائحة العامة لحماية البيانات (GDPR) الأوروبية.\n<ul>\n<li><strong>البيانات المجمعة</strong>: فقط ما هو ضروري للخدمة</li>\n<li><strong>المكالمات غير مسجلة</strong>: محادثاتك لا تُسجل أو تُخزن أبداً</li>\n<li><strong>مدفوعات آمنة</strong>: بياناتك المصرفية لا تمر عبر خوادمنا (Stripe PCI-DSS مستوى 1)</li>\n<li><strong>بيانات مشفرة</strong>: مخزنة على خوادم آمنة</li>\n<li><strong>بدون إعادة بيع البيانات</strong>: لا تُباع لأطراف ثالثة</li>\n<li><strong>حقوقك وفق GDPR</strong>: الوصول، التصحيح، الحذف، إمكانية النقل</li>\n</ul>",
      ch: "SOS-Expat严格遵守欧盟《通用数据保护条例》（GDPR），执行最高标准的个人数据保护。\n<ul>\n<li><strong>收集的数据</strong>：仅限服务所需的信息（姓名、邮箱、国家、电话号码）</li>\n<li><strong>通话不录音</strong>：您的电话对话从不被录制或存储</li>\n<li><strong>安全支付</strong>：您的银行信息不经过我们的服务器（由Stripe PCI-DSS一级认证直接处理）</li>\n<li><strong>数据加密</strong>：所有数据在安全服务器上加密存储</li>\n<li><strong>不转售数据</strong>：您的个人数据绝不出售给第三方</li>\n<li><strong>您的GDPR权利</strong>：访问、更正、删除、可携性和反对权——随时通过账户行使</li>\n</ul>"
    },
    slug: {
      fr: "protection-donnees-personnelles-rgpd-sos-expat",
      en: "personal-data-protection-gdpr-sos-expat",
      es: "proteccion-datos-personales-rgpd-sos-expat",
      de: "datenschutz-dsgvo-sos-expat",
      pt: "protecao-dados-pessoais-lgpd-sos-expat",
      ru: "ru-zashita-lichnykh-dannykh-gdpr-sos-expat",
      hi: "hi-vyaktigat-data-suraksha-gdpr",
      ar: "ar-himayat-byanat-shakhsiya-gdpr",
      ch: "ch-gerenshunju-baohu-gdpr-sos-expat"
    }
  },

  {
    order: 27,
    category: "account",
    isActive: true,
    isFooter: false,
    tags: ["delete", "account", "gdpr", "data", "removal"],
    question: {
      fr: "Comment supprimer définitivement mon compte SOS-Expat ?",
      en: "How do I permanently delete my SOS-Expat account?",
      es: "¿Cómo elimino definitivamente mi cuenta de SOS-Expat?",
      de: "Wie lösche ich mein SOS-Expat-Konto endgültig?",
      pt: "Como excluir definitivamente minha conta no SOS-Expat?",
      ru: "Как окончательно удалить аккаунт на SOS-Expat?",
      hi: "SOS-Expat अकाउंट को स्थायी रूप से कैसे हटाएं?",
      ar: "كيف أحذف حسابي على SOS-Expat نهائياً؟",
      ch: "如何永久删除我的SOS-Expat账户？"
    },
    answer: {
      fr: "Vous avez le droit de supprimer votre compte SOS-Expat à tout moment, conformément au RGPD (droit à l'effacement). Voici la procédure :\n<ul>\n<li><strong>Depuis votre compte</strong> : rendez-vous dans Paramètres → Compte → Supprimer mon compte. La suppression est immédiate et irréversible</li>\n<li><strong>Par email</strong> : si vous ne pouvez pas vous connecter, envoyez une demande à notre support avec la mention \"Demande de suppression de compte RGPD\" et l'adresse email de votre compte</li>\n</ul>\nCe qui est supprimé lors de la clôture de votre compte :\n<ul>\n<li>Votre profil et vos informations personnelles</li>\n<li>Votre historique d'appels (métadonnées)</li>\n<li>Vos préférences et paramètres</li>\n</ul>\nCe qui peut être conservé pour des raisons légales :\n<ul>\n<li>Les données de transaction (factures, paiements) sont conservées 10 ans conformément aux obligations comptables</li>\n<li>Les données nécessaires à la résolution de litiges en cours</li>\n</ul>\nLa suppression définitive est effectuée dans un délai de 30 jours maximum après votre demande.",
      en: "You have the right to delete your SOS-Expat account at any time under GDPR (right to erasure). Here is the procedure:\n<ul>\n<li><strong>From your account</strong>: go to Settings → Account → Delete my account. Deletion is immediate and irreversible</li>\n<li><strong>By email</strong>: if you cannot log in, send a request to our support mentioning \"GDPR Account Deletion Request\" with your account email</li>\n</ul>\nWhat is deleted:\n<ul>\n<li>Your profile and personal information</li>\n<li>Your call history (metadata)</li>\n<li>Your preferences and settings</li>\n</ul>\nWhat may be kept for legal reasons:\n<ul>\n<li>Transaction data (invoices, payments) kept 10 years per accounting obligations</li>\n<li>Data needed to resolve ongoing disputes</li>\n</ul>",
      es: "Tienes derecho a eliminar tu cuenta de SOS-Expat en cualquier momento según el RGPD.\n<ul>\n<li><strong>Desde tu cuenta</strong>: Ajustes → Cuenta → Eliminar mi cuenta</li>\n<li><strong>Por email</strong>: solicita la eliminación indicando \"Solicitud eliminación cuenta RGPD\"</li>\n</ul>\nQué se elimina: perfil, historial de llamadas, preferencias.\nQué se puede conservar: datos de transacciones (10 años), datos para resolver disputas pendientes.",
      de: "Sie haben das Recht, Ihr SOS-Expat-Konto jederzeit zu löschen (DSGVO-Recht auf Löschung).\n<ul>\n<li><strong>Über Ihr Konto</strong>: Einstellungen → Konto → Konto löschen</li>\n<li><strong>Per E-Mail</strong>: Anfrage mit dem Betreff \"DSGVO-Kontolöschungsanfrage\"</li>\n</ul>\nWas gelöscht wird: Profil, Anrufhistorie, Präferenzen.\nWas aus rechtlichen Gründen aufbewahrt werden kann: Transaktionsdaten (10 Jahre).",
      pt: "Você tem o direito de excluir sua conta no SOS-Expat a qualquer momento pelo LGPD/RGPD.\n<ul>\n<li><strong>Pela conta</strong>: Configurações → Conta → Excluir minha conta</li>\n<li><strong>Por e-mail</strong>: solicite com \"Pedido de exclusão de conta LGPD\"</li>\n</ul>\nO que é excluído: perfil, histórico de ligações, preferências.\nO que pode ser mantido: dados de transações (10 anos).",
      ru: "Вы вправе удалить аккаунт на SOS-Expat в любое время согласно GDPR (право на удаление).\n<ul>\n<li><strong>Через аккаунт</strong>: Настройки → Аккаунт → Удалить мой аккаунт</li>\n<li><strong>По email</strong>: отправьте запрос с пометкой \"Запрос на удаление аккаунта GDPR\"</li>\n</ul>\nЧто удаляется: профиль, история звонков, настройки.\nЧто может храниться по юридическим причинам: данные транзакций (10 лет).",
      hi: "GDPR के तहत आप किसी भी समय अपना SOS-Expat अकाउंट हटाने का अधिकार रखते हैं।\n<ul>\n<li><strong>अकाउंट से</strong>: सेटिंग → अकाउंट → मेरा अकाउंट हटाएं</li>\n<li><strong>ईमेल द्वारा</strong>: \"GDPR अकाउंट डिलीशन रिक्वेस्ट\" लिखकर सपोर्ट को भेजें</li>\n</ul>\nजो हटाया जाता है: प्रोफ़ाइल, कॉल इतिहास, प्राथमिकताएँ।\nकानूनी कारणों से जो रखा जा सकता है: लेनदेन डेटा (10 वर्ष)।",
      ar: "لديك الحق في حذف حسابك على SOS-Expat في أي وقت وفق اللائحة العامة لحماية البيانات.\n<ul>\n<li><strong>من حسابك</strong>: الإعدادات ← الحساب ← حذف حسابي</li>\n<li><strong>عبر البريد الإلكتروني</strong>: أرسل طلباً بعنوان \"طلب حذف حساب GDPR\"</li>\n</ul>\nما يُحذف: ملفك الشخصي، سجل المكالمات، تفضيلاتك.\nما قد يُحتفظ به لأسباب قانونية: بيانات المعاملات (10 سنوات).",
      ch: "根据GDPR（被遗忘权），您随时有权删除您的SOS-Expat账户。\n<ul>\n<li><strong>通过账户</strong>：进入设置 → 账户 → 删除我的账户。删除立即生效且不可逆</li>\n<li><strong>通过邮件</strong>：如无法登录，发送「GDPR账户删除请求」至客服，注明账户邮箱</li>\n</ul>\n删除的内容：您的资料、通话记录（元数据）、偏好设置。\n因法律原因可能保留的内容：交易数据（发票、付款）保留10年；解决纠纷所需数据。"
    },
    slug: {
      fr: "supprimer-compte-sos-expat-rgpd",
      en: "delete-account-sos-expat-gdpr",
      es: "eliminar-cuenta-sos-expat-rgpd",
      de: "konto-loeschen-sos-expat-dsgvo",
      pt: "excluir-conta-sos-expat-lgpd",
      ru: "ru-udalit-akkaunt-sos-expat-gdpr",
      hi: "hi-account-delete-sos-expat-gdpr",
      ar: "ar-hathf-hisab-sos-expat-gdpr",
      ch: "ch-shanchu-zhanghao-sos-expat-gdpr"
    }
  },

  // ─────────────────────────────────────────────
  // TECHNICAL (orders 28-30)
  // ─────────────────────────────────────────────

  {
    order: 28,
    category: "technical",
    isActive: true,
    isFooter: false,
    tags: ["connection", "internet", "call", "quality", "troubleshoot"],
    question: {
      fr: "Que faire si ma connexion internet est instable pendant un appel SOS-Expat ?",
      en: "What should I do if my internet connection is unstable during a SOS-Expat call?",
      es: "¿Qué hago si mi conexión a internet es inestable durante una llamada en SOS-Expat?",
      de: "Was soll ich tun, wenn meine Internetverbindung während eines SOS-Expat-Anrufs instabil ist?",
      pt: "O que fazer se minha conexão com a internet for instável durante uma ligação no SOS-Expat?",
      ru: "Что делать, если интернет нестабилен во время звонка через SOS-Expat?",
      hi: "SOS-Expat कॉल के दौरान इंटरनेट कनेक्शन अस्थिर हो तो क्या करें?",
      ar: "ماذا أفعل إذا كان اتصالي بالإنترنت غير مستقر أثناء مكالمة SOS-Expat؟",
      ch: "SOS-Expat通话期间网络不稳定怎么办？"
    },
    answer: {
      fr: "Les appels SOS-Expat sont des appels téléphoniques classiques — pas des appels VoIP ou vidéo. Cela signifie que la qualité de votre connexion internet n'a pas d'impact direct sur la qualité audio de l'appel. Le prestataire vous appelle sur votre numéro de téléphone ordinaire.\n\nCependant, si vous rencontrez des problèmes liés à la connexion internet lors de la commande :\n<ul>\n<li><strong>Page de paiement qui ne charge pas</strong> : rechargez la page ou essayez avec une connexion plus stable (WiFi vs données mobiles)</li>\n<li><strong>Confirmation de commande non reçue</strong> : vérifiez vos spams ou utilisez un réseau différent</li>\n<li><strong>Problème lors de l'inscription</strong> : vérifiez votre connexion et videz le cache du navigateur</li>\n</ul>\nSi vous êtes dans un pays avec des restrictions réseau (Chine, Iran, etc.) et que le site est difficile à charger, vous pouvez essayer :\n<ul>\n<li>Utiliser un réseau mobile plutôt que le WiFi local</li>\n<li>Changer de navigateur web</li>\n<li>Contacter notre support pour une procédure alternative</li>\n</ul>",
      en: "SOS-Expat calls are standard phone calls — not VoIP or video calls. This means your internet connection quality does not directly affect the audio quality of the call. The provider calls you on your regular phone number.\n\nHowever, if you encounter internet-related issues during the booking:\n<ul>\n<li><strong>Payment page not loading</strong>: reload the page or try a more stable connection</li>\n<li><strong>Order confirmation not received</strong>: check your spam or use a different network</li>\n<li><strong>Issue during registration</strong>: check your connection and clear browser cache</li>\n</ul>\nIf you are in a country with network restrictions (China, Iran, etc.) and the site is hard to load, try:\n<ul>\n<li>Using mobile data instead of local WiFi</li>\n<li>Switching web browsers</li>\n<li>Contacting our support for an alternative procedure</li>\n</ul>",
      es: "Las llamadas de SOS-Expat son llamadas telefónicas estándar, no VoIP ni videollamadas. Esto significa que la calidad de tu conexión a internet no afecta directamente a la calidad del audio.\n\nSin embargo, si tienes problemas relacionados con internet al hacer el pedido:\n<ul>\n<li><strong>Página de pago que no carga</strong>: recarga o usa una conexión más estable</li>\n<li><strong>Confirmación no recibida</strong>: revisa el spam</li>\n<li><strong>Problema en el registro</strong>: comprueba tu conexión y borra la caché</li>\n</ul>\nEn países con restricciones de red, prueba con datos móviles o cambia de navegador.",
      de: "SOS-Expat-Anrufe sind normale Telefonanrufe — kein VoIP oder Videoanrufe. Ihre Internetverbindung beeinflusst die Audioqualität nicht direkt.\n\nBei internetbezogenen Problemen während der Buchung:\n<ul>\n<li><strong>Zahlungsseite lädt nicht</strong>: Seite neu laden oder stabilere Verbindung verwenden</li>\n<li><strong>Bestellbestätigung nicht erhalten</strong>: Spam-Ordner prüfen</li>\n<li><strong>Problem bei der Registrierung</strong>: Verbindung prüfen, Browser-Cache leeren</li>\n</ul>",
      pt: "As ligações do SOS-Expat são chamadas telefônicas comuns — não VoIP nem videochamadas. A qualidade da sua conexão à internet não afeta diretamente a qualidade do áudio.\n\nSe tiver problemas de internet durante o pedido:\n<ul>\n<li><strong>Página de pagamento não carrega</strong>: recarregue ou use conexão mais estável</li>\n<li><strong>Confirmação não recebida</strong>: verifique o spam</li>\n<li><strong>Problema no cadastro</strong>: verifique sua conexão e limpe o cache</li>\n</ul>",
      ru: "Звонки SOS-Expat — это обычные телефонные звонки, а не VoIP или видеозвонки. Качество вашего интернета не влияет напрямую на качество звука.\n\nЕсли возникли проблемы с интернетом во время оформления заказа:\n<ul>\n<li><strong>Страница оплаты не загружается</strong>: обновите страницу или используйте более стабильное соединение</li>\n<li><strong>Подтверждение не получено</strong>: проверьте папку спама</li>\n<li><strong>Проблема при регистрации</strong>: проверьте соединение и очистите кэш браузера</li>\n</ul>",
      hi: "SOS-Expat कॉल सामान्य टेलीफोन कॉल हैं — VoIP या वीडियो कॉल नहीं। इसका मतलब है कि आपका इंटरनेट कनेक्शन गुणवत्ता सीधे ऑडियो गुणवत्ता को प्रभावित नहीं करती।\n\nयदि बुकिंग के दौरान इंटरनेट से संबंधित समस्याएं हों:\n<ul>\n<li><strong>भुगतान पृष्ठ लोड नहीं हो रहा</strong>: पृष्ठ पुनः लोड करें या अधिक स्थिर कनेक्शन आज़माएं</li>\n<li><strong>ऑर्डर पुष्टि नहीं मिली</strong>: स्पैम जांचें</li>\n<li><strong>पंजीकरण में समस्या</strong>: कनेक्शन जांचें और ब्राउज़र कैश साफ करें</li>\n</ul>",
      ar: "مكالمات SOS-Expat هي مكالمات هاتفية عادية — وليست مكالمات VoIP أو فيديو. هذا يعني أن جودة اتصالك بالإنترنت لا تؤثر مباشرةً على جودة الصوت.\n\nإذا واجهت مشاكل تتعلق بالإنترنت أثناء الطلب:\n<ul>\n<li><strong>صفحة الدفع لا تحمَّل</strong>: أعد تحميل الصفحة أو استخدم اتصالاً أكثر استقراراً</li>\n<li><strong>لم تصل رسالة التأكيد</strong>: تحقق من مجلد الرسائل غير المرغوب</li>\n<li><strong>مشكلة أثناء التسجيل</strong>: تحقق من اتصالك وامسح ذاكرة التخزين المؤقت</li>\n</ul>",
      ch: "SOS-Expat通话是标准电话呼叫——不是VoIP或视频通话。这意味着您的网络连接质量不会直接影响通话音质。服务商直接拨打您的普通手机号码。\n\n但如果您在下单过程中遇到网络问题：\n<ul>\n<li><strong>支付页面无法加载</strong>：刷新页面或尝试更稳定的网络</li>\n<li><strong>未收到订单确认</strong>：检查垃圾邮件文件夹</li>\n<li><strong>注册时出现问题</strong>：检查网络并清除浏览器缓存</li>\n</ul>\n如果您在网络受限地区（中国、伊朗等），网站加载困难，请尝试使用手机流量代替本地WiFi，或更换浏览器。"
    },
    slug: {
      fr: "connexion-internet-instable-appel-sos-expat",
      en: "unstable-internet-connection-call-sos-expat",
      es: "conexion-internet-inestable-llamada-sos-expat",
      de: "instabile-internetverbindung-anruf-sos-expat",
      pt: "conexao-internet-instavel-ligacao-sos-expat",
      ru: "ru-nestabilny-internet-zvonok-sos-expat",
      hi: "hi-internet-unstable-call-sos-expat",
      ar: "ar-ittisal-internet-gayr-mustaqir-mukalama",
      ch: "ch-wangluo-bu-wending-tonghua-sos-expat"
    }
  },

  {
    order: 29,
    category: "technical",
    isActive: true,
    isFooter: false,
    tags: ["mobile", "smartphone", "app", "browser", "compatibility"],
    question: {
      fr: "SOS-Expat fonctionne-t-il sur smartphone sans application à télécharger ?",
      en: "Does SOS-Expat work on smartphones without downloading an app?",
      es: "¿Funciona SOS-Expat en smartphones sin descargar ninguna aplicación?",
      de: "Funktioniert SOS-Expat auf Smartphones ohne App-Download?",
      pt: "O SOS-Expat funciona em smartphones sem baixar nenhum aplicativo?",
      ru: "Работает ли SOS-Expat на смартфонах без скачивания приложения?",
      hi: "क्या SOS-Expat बिना ऐप डाउनलोड किए स्मार्टफोन पर काम करता है?",
      ar: "هل يعمل SOS-Expat على الهواتف الذكية دون تنزيل أي تطبيق؟",
      ch: "SOS-Expat无需下载应用就能在智能手机上使用吗？"
    },
    answer: {
      fr: "Oui, SOS-Expat est une application web progressive (PWA) entièrement accessible depuis le navigateur de votre smartphone, sans aucune installation requise. Il est compatible avec tous les appareils modernes.\n<ul>\n<li><strong>iPhone / iOS</strong> : fonctionne parfaitement sur Safari (iOS 14+). Vous pouvez ajouter le site à votre écran d'accueil pour une expérience proche d'une application native</li>\n<li><strong>Android</strong> : compatible avec Chrome, Firefox et Samsung Internet. La fonctionnalité \"Ajouter à l'écran d'accueil\" crée un raccourci</li>\n<li><strong>Tablette</strong> : interface optimisée pour les écrans tablette également</li>\n</ul>\nL'interface est entièrement responsive et s'adapte à la taille de votre écran. Vous pouvez :\n<ul>\n<li>Rechercher des prestataires disponibles</li>\n<li>Consulter les profils et les avis</li>\n<li>Payer par carte bancaire de manière sécurisée</li>\n<li>Recevoir l'appel directement sur votre numéro de téléphone</li>\n</ul>\nAucune permission spéciale (micro, caméra) n'est nécessaire puisque l'appel est reçu via votre réseau téléphonique habituel, pas via l'application.",
      en: "Yes, SOS-Expat is a progressive web app (PWA) fully accessible from your smartphone browser, with no installation required. It is compatible with all modern devices.\n<ul>\n<li><strong>iPhone / iOS</strong>: works perfectly on Safari (iOS 14+). You can add the site to your home screen for a native app-like experience</li>\n<li><strong>Android</strong>: compatible with Chrome, Firefox, and Samsung Internet</li>\n<li><strong>Tablet</strong>: interface optimized for tablet screens as well</li>\n</ul>\nThe interface is fully responsive and adapts to your screen size. No special permissions (microphone, camera) are needed since the call is received via your regular phone network, not the app.",
      es: "Sí, SOS-Expat es una aplicación web progresiva (PWA) accesible desde el navegador de tu smartphone, sin instalación.\n<ul>\n<li><strong>iPhone / iOS</strong>: funciona perfectamente en Safari (iOS 14+)</li>\n<li><strong>Android</strong>: compatible con Chrome, Firefox, Samsung Internet</li>\n<li><strong>Tableta</strong>: interfaz optimizada</li>\n</ul>\nLa interfaz es completamente responsive. No se necesitan permisos especiales (micrófono, cámara).",
      de: "Ja, SOS-Expat ist eine Progressive Web App (PWA), die vollständig im Browser Ihres Smartphones zugänglich ist, ohne Installation.\n<ul>\n<li><strong>iPhone / iOS</strong>: funktioniert perfekt auf Safari (iOS 14+)</li>\n<li><strong>Android</strong>: kompatibel mit Chrome, Firefox, Samsung Internet</li>\n<li><strong>Tablet</strong>: optimierte Benutzeroberfläche</li>\n</ul>\nKeine Sonderberechtigungen (Mikrofon, Kamera) erforderlich.",
      pt: "Sim, o SOS-Expat é um Progressive Web App (PWA) acessível no navegador do seu smartphone, sem instalação.\n<ul>\n<li><strong>iPhone / iOS</strong>: funciona perfeitamente no Safari (iOS 14+)</li>\n<li><strong>Android</strong>: compatível com Chrome, Firefox, Samsung Internet</li>\n<li><strong>Tablet</strong>: interface otimizada</li>\n</ul>\nNenhuma permissão especial necessária (microfone, câmera).",
      ru: "Да, SOS-Expat — это прогрессивное веб-приложение (PWA), полностью доступное из браузера смартфона без установки.\n<ul>\n<li><strong>iPhone / iOS</strong>: отлично работает в Safari (iOS 14+)</li>\n<li><strong>Android</strong>: совместим с Chrome, Firefox, Samsung Internet</li>\n<li><strong>Планшет</strong>: оптимизированный интерфейс</li>\n</ul>\nСпециальные разрешения (микрофон, камера) не нужны.",
      hi: "हाँ, SOS-Expat एक प्रोग्रेसिव वेब ऐप (PWA) है जो आपके स्मार्टफोन के ब्राउज़र से बिना इंस्टॉलेशन के उपलब्ध है।\n<ul>\n<li><strong>iPhone / iOS</strong>: Safari पर पूरी तरह काम करता है (iOS 14+)</li>\n<li><strong>Android</strong>: Chrome, Firefox, Samsung Internet के साथ संगत</li>\n<li><strong>टैबलेट</strong>: अनुकूलित इंटरफ़ेस</li>\n</ul>\nकोई विशेष अनुमति (माइक्रोफोन, कैमरा) आवश्यक नहीं।",
      ar: "نعم، SOS-Expat هو تطبيق ويب تقدمي (PWA) يمكن الوصول إليه بالكامل من متصفح هاتفك الذكي دون تثبيت.\n<ul>\n<li><strong>iPhone / iOS</strong>: يعمل بشكل مثالي على Safari (iOS 14+)</li>\n<li><strong>Android</strong>: متوافق مع Chrome وFirefox وSamsung Internet</li>\n<li><strong>الأجهزة اللوحية</strong>: واجهة محسّنة</li>\n</ul>\nلا تلزم أذونات خاصة (ميكروفون، كاميرا).",
      ch: "是的，SOS-Expat是一款渐进式网页应用（PWA），完全可以通过智能手机浏览器访问，无需安装。\n<ul>\n<li><strong>iPhone / iOS</strong>：在Safari上运行完美（iOS 14+），可添加到主屏幕</li>\n<li><strong>Android</strong>：兼容Chrome、Firefox和三星浏览器</li>\n<li><strong>平板电脑</strong>：界面也针对平板进行了优化</li>\n</ul>\n无需特殊权限（麦克风、摄像头），因为电话是通过您的普通电话网络接听的，而非通过应用。"
    },
    slug: {
      fr: "smartphone-sans-application-sos-expat-mobile",
      en: "smartphone-no-app-download-sos-expat-mobile",
      es: "smartphone-sin-aplicacion-sos-expat-movil",
      de: "smartphone-ohne-app-sos-expat-mobil",
      pt: "smartphone-sem-aplicativo-sos-expat-mobile",
      ru: "ru-smartfon-bez-prilozhenia-sos-expat",
      hi: "hi-smartphone-bina-app-sos-expat",
      ar: "ar-hatif-thaki-bila-tatbiq-sos-expat",
      ch: "ch-shouji-wu-xia-zai-sos-expat"
    }
  },

  {
    order: 30,
    category: "technical",
    isActive: true,
    isFooter: false,
    tags: ["privacy", "security", "confidential", "encrypted", "call"],
    question: {
      fr: "Les appels passés via SOS-Expat sont-ils confidentiels et sécurisés ?",
      en: "Are calls made through SOS-Expat confidential and secure?",
      es: "¿Las llamadas realizadas a través de SOS-Expat son confidenciales y seguras?",
      de: "Sind über SOS-Expat geführte Gespräche vertraulich und sicher?",
      pt: "As ligações feitas pelo SOS-Expat são confidenciais e seguras?",
      ru: "Конфиденциальны и безопасны ли звонки через SOS-Expat?",
      hi: "SOS-Expat के माध्यम से की गई कॉल गोपनीय और सुरक्षित हैं?",
      ar: "هل المكالمات المجراة عبر SOS-Expat سرية وآمنة؟",
      ch: "通过SOS-Expat进行的通话是否保密且安全？"
    },
    answer: {
      fr: "Oui, les appels via SOS-Expat sont strictement confidentiels. La confidentialité de vos échanges est une priorité absolue, notamment pour les sujets sensibles traités (droit, santé, immigration).\n<ul>\n<li><strong>Aucun enregistrement</strong> : les conversations téléphoniques ne sont jamais enregistrées ni stockées sur les serveurs de SOS-Expat</li>\n<li><strong>Numéro masqué</strong> : votre numéro de téléphone n'est pas communiqué directement au prestataire — il transite via le système téléphonique sécurisé Twilio</li>\n<li><strong>Secret professionnel</strong> : les avocats sont soumis au secret professionnel légal. Vos informations ne peuvent pas être divulguées à des tiers</li>\n<li><strong>Connexion HTTPS</strong> : toutes les communications entre votre navigateur et nos serveurs sont chiffrées (TLS/SSL)</li>\n<li><strong>Paiements sécurisés</strong> : traitement via Stripe, certifié PCI-DSS niveau 1</li>\n<li><strong>Données minimales</strong> : seules les informations strictement nécessaires sont collectées et stockées</li>\n</ul>\nSOS-Expat ne partage aucune information sur votre appel avec des tiers, des annonceurs ou des partenaires commerciaux.",
      en: "Yes, calls through SOS-Expat are strictly confidential. The confidentiality of your exchanges is an absolute priority, especially given the sensitive subjects covered (law, health, immigration).\n<ul>\n<li><strong>No recording</strong>: phone conversations are never recorded or stored on SOS-Expat servers</li>\n<li><strong>Masked number</strong>: your phone number is not shared directly with the provider — it goes through Twilio's secure phone system</li>\n<li><strong>Professional secrecy</strong>: lawyers are bound by legal professional secrecy</li>\n<li><strong>HTTPS connection</strong>: all communications between your browser and our servers are encrypted (TLS/SSL)</li>\n<li><strong>Secure payments</strong>: processed via Stripe, PCI-DSS Level 1 certified</li>\n<li><strong>Minimal data</strong>: only strictly necessary information is collected</li>\n</ul>\nSOS-Expat shares no information about your call with third parties, advertisers, or commercial partners.",
      es: "Sí, las llamadas a través de SOS-Expat son estrictamente confidenciales.\n<ul>\n<li><strong>Sin grabación</strong>: las conversaciones nunca se graban ni almacenan</li>\n<li><strong>Número enmascarado</strong>: tu número no se comparte directamente con el proveedor</li>\n<li><strong>Secreto profesional</strong>: los abogados están sujetos al secreto profesional legal</li>\n<li><strong>Conexión HTTPS</strong>: comunicaciones cifradas (TLS/SSL)</li>\n<li><strong>Pagos seguros</strong>: Stripe PCI-DSS nivel 1</li>\n</ul>",
      de: "Ja, Anrufe über SOS-Expat sind streng vertraulich.\n<ul>\n<li><strong>Keine Aufzeichnung</strong>: Gespräche werden nie aufgezeichnet</li>\n<li><strong>Nummerverdeckung</strong>: Ihre Nummer wird nicht direkt an den Anbieter weitergegeben</li>\n<li><strong>Berufsgeheimnis</strong>: Anwälte unterliegen der gesetzlichen Verschwiegenheitspflicht</li>\n<li><strong>HTTPS-Verbindung</strong>: verschlüsselte Kommunikation</li>\n<li><strong>Sichere Zahlungen</strong>: Stripe PCI-DSS Stufe 1</li>\n</ul>",
      pt: "Sim, as ligações pelo SOS-Expat são estritamente confidenciais.\n<ul>\n<li><strong>Sem gravação</strong>: conversas nunca são gravadas ou armazenadas</li>\n<li><strong>Número mascarado</strong>: seu número não é compartilhado diretamente</li>\n<li><strong>Sigilo profissional</strong>: advogados têm sigilo legal</li>\n<li><strong>Conexão HTTPS</strong>: comunicação criptografada</li>\n<li><strong>Pagamentos seguros</strong>: Stripe PCI-DSS nível 1</li>\n</ul>",
      ru: "Да, звонки через SOS-Expat строго конфиденциальны.\n<ul>\n<li><strong>Нет записи</strong>: разговоры никогда не записываются и не хранятся</li>\n<li><strong>Скрытый номер</strong>: ваш номер не передаётся специалисту напрямую</li>\n<li><strong>Профессиональная тайна</strong>: юристы связаны законодательной тайной</li>\n<li><strong>HTTPS-соединение</strong>: зашифрованная связь</li>\n<li><strong>Безопасные платежи</strong>: Stripe PCI-DSS уровень 1</li>\n</ul>",
      hi: "हाँ, SOS-Expat के माध्यम से कॉल सख्त रूप से गोपनीय हैं।\n<ul>\n<li><strong>कोई रिकॉर्डिंग नहीं</strong>: बातचीत कभी रिकॉर्ड या संग्रहीत नहीं होती</li>\n<li><strong>नंबर छुपाया गया</strong>: आपका नंबर सीधे प्रदाता को नहीं बताया जाता</li>\n<li><strong>पेशेवर गोपनीयता</strong>: वकील कानूनी रहस्य से बंधे हैं</li>\n<li><strong>HTTPS कनेक्शन</strong>: एन्क्रिप्टेड संचार</li>\n<li><strong>सुरक्षित भुगतान</strong>: Stripe PCI-DSS स्तर 1</li>\n</ul>",
      ar: "نعم، المكالمات عبر SOS-Expat سرية تماماً.\n<ul>\n<li><strong>بدون تسجيل</strong>: المحادثات لا تُسجل أو تُخزن أبداً</li>\n<li><strong>رقم مخفي</strong>: رقمك لا يُشارك مباشرةً مع المقدم</li>\n<li><strong>السرية المهنية</strong>: المحامون ملزمون بالسرية القانونية</li>\n<li><strong>اتصال HTTPS</strong>: اتصالات مشفرة</li>\n<li><strong>مدفوعات آمنة</strong>: Stripe PCI-DSS مستوى 1</li>\n</ul>",
      ch: "是的，通过SOS-Expat进行的通话严格保密。\n<ul>\n<li><strong>不录音</strong>：电话对话从不被录制或存储在SOS-Expat服务器上</li>\n<li><strong>号码隐藏</strong>：您的电话号码不会直接透露给服务商——通过Twilio安全电话系统中转</li>\n<li><strong>职业保密</strong>：律师受法律职业保密约束，信息不得泄露</li>\n<li><strong>HTTPS连接</strong>：浏览器与服务器间的所有通信均加密（TLS/SSL）</li>\n<li><strong>安全支付</strong>：通过Stripe处理（PCI-DSS一级认证）</li>\n<li><strong>最少数据</strong>：仅收集绝对必要的信息</li>\n</ul>\nSOS-Expat不会将您的通话信息分享给任何第三方、广告商或商业合作伙伴。"
    },
    slug: {
      fr: "confidentialite-securite-appels-sos-expat",
      en: "confidentiality-security-calls-sos-expat",
      es: "confidencialidad-seguridad-llamadas-sos-expat",
      de: "vertraulichkeit-sicherheit-anrufe-sos-expat",
      pt: "confidencialidade-seguranca-ligacoes-sos-expat",
      ru: "ru-konfidentsialnost-bezopasnost-zvonki-sos-expat",
      hi: "hi-gopaniyata-suraksha-call-sos-expat",
      ar: "ar-siriya-aman-mukalama-sos-expat",
      ch: "ch-baomi-anquan-tonghua-sos-expat"
    }
  }

];

// ─────────────────────────────────────────────
// Insertion Firestore (ADC Firebase CLI)
// ─────────────────────────────────────────────

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  (process.env.APPDATA || require("os").homedir() + "/AppData/Roaming") +
  "/firebase/williamsjullin_gmail_com_application_default_credentials.json";

const admin = require("./sos/firebase/functions/node_modules/firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sos-urgently-ac307",
});

const db = admin.firestore();

async function insertFaqs() {
  console.log(`\nInsertion de ${faqs.length} FAQ dans app_faq...`);
  const batch = db.batch();
  faqs.forEach((faq) => {
    const ref = db.collection("app_faq").doc();
    batch.set(ref, faq);
  });
  await batch.commit();
  console.log(`✅ ${faqs.length} FAQ insérées avec succès dans app_faq (orders 11-30)`);
  process.exit(0);
}

insertFaqs().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
