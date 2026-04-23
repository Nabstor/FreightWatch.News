import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/lib/rewriter';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

import { notFound } from 'next/navigation';
  import { getArticleBySlug } from '@/lib/rewriter';
  
  export const dynamic = 'force-dynamic';
  
  export default async function ArticlePage({ params }: { params: { slug: string } }) {
      const article = await getArticleBySlug(params.slug);
      if (!article) notFound();
    
      const date = new Date(article.publishedAt).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            timeZone: 'America/New_York',
      });
    
      const paragraphs = article.body.split('\n\n').filter((p: string) => p.trim());
    
      return (
            <div style={{ minHeight: '100vh', background: '#fff' }}>
                    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
                              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
                                {article.category}
                              </p>p>
                              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', fontWeight: 700, color: '#0a1628', lineHeight: 1.3, marginBottom: '20px' }}>
                                {article.title}
                              </h1>h1>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid #e2e2e2', marginBottom: '32px' }}>
                                          <div>
                                                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0a1628', margin: 0 }}>Freightwatch Reporter</p>p>
                                                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#888', margin: '2px 0 0 0' }}>Freightwatch.news</p>p>
                                          </div>div>
                                        <span style={{ color: '#ccc' }}>·</span>span>
                                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999', margin: 0 }}>{date}</p>p>
                              </div>div>
                      {paragraphs.map((p: string, i: number) => (
                        <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', color: '#222', lineHeight: 1.8, marginBottom: '20px' }}>{p}</p>p>
                      ))}
                            <div style={{ marginTop: '40px' }}>
                                      <a href="/" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#0a1628', textDecoration: 'none' }}>Back to Freightwatch.news</a>a>
                            </div>div>
                    </div>div>
            </div>div>
          );
  }</div>const date = new Date(article.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/New_York',
  });

  const paragraphs = article.body.split('\n\n').filter((p: string) => p.trim());

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
          {article.category}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', fontWeight: 700, color: '#0a1628', lineHeight: 1.3, marginBottom: '20px' }}>
          {article.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid #e2e2e2', marginBottom: '32px' }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0a1628', margin: 0 }}>Freightwatch Reporter</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#888', margin: '2px 0 0 0' }}>Freightwatch.news</p>
          </div>
          <span style={{ color: '#ccc' }}>·</span>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#999', margin: 0 }}>{date}</p>
        </div>
        {paragraphs.map((p: string, i: number) => (
          <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', color: '#222', lineHeight: 1.8, marginBottom: '20px' }}>{p}</p>
        ))}
        <div style={{ marginTop: '40px' }}>
          <a href="/" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#0a1628', textDecoration: 'none' }}>← Back to Freightwatch.news</a>
        </div>
      </div>
    </div>
  );
}
