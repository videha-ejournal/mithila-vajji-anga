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
    title: {
      en: 'History — English',
      mai: 'इतिहास — अंग्रेजी',
    },
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
    title: {
      en: 'Parallel Philosophy — English',
      mai: 'समानान्तर दर्शन — अंग्रेजी',
    },
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
    title: {
      en: 'Parallel Philosophy — Maithili',
      mai: 'समानान्तर दर्शन — मैथिली',
    },
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
  const copy =
    locale === 'mai'
      ? {
          eyebrow: 'पूर्ण प्रत्यक्ष कड़ी-सूची',
          title: '५२२ लाइव शोध-पन्ना',
          intro:
            'इतिहास आ समानान्तर दर्शनक सभ प्रमाणित लाइव पन्ना एतय सुरक्षित अछि। सूची केँ खोलू, फेर आवश्यक corpus खोलू।',
          foldHint: 'क्लिक कऽ ५२२ कड़ी खोलू',
          total: 'कुल',
          pages: 'पन्ना',
          jump: 'सीधा जाउ',
          volume: 'खण्ड',
          links: 'प्रत्यक्ष कड़ी',
          openSeries: 'सूची खोलू',
        }
      : {
          eyebrow: 'COMPLETE DIRECT-LINK DIRECTORY',
          title: '522 live research pages',
          intro:
            'All verified History and Parallel Philosophy pages remain available here. Open the directory, then expand only the corpus you need.',
          foldHint: 'Open the 522-link directory',
          total: 'Total',
          pages: 'pages',
          jump: 'Jump to',
          volume: 'Volume',
          links: 'direct links',
          openSeries: 'Open list',
        };

  return (
    <section
      className={styles.directory}
      id="research-corpus-522"
      aria-labelledby="research-corpus-522-title"
      lang={locale}
      data-research-corpus-count="522"
    >
      <details className={styles.masterFold}>
        <summary className={styles.masterSummary}>
          <span className={styles.chevron} aria-hidden="true">›</span>
          <span className={styles.summaryCopy}>
            <span className={styles.eyebrow}>{copy.eyebrow}</span>
            <strong className={styles.masterTitle} id="research-corpus-522-title">{copy.title}</strong>
            <span className={styles.summaryIntro}>{copy.intro}</span>
            <span className={styles.foldHint}>{copy.foldHint}</span>
          </span>
          <span className={styles.totalBadge} aria-label={`${copy.total}: 522 ${copy.pages}`}>
            <strong>{locale === 'mai' ? '५२२' : '522'}</strong>
            <span>{copy.pages}</span>
          </span>
        </summary>

        <div className={styles.foldBody}>
          <div className={styles.stats} aria-label={copy.total}>
            {series.map((item) => (
              <a className={styles.stat} href={`#corpus-${item.id}`} key={item.id}>
                <strong>{locale === 'mai' ? toDevanagari(item.count) : item.count}</strong>
                <span>{item.title[locale]}</span>
              </a>
            ))}
          </div>

          <nav className={styles.jumpNav} aria-label={copy.jump}>
            <strong>{copy.jump}</strong>
            {series.map((item) => (
              <a href={`#corpus-${item.id}`} key={item.id}>
                {item.title[locale]}
              </a>
            ))}
          </nav>

          <div className={styles.seriesList}>
            {series.map((item) => (
              <details className={styles.series} id={`corpus-${item.id}`} key={item.id}>
                <summary className={styles.seriesHeader}>
                  <span className={styles.seriesChevron} aria-hidden="true">›</span>
                  <span className={styles.seriesCopy}>
                    <span className={styles.seriesKicker}>
                      {locale === 'mai'
                        ? `${toDevanagari(item.count)} ${copy.links}`
                        : `${item.count} ${copy.links}`}
                    </span>
                    <strong className={styles.seriesTitle}>{item.title[locale]}</strong>
                    <span className={styles.seriesDescription}>{item.description[locale]}</span>
                  </span>
                  <span className={styles.seriesAction}>{copy.openSeries}</span>
                  <span className={styles.countPill}>
                    {locale === 'mai' ? toDevanagari(item.count) : item.count}
                  </span>
                </summary>

                <div className={styles.volumeList}>
                  {item.volumes.map((volume) => (
                    <section className={styles.volume} key={`${item.id}-${volume.volume}`}>
                      <header className={styles.volumeHeader}>
                        <h4>
                          {locale === 'mai'
                            ? `${copy.volume} ${toDevanagari(volume.volume)} / Volume ${romanVolume(volume.volume)}`
                            : `${copy.volume} ${romanVolume(volume.volume)} / खण्ड ${toDevanagari(volume.volume)}`}
                        </h4>
                        <span>
                          {locale === 'mai'
                            ? `${toDevanagari(volume.count)} ${copy.pages}`
                            : `${volume.count} ${copy.pages}`}
                        </span>
                      </header>

                      <div className={styles.linkGrid}>
                        {Array.from({ length: volume.count }, (_, index) => index + 1).map((chapter) => (
                          <a
                            className={styles.chapterLink}
                            href={articleUrl(item.id, volume.volume, chapter)}
                            key={`${item.id}-${volume.volume}-${chapter}`}
                            aria-label={`${item.title[locale]}, ${copy.volume} ${volume.volume}, ${chapterLabel(
                              locale,
                              item.id,
                              chapter,
                            )}`}
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
