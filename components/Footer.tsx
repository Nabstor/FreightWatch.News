export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #e2e2e2', background: '#fafafa', padding: '40px 0 24px' }}>
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }} className="grid-cols-1 md:grid-cols-3">
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontFamily: "Arial, sans-serif", fontSize: '16px', fontWeight: 800, color: '#0a1628', letterSpacing: '-0.5px' }}>FREIGHTWATCH</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '10px', fontWeight: 600, color: '#d0021b' }}>.news</span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
              Freight and logistics intelligence for professionals.
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#0a1628', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Coverage</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#888', lineHeight: 2 }}>
              Trucking · Ports · Air Cargo · Rail<br/>
              World Economy · Market Intelligence
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#0a1628', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Subscribe</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
              Daily freight analysis delivered at 10am CST.<br/>
              <a href="/" style={{ color: '#0a1628', textDecoration: 'underline' }}>Sign up free</a>
            </p>
          </div>
        </div>
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#bbb' }}>
            © {new Date().getFullYear()} Freightwatch.news — Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
