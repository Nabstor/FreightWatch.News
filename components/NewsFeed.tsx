'use client';
import { useCallback, useEffect, useState } from 'react';
import { Article, Category, CATEGORIES } from '@/lib/feeds';
import { Header } from './Header';
import { Ticker } from './Ticker';
import { MarketBar } from './MarketBar';
import { HeroCard, GridCard, ListRow, SidebarItem } from './ArticleCard';
import { NewsletterSignup } from './NewsletterSignup';
import { NewsletterPopup } from './NewsletterPopup';
import { Footer } from './Footer';

function titleKey(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
}

function dedupe(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter(a => {
    const k = titleKey(a.title);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildCuratedFeed(articles: Article[]): Article[] {
  const cats: Category[] = ['breaking', 'trucking', 'ports', 'air-cargo', 'rail', 'market-rates', 'world-economy'];
  const result: Article[] = [];
  const usedTitles = new Set<string>();

  for (let round = 0; round < 5; round++) {
    for (const cat of cats) {
      const catArticles = articles.filter(a => a.category === cat);
      const pick = catArticles.find(a => {
        const k = titleKey(a.title);
        return !usedTitles.has(k);
      });
      if (pick) {
        result.push(pick);
        usedTitles.add(titleKey(pick.title));
      }
    }
  }

  for (const a of articles) {
    if (result.length >= 80) break;
    const k = titleKey(a.title);
    if (!usedTitles.has(k)) {
      result.push(a);
      usedTitles.add(k);
    }
  }

  return result;
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'flex', gap: '16px', animation: 'pulse 1.5s infinite' }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: '12px', background: '#f0f0f0', borderRadius: '2px', marginBottom: '8px', width: '30%' }} />
            <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '2px', marginBottom: '6px' }} />
            <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '2px', width: '75%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewsFeed() {
  const [articles, setArticles]       = useState<Article[]>([]);
  const [loading, setLoading]         = useState(true);
  const [active, setActive]           = useState<Category | 'all'>('all');
  const [search, setSearch]           = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent && articles.length === 0) setLoading(true);
    try {
      if (!silent) {
        const cached = sessionStorage.getItem('fw_articles');
        if (cached) {
          const { data: d, at } = JSON.parse(cached);
          if (Date.now() - at < 10 * 60 * 1000) {
            setArticles(d);
            setLastUpdated(new Date(at));
            setLoading(false);
            return;
          }
        }
      }
      // Try rewritten Freightwatch articles first
      const rewriteRes  = await fetch('/api/rewrite');
      const rewriteData = await rewriteRes.json();
      let arts = rewriteData.articles || [];

      // If no rewritten articles yet, trigger rewrite and fall back to RSS
      if (arts.length === 0) {
        const res  = await fetch('/api/articles?limit=200');
        const data = await res.json();
        arts = (data.articles || []).map((a: any) => ({
          ...a,
          byline: 'Freightwatch Reporter',
        }));
        // Trigger rewrite in background
        fetch('/api/rewrite', { method: 'POST', headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` } }).catch(() => {});
      }
      setArticles(arts);
      setLastUpdated(new Date());
      sessionStorage.setItem('fw_articles', JSON.stringify({ data: arts, at: Date.now() }));
    } catch (e) {
      console.error('Failed to load articles', e);
    } finally {
      setLoading(false);
    }
  }, [articles.length]);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 6 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Filter by search and category
  let base = search
    ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.source.toLowerCase().includes(search.toLowerCase()))
    : articles;

  if (active !== 'all') base = base.filter(a => a.category === active);

  const displayArticles = active === 'all' && !search ? buildCuratedFeed(base) : dedupe(base);

  const hero        = displayArticles[0] || null;
  const gridStories = displayArticles.slice(1, 4);
  const listStories = displayArticles.slice(4);

  const sidebarCats: Category[] = ['ports', 'trucking', 'air-cargo', 'rail', 'world-economy'];

  return (
    <>
      <Header active={active} onChange={setActive} search={search} onSearch={setSearch} />
      <Ticker />
      <MarketBar />

      <main className="max-w-screen-xl mx-auto px-4 md:px-6" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
        {loading && articles.length === 0 ? (
          <Skeleton />
        ) : displayArticles.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: '#666' }}>No stories found</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#999', marginTop: '8px' }}>Try a different search or section</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '32px' }}>
            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Status bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e2e2' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {active === 'all' ? 'Top Stories — All Categories' : CATEGORIES[active as Category]?.label}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>
                  {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''} · {displayArticles.length} stories
                </span>
              </div>

              {/* Hero + grid */}
              {hero && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0, paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid #e2e2e2' }}
                  className="md:grid-cols-12">
                  <div className="md:col-span-7" style={{ paddingRight: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.paddingRight = '')}
                  >
                    <div className="md:pr-8 md:border-r md:border-[#e2e2e2]">
                      {active === 'all' && (
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#d0021b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                          {CATEGORIES[hero.category as Category]?.label}
                        </p>
                      )}
                      <HeroCard article={hero} />
                    </div>
                  </div>
                  <div className="md:col-span-5 md:pl-8" style={{ marginTop: '20px' }} data-md-margin-top="0">
                    {gridStories.map(a => (
                      <div key={a.id} style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid #ebebeb' }}>
                        {active === 'all' && (
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#0a5c8a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {CATEGORIES[a.category as Category]?.label}
                          </p>
                        )}
                        <GridCard article={a} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* More stories label */}
              {listStories.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>More Stories</span>
                  <div style={{ flex: 1, borderTop: '1px solid #e2e2e2' }} />
                </div>
              )}

              {/* List stories */}
              <div>
                {listStories.map(a => (
                  <ListRow key={a.id} article={a} />
                ))}
              </div>

            </div>

            {/* Sidebar */}
            <div className="hidden lg:block" style={{ width: '300px', flexShrink: 0 }}>
              <div style={{ position: 'sticky', top: '80px' }}>
                <NewsletterSignup />
                <div style={{ marginTop: '28px' }}>
                  {sidebarCats.map(cat => {
                    const items = dedupe(articles.filter(a => a.category === cat)).slice(0, 3);
                    if (!items.length) return null;
                    return (
                      <div key={cat} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#0a1628', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {CATEGORIES[cat].label}
                          </span>
                          <div style={{ flex: 1, borderTop: '1px solid #e2e2e2' }} />
                        </div>
                        {items.map((a, i) => <SidebarItem key={a.id} article={a} showDivider={i < items.length - 1} />)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <NewsletterPopup />
    </>
  );
}
