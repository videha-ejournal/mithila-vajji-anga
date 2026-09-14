import type { Metadata } from 'next';
import Home from '../page';

const languageAlternates: Record<string, string> = {
  mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/',
  en: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
};

export const metadata: Metadata = {
  title: 'English Edition — Mithila–Vajji–Anga Digital Research Archive',
  description: 'English mirror of the Videha source-controlled Mithila–Vajji–Anga research environment.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
    languages: languageAlternates,
  },
};

export default Home;
