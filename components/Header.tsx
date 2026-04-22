'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Category, CATEGORIES } from '@/lib/feeds';

interface HeaderProps {
  active:   Category | 'all';
  onChange: (c: Category | 'all') => void;
  search:   string;
  onSearch: (s: string) => void;
}

export function Header({ active, onChange, search, onSearch }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const navCats = Object.entries(CATEGORIES).filter(([k]) => k !== 'breaking');

  return (
    <header style={{ borderBottom: '1px solid #e2e2e2', background: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

      {/* Top bar */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Logo />

        {/* Desktop: Analysis + Search */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/analysis"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#fff', background: '#0a1628', padding: '6px 14px', letterSpacing: '0.05em', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d0021b')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0a1628')}
          >
            Analysis
          </Link>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999', width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search freight news..."
              value={search}
              onChange={e => onSearch(e.target.value)}
              style={{ border: '1px solid #e2e2e2', fontSize: '13px', paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', width: '240px', outline: 'none', fontFamily: "'Inter', sans-serif" }}
            />
          </div>
        </div>

        {/* Mobile: Analysis + Search icon only */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/analysis" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#fff', background: '#0a1628', padding: '4px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Analysis
          </Link>
          <button onClick={() => setShowSearch(!showSearch)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile search — toggleable */}
      {showSearch && (
        <div className="md:hidden px-4 pb-2">
          <input
            type="text"
            placeholder="Search freight news..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            autoFocus
            style={{ width: '100%', border: '1px solid #e2e2e2', fontSize: '13px', padding: '7px 12px', outline: 'none', fontFamily: "'Inter', sans-serif" }}
          />
        </div>
      )}

      {/* Category nav — ALWAYS visible, scrollable on mobile */}
      <div style={{ borderTop: '1px solid #e2e2e2', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', padding: '0 16px', minWidth: 'max-content' }}>
          {(['all', ...navCats.map(([k]) => k)] as (Category | 'all')[]).map(key => {
            const label = key === 'all' ? 'All News' : CATEGORIES[key as Category]?.label;
            const isMarketIntel = key === 'market-rates';
            const isActive = active === key;
            const baseStyle = {
              padding: '9px 12px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
              borderBottom: isActive ? '2px solid #0a1628' : '2px solid transparent',
              color: isActive ? '#0a1628' : '#888',
              whiteSpace: 'nowrap' as const,
              flexShrink: 0,
            };

            return isMarketIntel ? (
              <a
                key={key}
                href="/market-intel"
                style={{ ...baseStyle, textDecoration: 'none', display: 'inline-block' }}
              >
                {label}
              </a>
            ) : (
              <button
                key={key}
                onClick={() => onChange(key)}
                style={{ ...baseStyle, background: 'none', border: 'none', borderBottom: isActive ? '2px solid #0a1628' : '2px solid transparent', cursor: 'pointer' }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
