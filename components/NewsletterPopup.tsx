'use client';
import { useEffect, useState } from 'react';

export function NewsletterPopup() {
  const [show, setShow]     = useState(false);
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const dismissed = localStorage.getItem('fw_popup_dismissed');
    const subscribed = localStorage.getItem('fw_subscribed');
    if (dismissed || subscribed) return;
    const timer = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('fw_popup_dismissed', '1');
  }

  async function handleSubmit() {
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        localStorage.setItem('fw_subscribed', '1');
        setTimeout(() => setShow(false), 3000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, maxWidth: '340px', background: '#fff', border: '1px solid #e2e2e2', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '24px' }}>
      <button onClick={dismiss} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}>✕</button>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Free Daily Intelligence</p>
      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 700, color: '#0a1628', marginBottom: '8px', lineHeight: 1.3 }}>Stay ahead of freight markets</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: 1.5 }}>Daily freight analysis at 10am CST. Join freight professionals who read Freightwatch daily.</p>
      {status === 'success' ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#1a7a3f', fontWeight: 600 }}>✓ You're subscribed!</p>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ flex: 1, border: '1px solid #e2e2e2', padding: '8px 10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', outline: 'none' }}
          />
          <button
            onClick={handleSubmit}
            disabled={status === 'loading'}
            style={{ background: '#0a1628', color: '#fff', border: 'none', padding: '8px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            {status === 'loading' ? '...' : 'Join'}
          </button>
        </div>
      )}
    </div>
  );
}
