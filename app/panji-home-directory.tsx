import Image from 'next/image';
import panjiInventory from './generated/panji-article-inventory.json';
import styles from './panji-home-directory.module.css';

type Locale = 'mai' | 'en';

type PanjiRecord = {
  stable_id: string;
  volume: number;
  chapter: number;
  global_chapter: number;
  title: string;
  canonical: string;
  source_pdf: string;
  source_pages: string;
  kind: string;
};

const roman: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const expected: Record<number, number> = { 1: 20, 2: 38, 3: 32, 4: 87, 5: 40, 6: 30 };
const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const panjiArtwork = '/mithila-vajji-anga/assets/book-covers/decoding-the-panji.webp';
const canonicalPrefix = 'https://videha-ejournal.github.io/mithila-vajji-anga/decoding-panji/';

function toDevanagari(value: number | string) {
  return String(value)
    .split('')
    .map((character) => (/\d/.test(character) ? devanagariDigits[Number(character)] : character))
    .join('');
}

function loadPanjiRecords() {
  const records = panjiInventory as PanjiRecord[];

  if (!Array.isArray(records) || records.length !== 247) {
    throw new Error(`Expected 247 Decoding Panji records; found ${records?.length ?? 'invalid'}.`);
  }

  if (records.some((record) => record.kind !== 'chapter' || !record.canonical.startsWith(canonicalPrefix))) {
    throw new Error('Decoding Panji homepage inventory contains an invalid record or canonical URL.');
  }

  for (const [volumeText, count] of Object.entries(expected)) {
    const volume = Number(volumeText);
    const volumeRecords = records.filter((record) => record.volume === volume);
    if (volumeRecords.length !== count) {
      throw new Error(`Expected ${count} records in Decoding Panji Volume ${volume}; found ${volumeRecords.length}.`);
    }
  }

  return records;
}

export default function PanjiHomeDirectory({ locale }: { locale: Locale }) {
  const records = loadPanjiRecords();
  const isMai = locale === 'mai';
  const display = (value: number | string) => (isMai ? toDevanagari(value) : String(value));
  const copy = isMai
    ? {
        eyebrow: 'विशेष शोध-द्वार · DECODING PANJI',
        title: 'Decoding Panji · खण्ड I–VI',
        intro:
          'छओ खण्डक २४७ स्रोत-सत्यापित औपचारिक अध्याय स्थायी HTML पन्ना रूपमे उपलब्ध अछि। प्रत्येक अध्यायक अपन canonical URL, स्रोत-सन्दर्भ आ मूल PDF पृष्ठ-सूचना अछि।',
        rule:
          'एक औपचारिक पुस्तक-अध्याय = एक HTML पन्ना। भूमिका, भाग-शीर्षक, परिशिष्ट, अनुबन्ध आ आन पुस्तक-उपकरण अलग अध्याय-पन्ना नहि बनैत अछि।',
        chapterPages: 'अध्याय-पन्ना',
        volumes: 'खण्ड',
        routes: 'स्थायी अध्याय-पथ',
        choose: 'खण्ड चुनू',
        volume: 'खण्ड',
        chapter: 'अध्याय',
        show: 'अध्यायसभ देखू',
        source: 'मूल स्रोत PDF',
        global: 'समग्र अध्याय',
        complete: '२४७ प्रमाणित canonical अध्याय-पथ',
      }
    : {
        eyebrow: 'FEATURED RESEARCH GATEWAY · DECODING PANJI',
        title: 'Decoding Panji · Volumes I–VI',
        intro:
          'All 247 source-verified formal chapters across the six volumes are available as permanent HTML pages. Every chapter has its own canonical URL, source citation and source-PDF page locator.',
        rule:
          'Governing rule: one formal book chapter equals one HTML page. Front matter, part headings, appendices, annexures and other book apparatus do not create extra chapter pages.',
        chapterPages: 'chapter pages',
        volumes: 'volumes',
        routes: 'permanent chapter routes',
        choose: 'Choose a volume',
        volume: 'Volume',
        chapter: 'Chapter',
        show: 'Show chapters',
        source: 'Source PDF',
        global: 'global chapter',
        complete: '247 verified canonical chapter routes',
      };

  const groups = Array.from({ length: 6 }, (_, index) => {
    const volume = index + 1;
    return {
      volume,
      records: records
        .filter((record) => record.volume === volume)
        .sort((a, b) => a.chapter - b.chapter),
    };
  });

  return (
    <section
      className={styles.directory}
      id="decoding-panji-live-directory"
      data-decoding-panji-directory="true"
      data-panji-article-count={records.length}
      aria-labelledby="decoding-panji-directory-title"
      lang={locale}
    >
      <header className={styles.header}>
        <figure className={styles.cover}>
          <Image
            src={panjiArtwork}
            alt="Decoding the Panji publication artwork"
            width={330}
            height={440}
            priority
            sizes="(max-width: 640px) 86px, (max-width: 980px) 120px, 165px"
          />
        </figure>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h2 id="decoding-panji-directory-title">{copy.title}</h2>
          <p className={styles.intro}>{copy.intro}</p>
          <p className={styles.rule}>{copy.rule}</p>
          <div className={styles.metrics} aria-label={copy.complete}>
            <span>{display(6)} {copy.volumes}</span>
            <span>{display(records.length)} {copy.routes}</span>
          </div>
        </div>
        <div className={styles.totalBadge} aria-label={`${display(records.length)} ${copy.chapterPages}`}>
          <strong>{display(records.length)}</strong>
          <span>{copy.chapterPages}</span>
        </div>
      </header>

      <nav className={styles.jumpNav} aria-label={copy.choose}>
        {groups.map(({ volume, records: volumeRecords }) => (
          <a href={`#decoding-panji-volume-${volume}`} key={volume}>
            <strong>{copy.volume} {roman[volume]}</strong>
            <span>{display(volumeRecords.length)} {copy.chapterPages}</span>
            <small>{display(volumeRecords[0].global_chapter)}–{display(volumeRecords.at(-1)?.global_chapter ?? '')}</small>
          </a>
        ))}
      </nav>

      <div className={styles.volumeList}>
        {groups.map(({ volume, records: volumeRecords }) => (
          <details className={styles.volume} id={`decoding-panji-volume-${volume}`} key={volume} open={volume === 1}>
            <summary>
              <span className={styles.volumeTitle}>
                <strong>{copy.volume} {roman[volume]}</strong>
                <small>
                  {display(volumeRecords.length)} {copy.chapterPages} · {display(volumeRecords[0].global_chapter)}–{display(volumeRecords.at(-1)?.global_chapter ?? '')}
                </small>
              </span>
              <span className={styles.openLabel}>{copy.show}</span>
            </summary>
            <div className={styles.volumeTools}>
              <a href={volumeRecords[0].source_pdf}>{copy.source} · {copy.volume} {roman[volume]}</a>
            </div>
            <div className={styles.chapterGrid}>
              {volumeRecords.map((record) => (
                <a className={styles.chapterLink} href={record.canonical} key={record.stable_id}>
                  <span className={styles.chapterNumber} aria-hidden="true">{display(record.chapter)}</span>
                  <span>
                    <strong>{copy.chapter} {display(record.chapter)}: {record.title}</strong>
                    <small>PDF pp. {record.source_pages} · {copy.global} {display(record.global_chapter)}</small>
                  </span>
                </a>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
