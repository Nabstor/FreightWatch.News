import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Freightwatch Reporter',
  description: 'Original freight and logistics reporting from Freightwatch.news.',
  alternates: { canonical: 'https://freightwatch.news/author/freightwatch-reporter' },
};

export default function AuthorPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ borderBottom: '2px solid #0a1628', paddingBottom: '32px', marginBottom: '40px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Editorial
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '36px', fontWeight: 700, color: '#0a1628', marginBottom: '8px' }}>
            Freightwatch Reporter
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#888', letterSpacing: '0.05em', marginBottom: '20px' }}>
            Freightwatch.news
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#444', lineHeight: 1.7, maxWidth: '600px' }}>
            Original freight and logistics intelligence from the Freightwatch editorial team. Covering trucking, ports, air cargo, rail and global trade.
          </p>
        </div>
        <a href="/" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#0a1628', textDecoration: 'none', letterSpacing: '0.05em' }}>
          ← Back to Freightwatch.news
        </a>
      </div>
    </div>
  );
}
