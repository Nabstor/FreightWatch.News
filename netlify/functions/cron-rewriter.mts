import type { Config } from "@netlify/functions";

// Runs every 10 minutes — processes ONE article per run
export default async function handler() {
  const secret  = process.env.CRON_SECRET;
  const baseUrl = process.env.URL || 'https://freightwatch.news';

  try {
    const res  = await fetch(`${baseUrl}/api/rewrite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    console.log('[cron-rewriter]', data);

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('[cron-rewriter] Failed:', err);
    return { statusCode: 500, body: 'Failed' };
  }
}

export const config: Config = {
  schedule: "*/10 * * * *", // Every 10 minutes
};
