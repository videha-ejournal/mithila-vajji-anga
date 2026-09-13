import type { Metadata } from 'next';
import ScholarlyToolbar from '../components/scholarly-toolbar';
import './globals.css';
import './research-expansion.css';
import './learning-lab.css';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const previewImage = 'https://videha-ejournal.github.io/mithila-vajji-anga/assets/research-studio-panorama.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Mithila–Vajji–Anga | Videha Historical Research',
    template: '%s | Mithila–Vajji–Anga',
  },
  description:
    'A scholarly, source-controlled research portal for the connected histories, genealogy, literature, philosophy, places, and texts of Mithila, Vajji, and Anga across India and Nepal.',
  applicationName: 'Mithila–Vajji–Anga · Videha Historical Research',
  authors: [{ name: 'Gajendra Thakur', url: 'https://www.videha.co.in/' }],
  creator: 'Gajendra Thakur',
  publisher: 'Videha Maithili eJournal',
  keywords: [
    'Mithila',
    'Vajji',
    'Anga',
    'Maithili',
    'Videha',
    'historical research',
    'digital humanities',
    'Panji',
    'Parallel Philosophy',
    'India',
    'Nepal',
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Mithila–Vajji–Anga',
    title: 'Mithila–Vajji–Anga | Videha Historical Research',
    description:
      'A source-controlled digital humanities research environment for Mithila, Vajji, and Anga.',
    images: [{ url: previewImage, width: 1944, height: 808, alt: 'Videha research panorama for Mithila, Vajji and Anga' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mithila–Vajji–Anga | Videha Historical Research',
    description: 'A source-controlled digital humanities research environment for Mithila, Vajji, and Anga.',
    images: [previewImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, maxImagePreview: 'large', maxSnippet: -1 },
  },
  manifest: 'https://videha-ejournal.github.io/mithila-vajji-anga/manifest.webmanifest',
  icons: { icon: './favicon.svg' },
  other: {
    'citation_title': 'Mithila–Vajji–Anga | Videha Historical Research',
    'citation_author': 'Gajendra Thakur',
    'citation_journal_title': 'Videha Maithili eJournal',
    'citation_issn': '2229-547X',
    'citation_publication_date': '2026',
    'citation_online_date': '2026-09-13',
    'DC.creator': 'Gajendra Thakur',
    'DC.publisher': 'Videha Maithili eJournal',
    'DC.identifier': 'ISSN 2229-547X',
    'DC.language': 'en',
    'DC.type': 'InteractiveResource',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: 'Mithila–Vajji–Anga · Videha Historical Research',
      description: 'A source-controlled digital humanities research portal for the connected histories of Mithila, Vajji, and Anga.',
      inLanguage: ['en', 'mai'],
      author: { '@id': `${siteUrl}#gajendra-thakur` },
      publisher: { '@id': `${siteUrl}#videha` },
      dateModified: '2026-09-13',
    },
    {
      '@type': 'Dataset',
      '@id': `${siteUrl}#dataset`,
      name: 'Mithila–Vajji–Anga scholarly research dataset',
      url: `${siteUrl}data/`,
      creator: { '@id': `${siteUrl}#gajendra-thakur` },
      publisher: { '@id': `${siteUrl}#videha` },
      dateModified: '2026-09-13',
      version: '2026.09',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}#gajendra-thakur`,
      name: 'Gajendra Thakur',
      jobTitle: 'Editor',
      affiliation: { '@id': `${siteUrl}#videha` },
      url: 'https://www.videha.co.in/',
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}#videha`,
      name: 'Videha Maithili eJournal',
      url: 'https://www.videha.co.in/',
      identifier: 'ISSN 2229-547X',
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }}
        />
        <ScholarlyToolbar />
        {children}
      </body>
    </html>
  );
}
