/**
 * forwardToPartnerEngine Unit Tests — AUDIT FIX 2026-05-03
 *
 * Tests for the P0-D fix: parse Laravel response body to detect
 * `status='ignored'` (Laravel renvoie HTTP 200 même quand le token
 * est rejeté pour raison métier).
 *
 * Without this fix, an attacker could inject any partnerInviteToken
 * at registration and Firebase would mark them as B2B-linked even
 * if Laravel rejected the token.
 */

// ============================================================================
// Mock Setup — must be before imports
// ============================================================================

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({ update: mockUpdate }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));
const mockDeleteSentinel = { __op: 'delete' };

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({ collection: mockCollection })),
  FieldValue: {
    delete: jest.fn(() => mockDeleteSentinel),
  },
}));

jest.mock('firebase-functions/v2', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('firebase-functions/params', () => ({
  defineSecret: jest.fn(() => ({ value: jest.fn(() => 'mock-secret') })),
}));

// Mock global fetch (used by callPartnerEngine)
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

// Set env vars to satisfy callPartnerEngine baseUrl/apiKey check
process.env.PARTNER_ENGINE_URL = 'https://partner.example.com';
process.env.PARTNER_ENGINE_API_KEY = 'test-api-key';

// ============================================================================
// Import after mocks
// ============================================================================

import { handlePartnerSubscriberRegistered } from '../forwardToPartnerEngine';

// ============================================================================
// Helpers
// ============================================================================

function buildEvent(userId: string, partnerInviteToken: string | undefined, email = 'user@test.com') {
  return {
    params: { userId },
    data: {
      data: () => {
        if (partnerInviteToken === undefined) return undefined;
        return { partnerInviteToken, email };
      },
    },
  };
}

function mockLaravelResponse(status: number, body: Record<string, unknown> | null) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body ? JSON.stringify(body) : ''),
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('handlePartnerSubscriberRegistered — Laravel response handling (P0-D 2026-05-03)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks user as linked when Laravel returns status="processed"', async () => {
    mockLaravelResponse(200, { status: 'processed', subscriber_id: 42 });

    await handlePartnerSubscriberRegistered(buildEvent('user_1', 'valid_token_abc'));

    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith('user_1');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerSubscriberLinked: true,
        partnerSubscriberLinkedAt: expect.any(String),
      })
    );
    // partnerInviteToken should NOT be deleted
    const callArgs = mockUpdate.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('partnerInviteToken');
  });

  it('marks user as linked when Laravel returns status="already_registered" (idempotent)', async () => {
    mockLaravelResponse(200, { status: 'already_registered' });

    await handlePartnerSubscriberRegistered(buildEvent('user_2', 'valid_token_def'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ partnerSubscriberLinked: true })
    );
  });

  it('CLEANS UP partnerInviteToken when Laravel returns status="ignored" (token rejected)', async () => {
    mockLaravelResponse(200, { status: 'ignored', reason: 'unknown_invite_token' });

    await handlePartnerSubscriberRegistered(buildEvent('user_3', 'fake_token_xyz'));

    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith('user_3');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerInviteToken: mockDeleteSentinel,
        partnerInviteTokenRejected: true,
        partnerInviteTokenRejectedAt: expect.any(String),
        partnerInviteTokenRejectedReason: 'unknown_invite_token',
      })
    );
    // partnerSubscriberLinked must NOT be set to true
    const callArgs = mockUpdate.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('partnerSubscriberLinked');
  });

  it('cleans up token with reason="unknown" if Laravel did not provide a reason', async () => {
    mockLaravelResponse(200, { status: 'ignored' });

    await handlePartnerSubscriberRegistered(buildEvent('user_4', 'fake_token'));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerInviteTokenRejected: true,
        partnerInviteTokenRejectedReason: 'unknown',
      })
    );
  });

  it('does NOT touch user doc on network error (allows retry)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));

    await handlePartnerSubscriberRegistered(buildEvent('user_5', 'some_token'));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does NOT touch user doc on HTTP 500 (allows retry)', async () => {
    mockLaravelResponse(500, { error: 'internal' });

    await handlePartnerSubscriberRegistered(buildEvent('user_6', 'some_token'));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does NOT touch user doc on HTTP 200 with unknown status value', async () => {
    // Laravel returns 200 but with a status we don't recognize → safe default = do nothing
    mockLaravelResponse(200, { status: 'something_unexpected' });

    await handlePartnerSubscriberRegistered(buildEvent('user_7', 'some_token'));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('skips processing entirely when user has no partnerInviteToken', async () => {
    await handlePartnerSubscriberRegistered(buildEvent('user_8', ''));

    // Empty string is falsy → early return, no fetch call
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('skips processing when event has no userData', async () => {
    await handlePartnerSubscriberRegistered(buildEvent('user_9', undefined));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('handles non-JSON response gracefully (body parsing fails)', async () => {
    // Laravel returns 200 but body is not JSON (e.g. plain text from a misconfigured route)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('<html>Not JSON</html>'),
    });

    await handlePartnerSubscriberRegistered(buildEvent('user_10', 'some_token'));

    // body=null → status undefined → neither linked nor rejected → no doc update
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
