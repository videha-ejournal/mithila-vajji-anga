import AboutView from '../../about-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata = {
  title: 'About the Videha Digital Research Archive',
  description: 'Scope, method and publication policy for the source-controlled Mithila–Vajji–Anga digital-humanities research environment.',
  alternates: {
    canonical: `${site}/en/about/`,
    languages: { mai: `${site}/about/`, en: `${site}/en/about/`, 'x-default': `${site}/about/` },
  },
  other: { 'DC.language': 'en' },
};

export default function EnglishAboutPage() {
  return <AboutView language="en" />;
}
