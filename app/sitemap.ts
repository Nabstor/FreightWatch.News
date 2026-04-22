import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: 'https://freightwatch.news',
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: 'https://freightwatch.news/analysis',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://freightwatch.news/market-intel',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
