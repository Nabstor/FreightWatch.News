'use client';
import { useState } from 'react';

const FEED_PASSWORD = process.env.NEXT_PUBLIC_FEED_PASSWORD || 'freightwatch2024';

export default function FeedPage() {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData]         = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);

  const handleAuth = () => {
    if (password === FEED_PASSWORD) setAuthed(true);
    else setStatus('Incorrect password.');
  };

  const handleSubmit = async () => {
    if (!data.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('✓ Data received. The agent will incorporate it into the next analysis.');
        setData('');
      } else {
        setStatus('Failed to submit. Try again.');
      }
    } catch {
      setStatus('Error submitting data.');
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', padding: '40px', width: '360px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Freightwatch · Private Feed
          </p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{ width: '100%', border: '1px solid #e2e2e2', padding: '10px 12px', fontFamily: "'Inter', sans-serif", fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' as const, outline: 'none' }}
          />
          <button onClick={handleAuth} style={{ width: '100%', background: '#0a1628', color: '#fff', border: 'none', padding: '10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Enter
          </button>
          {status && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#d0021b', marginTop: '8px' }}>{status}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', padding: '40px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Freightwatch · Private Intelligence Feed
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Feed the Agent
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#888', lineHeight: 1.6 }}>
            Paste rate data, market reports, broker intel, or any freight intelligence below. The agent will incorporate it into the next analysis with priority over other sources.
          </p>
        </div>

        <textarea
          value={data}
          onChange={e => setData(e.target.value)}
          placeholder="Paste rate sheets, market reports, broker notes, carrier data, or any freight intelligence here..."
          rows={16}
          style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' as const, outline: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading || !data.trim()}
            style={{ background: loading ? '#333' : '#d0021b', color: '#fff', border: 'none', padding: '12px 28px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Submitting...' : 'Submit to Agent'}
          </button>
          {status && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: status.startsWith('✓') ? '#1a7a3f' : '#d0021b' }}>
              {status}
            </p>
          )}
        </div>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #222' }}>
          <a href="/" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#555', textDecoration: 'none', letterSpacing: '0.05em' }}>
            ← Back to Freightwatch.news
          </a>
        </div>
      </div>
    </div>
  );
}
