import type { Metadata } from 'next';
import ArchiveIndex from '../../archive-index';

const languageAlternates: Record<string, string> = {
  mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/literature/',
};

export const metadata: Metadata = {
  title: 'Parallel Literature — Mithila–Vajji–Anga Digital Research Archive',
  description: 'Source-verified English chapters of A Parallel History of Mithilā & Maithilī Literature with paired Maithili research editions.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/literature/',
    languages: languageAlternates,
  },
};

export default function EnglishLiteraturePage() {
  return <ArchiveIndex group="literature" language="en" />;
}
