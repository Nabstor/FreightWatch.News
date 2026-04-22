'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface AtlasSection {
  mode:    string;
  content: string;
}

interface AtlasReport {
  id:          string;
  headline:    string;
  sections:    AtlasSection[];
  bottomLine:  string;
  publishedAt: string;
}

export default function AnalysisClient() {
  const [report, setReport]   = useState<AtlasReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [active, setActive]   = useState<'all' | any>('all');

  useEffect(() => {
    async function load() {
      try {
        const weekKey = new Date().toISOString().slice(0, 10);
        const cached  = localStorage.getItem('fw_analysis_v2');
        if (cached) {
          const { date, report: r } = JSON.parse(cached);
          if (date === weekKey && r) {
            setReport(r);
            setLoading(false);
            return;
          }
        }
        const res  = await fetch('/api/atlas');
        const data = await res.json();
        const r    = data.reports?.[0];
        if (r) {
          setReport(r);
          localStorage.setItem('fw_analysis_v2', JSON.stringify({ date: weekKey, report: r }));
        } else {
          setError('Analysis will be available at 10am CST.');
        }
      } catch {
        setError('Failed to load analysis.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const date = report
    ? new Date(report.publishedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        timeZone: 'America/New_York',
      })
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header active={active} onChange={setActive} search="" onSearch={() => {}} />

      <main className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #0a1628' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Freightwatch Analysis
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#0a1628', lineHeight: 1.2, marginBottom: '6px' }}>
              Freightwatch Analysis
            </h1>
            {report && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999' }}>
                {date}
              </p>
            )}
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
          ) : report ? (
            <div>
              {/* Headline */}
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#0a1628', lineHeight: 1.3, marginBottom: '32px' }}>
                {report.headline}
              </h2>

              {/* Sections */}
              {(report.sections || []).map((section, i) => (
                <div key={i} style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {section.mode}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#222', lineHeight: 1.75, margin: 0 }}>
                    {section.content}
                  </p>
                </div>
              ))}

              {/* Bottom Line */}
              {report.bottomLine && (
                <div style={{ borderLeft: '3px solid #0a1628', paddingLeft: '16px', marginTop: '8px' }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    The Bottom Line
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', color: '#0a1628', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    {report.bottomLine}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
