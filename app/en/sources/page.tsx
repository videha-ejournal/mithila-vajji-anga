import SourceRegister from '../../source-register';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const languageAlternates: Record<string, string> = {
  mai: `${site}/sources/`,
  en: `${site}/en/sources/`,
  'x-default': `${site}/sources/`,
};

export const metadata = {
  title: 'Cited chronology records | Mithila–Vajji–Anga',
  description: 'Stable source records for the Videha historical research chronology.',
  alternates: {
    canonical: `${site}/en/sources/`,
    languages: languageAlternates,
  },
  other: { 'DC.language': 'en' },
};
export const dynamic = 'force-static';

export default function EnglishSourcesPage() {
  return <SourceRegister language="en" />;
}
