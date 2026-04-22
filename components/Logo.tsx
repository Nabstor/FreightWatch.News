'use client';
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <svg viewBox="0 0 36 36" height="32" width="32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="15" stroke="#0a1628" strokeWidth="1.5"/>
        <circle cx="18" cy="18" r="9" stroke="#0a1628" strokeWidth="1" opacity="0.3"/>
        <circle cx="18" cy="18" r="3.5" fill="#d0021b"/>
        <line x1="18" y1="3"  x2="18" y2="10" stroke="#0a1628" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="26" x2="18" y2="33" stroke="#0a1628" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
        <line x1="3"  y1="18" x2="10" y2="18" stroke="#0a1628" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
        <line x1="26" y1="18" x2="33" y2="18" stroke="#0a1628" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      </svg>
      <div style={{ lineHeight: 1 }}>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '19px', fontWeight: 800, color: '#0a1628', letterSpacing: '-0.5px' }}>
          FREIGHTWATCH
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: '13px', fontWeight: 600, color: '#d0021b' }}>
          .news
        </span>
      </div>
    </div>
  );
}
