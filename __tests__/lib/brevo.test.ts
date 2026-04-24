import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Reset module state (in-memory _sentToday lock) between tests
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  delete process.env.BREVO_API_KEY;
  vi.unstubAllGlobals();
});

// ── addSubscriber ─────────────────────────────────────────────────

describe('addSubscriber', () => {
  it('returns false when BREVO_API_KEY is not set', async () => {
    delete process.env.BREVO_API_KEY;
    const { addSubscriber } = await import('@/lib/brevo');
    const result = await addSubscriber('test@example.com');
    expect(result).toBe(false);
  });

  it('returns true on a successful 200 response', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const { addSubscriber } = await import('@/lib/brevo');
    const result = await addSubscriber('freight@example.com');
    expect(result).toBe(true);
  });

  it('returns true on a 204 No Content response (existing contact)', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 204 }));

    const { addSubscriber } = await import('@/lib/brevo');
    const result = await addSubscriber('existing@example.com');
    expect(result).toBe(true);
  });

  it('returns false on a non-ok, non-204 response', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));

    const { addSubscriber } = await import('@/lib/brevo');
    const result = await addSubscriber('bad@example.com');
    expect(result).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const { addSubscriber } = await import('@/lib/brevo');
    const result = await addSubscriber('error@example.com');
    expect(result).toBe(false);
  });

  it('sends to the Brevo contacts endpoint with the correct email', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', mockFetch);

    const { addSubscriber } = await import('@/lib/brevo');
    await addSubscriber('shipper@freight.com');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('brevo.com/v3/contacts');
    const body = JSON.parse(opts.body);
    expect(body.email).toBe('shipper@freight.com');
  });
});

// ── sendAnalysisEmail — duplicate-send prevention ─────────────────

const makeReport = () => ({
  id:          'report-1',
  headline:    'Freight markets tighten as demand recovers',
  sections:    [{ mode: 'TRUCKING', content: 'Spot rates rose 3% last week.' }],
  bottomLine:  'Carriers are well-positioned heading into peak season.',
  publishedAt: new Date().toISOString(),
});

describe('sendAnalysisEmail — no API key', () => {
  it('returns false when BREVO_API_KEY is not set', async () => {
    delete process.env.BREVO_API_KEY;
    const { sendAnalysisEmail } = await import('@/lib/brevo');
    const result = await sendAnalysisEmail(makeReport());
    expect(result).toBe(false);
  });
});

describe('sendAnalysisEmail — in-memory duplicate-send lock', () => {
  it('skips sending and returns true when in-memory lock is set for today', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';

    const today = new Date().toISOString().slice(0, 10);
    let callCount = 0;

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      callCount++;
      // First campaign check call
      if (typeof url === 'string' && url.includes('emailCampaigns?status=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ campaigns: [] }),
        });
      }
      // Create campaign call
      if (typeof url === 'string' && url.includes('emailCampaigns') && !url.includes('status=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 42 }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    const { sendAnalysisEmail } = await import('@/lib/brevo');

    // First send — should succeed
    const first = await sendAnalysisEmail(makeReport());
    expect(first).toBe(true);

    const callsAfterFirst = callCount;

    // Second send — in-memory lock should short-circuit
    const second = await sendAnalysisEmail(makeReport());
    expect(second).toBe(true);

    // No new fetch calls should have been made for the second send
    expect(callCount).toBe(callsAfterFirst);
  });

  it('checks Brevo API campaigns when in-memory lock is not set', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';

    const today = new Date().toISOString().slice(0, 10);
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('emailCampaigns?status=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            campaigns: [{ name: `Freightwatch Daily Brief — ${today}` }],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 99 }) });
    });
    vi.stubGlobal('fetch', mockFetch);

    const { sendAnalysisEmail } = await import('@/lib/brevo');
    const result = await sendAnalysisEmail(makeReport());

    // Campaign already exists today — should skip
    expect(result).toBe(true);

    // Should NOT have called the campaign-create endpoint
    const createCalls = mockFetch.mock.calls.filter(
      ([url]: [string]) => url.includes('emailCampaigns') && !url.includes('status=')
    );
    expect(createCalls.length).toBe(0);
  });

  it('returns false when campaign creation fails', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key';

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('emailCampaigns?status=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ campaigns: [] }),
        });
      }
      // Campaign create returns error (no id)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Invalid sender' }),
      });
    }));

    const { sendAnalysisEmail } = await import('@/lib/brevo');
    const result = await sendAnalysisEmail(makeReport());
    expect(result).toBe(false);
  });
});
