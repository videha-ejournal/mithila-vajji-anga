import type { Metadata } from 'next';
import ScholarlyToolbar from '../components/scholarly-toolbar';
import EditionSwitch from '../components/edition-switch';
import './globals.css';
import './bilingual-editions.css';
import './research-expansion.css';
import './learning-lab.css';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const archiveName = 'Videha Digital Research Archive';
const archiveSubtitle = 'Digital Humanities Research Environment for Mithila, Vajji & Anga';
const archiveTitle = `${archiveName} | ${archiveSubtitle}`;
const archiveDescription =
  'A permanent, citable, machine-readable, versioned and independently discoverable digital humanities research environment for the connected histories, genealogy, literature, philosophy, places, texts and chronology of Mithila, Vajji and Anga across India and Nepal.';
const previewImage = 'https://videha-ejournal.github.io/mithila-vajji-anga/assets/research-studio-panorama.png';
const faviconUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/favicon.svg';
const releaseDate = '2026-09-14';
const languageAlternates: Record<string, string> = {
  mai: siteUrl,
  en: `${siteUrl}en/`,
  'x-default': siteUrl,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: archiveTitle,
    template: `%s | ${archiveName}`,
  },
  description: archiveDescription,
  applicationName: archiveName,
  authors: [{ name: 'Gajendra Thakur', url: 'https://www.videha.co.in/' }],
  creator: 'Gajendra Thakur',
  publisher: 'Videha Maithili eJournal',
  keywords: [
    'Videha Digital Research Archive',
    'digital humanities research environment',
    'digital archive',
    'research data',
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
  alternates: { canonical: siteUrl, languages: languageAlternates },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: archiveName,
    title: archiveTitle,
    description: archiveDescription,
    images: [{ url: previewImage, width: 1944, height: 808, alt: 'Videha Digital Research Archive research panorama for Mithila, Vajji and Anga' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: archiveTitle,
    description: archiveDescription,
    images: [previewImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: 'https://videha-ejournal.github.io/mithila-vajji-anga/manifest.webmanifest',
  icons: {
    icon: [{ url: faviconUrl, type: 'image/svg+xml' }],
    shortcut: faviconUrl,
  },
  other: {
    'citation_title': archiveTitle,
    'citation_author': 'Gajendra Thakur',
    'citation_journal_title': 'Videha Maithili eJournal',
    'citation_issn': '2229-547X',
    'citation_publication_date': '2026',
    'citation_online_date': releaseDate,
    'DC.title': archiveTitle,
    'DC.creator': 'Gajendra Thakur',
    'DC.publisher': 'Videha Maithili eJournal',
    'DC.identifier': 'ISSN 2229-547X',
    'DC.language': 'mai',
    'DC.type': 'Digital Research Archive; InteractiveResource; Dataset',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: archiveName,
      alternateName: archiveSubtitle,
      description: archiveDescription,
      inLanguage: ['mai', 'en'],
      author: { '@id': `${siteUrl}#gajendra-thakur` },
      publisher: { '@id': `${siteUrl}#videha` },
      dateModified: releaseDate,
      about: [
        { '@type': 'Place', name: 'Mithila' },
        { '@type': 'Place', name: 'Vajji' },
        { '@type': 'Place', name: 'Anga' },
      ],
    },
    {
      '@type': 'DataCatalog',
      '@id': `${siteUrl}#catalog`,
      name: archiveTitle,
      url: siteUrl,
      description: archiveDescription,
      creator: { '@id': `${siteUrl}#gajendra-thakur` },
      publisher: { '@id': `${siteUrl}#videha` },
      dataset: { '@id': `${siteUrl}#dataset` },
      isAccessibleForFree: true,
      dateModified: releaseDate,
    },
    {
      '@type': 'Dataset',
      '@id': `${siteUrl}#dataset`,
      name: 'Videha Digital Research Archive structured research dataset for Mithila, Vajji & Anga',
      url: `${siteUrl}data/`,
      creator: { '@id': `${siteUrl}#gajendra-thakur` },
      publisher: { '@id': `${siteUrl}#videha` },
      dateModified: releaseDate,
      version: '2026.09',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
      includedInDataCatalog: { '@id': `${siteUrl}#catalog` },
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
    <html lang="mai" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }}
        />
        <div className="global-edition-bar">
          <span>Videha Digital Research Archive</span>
          <EditionSwitch />
        </div>
        <ScholarlyToolbar />
        {children}
      </body>
    </html>
  );
}
