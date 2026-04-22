import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://freightwatch.news'),
  title: {
    default: 'Freightwatch.news — Freight & Logistics Intelligence',
    template: '%s | Freightwatch.news',
  },
  description: 'Daily freight market intelligence. Trucking, ports, air cargo, rail and world economy news for logistics professionals.',
  keywords: ['freight news', 'logistics intelligence', 'trucking market', 'freight rates', 'supply chain news', 'air cargo', 'maritime news', 'freight analytics', 'DAT rates', 'FreightWaves'],
  authors: [{ name: 'Freightwatch.news' }],
  creator: 'Freightwatch.news',
  publisher: 'Freightwatch.news',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: 'Freightwatch.news — Freight & Logistics Intelligence',
    description: 'Daily freight market intelligence. Trucking, ports, air cargo, rail and world economy news for logistics professionals.',
    url: 'https://freightwatch.news',
    siteName: 'Freightwatch.news',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: '/og-image.svg',
      width: 1200,
      height: 630,
      alt: 'Freightwatch.news — Freight & Logistics Intelligence',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freightwatch.news — Freight & Logistics Intelligence',
    description: 'Daily freight market intelligence. Trucking, ports, air cargo, rail and world economy news for logistics professionals.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: 'https://freightwatch.news',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://query1.finance.yahoo.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Structured data — NewsMediaOrganization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'Freightwatch.news',
              url: 'https://freightwatch.news',
              description: 'Daily freight market intelligence for logistics professionals.',
              foundingDate: '2024',
              logo: {
                '@type': 'ImageObject',
                url: 'https://freightwatch.news/og-image.svg',
              },
              sameAs: ['https://freightwatch.news'],
            }),
          }}
        />
      </head>
      <body>
        {children}
        {/* Google Analytics GA4 — loads after page is interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-23ZQK2LKSF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-23ZQK2LKSF', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
