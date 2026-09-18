import styles from './research-corpus-directory.module.css';

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga';

type Locale = 'mai' | 'en';
type CorpusKind = 'history-en' | 'philosophy-en' | 'philosophy-mai';

type VolumeSpec = {
  volume: 1 | 2;
  count: number;
};

type SeriesSpec = {
  id: CorpusKind;
  count: number;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  volumes: VolumeSpec[];
};

const series: SeriesSpec[] = [
  {
    id: 'history-en',
    count: 178,
    title: { en: 'History — English', mai: 'इतिहास — अंग्रेजी' },
    description: {
      en: 'Direct links to all 178 History research pages.',
      mai: 'इतिहासक सभ १७८ अंग्रेजी शोध-पन्नाक सीधा कड़ी।',
    },
    volumes: [
      { volume: 1, count: 28 },
      { volume: 2, count: 150 },
    ],
  },
  {
    id: 'philosophy-en',
    count: 172,
    title: { en: 'Parallel Philosophy — English', mai: 'समानान्तर दर्शन — अंग्रेजी' },
    description: {
      en: 'Direct links to all 172 English Parallel Philosophy research pages.',
      mai: 'समानान्तर दर्शनक सभ १७२ अंग्रेजी शोध-पन्नाक सीधा कड़ी।',
    },
    volumes: [
      { volume: 1, count: 72 },
      { volume: 2, count: 100 },
    ],
  },
  {
    id: 'philosophy-mai',
    count: 172,
    title: { en: 'Parallel Philosophy — Maithili', mai: 'समानान्तर दर्शन — मैथिली' },
    description: {
      en: 'Direct links to all 172 Maithili Parallel Philosophy research pages.',
      mai: 'समानान्तर दर्शनक सभ १७२ मैथिली शोध-पन्नाक सीधा कड़ी।',
    },
    volumes: [
      { volume: 1, count: 72 },
      { volume: 2, count: 100 },
    ],
  },
];

const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

function toDevanagari(value: number | string) {
  return String(value)
    .split('')
    .map((character) => (/\d/.test(character) ? devanagariDigits[Number(character)] : character))
    .join('');
}

function romanVolume(volume: 1 | 2) {
  return volume === 1 ? 'I' : 'II';
}

function articleUrl(kind: CorpusKind, volume: 1 | 2, chapter: number) {
  const padded = String(chapter).padStart(3, '0');

  if (kind === 'history-en') {
    return `${siteUrl}/research-articles/history/volume-${volume}/chapter-${padded}/`;
  }

  const language = kind === 'philosophy-en' ? 'en' : 'mai';
  return `${siteUrl}/research-articles/parallel-philosophy/volume-${volume}/${language}/chapter-${padded}/`;
}

function chapterLabel(locale: Locale, kind: CorpusKind, chapter: number) {
  const padded = String(chapter).padStart(3, '0');

  if (locale === 'mai') {
    const language = kind === 'philosophy-mai' ? 'मैथिली' : 'EN';
    return `अध्याय ${toDevanagari(padded)} · ${language}`;
  }

  const language = kind === 'philosophy-mai' ? 'MAI' : 'EN';
  return `Ch. ${padded} · ${language}`;
}

export default function ResearchCorpusDirectory({ locale }: { locale: Locale }) {
  const isMai = locale === 'mai';
  const display = (value: number | string) => (isMai ? toDevanagari(value) : String(value));
  const copy = isMai
    ? {
        eyebrow: 'पूर्ण प्रत्यक्ष कड़ी-सूची',
        title: '५२२ लाइव शोध-पन्ना',
        intro:
          'इतिहास आ समानान्तर दर्शनक सभ प्रमाणित लाइव पन्नाक पूर्ण सूची। मुख्य पन्ना स्वच्छ रखबाक लेल सूची एखन मोड़ल अछि; त्रिकोण पर क्लिक कऽ खोलू।',
        pages: 'पन्ना',
        volume: 'खण्ड',
        links: 'प्रत्यक्ष कड़ी',
        openAll: '५२२ कड़ीक सूची खोलू / बन्द करू',
        openSeries: 'श्रृंखला खोलू',
      }
    : {
        eyebrow: 'COMPLETE DIRECT-LINK DIRECTORY',
        title: '522 live research pages',
        intro:
          'The complete verified History and Parallel Philosophy link directory. It stays folded to keep the homepage uncluttered; use the disclosure triangle to open it.',
        pages: 'pages',
        volume: 'Volume',
        links: 'direct links',
        openAll: 'Open / close the 522-link directory',
        openSeries: 'Open series',
      };

  return (
    <section className={styles.directory} id="research-corpus-522" lang={locale}>
      <details className={styles.masterDisclosure}>
        <summary className={styles.masterSummary} aria-label={copy.openAll}>
          <div className={styles.summaryCopy}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h2 id="research-corpus-522-title">{copy.title}</h2>
            <p className={styles.intro}>{copy.intro}</p>
            <div className={styles.summaryStats} aria-label={copy.title}>
              {series.map((item) => (
                <span key={item.id}>
                  <strong>{display(item.count)}</strong> {item.title[locale]}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.totalBadge} aria-hidden="true">
            <strong>{display(522)}</strong>
            <span>{copy.pages}</span>
          </div>
        </summary>

        <div className={styles.directoryBody}>
          <div className={styles.seriesList}>
            {series.map((item) => (
              <details className={styles.series} id={`corpus-${item.id}`} key={item.id}>
                <summary className={styles.seriesSummary} aria-label={`${copy.openSeries}: ${item.title[locale]}`}>
                  <div>
                    <p className={styles.seriesKicker}>{display(item.count)} {copy.links}</p>
                    <h3>{item.title[locale]}</h3>
                    <p>{item.description[locale]}</p>
                  </div>
                  <span className={styles.countPill}>{display(item.count)}</span>
                </summary>

                <div className={styles.volumeList}>
                  {item.volumes.map((volume) => (
                    <section className={styles.volume} key={`${item.id}-${volume.volume}`}>
                      <header className={styles.volumeHeader}>
                        <h4>
                          {isMai
                            ? `${copy.volume} ${toDevanagari(volume.volume)} / Volume ${romanVolume(volume.volume)}`
                            : `${copy.volume} ${romanVolume(volume.volume)} / खण्ड ${toDevanagari(volume.volume)}`}
                        </h4>
                        <span>{display(volume.count)} {copy.pages}</span>
                      </header>

                      <div className={styles.linkGrid}>
                        {Array.from({ length: volume.count }, (_, index) => index + 1).map((chapter) => (
                          <a
                            className={styles.chapterLink}
                            href={articleUrl(item.id, volume.volume, chapter)}
                            key={`${item.id}-${volume.volume}-${chapter}`}
                            aria-label={`${item.title[locale]}, ${copy.volume} ${volume.volume}, ${chapterLabel(locale, item.id, chapter)}`}
                          >
                            {chapterLabel(locale, item.id, chapter)}
                          </a>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
