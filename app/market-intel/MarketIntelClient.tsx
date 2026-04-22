'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Section {
  title:   string;
  bullets: string[];
}

interface Brief {
  id:          string;
  weekOf:      string;
  sections:    Section[];
  generatedAt: string;
  sources:     string[];
}

function BulletIcon({ text }: { text: string }) {
  if (text.includes('⚠️')) return <span style={{ color: '#f0a500', marginRight: '6px' }}>⚠</span>;
  if (text.includes('▲')) return <span style={{ color: '#1a7a3f', marginRight: '6px', fontSize: '10px' }}>▲</span>;
  if (text.includes('▼')) return <span style={{ color: '#d0021b', marginRight: '6px', fontSize: '10px' }}>▼</span>;
  return <span style={{ color: '#0a1628', marginRight: '6px' }}>—</span>;
}

function formatBullet(text: string) {
  // Bold the data point (everything before the first space after a colon or value)
  return text
    .replace(/(\$[\d,]+\.?\d*\/\w+)/g, '<strong>$1</strong>')
    .replace(/(\d+\.\d+%)/g, '<strong>$1</strong>')
    .replace(/(\d+,\d+)/g, '<strong>$1</strong>');
}

export default function MarketIntelPage() {
  const [brief, setBrief]     = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [active, setActive]   = useState<'market-rates' | 'all'>('market-rates');

  useEffect(() => {
    async function load() {
      try {
        // Check localStorage weekly cache
        const weekKey = (() => {
          const d = new Date();
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d);
          monday.setDate(diff);
          return monday.toISOString().slice(0, 10);
        })();

        const cached = localStorage.getItem('fw_market_intel');
        if (cached) {
          const { week, data } = JSON.parse(cached);
          if (week === weekKey && data) {
            setBrief(data);
            setLoading(false);
            return;
          }
        }

        const res  = await fetch('/api/market-intel');
        const json = await res.json();
        if (json.brief) {
          setBrief(json.brief);
          localStorage.setItem('fw_market_intel', JSON.stringify({ week: weekKey, data: json.brief }));
        } else {
          setError('Market intelligence brief not yet available. Check back Monday morning.');
        }
      } catch {
        setError('Failed to load market intelligence.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header
        active={active}
        onChange={(c) => {
          if (c === 'all' || c !== 'market-rates') {
            window.location.href = '/';
          }
        }}
        search=""
        onSearch={() => {}}
      />

      <main className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #0a1628' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Weekly Intelligence
                </p>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#0a1628', lineHeight: 1.2, marginBottom: '6px' }}>
                  Freight Market Intelligence
                </h1>
                {brief && (
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999' }}>
                    Week of {brief.weekOf}
                  </p>
                )}
              </div>
              {brief && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Sources</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {brief.sources.map(s => (
                      <span key={s} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', background: '#f0f0f0', color: '#666', padding: '2px 6px', borderRadius: '2px' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999', letterSpacing: '0.1em' }}>Loading...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', background: '#f8f8f8', border: '1px solid #e2e2e2', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#666' }}>{error}</p>
            </div>
          ) : brief ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {brief.sections.map((section, si) => (
                <div key={si} style={{ border: '1px solid #e2e2e2', padding: '20px 24px' }}>

                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e2e2e2' }}>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#0a1628', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                      {section.title}
                    </p>
                  </div>

                  {/* Bullets */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {section.bullets.map((bullet, bi) => (
                      <li key={bi} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '6px 0',
                        borderBottom: bi < section.bullets.length - 1 ? '1px solid #f5f5f5' : 'none',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '13px',
                        color: bullet.toLowerCase().includes('data pending') ? '#bbb' : '#222',
                        fontStyle: bullet.toLowerCase().includes('data pending') ? 'italic' : 'normal',
                        lineHeight: 1.5,
                      }}>
                        <BulletIcon text={bullet} />
                        <span dangerouslySetInnerHTML={{ __html: formatBullet(bullet) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {/* Last updated */}
          {brief && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#bbb', marginTop: '32px', textAlign: 'center' }}>
              Updated {new Date(brief.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
