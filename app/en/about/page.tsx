import AboutView from '../../about-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const languageAlternates: Record<string, string> = {
  mai: `${site}/about/`,
  en: `${site}/en/about/`,
  'x-default': `${site}/about/`,
};

export const metadata = {
  title: 'About the Videha Digital Research Archive',
  description: 'Scope, method and publication policy for the source-controlled Mithila–Vajji–Anga digital-humanities research environment.',
  alternates: {
    canonical: `${site}/en/about/`,
    languages: languageAlternates,
  },
  other: { 'DC.language': 'en' },
};

export default function EnglishAboutPage() {
  return <AboutView language="en" />;
}
