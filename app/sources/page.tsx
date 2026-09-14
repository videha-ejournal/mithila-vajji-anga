import SourceRegister from '../source-register';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata = {
  title: 'उद्धृत कालक्रम-स्रोत | मिथिला–वज्जि–अंग',
  description: 'विदेह ऐतिहासिक शोध-कालक्रमक स्थायी स्रोत-अभिलेख।',
  alternates: {
    canonical: `${site}/sources/`,
    languages: { mai: `${site}/sources/`, en: `${site}/en/sources/`, 'x-default': `${site}/sources/` },
  },
  other: { 'DC.language': 'mai' },
};
export const dynamic = 'force-static';

export default function SourcesPage() {
  return <SourceRegister language="mai" />;
}
