# Intégration Backlink Engine pour envois presse

Selon la mémoire projet (`project_backlink_engine`), tu as déjà une
plateforme **Fastify + Prisma + BullMQ** avec **9 workers** pour le
netlinking. Cette infrastructure est parfaite pour les envois presse —
pas besoin d'outil externe payant (Lemlist, Mailmeteor, etc.).

## Avantages vs outil externe

| Critère | Backlink Engine | Lemlist |
|---|---|---|
| Coût mensuel | 0 € (infra existante) | 59 €/mois |
| Deliverability | ✅ Infra warmup `presse@*` déjà OK | ⚠️ à configurer SPF/DKIM/DMARC |
| 9 langues natives | ✅ avec templates ci-fournis | ⚠️ à paramétrer 1 par 1 |
| Tracking ouverture / réponse | À ajouter (hook webhook Mailflow) | ✅ natif |
| Scaling 130 emails | ✅ 9 workers parallèles | Limite souvent 100/j |
| Relances programmées | ✅ BullMQ delayed jobs | ✅ natif |
| Ownership des données | ✅ Prisma VPS | ❌ SaaS externe |

## Architecture proposée

```
┌─────────────────────────────────────────────────────┐
│  1. Seed DB avec 130 médias                         │
│     prisma/seed-press-contacts.ts                   │
│                                                     │
│  PressContact {                                     │
│    id, name, first_name, last_name,                 │
│    email, media_name, lang, angle,                  │
│    sent_at, responded_at, article_url               │
│  }                                                  │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  2. Queue "press-outreach" BullMQ                   │
│                                                     │
│  POST /api/press/outreach                           │
│     body: { batch: "fr-main" | "en-tech" | ... }    │
│     → enqueue N jobs pour les contacts de ce batch  │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  3. Worker press-outreach.worker.ts                 │
│                                                     │
│  For each job:                                      │
│    - Pick pitch template from templates/            │
│      (pitch.fr.md, pitch.en.md, ... 9 fichiers)     │
│    - Remplace [Prénom], [sujet récent], [angle]     │
│    - Attache PDF du bon communiqué (sos-expat.com/  │
│      fr-fr/presse/communique-X-fr.pdf)              │
│    - Send via Postal / Mailflow presse@* inbox      │
│    - Update PressContact.sent_at                    │
│    - Schedule follow-up job at J+5 & J+10           │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  4. Webhook Mailflow → Backlink Engine              │
│                                                     │
│  Mailflow detects reply in presse@*                 │
│  → POST /api/press/reply-received                   │
│     body: { email, from, subject, body }            │
│  → Update PressContact.responded_at                 │
│  → Send Telegram notification via existing bot      │
│    (@sosexpat_admin_bot → chat 7560535072)          │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  5. Article tracking (manuel + auto via Google      │
│     Alerts → Telegram)                              │
│                                                     │
│  Si tu identifies un article publié (Google Alert   │
│  ou manuel), ajoute via:                            │
│     PATCH /api/press/contact/:id                    │
│     body: { article_url, published_at }             │
│                                                     │
│  → Compte automatique pour stats Wikidata (need 3+) │
└─────────────────────────────────────────────────────┘
```

## Structure DB (Prisma schema à ajouter)

