// ── Agent 5 — Quality Control Editor ─────────────────────────────
// Runs after rewriter. Checks accuracy, style, hallucination.
// Three outcomes: pass, corrected, rejected.

import { FreightwatchArticle } from './rewriter';

export type QCResult =
  | { status: 'pass';      article: FreightwatchArticle }
  | { status: 'corrected'; article: FreightwatchArticle; notes: string }
  | { status: 'rejected';  reason: string };

export async function runQualityControl(
  article: FreightwatchArticle,
  sourceText: string // full article text or RSS summary used as input
): Promise<QCResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { status: 'pass', article };

  try {
    const prompt = `You are a senior fact-checking editor. Your job is to review a rewritten article for accuracy, invented facts, and style issues.

SOURCE MATERIAL (the only facts allowed in the article):
${sourceText.slice(0, 2000)}

REWRITTEN ARTICLE TO REVIEW:
Title: ${article.title}
Body: ${article.body}

CHECK FOR:
1. HALLUCINATED FACTS — any number, percentage, company name, rate, date, or specific claim in the article that does NOT appear in the source material
2. STYLE ISSUES — sentences over 30 words, vague non-factual adjectives, passive voice where active is needed
3. ACCURACY — does the article accurately represent what the source says, or does it change the meaning?

RULES:
- If you find hallucinated facts that cannot be corrected, REJECT the article
- If you find minor style issues only, CORRECT them
- If the article accurately represents the source with good style, PASS it
- Be strict on numbers and rates — if a number appears in the article but not the source, flag it
- Never invent corrections — only fix what's there

Return only valid JSON, no markdown:
{
  "decision": "pass" | "corrected" | "rejected",
  "reason": "Brief explanation of decision",
  "correctedTitle": "Corrected title if decision is corrected, otherwise same as input",
  "correctedBody": "Corrected body if decision is corrected, otherwise same as input"
}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages:   [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data   = await res.json();
    const text   = data.content?.[0]?.text?.trim() || '';
    const clean  = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (parsed.decision === 'rejected') {
      return { status: 'rejected', reason: parsed.reason };
    }

    if (parsed.decision === 'corrected') {
      const corrected: FreightwatchArticle = {
        ...article,
        title: parsed.correctedTitle || article.title,
        body:  parsed.correctedBody  || article.body,
      };
      return { status: 'corrected', article: corrected, notes: parsed.reason };
    }

    return { status: 'pass', article };
  } catch (e) {
    console.error('[qc] Quality control failed:', e);
    // On error, pass through — better to publish than block everything
    return { status: 'pass', article };
  }
}
