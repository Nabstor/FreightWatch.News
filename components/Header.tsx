'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const isHome   = pathname === '/';
  const navCats  = Object.entries(CATEGORIES).filter(([k]) => k !== 'breaking' && k !== 'market-rates');

  return (
    <header style={{ borderBottom: '1px solid #e2e2e2', background: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

      {/* Top bar */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Logo />

        {/* Desktop: Market Intel + Search */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/market-intel"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#fff', background: '#0a1628', padding: '6px 14px', letterSpacing: '0.05em', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d0021b')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0a1628')}
          >
            Market Intel
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

        {/* Mobile: Market Intel + Search icon only */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/market-intel" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#fff', background: '#0a1628', padding: '4px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Market Intel
          </Link>
          <button onClick={() => setShowSearch(!showSearch)} aria-label="Toggle search" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
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

            return isHome ? (
              <button
                key={key}
                onClick={() => onChange(key)}
                aria-current={isActive ? 'page' : undefined}
                style={{ ...baseStyle, background: 'none', border: 'none', borderBottom: isActive ? '2px solid #0a1628' : '2px solid transparent', cursor: 'pointer' }}
              >
                {label}
              </button>
            ) : (
              <a key={key} href="/" style={{ ...baseStyle, textDecoration: 'none', display: 'inline-block' }}>
                {label}
              </a>
            );
          })}

          {/* Analysis — last tab, links to its own page */}
          <a
            href="/analysis"
            style={{
              padding: '9px 12px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderBottom: '2px solid transparent',
              color: '#888',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Analysis
          </a>
        </div>
      </div>
    </header>
  );
}
