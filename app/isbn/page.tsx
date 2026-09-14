import IsbnView from '../isbn-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const languageAlternates: Record<string, string> = {
  mai: `${site}/isbn/`,
  en: `${site}/en/isbn/`,
  'x-default': `${site}/isbn/`,
};

export const metadata = {
  title: 'विदेह ISBN प्रामाणिक सूची',
  description: 'सम्पादक-देल ISBN.gov.in allotment export पर आधारित २९३-अभिलेखक प्रामाणिक विदेह ISBN सूची।',
  alternates: {
    canonical: `${site}/isbn/`,
    languages: languageAlternates,
  },
  other: { 'DC.language': 'mai' },
};

export default function IsbnRegistryPage() {
  return <IsbnView language="mai" />;
}
