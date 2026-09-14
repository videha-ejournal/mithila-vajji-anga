import type { Metadata } from 'next';
import ArchiveIndex from '../archive-index';

export const metadata: Metadata = {
  title: 'समानान्तर दर्शन — मिथिला–वज्जि–अंग डिजिटल रिसर्च आर्काइव',
  description: 'मैथिली–अंग्रेजी द्विभाषी दार्शनिक स्रोत: Parallel Philosophy I–II, Bhāmatī, Ātmatattvaviveka, Nyāyakusumāñjali आ Tattvacintāmaṇi.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/philosophy/',
    languages: { en: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/philosophy/' },
  },
};

export default function PhilosophyPage() {
  return <ArchiveIndex group="philosophy" language="mai" />;
}
