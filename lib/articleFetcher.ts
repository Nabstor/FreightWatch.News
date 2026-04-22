// ── Full Article Fetcher ──────────────────────────────────────────
// Attempts to fetch the full text of an article URL.
// Falls back to RSS summary if fetch fails or hits a paywall.

const PAYWALL_SIGNALS = [
  'subscribe to read',
  'subscription required',
  'sign in to read',
  'create a free account',
  'to continue reading',
  'premium content',
  'members only',
  'paid subscribers',
  'unlock this article',
];

const MIN_FULL_TEXT = 300; // chars — below this we treat as paywall/thin

export async function fetchFullArticle(url: string, fallback: string): Promise<{
  text:     string;
  full:     boolean; // true if we got the full article, false if fallback
}> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Freightwatch/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { text: fallback, full: false };

    const html = await res.text();

    // Strip HTML tags — get readable text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Check for paywall signals
    const lower = text.toLowerCase();
    const isPaywalled = PAYWALL_SIGNALS.some(signal => lower.includes(signal));

    if (isPaywalled || text.length < MIN_FULL_TEXT) {
      return { text: fallback, full: false };
    }

    // Extract the most relevant content — find the densest paragraph block
    // Typically the article body is the longest continuous text block
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40);
    const relevant  = sentences.slice(0, 40).join('. ').trim();

    return {
      text: relevant.length > fallback.length ? relevant : fallback,
      full: relevant.length > MIN_FULL_TEXT,
    };
  } catch {
    return { text: fallback, full: false };
  }
}
