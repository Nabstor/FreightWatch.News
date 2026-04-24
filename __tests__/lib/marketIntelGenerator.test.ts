import { describe, it, expect, vi, afterEach } from 'vitest';
import { getMondayOfWeek, getWeekKey } from '@/lib/marketIntelGenerator';

// ── getMondayOfWeek ───────────────────────────────────────────────

describe('getMondayOfWeek', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a formatted date string (e.g. "April 21, 2025")', () => {
    // Pin to a Wednesday
    vi.setSystemTime(new Date('2025-04-23T12:00:00Z'));
    const result = getMondayOfWeek();
    expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
  });

  it('returns the Monday of the current week when today is Wednesday', () => {
    // 2025-04-23 is a Wednesday; Monday of that week is 2025-04-21
    vi.setSystemTime(new Date('2025-04-23T12:00:00Z'));
    expect(getMondayOfWeek()).toContain('21');
  });

  it('returns the previous Monday when today is Sunday', () => {
    // 2025-04-27 is a Sunday; previous Monday is 2025-04-21
    vi.setSystemTime(new Date('2025-04-27T12:00:00Z'));
    expect(getMondayOfWeek()).toContain('21');
  });

  it('returns the same day when today is Monday', () => {
    // 2025-04-21 is a Monday
    vi.setSystemTime(new Date('2025-04-21T12:00:00Z'));
    expect(getMondayOfWeek()).toContain('21');
  });

  it('returns the correct Monday when today is Saturday', () => {
    // 2025-04-26 is a Saturday; Monday of that week is 2025-04-21
    vi.setSystemTime(new Date('2025-04-26T12:00:00Z'));
    expect(getMondayOfWeek()).toContain('21');
  });
});

// ── getWeekKey ────────────────────────────────────────────────────

describe('getWeekKey', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an ISO date string in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date('2025-04-23T12:00:00Z'));
    expect(getWeekKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the Monday date for a Wednesday', () => {
    vi.setSystemTime(new Date('2025-04-23T12:00:00Z'));
    expect(getWeekKey()).toBe('2025-04-21');
  });

  it('returns the same Monday date for any day within the same week', () => {
    const expected = '2025-04-21';

    const days = ['2025-04-21', '2025-04-22', '2025-04-23', '2025-04-24', '2025-04-25', '2025-04-26'];
    for (const day of days) {
      vi.setSystemTime(new Date(`${day}T12:00:00Z`));
      expect(getWeekKey()).toBe(expected);
    }
  });

  it('returns the previous week Monday for Sunday', () => {
    vi.setSystemTime(new Date('2025-04-27T12:00:00Z')); // Sunday
    expect(getWeekKey()).toBe('2025-04-21');
  });

  it('returns a different key for a different week', () => {
    vi.setSystemTime(new Date('2025-04-23T12:00:00Z')); // week of Apr 21
    const week1 = getWeekKey();

    vi.setSystemTime(new Date('2025-04-30T12:00:00Z')); // week of Apr 28
    const week2 = getWeekKey();

    expect(week1).not.toBe(week2);
  });
});

// ── FRED response parsing (via generateMarketIntelBrief) ──────────

describe('FRED data parsing — dot-placeholder filtering', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('filters out "." placeholder observations and uses only real values', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const capturedPrompts: string[] = [];

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      // FRED endpoints
      if (typeof url === 'string' && url.includes('stlouisfed.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            observations: [
              { date: '2025-04-01', value: '.' },     // placeholder — should be filtered
              { date: '2025-03-01', value: '.' },     // placeholder — should be filtered
              { date: '2025-02-01', value: '125.50' }, // real value
              { date: '2025-01-01', value: '123.20' }, // real value
            ],
          }),
        });
      }
      // Anthropic API — capture the prompt and return valid JSON
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        const body = opts?.body ? JSON.parse(opts.body as string) : {};
        capturedPrompts.push(body.messages?.[0]?.content || '');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: [{ text: JSON.stringify({
              sections: [
                { title: 'TRUCKLOAD MARKET', bullets: ['Spot rates stable.', 'Capacity tight.', 'DAT load-to-truck at 3.2.'] },
                { title: 'OCEAN & PORTS',    bullets: ['Container rates flat.', 'Port delays minimal.', 'Vessels on schedule.'] },
                { title: 'AIR CARGO',        bullets: ['Air demand rising.', 'Belly capacity up.', 'E-commerce strong.'] },
                { title: 'FUEL & ENERGY',    bullets: ['Diesel steady.', 'WTI at $80.', 'No disruptions.'] },
                { title: 'MACRO & TRADE',    bullets: ['GDP growth 2%.', 'Tariffs stable.', 'Inventories lean.'] },
                { title: 'WEEK IN FOCUS',    bullets: ['Key dev 1.', 'Key dev 2.', 'Key dev 3.'] },
              ],
            }) }],
          }),
        });
      }
      // getCachedArticles fetch
      return Promise.resolve({ ok: false });
    }));

    const { generateMarketIntelBrief } = await import('@/lib/marketIntelGenerator');
    const brief = await generateMarketIntelBrief();

    expect(brief).not.toBeNull();

    // The prompt sent to Claude should contain real FRED values (125.50), not the "." placeholders
    const prompt = capturedPrompts[0] || '';
    expect(prompt).toContain('125.50');
    // Placeholder "." values should never leak into the live data section
    expect(prompt).not.toMatch(/CASS.*\.\s+▲/);
  });

  it('returns null when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { generateMarketIntelBrief } = await import('@/lib/marketIntelGenerator');
    const result = await generateMarketIntelBrief();
    expect(result).toBeNull();
  });

  it('returns a brief with the expected section titles', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('stlouisfed.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            observations: [
              { date: '2025-02-01', value: '125.50' },
              { date: '2025-01-01', value: '123.20' },
            ],
          }),
        });
      }
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: [{ text: JSON.stringify({
              sections: [
                { title: 'TRUCKLOAD MARKET', bullets: ['Rates stable.', 'Capacity OK.', 'Load-to-truck 3.2.'] },
                { title: 'OCEAN & PORTS',    bullets: ['Rates flat.', 'Delays minimal.', 'On schedule.'] },
                { title: 'AIR CARGO',        bullets: ['Demand up.', 'Belly cap up.', 'E-com strong.'] },
                { title: 'FUEL & ENERGY',    bullets: ['Diesel steady.', 'WTI at $80.', 'No disruptions.'] },
                { title: 'MACRO & TRADE',    bullets: ['GDP 2%.', 'Tariffs stable.', 'Inventories lean.'] },
                { title: 'WEEK IN FOCUS',    bullets: ['Dev 1.', 'Dev 2.', 'Dev 3.'] },
              ],
            }) }],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    }));

    const { generateMarketIntelBrief } = await import('@/lib/marketIntelGenerator');
    const brief = await generateMarketIntelBrief();

    expect(brief).not.toBeNull();
    expect(brief!.sections.length).toBeGreaterThan(0);
    expect(brief!.weekOf).toBeTruthy();
    expect(brief!.sources).toContain('FRED');
    expect(brief!.sources).toContain('CASS');
  });
});
