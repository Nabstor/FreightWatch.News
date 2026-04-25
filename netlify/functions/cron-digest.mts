import type { Config } from "@netlify/functions";
import { forceRefreshReport } from "../../lib/atlas";

// Runs daily at 9am CST = 15:00 UTC
export default async function handler() {
  const secret  = process.env.CRON_SECRET;
  const baseUrl = process.env.URL || 'https://freightwatch.news';

  try {
    // 1. Refresh articles from all RSS sources
    await fetch(`${baseUrl}/api/cron`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });

    // 2. Pre-warm market data
    await fetch(`${baseUrl}/api/markets`, { method: 'POST' });

    // 3. Generate the daily analysis report directly — avoids the Next.js serverless
    //    function timeout that kills HTTP calls to /api/atlas after 10-26 seconds.
    //    Scheduled functions can run up to 15 minutes.
    const report = await forceRefreshReport();
    console.log('[cron-digest] Atlas report generated:', report ? report.headline : 'FAILED');

    // 4. Send the daily analysis email
    const res  = await fetch(`${baseUrl}/api/analysis-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    console.log('[cron-digest] Daily brief sent:', data);

    return { statusCode: 200, body: JSON.stringify({ ...data, atlasGenerated: !!report }) };
  } catch (err) {
    console.error('[cron-digest] Failed:', err);
    return { statusCode: 500, body: 'Cron failed' };
  }
}

export const config: Config = {
  schedule: "0 15 * * *", // 9am CST = 15:00 UTC
};
