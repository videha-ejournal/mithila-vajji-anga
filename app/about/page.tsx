import AboutView from '../about-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata = {
  title: 'विदेह डिजिटल शोध अभिलेखागारक परिचय',
  description: 'मिथिला–वज्जि–अंगक स्रोत-नियन्त्रित डिजिटल मानविकी शोध परिवेशक परिचय, पद्धति आ प्रकाशन-नीति।',
  alternates: {
    canonical: `${site}/about/`,
    languages: { mai: `${site}/about/`, en: `${site}/en/about/`, 'x-default': `${site}/about/` },
  },
  other: { 'DC.language': 'mai' },
};

export default function AboutPage() {
  return <AboutView language="mai" />;
}
