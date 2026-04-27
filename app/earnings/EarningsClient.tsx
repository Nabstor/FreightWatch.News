'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EARNINGS_DATA, LAST_UPDATED, NEXT_UPDATE, type EarningsEntry } from '@/lib/earningsData';

const MODE_COLORS: Record<string, string> = {
  'Parcel':              '#6b3fa0',
  'Parcel / Air':        '#6b3fa0',
  'LTL':                 '#0a5c8a',
  'Truckload / LTL':     '#1a5c2a',
  'Intermodal / TL':     '#8a4a0a',
  'Intermodal / Drayage':'#8a4a0a',
  '3PL / Brokerage':     '#0a5c8a',
  'Freight Forwarding':  '#8a4a0a',
  'Asset-Light TL':      '#1a5c2a',
};

function ModeBadge({ mode }: { mode: string }) {
  const color = MODE_COLORS[mode] || '#333';
  return (
    <span style={{
      display: 'inline-block',
      background: color + '18',
      color,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      padding: '2px 6px',
      borderRadius: '2px',
    }}>
      {mode}
    </span>
  );
}

function EarningsCard({ entry }: { entry: EarningsEntry }) {
  const up = entry.revenueYoY >= 0;
  return (
    <div style={{
      border: '1px solid #e8e8e8',
      padding: '20px',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Header row: ticker + beat/miss */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '18px', fontWeight: 700, color: '#0a1628' }}>
              {entry.ticker}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#bbb' }}>
              {entry.exchange}
            </span>
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#888', marginBottom: '6px' }}>
            {entry.name}
          </div>
          <ModeBadge mode={entry.mode} />
        </div>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: entry.beat ? '#1a7a3f' : '#d0021b',
          background: entry.beat ? '#1a7a3f18' : '#d0021b18',
          padding: '3px 8px',
          borderRadius: '2px',
          whiteSpace: 'nowrap',
        }}>
          {entry.beat ? '▲ Beat' : '▼ Miss'}
        </span>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>Revenue</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '20px', fontWeight: 700, color: '#0a1628', lineHeight: 1, marginBottom: '5px' }}>
            {entry.revenue}
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, color: up ? '#1a7a3f' : '#d0021b' }}>
            {up ? '▲' : '▼'}{Math.abs(entry.revenueYoY).toFixed(1)}%
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#bbb', marginLeft: '3px' }}>YoY</span>
        </div>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>EPS</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '20px', fontWeight: 700, color: '#0a1628', lineHeight: 1, marginBottom: '5px' }}>
            {entry.eps}
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#bbb' }}>
            est. {entry.epsEstimate}
          </span>
        </div>
      </div>

      {/* Footer row: quarter + next report + notes */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#aaa' }}>{entry.quarter}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#aaa' }}>
            Next: {entry.nextEarnings}
          </span>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#777', lineHeight: 1.5, margin: 0 }}>
          {entry.notes}
        </p>
      </div>
    </div>
  );
}

export default function EarningsClient() {
  const [active, setActive] = useState<'all' | any>('all');

  const beats  = EARNINGS_DATA.filter(e => e.beat).length;
  const misses = EARNINGS_DATA.length - beats;

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header active={active} onChange={setActive} search="" onSearch={() => {}} />

      <main className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ paddingTop: '40px', paddingBottom: '60px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #0a1628' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Logistics Q. Earnings
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#0a1628', lineHeight: 1.2, marginBottom: '6px' }}>
            Top 10 Freight &amp; Logistics Earnings
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#666' }}>
            Quarterly snapshot for publicly traded carriers, brokers, and forwarders — sorted by revenue.
          </p>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', marginBottom: '28px', padding: '14px 20px', background: '#fafafa', border: '1px solid #e8e8e8' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Period</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#0a1628' }}>{LAST_UPDATED}</div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e2e2' }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Beat</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#1a7a3f' }}>{beats}/{EARNINGS_DATA.length}</div>
          </div>
          <div style={{ width: '1px', height: '28px', background: '#e2e2e2' }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Miss</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#d0021b' }}>{misses}/{EARNINGS_DATA.length}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Next Update</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#0a1628' }}>{NEXT_UPDATE}</div>
          </div>
        </div>

        {/* Card grid — 1 col mobile, 2 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EARNINGS_DATA.map(entry => (
            <EarningsCard key={entry.ticker} entry={entry} />
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e2e2' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#bbb', letterSpacing: '0.05em' }}>
            Data updated quarterly. Figures sourced from public earnings releases. Not financial advice.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
