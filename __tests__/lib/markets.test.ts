import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAllMarketData, getCachedMarketData } from '@/lib/markets';

const makeYahooResponse = (price: number, prev: number) => ({
  chart: {
    result: [{
      meta: {
        regularMarketPrice: price,
        chartPreviousClose: prev,
      },
    }],
  },
});

describe('fetchAllMarketData — Yahoo Finance parsing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns MarketData with a fuel array and updatedAt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeYahooResponse(3.9512, 3.8800)),
    }));

    const data = await fetchAllMarketData();

    expect(data).toHaveProperty('fuel');
    expect(data).toHaveProperty('updatedAt');
    expect(Array.isArray(data.fuel)).toBe(true);
  });

  it('formats US Diesel price to 4 decimal places ($/gal)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      // HO=F (US Diesel)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(3.9512, 3.8800)) })
      // CL=F and BZ=F
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(makeYahooResponse(80.50, 79.00)) })
    );

    const data   = await fetchAllMarketData();
    const diesel = data.fuel.find(f => f.label === 'US Diesel');

    expect(diesel).toBeDefined();
    // 4 decimal places
    expect(diesel!.value).toMatch(/^\d+\.\d{4}$/);
    expect(diesel!.unit).toBe('$/gal');
  });

  it('formats WTI Crude price to 2 decimal places ($/bbl)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(3.9512, 3.88)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(80.50, 79.00)) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(makeYahooResponse(83.20, 82.00)) })
    );

    const data = await fetchAllMarketData();
    const wti  = data.fuel.find(f => f.label === 'WTI Crude');

    expect(wti).toBeDefined();
    expect(wti!.value).toMatch(/^\d+\.\d{2}$/);
    expect(wti!.unit).toBe('$/bbl');
  });

  it('formats Brent Crude price to 2 decimal places ($/bbl)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(3.95, 3.88)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(80.50, 79.00)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(83.20, 82.00)) })
    );

    const data  = await fetchAllMarketData();
    const brent = data.fuel.find(f => f.label === 'Brent Crude');

    expect(brent).toBeDefined();
    expect(brent!.value).toMatch(/^\d+\.\d{2}$/);
    expect(brent!.unit).toBe('$/bbl');
  });

  it('calculates a positive change when price > prev', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeYahooResponse(85.00, 80.00)),
    }));

    const data   = await fetchAllMarketData();
    const wti    = data.fuel.find(f => f.label === 'WTI Crude');

    expect(wti!.change).toBeGreaterThan(0);
  });

  it('calculates a negative change when price < prev', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeYahooResponse(75.00, 80.00)),
    }));

    const data = await fetchAllMarketData();
    const wti  = data.fuel.find(f => f.label === 'WTI Crude');

    expect(wti!.change).toBeLessThan(0);
  });

  it('returns empty fuel array when Yahoo Finance API returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const data = await fetchAllMarketData();
    expect(data.fuel).toHaveLength(0);
  });

  it('returns empty fuel array when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const data = await fetchAllMarketData();
    expect(data.fuel).toHaveLength(0);
  });

  it('returns empty fuel array when Yahoo response is missing chart data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ chart: { result: null } }),
    }));

    const data = await fetchAllMarketData();
    expect(data.fuel).toHaveLength(0);
  });

  it('orders results as US Diesel, WTI Crude, Brent Crude', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(3.95, 3.88)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(80.50, 79.00)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeYahooResponse(83.20, 82.00)) })
    );

    const data = await fetchAllMarketData();

    expect(data.fuel[0]?.label).toBe('US Diesel');
    expect(data.fuel[1]?.label).toBe('WTI Crude');
    expect(data.fuel[2]?.label).toBe('Brent Crude');
  });
});

describe('getCachedMarketData — caching', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns cached data on the same EST date without re-fetching', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeYahooResponse(3.95, 3.88)),
    });
    vi.stubGlobal('fetch', mockFetch);

    // Prime the cache
    await fetchAllMarketData();
    const callCountAfterPrime = mockFetch.mock.calls.length;

    // Second call should use cache
    await getCachedMarketData();
    expect(mockFetch.mock.calls.length).toBe(callCountAfterPrime);
  });
});
