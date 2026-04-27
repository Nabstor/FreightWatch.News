'use client';
import { useEffect, useState } from 'react';
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
  if (text.includes('⚠️') || text.startsWith('⚠')) return <span style={{ color: '#f0a500', marginRight: '6px' }}>⚠</span>;
  if (text.includes('▲')) return <span style={{ color: '#1a7a3f', marginRight: '6px', fontSize: '10px' }}>▲</span>;
  if (text.includes('▼')) return <span style={{ color: '#d0021b', marginRight: '6px', fontSize: '10px' }}>▼</span>;
  if (text.includes('→')) return <span style={{ color: '#888', marginRight: '6px', fontSize: '10px' }}>→</span>;
  return <span style={{ color: '#0a1628', marginRight: '6px' }}>—</span>;
}

function formatBullet(text: string) {
  return text
    .replace(/(\$[\d,]+\.?\d*\/\w+)/g, '<strong>$1</strong>')
    .replace(/(\d+\.\d+%)/g, '<strong>$1</strong>')
    .replace(/(\d{1,3},\d{3})/g, '<strong>$1</strong>')
    .replace(/\b(BULLISH|BEARISH|NEUTRAL)\b/g, '<strong>$1</strong>');
}

export default function MarketIntelPage() {
  const [brief, setBrief]           = useState<Brief | null>(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [active, setActive]         = useState<any>('all');

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      if (!silent) {
        const cached = localStorage.getItem('fw_market_intel_v3');
        if (cached) {
          const { date, data } = JSON.parse(cached);
          if (date === todayKey && data) {
            setBrief(data);
            setLoading(false);
            return;
          }
        }
      }

      const res  = await fetch('/api/market-intel');
      const json = await res.json();
      if (json.brief) {
        setBrief(json.brief);
        setGenerating(false);
        localStorage.setItem('fw_market_intel_v3', JSON.stringify({ date: todayKey, data: json.brief }));
      } else if (json.generating) {
        setGenerating(true);
      } else {
        setError('Next brief publishes Monday and Thursday at 9am EST.');
      }
    } catch {
      setError('Failed to load market intelligence.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Poll every 25 seconds while generating
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => load(true), 25000);
    return () => clearInterval(id);
  }, [generating]);

  const updatedDate = brief
    ? new Date(brief.generatedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        timeZone: 'America/New_York',
      })
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header active={active} onChange={setActive} search="" onSearch={() => {}} />

      <main className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ marginBottom: '36px', paddingBottom: '24px', borderBottom: '2px solid #0a1628' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Market Intelligence
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#0a1628', lineHeight: 1.2, marginBottom: '8px' }}>
              Freight Market Intelligence Brief
            </h1>
            {brief ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999' }}>
                Week of {brief.weekOf} · Updated {updatedDate}
              </p>
            ) : (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999' }}>
                Published Monday &amp; Thursday at 9am EST
              </p>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999', letterSpacing: '0.1em' }}>Loading...</p>
            </div>
          ) : generating ? (
            <div style={{ padding: '40px', background: '#f8f8f8', border: '1px solid #e2e2e2', textAlign: 'center' }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#0a1628', letterSpacing: '0.1em', marginBottom: '8px' }}>GENERATING BRIEF</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666' }}>Your market intelligence brief is being prepared. This page will update automatically.</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', background: '#f8f8f8', border: '1px solid #e2e2e2', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#666' }}>{error}</p>
            </div>
          ) : brief ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {brief.sections.map((section, si) => (
                <div key={si} style={{ border: '1px solid #e2e2e2', padding: '20px 24px' }}>
                  <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e2e2e2' }}>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#0a1628', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                      {section.title}
                    </p>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {section.bullets.map((bullet, bi) => (
                      <li key={bi} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '7px 0',
                        borderBottom: bi < section.bullets.length - 1 ? '1px solid #f5f5f5' : 'none',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '13px',
                        color: '#222',
                        lineHeight: 1.6,
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
