import type { Metadata } from 'next';
import ArchiveIndex from '../archive-index';

export const metadata: Metadata = {
  title: 'समानान्तर साहित्य इतिहास — मिथिला–वज्जि–अंग डिजिटल रिसर्च आर्काइव',
  description: 'A Parallel History of Mithilā & Maithilī Literature क स्रोत-सत्यापित अध्याय आ विदेह डिजिटल रिसर्च आर्काइव लेल तैयार मैथिली शोध-संस्करण.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/literature/',
    languages: { en: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/literature/' },
  },
};

export default function LiteraturePage() {
  return <ArchiveIndex group="literature" language="mai" />;
}
