/**
 * TwilioCallManager B2B Alert Tests — AUDIT FIX 2026-05-03 (P0-E)
 *
 * Tests pour l'alerte admin_alerts créée quand un appel B2B SOS-Call
 * échoue par provider_no_answer. Sans cette alerte, l'incident est
 * invisible côté ops (le client B2B n'a pas de page de paiement où
 * voir l'échec, sa session SOS-Call est consommée).
 */

// ============================================================================
// Mock Setup — must be before imports
// ============================================================================

const mockTransactionGet = jest.fn();
const mockTransactionUpdate = jest.fn();
const mockRunTransaction = jest.fn();
const mockDocGet = jest.fn();
const mockDocUpdate = jest.fn();
const mockDocSet = jest.fn();
const mockCollectionAdd = jest.fn().mockResolvedValue({ id: 'mock-doc-id' });
const mockWhere = jest.fn();

// Track which collection.add was called on
const collectionAddCalls: Array<{ collectionName: string; data: Record<string, unknown> }> = [];

const mockDoc = jest.fn(() => ({
  get: mockDocGet,
  update: mockDocUpdate,
  set: mockDocSet,
}));

const mockCollection = jest.fn((name: string) => ({
  doc: mockDoc,
  add: jest.fn((data: Record<string, unknown>) => {
    collectionAddCalls.push({ collectionName: name, data });
    return Promise.resolve({ id: 'mock-doc-id' });
  }),
  where: mockWhere,
}));

jest.mock('firebase-admin', () => ({
  firestore: Object.assign(
    jest.fn(() => ({
      collection: mockCollection,
      doc: mockDoc,
      runTransaction: mockRunTransaction,
    })),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'mock-timestamp'),
        increment: jest.fn((n: number) => n),
        delete: jest.fn(() => 'mock-delete-sentinel'),
      },
      Timestamp: {
        now: jest.fn(() => ({ toDate: () => new Date(), toMillis: () => Date.now() })),
        fromDate: jest.fn((d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() })),
        fromMillis: jest.fn((ms: number) => ({ toDate: () => new Date(ms), toMillis: () => ms })),
      },
    }
  ),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-functions/v2', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../lib/twilio', () => ({
  getTwilioClient: jest.fn(() => ({
    calls: jest.fn(() => ({ update: jest.fn().mockResolvedValue({}) })),
  })),
  getTwilioPhoneNumber: jest.fn(() => '+1234567890'),
  isCircuitOpen: jest.fn(() => false),
  recordTwilioSuccess: jest.fn(),
  recordTwilioFailure: jest.fn(),
}));

jest.mock('../utils/urlBase', () => ({
  getTwilioCallWebhookUrl: jest.fn(() => 'https://mock.url/webhook'),
  getTwilioAmdTwimlUrl: jest.fn(() => 'https://mock.url/amd'),
  getProviderNoAnswerTwiMLUrl: jest.fn(() => 'https://mock.url/no-answer'),
}));

jest.mock('../utils/logs/logError', () => ({ logError: jest.fn() }));
jest.mock('../utils/logs/logCallRecord', () => ({ logCallRecord: jest.fn() }));

jest.mock('../StripeManager', () => ({
  stripeManager: {
    capturePayment: jest.fn(),
    cancelPayment: jest.fn(),
    refundPayment: jest.fn(),
  },
}));

jest.mock('../lib/tasks', () => ({
  scheduleProviderAvailableTask: jest.fn().mockResolvedValue('mock-task-id'),
}));

jest.mock('../callables/providerStatusManager', () => ({
  setProviderAvailable: jest.fn(),
}));

jest.mock('../utils/encryption', () => ({
  encryptPhoneNumber: jest.fn((p: string) => `encrypted_${p}`),
  decryptPhoneNumber: jest.fn((p: string) => p.replace('encrypted_', '')),
}));

jest.mock('../notificationPipeline/i18n', () => ({ resolveLang: jest.fn(() => 'fr') }));
jest.mock('../utils/paymentSync', () => ({ syncPaymentStatus: jest.fn() }));
jest.mock('../utils/productionLogger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../config/sentry', () => ({ captureError: jest.fn() }));

jest.mock('../chatter/services/chatterCommissionService', () => ({
  cancelCommissionsForCallSession: jest.fn(),
}));
jest.mock('../influencer/services/influencerCommissionService', () => ({
  cancelCommissionsForCallSession: jest.fn(),
}));
jest.mock('../blogger/services/bloggerCommissionService', () => ({
  cancelBloggerCommissionsForCallSession: jest.fn(),
}));
jest.mock('../groupAdmin/services/groupAdminCommissionService', () => ({
  cancelCommissionsForCallSession: jest.fn(),
}));
jest.mock('../affiliate/services/commissionService', () => ({
  cancelCommissionsForCallSession: jest.fn(),
}));
jest.mock('../unified/handlers/handleCallRefunded', () => ({
  cancelUnifiedCommissionsForCallSession: jest.fn(),
}));

jest.mock('../content/voicePrompts.json', () => ({
  provider_intro: { fr: 'Bonjour' },
  client_intro: { fr: 'Bonjour' },
}), { virtual: true });

jest.mock('../utils/types', () => ({}), { virtual: true });

// ============================================================================
// Import after mocks
// ============================================================================

import { TwilioCallManager, CallSessionState } from '../TwilioCallManager';
import * as admin from 'firebase-admin';

// ============================================================================
// Helpers
// ============================================================================

function makeTimestamp(date: Date = new Date()): admin.firestore.Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    isEqual: () => false,
    valueOf: () => '',
  } as unknown as admin.firestore.Timestamp;
}

