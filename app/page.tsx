import type { Metadata } from 'next';
import ArchiveEnglish from './archive-english';
import HomeMaithiliLocalizer from './home-maithili-localizer';
import ResearchCorpusDirectory from './research-corpus-directory';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const languageAlternates: Record<string, string> = {
  mai: siteUrl,
  en: `${siteUrl}en/`,
  'x-default': siteUrl,
};

export const metadata: Metadata = {
  title: {
    absolute: 'विदेह डिजिटल शोध-संग्रह | मिथिला, वज्जि आ अंग',
  },
  description:
    'भारत आ नेपालक मिथिला, वज्जि आ अंगक इतिहास, वंशावली, साहित्य, दर्शन, स्थान, ग्रन्थ आ कालक्रम लेल स्रोत-नियन्त्रित डिजिटल शोध-संग्रह।',
  alternates: {
    canonical: siteUrl,
    languages: languageAlternates,
  },
  openGraph: {
    url: siteUrl,
    locale: 'mai_IN',
    title: 'विदेह डिजिटल शोध-संग्रह | मिथिला, वज्जि आ अंग',
    description:
      'मिथिला–वज्जि–अंगक इतिहास, वंशावली, साहित्य आ दर्शनक स्रोत-नियन्त्रित शोध-संग्रह।',
  },
  other: {
    'DC.language': 'mai',
  },
};

export default function MaithiliHome() {
  return (
    <>
      <HomeMaithiliLocalizer />
      <section
        className="edition-home-introduction"
        id="edition-home-introduction"
        lang="mai"
        aria-labelledby="edition-home-title"
      >
        <p className="eyebrow">स्रोत-नियन्त्रित मिथिला–वज्जि–अंग शोध-संग्रह</p>
        <h1 id="edition-home-title">मिथिला, वज्जि आ अंगक शोध-द्वार</h1>
        <p>
          ई विदेहक मैथिली प्रवेश-पन्ना अछि। एहिठाम भारत आ नेपालक मिथिला, वज्जि आ अंगसँ
          सम्बन्धित इतिहास, वंशावली, पञ्जी, साहित्य, दर्शन, ग्रन्थ, स्थान आ कालक्रम केँ
          प्रमाण, स्रोत-सन्दर्भ आ स्थायी शोध-पथक संग देखल जा सकैत अछि।
        </p>
        <p>
          अन्तरफलक मैथिलीमे अछि; मूल स्रोत, ग्रन्थ-शीर्षक अथवा उद्धरण जतय मूल भाषामे
          राखब विद्वत्-सन्दर्भ लेल आवश्यक अछि, ततय ओकर भाषिक रूप सुरक्षित राखल गेल अछि।
        </p>
      </section>
      <div id="decoding-panji-directory-anchor" aria-hidden="true" />
      <ResearchCorpusDirectory locale="mai" />
      <ArchiveEnglish />
    </>
  );
}
