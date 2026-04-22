'use client';
import { useEffect, useState } from 'react';
import { Article } from '@/lib/feeds';

export function Ticker() {
  const [headlines, setHeadlines] = useState<Article[]>([]);

  useEffect(() => {
    fetch('/api/articles?category=breaking&limit=10')
      .then(r => r.json())
      .then(d => setHeadlines(d.articles || []))
      .catch(() => {});
  }, []);

  if (!headlines.length) return null;

  const items = [...headlines, ...headlines];

  return (
    <div style={{ background: '#0a1628', borderBottom: '2px solid #d0021b', overflow: 'hidden', height: '32px', display: 'flex', alignItems: 'center' }}>
      <div style={{ flexShrink: 0, background: '#d0021b', padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1 }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>BREAKING</span>
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="ticker-inner">
          {items.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 24px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#e5e7eb', fontWeight: 500 }}>{a.title}</span>
              <span style={{ color: '#d0021b', fontSize: '10px' }}>◆</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