function buildB2BSession(overrides: Partial<CallSessionState> = {}): CallSessionState {
  const now = new Date();
  return {
    id: 'b2b_session_1',
    clientId: 'b2b_client_1',
    providerId: 'provider_b2b_1',
    status: 'active',
    participants: {
      provider: { phone: '+33600000001', status: 'pending', attemptCount: 0 },
      client: { phone: '+33600000002', status: 'pending', attemptCount: 0 },
    },
    conference: { name: 'b2b_conf' },
    payment: {
      intentId: '',
      status: 'authorized',
      amount: 0,
    },
    metadata: {
      providerId: 'provider_b2b_1',
      clientId: 'b2b_client_1',
      serviceType: 'expat_call',
      providerType: 'expat',
      maxDuration: 1920,
      createdAt: makeTimestamp(now),
      updatedAt: makeTimestamp(now),
      isSosCallFree: true,
      sosCallSessionToken: 'sos_token_abc123',
      partnerSubscriberId: 42,
    } as any,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('TwilioCallManager — B2B no_answer admin_alerts (P0-E 2026-05-03)', () => {
  let manager: TwilioCallManager;

  beforeEach(() => {
    jest.clearAllMocks();
    collectionAddCalls.length = 0;
    manager = new TwilioCallManager();

    // Stub getCallSession on the instance — handleCallFailure reads session via this.getCallSession()
    (manager as any).getCallSession = jest.fn();

    // Default: provider doc lookup returns isAAA=false (so we enter the offline-set path)
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ isAAA: false }),
    });

    // runTransaction: invoke the callback with a stub transaction
    mockRunTransaction.mockImplementation(async (cb: any) => {
      const stubTx = {
        get: jest.fn().mockResolvedValue({
          data: () => ({ metadata: { providerSetOffline: false } }),
        }),
        update: jest.fn(),
        set: jest.fn(),
      };
      return cb(stubTx);
    });
  });

  it('creates admin_alerts doc when provider_no_answer + isSosCallFree=true (B2B SOS-Call)', async () => {
    const session = buildB2BSession();
    (manager as any).getCallSession.mockResolvedValue(session);

    await manager.handleCallFailure('b2b_session_1', 'provider_no_answer');

    const b2bAlerts = collectionAddCalls.filter(
      (c) => c.collectionName === 'admin_alerts' && c.data.type === 'b2b_call_no_answer'
    );
    expect(b2bAlerts).toHaveLength(1);
    expect(b2bAlerts[0].data).toMatchObject({
      type: 'b2b_call_no_answer',
      severity: 'high',
      sessionId: 'b2b_session_1',
      providerId: 'provider_b2b_1',
      providerType: 'expat',
      clientUid: 'b2b_client_1',
      partnerSubscriberId: 42,
      subscriberToken: 'sos_token_abc123',
      handled: false,
    });
    expect(b2bAlerts[0].data.message).toContain('B2B SOS-Call');
  });

  it('does NOT create admin_alerts when isSosCallFree is false (regular B2C call)', async () => {
    const session = buildB2BSession({
      metadata: {
        ...buildB2BSession().metadata,
        isSosCallFree: false,
      } as any,
    });
    (manager as any).getCallSession.mockResolvedValue(session);

    await manager.handleCallFailure('b2c_session_1', 'provider_no_answer');

    const b2bAlerts = collectionAddCalls.filter(
      (c) => c.collectionName === 'admin_alerts' && c.data.type === 'b2b_call_no_answer'
    );
    expect(b2bAlerts).toHaveLength(0);
  });

  it('does NOT create admin_alerts when isSosCallFree is undefined', async () => {
    const baseMeta = buildB2BSession().metadata as any;
    delete baseMeta.isSosCallFree;
    const session = buildB2BSession({ metadata: baseMeta });
    (manager as any).getCallSession.mockResolvedValue(session);

    await manager.handleCallFailure('session_no_meta', 'provider_no_answer');

    const b2bAlerts = collectionAddCalls.filter(
      (c) => c.collectionName === 'admin_alerts' && c.data.type === 'b2b_call_no_answer'
    );
    expect(b2bAlerts).toHaveLength(0);
  });

  it('does NOT create admin_alerts for other failure reasons (e.g. client_no_answer)', async () => {
    const session = buildB2BSession();
    (manager as any).getCallSession.mockResolvedValue(session);

    await manager.handleCallFailure('b2b_session_1', 'client_no_answer');

    const b2bAlerts = collectionAddCalls.filter(
      (c) => c.collectionName === 'admin_alerts' && c.data.type === 'b2b_call_no_answer'
    );
    expect(b2bAlerts).toHaveLength(0);
  });

  it('handles missing partnerSubscriberId/sosCallSessionToken gracefully (still creates alert)', async () => {
    const session = buildB2BSession({
      metadata: {
        providerId: 'provider_b2b_1',
        clientId: 'b2b_client_1',
        serviceType: 'lawyer_call',
        providerType: 'lawyer',
        maxDuration: 1320,
        createdAt: makeTimestamp(),
        updatedAt: makeTimestamp(),
        isSosCallFree: true,
        // no sosCallSessionToken, no partnerSubscriberId
      } as any,
    });
    (manager as any).getCallSession.mockResolvedValue(session);

    await manager.handleCallFailure('b2b_session_minimal', 'provider_no_answer');

    const b2bAlerts = collectionAddCalls.filter(
      (c) => c.collectionName === 'admin_alerts' && c.data.type === 'b2b_call_no_answer'
    );
    expect(b2bAlerts).toHaveLength(1);
    expect(b2bAlerts[0].data).toMatchObject({
      providerId: 'provider_b2b_1',
      providerType: 'lawyer',
      subscriberToken: null,
      partnerSubscriberId: null,
    });
  });
});
