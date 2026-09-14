import UpdatesView from '../../updates-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata = {
  title: 'Status and roadmap | Mithila–Vajji–Anga',
  description: 'Changelog, completion status, release integrity and remaining source-controlled work for the living Videha research archive.',
  alternates: {
    canonical: `${site}/en/updates/`,
    languages: { mai: `${site}/updates/`, en: `${site}/en/updates/`, 'x-default': `${site}/updates/` },
  },
  other: { 'DC.language': 'en' },
};
export const dynamic = 'force-static';

export default function EnglishUpdatesPage() {
  return <UpdatesView language="en" />;
}
