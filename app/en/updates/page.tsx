import UpdatesView from '../../updates-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const languageAlternates: Record<string, string> = {
  mai: `${site}/updates/`,
  en: `${site}/en/updates/`,
  'x-default': `${site}/updates/`,
};

export const metadata = {
  title: 'Status and roadmap | Mithila–Vajji–Anga',
  description: 'Changelog, completion status, release integrity and remaining source-controlled work for the living Videha research archive.',
  alternates: {
    canonical: `${site}/en/updates/`,
    languages: languageAlternates,
  },
  other: { 'DC.language': 'en' },
};
export const dynamic = 'force-static';

export default function EnglishUpdatesPage() {
  return <UpdatesView language="en" />;
}
