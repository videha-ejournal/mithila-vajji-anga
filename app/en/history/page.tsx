import type { Metadata } from 'next';
import HistoryView from '../../history-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata: Metadata = {
  title: 'History of Mithila, Vajji & Anga — Complete Chapter Index',
  description:
    'Permanent English chapter index for Gajendra Thakur’s two-volume history of Mithila, Vajji and Anga across India and Nepal.',
  alternates: {
    canonical: `${site}/en/history/`,
    languages: {
      mai: `${site}/history/`,
      en: `${site}/en/history/`,
      'x-default': `${site}/history/`,
    },
  },
  other: { 'DC.language': 'en' },
};

export default function EnglishHistoryIndexPage() {
  return <HistoryView language="en" />;
}
