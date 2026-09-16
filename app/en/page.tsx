import type { Metadata } from 'next';
import ArchiveEnglish from '../archive-english';
import ResearchCorpusDirectory from '../research-corpus-directory';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const englishUrl = `${siteUrl}en/`;

const languageAlternates: Record<string, string> = {
  mai: siteUrl,
  en: englishUrl,
  'x-default': siteUrl,
};

export const metadata: Metadata = {
  title: {
    absolute: 'Videha Digital Research Archive | Digital Humanities Research Environment for Mithila, Vajji & Anga',
  },
  description: 'English mirror of the Videha source-controlled Mithila–Vajji–Anga research environment.',
  alternates: {
    canonical: englishUrl,
    languages: languageAlternates,
  },
  openGraph: {
    url: englishUrl,
    locale: 'en_IN',
  },
  other: {
    'DC.language': 'en',
  },
};

export default function EnglishHome() {
  return (
    <>
      <section
        className="edition-home-introduction"
        id="edition-home-introduction"
        lang="en"
        aria-labelledby="edition-home-title"
      >
        <p className="eyebrow">SOURCE-CONTROLLED MITHILA–VAJJI–ANGA RESEARCH ARCHIVE</p>
        <h1 id="edition-home-title">Research gateway to Mithila, Vajji and Anga</h1>
        <p>
          This is the English entrance to the Videha research archive for the connected histories,
          genealogy, Panji, literature, philosophy, texts, places and chronology of Mithila, Vajji
          and Anga across India and Nepal.
        </p>
        <p>
          The interface is English. Source titles, quotations and other philologically significant
          forms remain in their original language where preserving them is necessary for scholarly use.
        </p>
      </section>
      <ResearchCorpusDirectory locale="en" />
      <ArchiveEnglish />
    </>
  );
}
