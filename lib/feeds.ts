export type Category =
  | 'breaking'
  | 'trucking'
  | 'ports'
  | 'air-cargo'
  | 'rail'
  | 'market-rates'
  | 'world-economy';

export const CATEGORIES: Record<Category, { label: string; color: string }> = {
  'breaking':      { label: 'Breaking',      color: '#d0021b' },
  'trucking':      { label: 'Trucking',       color: '#1a5c2a' },
  'ports':         { label: 'Ports',          color: '#0a5c8a' },
  'air-cargo':     { label: 'Air Cargo',      color: '#6b3fa0' },
  'rail':          { label: 'Rail',           color: '#8a4a0a' },
  'market-rates':  { label: 'Market Intel',   color: '#0a5c8a' },
  'world-economy': { label: 'World Economy',  color: '#333333' },
};

export interface FeedSource {
  url:      string;
  source:   string;
  category: Category;
  trusted:  boolean;
}

export const FEED_SOURCES: FeedSource[] = [

  // ── Breaking ────────────────────────────────────────────────────
  // Only trusted freight/finance sources for breaking
  { url: 'https://www.freightwaves.com/news/feed',                                       source: 'FreightWaves',           category: 'breaking',      trusted: true  },
  { url: 'https://feeds.bloomberg.com/markets/news.rss',                                 source: 'Bloomberg',              category: 'breaking',      trusted: false },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',                        source: 'CNBC',                   category: 'breaking',      trusted: false },

  // ── Trucking — FreightWaves Truckload & LTL only ─────────────────
  { url: 'https://www.freightwaves.com/news/category/truckload/feed',                    source: 'FreightWaves',           category: 'trucking',      trusted: true  },
  { url: 'https://www.freightwaves.com/news/category/ltl/feed',                          source: 'FreightWaves',           category: 'trucking',      trusted: true  },
  { url: 'https://www.truckingdive.com/feeds/news/',                                     source: 'Trucking Dive',          category: 'trucking',      trusted: true  },
  { url: 'https://www.ccjdigital.com/feed/',                                             source: 'CCJ Digital',            category: 'trucking',      trusted: true  },
  { url: 'https://www.fleetowner.com/rss/all',                                           source: 'Fleet Owner',            category: 'trucking',      trusted: true  },
  { url: 'https://www.dat.com/blog/feed/',                                               source: 'DAT Freight',            category: 'trucking',      trusted: true  },

  // ── Ports & Maritime — strict maritime/ocean logistics only ──────
  // FreightWaves maritime, JOC, Maritime Executive, The Loadstar
  { url: 'https://www.freightwaves.com/news/category/maritime/feed',                     source: 'FreightWaves',           category: 'ports',         trusted: true  },
  { url: 'https://www.joc.com/rss/all',                                                  source: 'Journal of Commerce',    category: 'ports',         trusted: true  },
  { url: 'https://maritime-executive.com/rss',                                           source: 'Maritime Executive',     category: 'ports',         trusted: true  },
  { url: 'https://theloadstar.com/feed/',                                                source: 'The Loadstar',           category: 'ports',         trusted: true  },
  { url: 'https://www.marinelink.com/rss/news',                                          source: 'Marine Link',            category: 'ports',         trusted: true  },
  { url: 'https://ajot.com/feed/rss/',                                                   source: 'AJOT',                   category: 'ports',         trusted: true  },
  { url: 'https://feeds.bloomberg.com/transportation/news.rss',                          source: 'Bloomberg Transport',    category: 'ports',         trusted: false },

  // ── Air Cargo — strict air freight and cargo only ────────────────
  // Only dedicated air cargo/freight sources
  { url: 'https://www.aircargonews.net/feed/',                                           source: 'Air Cargo News',         category: 'air-cargo',     trusted: true  },
  { url: 'https://www.aircargoworld.com/feed/',                                          source: 'Air Cargo World',        category: 'air-cargo',     trusted: true  },
  { url: 'https://www.freightwaves.com/news/category/air-cargo/feed',                    source: 'FreightWaves',           category: 'air-cargo',     trusted: true  },
  { url: 'https://www.stat-trade.com/feed/',                                             source: 'STAT Times',             category: 'air-cargo',     trusted: true  },

  // ── Rail ─────────────────────────────────────────────────────────
  { url: 'https://www.freightwaves.com/news/category/railroad/feed',                     source: 'FreightWaves',           category: 'rail',          trusted: true  },
  { url: 'https://www.railwayage.com/feed/',                                             source: 'Railway Age',            category: 'rail',          trusted: true  },

  // ── Market Intel ─────────────────────────────────────────────────
  { url: 'https://www.dat.com/blog/feed/',                                               source: 'DAT Freight',            category: 'market-rates',  trusted: true  },
  { url: 'https://www.freightos.com/freight-resources/feed/',                            source: 'Freightos',              category: 'market-rates',  trusted: false },
  { url: 'https://www.xeneta.com/blog/feed/',                                            source: 'Xeneta',                 category: 'market-rates',  trusted: false },
  { url: 'https://www.uberfreight.com/feed/',                                            source: 'Uber Freight',           category: 'market-rates',  trusted: true  },

  // ── World Economy ────────────────────────────────────────────────
  { url: 'https://feeds.bloomberg.com/economics/news.rss',                               source: 'Bloomberg',              category: 'world-economy', trusted: false },
  { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',                                  source: 'WSJ',                    category: 'world-economy', trusted: false },
  { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',                         source: 'CNBC Markets',           category: 'world-economy', trusted: false },
  { url: 'https://www.economist.com/finance-and-economics/rss.xml',                      source: 'The Economist',          category: 'world-economy', trusted: false },
  { url: 'https://feeds.npr.org/1006/rss.xml',                                           source: 'NPR Economy',            category: 'world-economy', trusted: false },

];

export interface Article {
  id:          string;
  title:       string;
  summary:     string;
  url:         string;
  source:      string;
  category:    Category;
  publishedAt: string;
  imageUrl?:   string;
  isBreaking:  boolean;
  aiSummary?:  string;
}
