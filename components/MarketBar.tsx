'use client';
import { useEffect, useState } from 'react';

interface FuelPrice {
  label:  string;
  value:  string;
  unit:   string;
  change: number;
}

export function MarketBar() {
  const [fuel, setFuel]       = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive]       = useState(false);

  useEffect(() => {
    fetch('/api/markets')
      .then(r => r.json())
      .then(data => {
        setFuel(data.fuel || []);
        setLive(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fuelItem = (f: FuelPrice) => {
    const up = f.change >= 0;
    return (
      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', borderRight: '1px solid #e8e8e8', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {f.label}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#0a1628' }}>
          {f.unit === '$/gal' ? `$${f.value}` : `$${f.value}`}
          <span style={{ fontSize: '10px', color: '#888', marginLeft: '2px' }}>{f.unit}</span>
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: up ? '#1a7a3f' : '#d0021b', fontWeight: 600 }}>
          {up ? '▲' : '▼'}{Math.abs(f.change).toFixed(f.unit === '$/gal' ? 4 : 2)}
        </span>
      </div>
    );
  };

  if (loading || fuel.length === 0) return null;

  return (
    <div style={{ borderBottom: '1px solid #e2e2e2', background: '#fafafa' }}>
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', height: '40px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.12em', textTransform: 'uppercase', paddingRight: '20px', borderRight: '1px solid #e2e2e2', whiteSpace: 'nowrap' }}>
            Fuel & Oil
          </span>
          {fuel.map(fuelItem)}
          {live && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#1a7a3f', marginLeft: 'auto', paddingLeft: '16px', whiteSpace: 'nowrap' }}>
              ● LIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
