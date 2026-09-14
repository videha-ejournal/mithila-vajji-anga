import type { Metadata } from 'next';
import HistoryView from '../history-view';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata: Metadata = {
  title: 'मिथिला–वज्जि–अंगक इतिहास — पूर्ण अध्याय-सूची',
  description:
    'गजेन्द्र ठाकुरक मिथिला–वज्जि–अंगक दू-खण्डीय इतिहासक १७८ स्थायी अध्याय-अभिलेखक मैथिली शोध-दुआरि।',
  alternates: {
    canonical: `${site}/history/`,
    languages: {
      mai: `${site}/history/`,
      en: `${site}/en/history/`,
      'x-default': `${site}/history/`,
    },
  },
  other: { 'DC.language': 'mai' },
};

export default function HistoryIndexPage() {
  return <HistoryView language="mai" />;
}
