import type { Metadata } from 'next';
import Home from '../archive-english';

const languageAlternates: Record<string, string> = {
  mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/',
  en: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
  'x-default': 'https://videha-ejournal.github.io/mithila-vajji-anga/',
};

export const metadata: Metadata = {
  title: {
    absolute: 'Videha Digital Research Archive | Digital Humanities Research Environment for Mithila, Vajji & Anga',
  },
  description: 'English edition of the Videha source-controlled Mithila–Vajji–Anga research environment.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
    languages: languageAlternates,
  },
  openGraph: {
    url: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
  },
  other: {
    'DC.language': 'en',
  },
};

export default Home;
