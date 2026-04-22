import type { Config } from "@netlify/functions";

// Runs every Monday at 9am EST = 14:00 UTC
export default async function handler() {
  const secret  = process.env.CRON_SECRET;
  const baseUrl = process.env.URL || 'https://freightwatch.news';

  try {
    // First refresh articles
    await fetch(`${baseUrl}/api/cron`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });

    // Generate weekly market intel brief
    const res  = await fetch(`${baseUrl}/api/market-intel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    console.log('[market-intel cron] Generated:', data?.brief?.weekOf);

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('[market-intel cron] Failed:', err);
    return { statusCode: 500, body: 'Market intel cron failed' };
  }
}

export const config: Config = {
  schedule: "0 14 * * 1", // Every Monday 9am EST = 14:00 UTC
};
