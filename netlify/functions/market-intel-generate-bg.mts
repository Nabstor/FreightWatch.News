import type { Config } from "@netlify/functions";
import { generateMarketIntelBrief } from "../../lib/marketIntelGenerator";

// Background function — responds 202 immediately, runs up to 15 minutes.
// Called by GET /api/market-intel when no cached brief exists.
export default async function handler() {
  try {
    const brief = await generateMarketIntelBrief();
    console.log('[market-intel-bg] Generated:', brief ? brief.weekOf : 'FAILED');
  } catch (err) {
    console.error('[market-intel-bg] Error:', err);
  }
  return { statusCode: 200 };
}

export const config: Config = {
  type: "background",
};
