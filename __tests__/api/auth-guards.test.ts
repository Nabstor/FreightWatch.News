import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getCachedArticles } from '@/lib/fetcher';
import { processNextArticle } from '@/lib/rewriter';
import type { Article } from '@/lib/feeds';

// ── Module-level mocks — in place before any route is imported ────
vi.mock('@/lib/fetcher', () => ({
  getCachedArticles: vi.fn().mockResolvedValue([]),
  refreshArticles:   vi.fn().mockResolvedValue([]),
  clearArticleCache: vi.fn(),
}));

vi.mock('@/lib/rewriter', () => ({
  processNextArticle:   vi.fn().mockResolvedValue({ processed: true, category: 'trucking', title: 'T', total: 1 }),
  getPublishedArticles: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/atlas', () => ({
  getCachedReport:    vi.fn().mockResolvedValue(null),
  forceRefreshReport: vi.fn().mockResolvedValue({ id: 'r1', headline: 'H', sections: [], bottomLine: 'B', publishedAt: '' }),
}));

vi.mock('@/lib/brevo', () => ({
  sendAnalysisEmail: vi.fn().mockResolvedValue(true),
  addSubscriber:     vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/marketIntelGenerator', () => ({
  getCachedMarketIntelBrief: vi.fn().mockResolvedValue(null),
  generateMarketIntelBrief:  vi.fn().mockResolvedValue({ id: 'b1', weekOf: 'April 21, 2025', sections: [], generatedAt: '', sources: [] }),
}));

vi.mock('@/lib/atlasGenerator', () => ({
  setPrivateData: vi.fn(),
  getPrivateData: vi.fn().mockReturnValue(''),
}));

// ── Helpers ───────────────────────────────────────────────────────

const req = (url: string, method: 'GET' | 'POST', auth?: string, body?: object) =>
  new NextRequest(`https://freightwatch.news${url}`, {
    method,
    headers: {
      ...(auth ? { Authorization: auth } : {}),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const SECRET = 'cron-secret-xyz';

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  }));
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ── /api/rewrite ──────────────────────────────────────────────────

describe('POST /api/rewrite — auth guard', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const { POST } = await import('@/app/api/rewrite/route');
    expect((await POST(req('/api/rewrite', 'POST'))).status).toBe(401);
  });

  it('returns 401 when token is wrong', async () => {
    const { POST } = await import('@/app/api/rewrite/route');
    expect((await POST(req('/api/rewrite', 'POST', 'Bearer wrongtoken'))).status).toBe(401);
  });

  it('returns 401 without the Bearer prefix', async () => {
    const { POST } = await import('@/app/api/rewrite/route');
    expect((await POST(req('/api/rewrite', 'POST', SECRET))).status).toBe(401);
  });

  it('returns 200 with the correct Bearer token', async () => {
    const { POST } = await import('@/app/api/rewrite/route');
    expect((await POST(req('/api/rewrite', 'POST', `Bearer ${SECRET}`))).status).toBe(200);
  });
});

describe('POST /api/rewrite — freight keyword filter', () => {
  const makeArticle = (id: string, title: string, summary: string): Article => ({
    id, title, summary, url: `https://example.com/${id}`,
    source: 'FreightWaves', category: 'trucking',
    publishedAt: new Date().toISOString(), isBreaking: false,
  });

  it('only forwards freight-relevant articles to processNextArticle', async () => {
    vi.mocked(getCachedArticles).mockResolvedValueOnce([
      makeArticle('1', 'Trucking rates rise sharply', 'Carrier capacity tight'),
      makeArticle('2', 'Celebrity gossip today', 'Pop star drama'),
      makeArticle('3', 'Diesel prices hit six-month high', 'Fuel costs surge'),
    ]);

    const { POST } = await import('@/app/api/rewrite/route');
    await POST(req('/api/rewrite', 'POST', `Bearer ${SECRET}`));

    const passed = vi.mocked(processNextArticle).mock.calls[0][0];
    expect(passed.some(a => a.id === '1')).toBe(true);  // 'truck', 'carrier' match
    expect(passed.some(a => a.id === '3')).toBe(true);  // 'diesel', 'fuel' match
    expect(passed.some(a => a.id === '2')).toBe(false); // no freight keywords
  });

  it('falls back to all RSS articles when none match freight keywords', async () => {
    // Titles chosen to have no substring overlap with any freight keyword
    const noFreight = [
      makeArticle('x', 'Golden Globes ceremony highlights', 'Award show recap'),
      makeArticle('y', 'Baseball season begins tomorrow',  'Opening day schedule'),
    ];
    vi.mocked(getCachedArticles).mockResolvedValueOnce(noFreight);

    const { POST } = await import('@/app/api/rewrite/route');
    await POST(req('/api/rewrite', 'POST', `Bearer ${SECRET}`));

    const passed = vi.mocked(processNextArticle).mock.calls[0][0];
    expect(passed).toHaveLength(2); // full list passed through
  });
});

