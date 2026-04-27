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

function BeatBadge({ beat }: { beat: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      background: beat ? '#1a7a3f18' : '#d0021b18',
      color: beat ? '#1a7a3f' : '#d0021b',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '2px 6px',
      borderRadius: '2px',
    }}>
      {beat ? '▲ Beat' : '▼ Miss'}
    </span>
  );
}

function YoYBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '11px',
      fontWeight: 600,
      color: up ? '#1a7a3f' : '#d0021b',
    }}>
      {up ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function EarningsRow({ entry, isLast }: { entry: EarningsEntry; isLast: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 90px 110px 130px 110px 110px',
      alignItems: 'center',
      gap: '0',
      padding: '14px 0',
      borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
    }}
      className="earnings-row"
    >
      {/* Company */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#0a1628' }}>
            {entry.ticker}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#bbb' }}>
            {entry.exchange}
          </span>
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#666', marginBottom: '5px' }}>
          {entry.name}
        </div>
        <ModeBadge mode={entry.mode} />
      </div>

      {/* Quarter */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888' }}>
        {entry.quarter}
      </div>

      {/* Revenue */}
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#0a1628', marginBottom: '3px' }}>
          {entry.revenue}
        </div>
        <YoYBadge pct={entry.revenueYoY} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#bbb', marginLeft: '3px' }}>YoY</span>
      </div>

      {/* EPS */}
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#0a1628', marginBottom: '3px' }}>
          {entry.eps}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BeatBadge beat={entry.beat} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#bbb' }}>
            est. {entry.epsEstimate}
          </span>
        </div>
      </div>

      {/* Next report */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#888' }}>
        {entry.nextEarnings}
      </div>

      {/* Notes */}
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#888', lineHeight: 1.5 }}>
        {entry.notes}
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
        <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #0a1628' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Logistics Q. Earnings
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#0a1628', lineHeight: 1.2, marginBottom: '8px' }}>
            Top 10 Freight &amp; Logistics Earnings
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#666' }}>
            Quarterly earnings snapshot for publicly traded carriers, brokers, and forwarders.
          </p>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '28px', padding: '14px 20px', background: '#fafafa', border: '1px solid #e8e8e8' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Reporting Period</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#0a1628' }}>{LAST_UPDATED}</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: '#e2e2e2' }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Beat Estimate</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#1a7a3f' }}>{beats} / {EARNINGS_DATA.length}</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: '#e2e2e2' }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Missed Estimate</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#d0021b' }}>{misses} / {EARNINGS_DATA.length}</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: '#e2e2e2' }} />
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Next Update</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#0a1628' }}>{NEXT_UPDATE}</div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 90px 110px 130px 110px 110px',
          gap: '0',
          padding: '0 0 8px',
          borderBottom: '2px solid #0a1628',
          marginBottom: '4px',
        }}>
          {['Company', 'Quarter', 'Revenue', 'EPS vs Est.', 'Next Report', 'Context'].map(h => (
            <span key={h} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Earnings rows */}
        <div>
          {EARNINGS_DATA.map((entry, i) => (
            <EarningsRow key={entry.ticker} entry={entry} isLast={i === EARNINGS_DATA.length - 1} />
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
