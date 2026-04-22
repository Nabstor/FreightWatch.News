import type { Config } from "@netlify/functions";

// Runs daily at 10am CST = 16:00 UTC
export default async function handler() {
  const secret  = process.env.CRON_SECRET;
  const baseUrl = process.env.URL || 'https://freightwatch.news';

  try {
    // 1. Refresh articles
    await fetch(`${baseUrl}/api/cron`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });

    // 2. Pre-warm market data
    await fetch(`${baseUrl}/api/markets`, { method: 'POST' });

    // 3. Generate and send daily analysis email
    const res  = await fetch(`${baseUrl}/api/analysis-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    console.log('[cron-digest] Daily brief sent:', data);

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('[cron-digest] Failed:', err);
    return { statusCode: 500, body: 'Cron failed' };
  }
}

export const config: Config = {
  schedule: "0 16 * * *", // 10am CST = 16:00 UTC
};