```prisma
// prisma/schema.prisma

model PressContact {
  id              String    @id @default(cuid())

  // Identity
  first_name      String?
  last_name       String?
  email           String    @unique
  media_name      String
  media_url       String?
  media_dr        Int?      // Domain Rating Ahrefs/Semrush

  // Segmentation
  lang            String    // fr, en, es, de, pt, ru, zh, hi, ar, et
  angle           String    // launch, ymyl, expat, estonia, human_interest
  market          String?   // asia, latam, europe, africa, mena

  // Tracking envoi
  sent_at         DateTime?
  reply_1_sent_at DateTime?  // Relance J+5
  reply_2_sent_at DateTime?  // Relance J+10

  // Tracking réponses / articles
  responded_at    DateTime?
  article_url     String?
  published_at    DateTime?

  // Meta
  campaign_id     String?
  notes           String?   @db.Text
  status          PressContactStatus @default(PENDING)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([lang, status])
  @@index([sent_at])
}

enum PressContactStatus {
  PENDING          // Pas encore envoyé
  SENT             // Email 1 envoyé
  FOLLOW_UP_1      // Relance J+5 envoyée
  FOLLOW_UP_2      // Relance J+10 envoyée
  RESPONDED        // A répondu
  PUBLISHED        // Article publié
  BOUNCED          // Email invalide
  UNSUBSCRIBED     // Désabonnement
}
```

## Seed file

```typescript
// prisma/seed-press-contacts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const contacts = [
  // 🇫🇷 30 médias FR
  {
    first_name: null,  // à remplir manuellement si connu
    last_name: null,
    email: 'redaction@lepetitjournal.com',
    media_name: 'Lepetitjournal.com',
    media_url: 'https://lepetitjournal.com',
    media_dr: 65,
    lang: 'fr',
    angle: 'expat',
    market: 'europe',
  },
  // ... 130 contacts au total
  // Voir strategie-et-medias.md pour la liste complète
];

async function main() {
  for (const contact of contacts) {
    await prisma.pressContact.upsert({
      where: { email: contact.email },
      update: {},
      create: contact,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Worker (template)

```typescript
// src/workers/press-outreach.worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sendEmail } from '../services/mailflow';

const prisma = new PrismaClient();

interface OutreachJobData {
  contactId: string;
  template: 'initial' | 'follow_up_1' | 'follow_up_2';
}

new Worker<OutreachJobData>('press-outreach', async (job: Job) => {
  const { contactId, template } = job.data;

  const contact = await prisma.pressContact.findUniqueOrThrow({
    where: { id: contactId },
  });

  // Load pitch template for the right language
  const pitchPath = path.join(
    process.cwd(),
    'brand-entity-kit/presse/pitch-emails-9-langues.md'
  );
  const allPitches = await fs.readFile(pitchPath, 'utf8');
  const langPitch = extractPitchForLang(allPitches, contact.lang); // parse markdown

  // Personalize
  const body = langPitch
    .replace('[Prénom Journaliste]', contact.first_name || '')
    .replace('[sujet récent]', await getRecentTopic(contact.media_url))
    .replace('[date]', '2026')
    .replace('[fondateur]', 'Will'); // À remplir

  // Subject line per angle
  const subject = `${contact.angle.toUpperCase()} — SOS-Expat : 5 min pour parler à un avocat`;

  // Attach PDF press release in the right language
  const pdfUrl = `https://sos-expat.com/${contact.lang}-xx/presse/communique-main-${contact.lang}.pdf`;

  // Send via Mailflow presse@* inbox (rotation for deliverability)
  const fromInbox = pickPresseInbox(job.id); // rotation 1..5
  await sendEmail({
    from: fromInbox,
    to: contact.email,
    subject,
    body,
    attachments: [{ filename: `SOS-Expat-press.pdf`, url: pdfUrl }],
  });

  // Update DB
  await prisma.pressContact.update({
    where: { id: contactId },
    data: {
      [template === 'initial' ? 'sent_at' : `reply_${template.split('_')[2]}_sent_at`]: new Date(),
      status: template === 'initial' ? 'SENT' : `FOLLOW_UP_${template.split('_')[2].toUpperCase()}`,
    },
  });

  // Schedule follow-ups if initial
  if (template === 'initial') {
    await job.queue.add('press-outreach', {
      contactId, template: 'follow_up_1',
    }, { delay: 5 * 24 * 60 * 60 * 1000 }); // 5 jours

    await job.queue.add('press-outreach', {
      contactId, template: 'follow_up_2',
    }, { delay: 10 * 24 * 60 * 60 * 1000 }); // 10 jours
  }

  // Check if responded — if yes, cancel follow-ups (webhook Mailflow handles)
}, {
  concurrency: 3, // Rythme doux pour ne pas déclencher spam
  connection: redisConnection,
});
```

## Webhook reply handler

```typescript
// src/routes/press.ts
fastify.post('/api/press/reply-received', async (request, reply) => {
  const { from_email, subject, body } = request.body;

  const contact = await prisma.pressContact.findFirst({
    where: { email: from_email },
  });
  if (!contact) return reply.code(404).send({ error: 'Contact not found' });

  await prisma.pressContact.update({
    where: { id: contact.id },
    data: {
      responded_at: new Date(),
      status: 'RESPONDED',
      notes: `[AUTO] Replied: ${subject}`,
    },
  });

  // Cancel pending follow-ups
  const queue = new Queue('press-outreach');
  const jobs = await queue.getJobs(['delayed']);
  for (const job of jobs) {
    if (job.data.contactId === contact.id) await job.remove();
  }

  // Telegram notification via existing bot (@sosexpat_admin_bot)
  await sendTelegramMessage({
    chatId: '7560535072',
    text: `📰 *Nouvelle réponse presse*\n\n` +
          `*${contact.media_name}* (${contact.lang.toUpperCase()})\n` +
          `De : ${from_email}\n` +
          `Sujet : ${subject}\n\n` +
          `Voir : https://your-admin-url/press/${contact.id}`,
  });

  return reply.send({ ok: true });
});
```

## Configuration Mailflow webhook

Sur ton VPS Hetzner qui héberge le Mailflow (mémoire `project_mailflow_warmup`) :

```bash
# /opt/mail-forwarder/config.yaml
inboxes:
  - presse-fr@sos-expat.com
  - presse-en@sos-expat.com
  - presse-es@sos-expat.com
  - presse-de@sos-expat.com
  - presse-@sos-expat.com  # catchall

