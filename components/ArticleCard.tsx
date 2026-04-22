'use client';
import { useState } from 'react';
import { Article, CATEGORIES } from '@/lib/feeds';

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Tag({ category, isBreaking }: { category: Article['category']; isBreaking?: boolean }) {
  const cat = CATEGORIES[category];
  if (!cat) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
      {isBreaking && (
        <span style={{ display: 'inline-block', background: '#d0021b', color: '#fff', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '2px' }}>Breaking</span>
      )}
      <span style={{ display: 'inline-block', background: cat.color + '18', color: cat.color, fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '2px' }}>{cat.label}</span>
    </div>
  );
}

function AISummary({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <div className="ai-summary">
      <span className="ai-badge">AI Summary</span>
      <p>{summary}</p>
    </div>
  );
}

function ArticleImage({ url, size = 'hero' }: { url?: string; size?: 'hero' | 'grid' | 'thumb' }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return null;
  const styles: Record<string, React.CSSProperties> = {
    hero:  { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', marginBottom: '12px', background: '#f0f0f0' },
    grid:  { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', marginBottom: '8px', background: '#f0f0f0' },
    thumb: { width: '72px', height: '52px', objectFit: 'cover', flexShrink: 0, background: '#f0f0f0' },
  };
  return <img src={url} alt="" loading="lazy" decoding="async" style={styles[size]} onError={() => setFailed(true)} />;
}

const metaStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#999',
};

// ── HERO ─────────────────────────────────────────────────────────
export function HeroCard({ article }: { article: Article }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ display: 'block', textDecoration: 'none' }}>
      <ArticleImage url={article.imageUrl} size="hero" />
      <Tag category={article.category} isBreaking={article.isBreaking} />
      <div className="summary-hover" style={{ position: 'relative' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, lineHeight: 1.3, color: '#111', marginBottom: '8px' }}>
          {article.title}
        </h2>
        <AISummary summary={article.aiSummary} />
      </div>
      {!article.aiSummary && article.summary && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#555', lineHeight: 1.6, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.summary}
        </p>
      )}
      <div style={metaStyle}>
        <span style={{ fontWeight: 600, color: '#0a1628' }}>{article.source}</span>
        <span>·</span>
        <span>{timeAgo(article.publishedAt)}</span>
        {article.aiSummary && <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#bbb' }}>hover for AI summary</span>}
      </div>
    </a>
  );
}

// ── GRID ─────────────────────────────────────────────────────────
export function GridCard({ article }: { article: Article }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ display: 'block', textDecoration: 'none' }}>
      <ArticleImage url={article.imageUrl} size="grid" />
      <Tag category={article.category} isBreaking={article.isBreaking} />
      <div className="summary-hover" style={{ position: 'relative' }}>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px', fontWeight: 700, lineHeight: 1.35, color: '#111', marginBottom: '6px' }}>
          {article.title}
        </h3>
        <AISummary summary={article.aiSummary} />
      </div>
      <div style={metaStyle}>
        <span style={{ fontWeight: 600, color: '#0a1628' }}>{article.source}</span>
        <span>·</span>
        <span>{timeAgo(article.publishedAt)}</span>
      </div>
    </a>
  );
}

// ── LIST ROW ─────────────────────────────────────────────────────
export function ListRow({ article }: { article: Article }) {
  const cat = CATEGORIES[article.category];
  if (!cat) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid #ebebeb' }}>
      <ArticleImage url={article.imageUrl} size="thumb" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Tag category={article.category} isBreaking={article.isBreaking} />
        <div className="summary-hover" style={{ position: 'relative' }}>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ textDecoration: 'none' }}>
            <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111', lineHeight: 1.4, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.title}
            </h4>
          </a>
          <AISummary summary={article.aiSummary} />
        </div>
        <div style={metaStyle}>
          <span style={{ fontWeight: 600, color: '#0a1628' }}>{article.source}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ──────────────────────────────────────────────────────
export function SidebarItem({ article, showDivider = true }: { article: Article; showDivider?: boolean }) {
  const cat = CATEGORIES[article.category];
  if (!cat) return null;
  return (
    <div style={{ padding: '10px 0', borderBottom: showDivider ? '1px solid #ebebeb' : 'none' }}>
      <span style={{ display: 'inline-block', background: cat.color + '18', color: cat.color, fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '2px', marginBottom: '5px' }}>
        {cat.label}
      </span>
      <div className="summary-hover" style={{ position: 'relative' }}>
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ textDecoration: 'none' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#111', lineHeight: 1.4, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.isBreaking && <span style={{ color: '#d0021b', marginRight: '4px' }}>●</span>}
            {article.title}
          </p>
        </a>
        <AISummary summary={article.aiSummary} />
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#999' }}>{article.source} · {timeAgo(article.publishedAt)}</p>
    </div>
  );
}
