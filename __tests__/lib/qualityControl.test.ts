import { describe, it, expect, vi, afterEach } from 'vitest';
import { runQualityControl } from '@/lib/qualityControl';
import type { FreightwatchArticle } from '@/lib/rewriter';

const makeArticle = (overrides: Partial<FreightwatchArticle> = {}): FreightwatchArticle => ({
  id:          'qc-test-id',
  slug:        'diesel-prices-surge',
  title:       'Diesel Prices Surge Amid Supply Constraints',
  body:        'Diesel fuel prices rose 8 percent last week as refinery output fell to a six-month low.',
  summary:     'Diesel up 8% on refinery shortfall.',
  category:    'trucking',
  importance:  6,
  byline:      'freightwatch',
  status:      'published',
  publishedAt: new Date().toISOString(),
  createdAt:   new Date().toISOString(),
  ...overrides,
});

const SOURCE_TEXT = 'Diesel fuel prices rose 8 percent last week as refinery output fell to a six-month low, according to EIA data.';

describe('runQualityControl — no API key', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it('passes through the article unchanged when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const article = makeArticle();
    const result = await runQualityControl(article, SOURCE_TEXT);

    expect(result.status).toBe('pass');
    expect((result as { article: FreightwatchArticle }).article).toBe(article);
  });
});

describe('runQualityControl — pass decision', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it('returns status "pass" with the original article', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({
          decision:       'pass',
          reason:         'Article accurately reflects source material.',
          correctedTitle: makeArticle().title,
          correctedBody:  makeArticle().body,
        }) }],
      }),
    }));

    const article = makeArticle();
    const result  = await runQualityControl(article, SOURCE_TEXT);

    expect(result.status).toBe('pass');
    expect((result as { article: FreightwatchArticle }).article).toEqual(article);
  });
});

describe('runQualityControl — corrected decision', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it('returns status "corrected" with updated title and body', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({
          decision:       'corrected',
          reason:         'Sentence was too long.',
          correctedTitle: 'Diesel Prices Rise on Refinery Shortfall',
          correctedBody:  'Diesel rose 8 percent. Refinery output fell.',
        }) }],
      }),
    }));

    const result = await runQualityControl(makeArticle(), SOURCE_TEXT);

    expect(result.status).toBe('corrected');
    const corrected = result as { status: 'corrected'; article: FreightwatchArticle; notes: string };
    expect(corrected.article.title).toBe('Diesel Prices Rise on Refinery Shortfall');
    expect(corrected.article.body).toBe('Diesel rose 8 percent. Refinery output fell.');
    expect(corrected.notes).toBe('Sentence was too long.');
  });

  it('falls back to original title/body if Claude omits correctedTitle/correctedBody', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({ decision: 'corrected', reason: 'Minor fix.' }) }],
      }),
    }));

    const article = makeArticle();
    const result  = await runQualityControl(article, SOURCE_TEXT);

    expect(result.status).toBe('corrected');
    const corrected = result as { article: FreightwatchArticle };
    expect(corrected.article.title).toBe(article.title);
    expect(corrected.article.body).toBe(article.body);
  });
});

describe('runQualityControl — rejected decision', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it('returns status "rejected" with a reason', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({
          decision: 'rejected',
          reason:   'Article contains hallucinated rate of 12% not found in source.',
        }) }],
      }),
    }));

    const result = await runQualityControl(makeArticle(), SOURCE_TEXT);

    expect(result.status).toBe('rejected');
    expect((result as { reason: string }).reason).toContain('hallucinated');
  });
});

describe('runQualityControl — error handling', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it('passes through when Claude returns malformed JSON (fail-open)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'I cannot process this request.' }],
      }),
    }));

    const article = makeArticle();
    const result  = await runQualityControl(article, SOURCE_TEXT);

    // Fail-open: malformed JSON triggers catch block → pass
    expect(result.status).toBe('pass');
    expect((result as { article: FreightwatchArticle }).article).toBe(article);
  });

  it('passes through when the fetch call throws a network error', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const article = makeArticle();
    const result  = await runQualityControl(article, SOURCE_TEXT);

    expect(result.status).toBe('pass');
    expect((result as { article: FreightwatchArticle }).article).toBe(article);
  });

  it('strips markdown code fences before parsing Claude response', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const payload = { decision: 'pass', reason: 'All good.', correctedTitle: '', correctedBody: '' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`` }],
      }),
    }));

    const result = await runQualityControl(makeArticle(), SOURCE_TEXT);
    expect(result.status).toBe('pass');
  });
});
