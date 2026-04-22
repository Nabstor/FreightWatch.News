import type { Config } from "@netlify/functions";

// Runs every 6 hours — refreshes articles and runs rewriter agent
export default async function handler() {
  const secret  = process.env.CRON_SECRET;
  const baseUrl = process.env.URL || 'https://freightwatch.news';

  try {
    // 1. Refresh article cache
    await fetch(`${baseUrl}/api/cron`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });

    // 2. Run rewriter agent + send approval emails
    const res  = await fetch(`${baseUrl}/api/rewrite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    console.log('[cron-refresh] Rewriter:', data);

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('[cron-refresh] Failed:', err);
    return { statusCode: 500, body: 'Cron failed' };
  }
}

export const config: Config = {
  schedule: "0 */6 * * *", // Every 6 hours
};
