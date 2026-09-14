import IsbnView from '../../isbn-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata = {
  title: 'Videha ISBN Authority Registry',
  description: 'The authoritative 293-record Videha ISBN allotment registry derived from the editor-supplied ISBN.gov.in export.',
  alternates: {
    canonical: `${site}/en/isbn/`,
    languages: { mai: `${site}/isbn/`, en: `${site}/en/isbn/`, 'x-default': `${site}/isbn/` },
  },
  other: { 'DC.language': 'en' },
};

export default function EnglishIsbnRegistryPage() {
  return <IsbnView language="en" />;
}
