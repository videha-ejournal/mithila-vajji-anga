import type { Metadata } from 'next';
import ScholarlyToolbar from '../components/scholarly-toolbar';
import EditionSwitch from '../components/edition-switch';
import VidehaPublicationIdentity from '../components/videha-publication-identity';
import libraryData from './library-data.json';
import './globals.css';
import './bilingual-editions.css';
import './research-expansion.css';
import './learning-lab.css';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const videhaUrl = 'https://www.videha.co.in/';
const videhaMirrorUrl = 'https://videha-ejournal.github.io/videha/';
const videhaGithubUrl = 'https://github.com/videha-ejournal';
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
  authors: [{ name: 'Gajendra Thakur', url: videhaUrl }],
  creator: 'Gajendra Thakur',
  publisher: 'Videha — First Maithili Fortnightly eJournal',
  keywords: [
    'Videha Digital Research Archive',
    'Videha ISSN 2229-547X',
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
    'citation_journal_title': 'Videha — First Maithili Fortnightly eJournal',
    'citation_issn': '2229-547X',
    'citation_publication_date': '2026',
    'citation_online_date': releaseDate,
    'citation_website_url': videhaUrl,
    'citation_mirror_url': videhaMirrorUrl,
    'citation_archive_network_url': videhaGithubUrl,
    'DC.title': archiveTitle,
    'DC.creator': 'Gajendra Thakur',
    'DC.publisher': 'Videha — First Maithili Fortnightly eJournal',
    'DC.identifier': 'ISSN 2229-547X',
    'DC.relation': `${videhaUrl} ; ${videhaMirrorUrl} ; ${videhaGithubUrl}`,
    'DC.language': 'mai',
    'DC.type': 'Digital Research Archive; InteractiveResource; Dataset',
  },
};

const isbnBookNodes = libraryData.flatMap((work) => {
  const isbn = work.extent.match(/ISBN\s+([0-9-]{13,17})/i)?.[1];
  if (!isbn) return [];
  return [{
    '@type': 'Book',
    '@id': `${siteUrl}#publication-${work.id}`,
    name: work.title,
    isbn,
    creator: work.creator,
    publisher: { '@id': `${siteUrl}#videha` },
    isPartOf: { '@id': `${siteUrl}#catalog` },
  }];
});

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
      isPartOf: { '@id': `${siteUrl}#videha` },
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
      url: videhaUrl,
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}#videha`,
      name: 'Videha — First Maithili Fortnightly eJournal',
      alternateName: 'Videha Maithili eJournal',
      url: videhaUrl,
      sameAs: [videhaMirrorUrl, videhaGithubUrl],
      identifier: 'ISSN 2229-547X',
    },
    ...isbnBookNodes,
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
        <VidehaPublicationIdentity />
        <ScholarlyToolbar />
        {children}
      </body>
    </html>
  );
}
