import type { Config } from "@netlify/functions";

// Ping every 10 minutes to keep serverless instance warm
export default async function handler() {
  const baseUrl = process.env.URL || 'https://freightwatch.news';
  try {
    // Lightweight ping — just checks the articles cache is warm
    const res  = await fetch(`${baseUrl}/api/articles?limit=1`);
    const data = await res.json();
    console.log('[keepwarm] Cache warm — articles:', data.total);
    return { statusCode: 200, body: 'warm' };
  } catch (err) {
    console.error('[keepwarm] Failed:', err);
    return { statusCode: 500, body: 'cold' };
  }
}

export const config: Config = {
  schedule: "*/10 * * * *", // Every 10 minutes
};
