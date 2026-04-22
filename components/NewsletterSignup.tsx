'use client';
import { useState } from 'react';

export function NewsletterSignup() {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit() {
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: '#f0f8f4', border: '1px solid #1a7a3f', padding: '16px 20px', borderRadius: '3px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#1a7a3f', fontWeight: 600, margin: 0 }}>
          ✓ You're subscribed. Daily analysis at 10am CST.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f8f8', border: '1px solid #e2e2e2', padding: '20px', borderRadius: '3px' }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#0a1628', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Daily Freight Intelligence
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666', marginBottom: '14px', lineHeight: 1.5 }}>
        Daily freight analysis at 10am CST. Free.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ flex: 1, border: '1px solid #e2e2e2', padding: '8px 12px', fontFamily: "'Inter', sans-serif", fontSize: '13px', outline: 'none' }}
        />
        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          style={{ background: '#0a1628', color: '#fff', border: 'none', padding: '8px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#d0021b', marginTop: '8px' }}>Something went wrong. Please try again.</p>}
    </div>
  );
}
