import panjiInventoryJson from './generated/panji-article-inventory.json';
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

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const publicationArt = `${siteUrl}assets/book-covers/decoding-the-panji.webp`;
const roman: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const expected: Record<number, number> = { 1: 20, 2: 38, 3: 32, 4: 87, 5: 40, 6: 30 };
const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const panjiInventory = panjiInventoryJson as PanjiRecord[];

function toDevanagari(value: number | string) {
  return String(value)
    .split('')
    .map((character) => (/\d/.test(character) ? devanagariDigits[Number(character)] : character))
    .join('');
}

function validateInventory() {
  if (panjiInventory.length !== 247) {
    throw new Error(`Expected 247 Decoding Panji records; found ${panjiInventory.length}.`);
  }

  for (const [volumeText, count] of Object.entries(expected)) {
    const volume = Number(volumeText);
    const records = panjiInventory.filter((record) => record.volume === volume);
    if (records.length !== count || records.some((record) => record.kind !== 'chapter')) {
      throw new Error(`Decoding Panji Volume ${volume}: expected ${count} formal chapters.`);
    }
  }
}

validateInventory();

export default function PanjiHomeDirectory({ locale }: { locale: Locale }) {
  const isMai = locale === 'mai';
  const display = (value: number | string) => (isMai ? toDevanagari(value) : String(value));
  const copy = isMai
    ? {
        eyebrow: 'विशेष शोध-द्वार · DECODING PANJI',
        title: 'Decoding Panji · खण्ड I–VI',
        intro:
          'छओ खण्डक २४७ स्रोत-सत्यापित औपचारिक अध्याय स्थायी HTML पन्ना रूपमे उपलब्ध अछि। प्रत्येक अध्याय अपन canonical URL, स्रोत-सन्दर्भ आ मूल PDF पृष्ठ-सूचनाक संग देल गेल अछि।',
        rule:
          'एक औपचारिक पुस्तक-अध्याय = एक HTML पन्ना। भूमिका, भाग-शीर्षक, परिशिष्ट, अनुबन्ध आ आन पुस्तक-उपकरण अलग अध्याय-पन्ना नहि बनैत अछि।',
        total: 'अध्याय-पन्ना',
        volume: 'खण्ड',
        chapter: 'अध्याय',
        source: 'मूल स्रोत PDF',
        open: 'अध्यायसभ देखू',
        jump: 'खण्ड चुनू',
        complete: 'सम्पूर्ण २४७-अध्याय सूची',
        permanent: 'स्थायी अध्याय-पथ',
        volumes: 'खण्ड',
        global: 'समग्र अध्याय',
      }
    : {
        eyebrow: 'FEATURED RESEARCH GATEWAY · DECODING PANJI',
        title: 'Decoding Panji · Volumes I–VI',
        intro:
          'All 247 source-verified formal chapters across the six volumes are available as permanent HTML pages. Every chapter has its own canonical URL, source citation and source-PDF page locator.',
        rule:
          'Governing rule: one formal book chapter equals one HTML page. Front matter, part headings, appendices, annexures and other book apparatus do not create extra chapter pages.',
        total: 'chapter pages',
        volume: 'Volume',
        chapter: 'Chapter',
        source: 'Source PDF',
        open: 'Show chapters',
        jump: 'Choose a volume',
        complete: 'Complete 247-chapter index',
        permanent: 'permanent chapter routes',
        volumes: 'volumes',
        global: 'global chapter',
      };

  const groups = Array.from({ length: 6 }, (_, index) => {
    const volume = index + 1;
    const records = panjiInventory
      .filter((record) => record.volume === volume)
      .sort((a, b) => a.chapter - b.chapter);
    return { volume, records };
  });

  return (
    <section
      className={styles.directory}
      id="decoding-panji-live-directory"
      data-decoding-panji-directory="true"
      data-panji-article-count={panjiInventory.length}
      data-panji-render-mode="react"
      lang={locale}
      aria-labelledby="decoding-panji-directory-title"
    >
      <header className={styles.header}>
        <figure className={styles.cover}>
          <img
            src={publicationArt}
            alt="Decoding the Panji publication artwork"
            loading="eager"
            decoding="async"
          />
        </figure>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h2 id="decoding-panji-directory-title">{copy.title}</h2>
          <p className={styles.intro}>{copy.intro}</p>
          <p className={styles.rule}>{copy.rule}</p>
          <div className={styles.metrics} aria-label="Decoding Panji corpus summary">
            <span>{display(6)} {copy.volumes}</span>
            <span>{display(247)} {copy.permanent}</span>
          </div>
          <a className={styles.primary} href="#decoding-panji-volumes">
            {copy.complete} ↓
          </a>
        </div>

        <div className={styles.badge} aria-label={`${display(247)} ${copy.total}`}>
          <strong>{display(247)}</strong>
          <span>{copy.total}</span>
        </div>
      </header>

      <nav className={styles.jumpNav} aria-label={copy.jump}>
        {groups.map(({ volume, records }) => (
          <a href={`#decoding-panji-volume-${volume}`} key={volume}>
            <strong>{copy.volume} {roman[volume]}</strong>
            <span>{display(records.length)} {copy.total}</span>
            <small>{display(records[0].global_chapter)}–{display(records.at(-1)!.global_chapter)}</small>
          </a>
        ))}
      </nav>

      <div className={styles.volumes} id="decoding-panji-volumes">
        {groups.map(({ volume, records }) => (
          <details
            className={styles.volume}
            id={`decoding-panji-volume-${volume}`}
            key={volume}
            open={volume === 1}
          >
            <summary>
              <span className={styles.volumeTitle}>
                <strong>{copy.volume} {roman[volume]}</strong>
                <small>
                  {display(records.length)} {copy.total} · {display(records[0].global_chapter)}–{display(records.at(-1)!.global_chapter)}
                </small>
              </span>
              <span className={styles.volumeOpen}>{copy.open}</span>
            </summary>

            <div className={styles.volumeTools}>
              <a href={records[0].source_pdf}>{copy.source} · {copy.volume} {roman[volume]}</a>
            </div>

            <div className={styles.linkGrid}>
              {records.map((record) => (
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
