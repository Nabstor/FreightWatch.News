import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  delete process.env.BREVO_API_KEY;
  vi.unstubAllGlobals();
});

const makeRequest = (body: unknown) =>
  new NextRequest('https://freightwatch.news/api/subscribe', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

describe('POST /api/subscribe — email validation', () => {
  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is an empty string', async () => {
    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(makeRequest({ email: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email has no @ character', async () => {
    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(makeRequest({ email: 'notanemail' }));
    expect(res.status).toBe(400);
  });

  it('accepts an email that contains @ (current validation)', async () => {
    process.env.BREVO_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(makeRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(200);
  });

  it('documents the weak validation: bare "@" passes the current check', async () => {
    // This test documents a known limitation: "@" alone satisfies email.includes('@').
    // It is intentionally NOT asserting 400 here — it asserts the current (weak) behavior
    // so any future strengthening of validation will be caught.
    process.env.BREVO_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(makeRequest({ email: '@' }));
    // Current code passes this through to addSubscriber — status will be 200 or 500
    // depending on Brevo's response. The point is it's NOT rejected at validation.
    expect(res.status).not.toBe(400);
  });

  it('returns 500 when addSubscriber fails', async () => {
    process.env.BREVO_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(makeRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(500);
  });

  it('returns JSON with success:true on a valid subscription', async () => {
    process.env.BREVO_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const { POST } = await import('@/app/api/subscribe/route');
    const res  = await POST(makeRequest({ email: 'freight@carrier.com' }));
    const body = await res.json();

    expect(body).toEqual({ success: true });
  });
});
