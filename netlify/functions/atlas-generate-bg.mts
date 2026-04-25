import type { Config } from "@netlify/functions";
import { forceRefreshReport } from "../../lib/atlas";

// Background function — responds 202 immediately, runs up to 15 minutes.
// Called by GET /api/atlas when no cached report exists for today.
export default async function handler() {
  try {
    const report = await forceRefreshReport();
    console.log('[atlas-bg] Generated:', report ? report.headline : 'FAILED');
  } catch (err) {
    console.error('[atlas-bg] Error:', err);
  }
  return { statusCode: 200 };
}

export const config: Config = {
  type: "background",
};
