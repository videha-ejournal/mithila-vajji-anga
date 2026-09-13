import type { Metadata } from 'next';
import ArchiveIndex from '../../archive-index';

const languageAlternates: Record<string, string> = {
  mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/panji/',
};

export const metadata: Metadata = {
  title: 'Decoding Panji — Mithila–Vajji–Anga Digital Research Archive',
  description: 'Six English Decoding Panji source volumes paired with clearly identified Maithili research editions.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/panji/',
    languages: languageAlternates,
  },
};

export default function EnglishPanjiPage() {
  return <ArchiveIndex group="panji" language="en" />;
}
