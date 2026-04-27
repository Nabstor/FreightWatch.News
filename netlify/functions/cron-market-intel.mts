import type { Config } from "@netlify/functions";
import { generateMarketIntelBrief } from "../../lib/marketIntelGenerator";

// Runs Monday and Thursday at 9am EST = 14:00 UTC
export default async function handler() {
  try {
    // Generate directly — avoids the Next.js serverless timeout that kills
    // HTTP calls to /api/market-intel after 10-26 seconds.
    // Scheduled functions can run up to 15 minutes.
    const brief = await generateMarketIntelBrief();
    console.log('[market-intel cron] Generated:', brief ? brief.weekOf : 'FAILED');

    return { statusCode: 200, body: JSON.stringify({ weekOf: brief?.weekOf }) };
  } catch (err) {
    console.error('[market-intel cron] Failed:', err);
    return { statusCode: 500, body: 'Market intel cron failed' };
  }
}

export const config: Config = {
  schedule: "0 14 * * 1,4", // Monday + Thursday 9am EST = 14:00 UTC
};