// ── /api/cron ─────────────────────────────────────────────────────

describe('POST /api/cron — auth guard', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const { POST } = await import('@/app/api/cron/route');
    expect((await POST(req('/api/cron', 'POST'))).status).toBe(401);
  });

  it('returns 401 when token is wrong', async () => {
    const { POST } = await import('@/app/api/cron/route');
    expect((await POST(req('/api/cron', 'POST', 'Bearer badtoken'))).status).toBe(401);
  });

  it('returns 200 with the correct Bearer token', async () => {
    const { POST } = await import('@/app/api/cron/route');
    expect((await POST(req('/api/cron', 'POST', `Bearer ${SECRET}`))).status).toBe(200);
  });
});

// ── /api/atlas ────────────────────────────────────────────────────

describe('POST /api/atlas — auth guard', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const { POST } = await import('@/app/api/atlas/route');
    expect((await POST(req('/api/atlas', 'POST'))).status).toBe(401);
  });

  it('returns 401 when token is wrong', async () => {
    const { POST } = await import('@/app/api/atlas/route');
    expect((await POST(req('/api/atlas', 'POST', 'Bearer wrongtoken'))).status).toBe(401);
  });

  it('returns 200 with the correct Bearer token', async () => {
    const { POST } = await import('@/app/api/atlas/route');
    expect((await POST(req('/api/atlas', 'POST', `Bearer ${SECRET}`))).status).toBe(200);
  });
});

// ── /api/analysis-email ───────────────────────────────────────────

describe('POST /api/analysis-email — auth guard', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const { POST } = await import('@/app/api/analysis-email/route');
    expect((await POST(req('/api/analysis-email', 'POST'))).status).toBe(401);
  });

  it('returns 401 when token is wrong', async () => {
    const { POST } = await import('@/app/api/analysis-email/route');
    expect((await POST(req('/api/analysis-email', 'POST', 'Bearer bad'))).status).toBe(401);
  });

  it('returns 404 when no Atlas report is available (authorized)', async () => {
    // getCachedReport is already mocked to return null
    const { POST } = await import('@/app/api/analysis-email/route');
    expect((await POST(req('/api/analysis-email', 'POST', `Bearer ${SECRET}`))).status).toBe(404);
  });
});

// ── /api/market-intel ─────────────────────────────────────────────

describe('POST /api/market-intel — auth guard', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const { POST } = await import('@/app/api/market-intel/route');
    expect((await POST(req('/api/market-intel', 'POST'))).status).toBe(401);
  });

  it('returns 401 when token is wrong', async () => {
    const { POST } = await import('@/app/api/market-intel/route');
    expect((await POST(req('/api/market-intel', 'POST', 'Bearer wrong'))).status).toBe(401);
  });

  it('returns 200 with the correct Bearer token', async () => {
    const { POST } = await import('@/app/api/market-intel/route');
    expect((await POST(req('/api/market-intel', 'POST', `Bearer ${SECRET}`))).status).toBe(200);
  });
});

// ── /api/feed — no auth guard (security gap) ─────────────────────

describe('POST /api/feed — unprotected endpoint', () => {
  it('accepts data from any caller without authentication', async () => {
    // /api/feed has no CRON_SECRET check — this test documents that fact.
    // Any caller can append private data to the Atlas feed.
    const { POST } = await import('@/app/api/feed/route');
    const res = await POST(req('/api/feed', 'POST', undefined, { data: 'some private data' }));
    // 200 proves no auth check is enforced
    expect(res.status).toBe(200);
  });

  it('returns 400 when body has no data field', async () => {
    const { POST } = await import('@/app/api/feed/route');
    const res = await POST(req('/api/feed', 'POST', undefined, {}));
    expect(res.status).toBe(400);
  });
});

// ── GET routes — no auth required ────────────────────────────────

describe('GET routes — publicly accessible', () => {
  it('GET /api/rewrite returns 200 without auth', async () => {
    const { GET } = await import('@/app/api/rewrite/route');
    expect((await GET(req('/api/rewrite', 'GET'))).status).toBe(200);
  });

  it('GET /api/atlas returns 200 without auth', async () => {
    const { GET } = await import('@/app/api/atlas/route');
    expect((await GET()).status).toBe(200);
  });

  it('GET /api/market-intel returns 200 without auth', async () => {
    const { GET } = await import('@/app/api/market-intel/route');
    expect((await GET()).status).toBe(200);
  });
});
