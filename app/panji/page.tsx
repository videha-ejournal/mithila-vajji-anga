import type { Metadata } from 'next';
import ArchiveIndex from '../archive-index';

export const metadata: Metadata = {
  title: 'पञ्जी शोध — मिथिला–वज्जि–अंग डिजिटल रिसर्च आर्काइव',
  description: 'Decoding Panji क छह अंग्रेजी स्रोत-खण्ड आ विदेह डिजिटल रिसर्च आर्काइव लेल तैयार मैथिली शोध-संस्करण.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/panji/',
    languages: { en: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/panji/' },
  },
};

export default function PanjiPage() {
  return <ArchiveIndex group="panji" language="mai" />;
}
