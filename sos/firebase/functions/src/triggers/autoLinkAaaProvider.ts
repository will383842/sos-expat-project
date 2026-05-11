/**
 * Auto-link AAA providers to multi-region accounts on creation.
 *
 * Context: Dashboard-multiprestataire (multi.sos-expat.com) lists booking_requests
 * filtered by `providerId IN user.linkedProviderIds`. AAA providers are seeded
 * test profiles owned by the admin team and viewed via 5 "multi" accounts:
 *
 *   - williamsjullin@gmail.com           (admin, global view)
 *   - aaa-multicompte-afrique@sos-expat.com   (Afrique & Moyen-Orient)
 *   - aaa-multicompte-ameriques@sos-expat.com
 *   - aaa-multicompte-asie-oceanie@sos-expat.com
 *   - aaa-multicompte-europe@sos-expat.com
 *
 * Until now, attaching a new AAA provider to these accounts was a manual step
 * via /admin/ia (IaMultiProvidersTab). When forgotten, the provider's bookings
 * never appear in /requests — see Kien Bach VN audit (2026-05-11).
 *
 * This handler runs on every users/{uid} create. It is a no-op for non-AAA docs.
 * Wired from consolidatedOnUserCreated (same region/runtime — no new function).
 */
import type { FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

const ADMIN_EMAIL = "williamsjullin@gmail.com";

const REGION_EMAILS: Record<string, string> = {
  afrique: "aaa-multicompte-afrique@sos-expat.com",
  ameriques: "aaa-multicompte-ameriques@sos-expat.com",
  asie: "aaa-multicompte-asie-oceanie@sos-expat.com",
  europe: "aaa-multicompte-europe@sos-expat.com",
};

// ISO-3166 alpha-2 -> region key. "afrique" includes Middle-East per existing
// account naming ("Afrique & Moyen-Orient"). Unknown codes fall back to admin only.
const COUNTRY_TO_REGION: Record<string, keyof typeof REGION_EMAILS> = {
  // Afrique
  DZ: "afrique", AO: "afrique", BJ: "afrique", BW: "afrique", BF: "afrique", BI: "afrique",
  CM: "afrique", CV: "afrique", CF: "afrique", TD: "afrique", KM: "afrique", CG: "afrique",
  CD: "afrique", CI: "afrique", DJ: "afrique", EG: "afrique", GQ: "afrique", ER: "afrique",
  SZ: "afrique", ET: "afrique", GA: "afrique", GM: "afrique", GH: "afrique", GN: "afrique",
  GW: "afrique", KE: "afrique", LS: "afrique", LR: "afrique", LY: "afrique", MG: "afrique",
  MW: "afrique", ML: "afrique", MR: "afrique", MU: "afrique", MA: "afrique", MZ: "afrique",
  NA: "afrique", NE: "afrique", NG: "afrique", RW: "afrique", ST: "afrique", SN: "afrique",
  SC: "afrique", SL: "afrique", SO: "afrique", ZA: "afrique", SS: "afrique", SD: "afrique",
  TZ: "afrique", TG: "afrique", TN: "afrique", UG: "afrique", ZM: "afrique", ZW: "afrique",
  // Moyen-Orient (regrouped under "Afrique & Moyen-Orient")
  BH: "afrique", IL: "afrique", IQ: "afrique", JO: "afrique", KW: "afrique", LB: "afrique",
  OM: "afrique", PS: "afrique", QA: "afrique", SA: "afrique", SY: "afrique", AE: "afrique",
  YE: "afrique",
  // Ameriques
  AR: "ameriques", BS: "ameriques", BZ: "ameriques", BO: "ameriques", BR: "ameriques",
  CA: "ameriques", CL: "ameriques", CO: "ameriques", CR: "ameriques", CU: "ameriques",
  DM: "ameriques", DO: "ameriques", EC: "ameriques", SV: "ameriques", GT: "ameriques",
  GY: "ameriques", HT: "ameriques", HN: "ameriques", JM: "ameriques", MX: "ameriques",
  NI: "ameriques", PA: "ameriques", PY: "ameriques", PE: "ameriques", PR: "ameriques",
  SR: "ameriques", TT: "ameriques", US: "ameriques", UY: "ameriques", VE: "ameriques",
  GF: "ameriques",
  // Asie & Oceanie
  AF: "asie", AM: "asie", AZ: "asie", BD: "asie", BT: "asie", BN: "asie", KH: "asie",
  CN: "asie", GE: "asie", HK: "asie", IN: "asie", ID: "asie", IR: "asie", JP: "asie",
  KZ: "asie", KP: "asie", KR: "asie", KG: "asie", LA: "asie", MO: "asie", MY: "asie",
  MV: "asie", MN: "asie", MM: "asie", NP: "asie", PK: "asie", PH: "asie", SG: "asie",
  LK: "asie", TW: "asie", TJ: "asie", TH: "asie", TL: "asie", TM: "asie", UZ: "asie",
  VN: "asie", TR: "asie",
  AU: "asie", NZ: "asie", FJ: "asie", PG: "asie", SB: "asie", VU: "asie", WS: "asie",
  TO: "asie", KI: "asie", FM: "asie", MH: "asie", NR: "asie", PW: "asie", TV: "asie",
  PF: "asie", NC: "asie",
  // Europe
  AL: "europe", AD: "europe", AT: "europe", BY: "europe", BE: "europe", BA: "europe",
  BG: "europe", HR: "europe", CY: "europe", CZ: "europe", DK: "europe", EE: "europe",
  FI: "europe", FR: "europe", DE: "europe", GR: "europe", HU: "europe", IS: "europe",
  IE: "europe", IT: "europe", LV: "europe", LI: "europe", LT: "europe", LU: "europe",
  MT: "europe", MD: "europe", MC: "europe", ME: "europe", NL: "europe", MK: "europe",
  NO: "europe", PL: "europe", PT: "europe", RO: "europe", RU: "europe", SM: "europe",
  RS: "europe", SK: "europe", SI: "europe", ES: "europe", SE: "europe", CH: "europe",
  UA: "europe", GB: "europe", VA: "europe",
};

function isAaaProviderUid(uid: string): boolean {
  return uid.startsWith("aaa_lawyer_") || uid.startsWith("aaa_expat_");
}

async function findUidByEmail(db: admin.firestore.Firestore, email: string): Promise<string | null> {
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

async function linkAccountToProvider(
  db: admin.firestore.Firestore,
  accountUid: string,
  providerId: string,
): Promise<{ linked: boolean; newLinkedIds: string[]; shareBusy: boolean }> {
  const ref = db.collection("users").doc(accountUid);
  const snap = await ref.get();
  if (!snap.exists) return { linked: false, newLinkedIds: [], shareBusy: false };

  const data = snap.data() || {};
  const existing: string[] = data.linkedProviderIds || [];
  const shareBusy: boolean = data.shareBusyStatus === true;
  if (existing.includes(providerId)) {
    return { linked: false, newLinkedIds: existing, shareBusy };
  }

  const update: Record<string, unknown> = {
    linkedProviderIds: admin.firestore.FieldValue.arrayUnion(providerId),
    isMultiProvider: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (existing.length === 0 && !data.activeProviderId) update.activeProviderId = providerId;
  await ref.update(update);

  return { linked: true, newLinkedIds: [...existing, providerId], shareBusy };
}

async function denormalizeOnProvider(
  db: admin.firestore.Firestore,
  providerId: string,
  linkedProviderIds: string[],
  shareBusyStatus: boolean,
): Promise<void> {
  const data = {
    linkedProviderIds,
    shareBusyStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await Promise.all([
    db.collection("users").doc(providerId).update(data).catch(() => undefined),
    db.collection("sos_profiles").doc(providerId).update(data).catch(() => undefined),
  ]);
}

export async function handleAutoLinkAaaProvider(
  event: FirestoreEvent<QueryDocumentSnapshot | undefined, { userId: string }>,
): Promise<void> {
  const uid = event.params.userId;
  if (!isAaaProviderUid(uid)) return;

  const userData = event.data?.data();
  if (!userData) return;
  const role = userData.role;
  if (role !== "lawyer" && role !== "expat") return;

  const db = admin.firestore();
  const country: string | undefined = userData.country;
  const regionKey = country ? COUNTRY_TO_REGION[country.toUpperCase()] : undefined;

  const targets: Array<{ label: string; email: string }> = [
    { label: "admin", email: ADMIN_EMAIL },
  ];
  if (regionKey && REGION_EMAILS[regionKey]) {
    targets.push({ label: `region:${regionKey}`, email: REGION_EMAILS[regionKey] });
  } else {
    logger.warn(`[autoLinkAaaProvider] No region mapping for country=${country} (uid=${uid}); linking to admin only`);
  }

  for (const target of targets) {
    const accountUid = await findUidByEmail(db, target.email);
    if (!accountUid) {
      logger.warn(`[autoLinkAaaProvider] Account ${target.email} not found, skipping`);
      continue;
    }
    const result = await linkAccountToProvider(db, accountUid, uid);
    if (result.linked) {
      await denormalizeOnProvider(db, uid, result.newLinkedIds, result.shareBusy);
      logger.info(`[autoLinkAaaProvider] ${uid} -> ${target.label} (${target.email}) LINKED`);
    } else {
      logger.info(`[autoLinkAaaProvider] ${uid} -> ${target.label} skip (already linked or missing)`);
    }
  }
}
