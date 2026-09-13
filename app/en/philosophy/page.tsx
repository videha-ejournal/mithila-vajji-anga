import type { Metadata } from 'next';
import ArchiveIndex from '../../archive-index';

export const metadata: Metadata = {
  title: 'Parallel Philosophy — Mithila–Vajji–Anga Digital Research Archive',
  description: 'Six bilingual philosophical sources: Parallel Philosophy I–II, Bhāmatī, Ātmatattvaviveka, Nyāyakusumāñjali and Tattvacintāmaṇi.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/philosophy/',
    languages: { mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/philosophy/' },
  },
};

export default function EnglishPhilosophyPage() {
  return <ArchiveIndex group="philosophy" language="en" />;
}