forward_rules:
  - when: reply_detected
    to_webhook: https://backlink.sos-expat.com/api/press/reply-received
    include: [from_email, subject, body_text]
  - when: reply_detected  # Telegram aussi
    to_telegram:
      bot: '@sosexpat_admin_bot'
      chat_id: 7560535072
      template: "📰 Réponse presse reçue — {from_email} : {subject}"
```

## Dashboard admin (ajout recommandé Backlink Engine UI)

Route `/admin/press-outreach` avec :

| Vue | Info |
|-----|------|
| Pipeline Kanban | PENDING (130) → SENT (X) → RESPONDED (Y) → PUBLISHED (Z) |
| Tableau détaillé | Tous les contacts avec filtres lang/angle/status |
| Graphique ouverture | % par langue (nécessite pixel de tracking dans email) |
| Liste articles publiés | Pour extraire URLs vers Wikidata |
| Export CSV | Pour rapport mensuel brand entity |

## Estimation charge

**Budget infra** : déjà payé (VPS Hetzner)
**Développement backend** : 1-2 jours (schema Prisma + worker + webhook)
**Développement UI admin** : 1 jour (si Backlink Engine a déjà une admin UI, ajouter une route suffit)
**Seed des 130 contacts** : 1-2h (copier-coller depuis `strategie-et-medias.md`)

**Total** : 2-3 jours dev pour être autonome sur les envois presse, réutilisable pour toutes les campagnes presse futures.

## Alternative rapide (si pas le temps de dev)

Si tu ne veux pas développer ça tout de suite :
- **Mailmeteor gratuit** (< 75 emails/j) : envoie 75 emails aujourd'hui, 55 demain → 130 en 2 jours
- **Export CSV** des contacts depuis `strategie-et-medias.md`
- **Google Sheets + Mailmeteor extension** : 30 min setup
- Trade-off : pas d'auto-relance, pas de tracking Telegram, mais ça marche pour 1 campagne
