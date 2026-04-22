// ── Draft approval email system ───────────────────────────────────
// Sends Nabih an email with approve/reject links for high-impact articles

import { FreightwatchArticle } from './rewriter';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const APPROVAL_EMAIL = 'ffilali.nabih@gmail.com';
const BASE_URL = process.env.URL || 'https://freightwatch.news';

export async function sendApprovalEmail(article: FreightwatchArticle): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  const approveUrl = `${BASE_URL}/api/approve?id=${article.id}&action=approve&secret=${process.env.CRON_SECRET}`;
  const rejectUrl  = `${BASE_URL}/api/approve?id=${article.id}&action=reject&secret=${process.env.CRON_SECRET}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;">

  <tr><td style="background:#0a1628;padding:20px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><span style="font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:#fff;">FREIGHTWATCH</span><span style="font-family:'Courier New',monospace;font-size:12px;color:#d0021b;">.news</span></td>
      <td align="right"><span style="font-family:'Courier New',monospace;font-size:10px;color:#aaa;text-transform:uppercase;">Draft Review</span></td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:24px 28px 0 28px;">
    <p style="margin:0 0 6px 0;font-family:'Courier New',monospace;font-size:10px;color:#d0021b;text-transform:uppercase;letter-spacing:0.1em;">High Impact Story — Importance ${article.importance}/10</p>
    <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:22px;color:#0a1628;line-height:1.3;">${article.title}</h1>
    <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">${article.category} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
  </td></tr>

  <tr><td style="padding:0 28px;"><div style="height:1px;background:#e2e2e2;"></div></td></tr>

  <tr><td style="padding:20px 28px;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.8;">${article.body.replace(/\n\n/g, '</p><p style="margin:0 0 14px 0;font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.8;">')}</p>
  </td></tr>

  <tr><td style="padding:0 28px 28px 28px;">
    <div style="background:#f8f8f8;border-left:4px solid #0a1628;padding:12px 16px;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555;font-style:italic;">${article.summary}</p>
    </div>
  </td></tr>

  <tr><td style="padding:0 28px 32px 28px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px;">
        <a href="${approveUrl}" style="display:inline-block;background:#0a1628;color:#fff;font-family:'Courier New',monospace;font-size:12px;font-weight:700;padding:12px 28px;text-decoration:none;letter-spacing:0.1em;text-transform:uppercase;">✓ Publish Under My Name</a>
      </td>
      <td>
        <a href="${rejectUrl}" style="display:inline-block;background:#f0f0f0;color:#666;font-family:'Courier New',monospace;font-size:12px;font-weight:700;padding:12px 28px;text-decoration:none;letter-spacing:0.1em;text-transform:uppercase;">✕ Reject</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#f8f8f8;padding:16px 28px;border-top:1px solid #e2e2e2;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#999;">This article was flagged for your review because it scored ${article.importance}/10 on importance. Clicking Publish will post it to freightwatch.news under your byline.</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:     { name: 'Freightwatch Editorial', email: 'atlas@freightwatch.news' },
        to:         [{ email: APPROVAL_EMAIL, name: 'Nabih Filali' }],
        subject:    `[Review Required] ${article.title.slice(0, 70)}`,
        htmlContent: html,
      }),
    });
    return res.ok;
  } catch { return false; }
}
