import { Article } from './feeds';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '2', 10);
const SENDER_NAME   = 'Freightwatch';
const SENDER_EMAIL  = 'atlas@freightwatch.news';

function todayUTC() { return new Date().toISOString().slice(0, 10); }

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/New_York',
  });
}

// In-memory lock — prevents duplicate sends within the same instance
const _sentToday: Record<string, string> = {};

async function campaignExistsToday(namePrefix: string): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  const today = todayUTC();

  // Check in-memory lock first — fastest
  if (_sentToday[namePrefix] === today) {
    console.log(`[brevo] In-memory lock hit for ${namePrefix}`);
    return true;
  }

  // Check Brevo API — catches cases where a previous instance already sent
  try {
    const statuses = ['scheduled', 'sent', 'queued', 'in_process'];
    const results  = await Promise.allSettled(
      statuses.map(status =>
        fetch(`https://api.brevo.com/v3/emailCampaigns?status=${status}&limit=20`, {
          headers: { 'api-key': BREVO_API_KEY! },
        }).then(r => r.json())
      )
    );

    const all: { name: string }[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        all.push(...(r.value.campaigns || []));
      }
    }

    const exists = all.some(c => c.name.includes(namePrefix) && c.name.includes(today));
    if (exists) {
      _sentToday[namePrefix] = today; // cache the result
      return true;
    }
    return false;
  } catch { return false; }
}

function markSentToday(namePrefix: string) {
  _sentToday[namePrefix] = todayUTC();
}

// ── 10AM CST DAILY BRIEF — Reuters style, no fluff ───────────────
export async function sendAnalysisEmail(report: {
  id:          string;
  headline:    string;
  sections:    { mode: string; content: string }[];
  bottomLine:  string;
  publishedAt: string;
}): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  const today = todayUTC();
  if (await campaignExistsToday('Freightwatch Daily Brief')) {
    console.log('[brevo] Daily brief already sent today — skipping');
    return true;
  }

  const subjectDate = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'America/New_York',
  });

  const sectionsHtml = (report.sections || []).map(s => `
    <tr><td style="padding:0 0 22px 0;">
      <p style="margin:0 0 6px 0;font-family:'Courier New',monospace;font-size:9px;font-weight:700;color:#d0021b;letter-spacing:0.15em;text-transform:uppercase;">${s.mode}</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#0a1628;line-height:1.75;">${s.content}</p>
    </td></tr>
  `).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;">

  <tr><td style="background:#0a1628;padding:20px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><span style="font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px;">FREIGHTWATCH</span><span style="font-family:'Courier New',monospace;font-size:12px;font-weight:600;color:#d0021b;">.news</span></td>
      <td align="right"><span style="font-family:'Courier New',monospace;font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.1em;">Daily Brief · ${subjectDate}</span></td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:28px 28px 20px 28px;">
    <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0a1628;line-height:1.3;">${report.headline}</h1>
  </td></tr>

  <tr><td style="padding:0 28px;"><div style="height:1px;background:#e2e2e2;margin-bottom:24px;"></div></td></tr>

  <tr><td style="padding:0 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${sectionsHtml}
    </table>
  </td></tr>

  <tr><td style="padding:0 28px 28px 28px;">
    <div style="border-left:3px solid #0a1628;padding:12px 16px;background:#f8f8f8;">
      <p style="margin:0 0 4px 0;font-family:'Courier New',monospace;font-size:9px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">The Bottom Line</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#0a1628;font-style:italic;">${report.bottomLine}</p>
    </div>
  </td></tr>

  <tr><td style="background:#f8f8f8;padding:16px 28px;border-top:1px solid #e2e2e2;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#999;line-height:1.6;">
      You are receiving this because you subscribed at freightwatch.news.<br>
      <a href="{{unsubscribeLink}}" style="color:#999;">Unsubscribe</a> · <a href="https://freightwatch.news/analysis" style="color:#999;">Read on site</a>
    </p>
  </td></tr>

</table></td></tr></table></body></html>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        `Freightwatch Daily Brief — ${today}`,
        subject:     `Freightwatch — ${report.headline.slice(0, 70)}`,
        sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
        type:        'classic',
        htmlContent: html,
        recipients:  { listIds: [BREVO_LIST_ID] },
        scheduledAt: new Date(Date.now() + 60000).toISOString(),
      }),
    });
    const data = await res.json();
    if (data.id) {
      console.log('[brevo] Daily brief created:', data.id);
      markSentToday('Freightwatch Daily Brief');
      return true;
    }
    console.error('[brevo] Daily brief failed:', data);
    return false;
  } catch (e) {
    console.error('[brevo] Daily brief error:', e);
    return false;
  }
}

export async function addSubscriber(email: string): Promise<boolean> {
  if (!BREVO_API_KEY) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, listIds: [BREVO_LIST_ID], updateEnabled: true }),
    });
    return res.ok || res.status === 204;
  } catch { return false; }
}
