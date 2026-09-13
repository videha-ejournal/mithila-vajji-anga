import type { Metadata } from 'next';
import researchData from '../research-data.json';
import styles from './history.module.css';

type Chapter = {
  id: string;
  number: number;
  title: string;
  collection: string;
  volume: string;
  part: string;
  status: 'Complete' | 'Planned';
  pages: string;
  summary: string;
  sections: string[];
};

type VolumeDefinition = {
  id: string;
  sequence: string;
  title: string;
  shortTitle: string;
  description: string;
  chapters: Chapter[];
};

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const political = researchData.political as Chapter[];
const social = researchData.social as Chapter[];

const volumes: VolumeDefinition[] = [
  {
    id: 'volume-i',
    sequence: 'Volume I',
    title: 'General & Political History of Mithila, Vajji & Anga',
    shortTitle: 'General & Political History',
    description:
      'The first volume reconstructs the changing historical geography and political worlds of Mithila, Vajji and Anga: environment and settlement, early polities, texts and archaeology, kingdoms and dynasties, institutions and routes, India–Nepal connections, colonial transformations and modern political change. It treats regional names and boundaries historically rather than projecting a timeless map backward across the evidence.',
    chapters: political,
  },
  {
    id: 'volume-ii',
    sequence: 'Volume II',
    title: 'Socio-Cultural & Economic History of Mithila, Vajji & Anga',
    shortTitle: 'Socio-Cultural & Economic History',
    description:
      'The second volume follows the social, cultural and economic structures through which the region was repeatedly remade: agrarian life, land and labour, household and kinship, caste and class, gender, religion, education, language, literature, arts, markets, migration, infrastructure, rivers, public institutions, media, heritage and the contemporary cultural economy across India and Nepal.',
    chapters: social,
  },
];

export const metadata: Metadata = {
  title: 'History of Mithila, Vajji & Anga — Complete Chapter Index',
  description:
    'Permanent chapter index for Gajendra Thakur’s two-volume history of Mithila, Vajji and Anga: General & Political History and Socio-Cultural & Economic History. Every chapter links to a detailed research page.',
  alternates: { canonical: `${siteUrl}history/` },
  keywords: [
    'History of Mithila',
    'History of Vajji',
    'History of Anga',
    'Mithila history chapters',
    'Vajji history',
    'Anga history',
    'Gajendra Thakur',
    'Videha Digital Research Archive',
  ],
  openGraph: {
    type: 'website',
    url: `${siteUrl}history/`,
    title: 'Two-Volume History of Mithila, Vajji & Anga',
    description:
      'A permanent, chapter-by-chapter research gateway to the General & Political and Socio-Cultural & Economic histories of Mithila, Vajji and Anga.',
  },
};

function groupByPart(chapters: Chapter[]) {
  const groups: Array<{ part: string; chapters: Chapter[] }> = [];
  for (const chapter of chapters) {
    const previous = groups.at(-1);
    if (previous?.part === chapter.part) {
      previous.chapters.push(chapter);
    } else {
      groups.push({ part: chapter.part, chapters: [chapter] });
    }
  }
  return groups;
}

function preview(summary: string) {
  const normalized = summary.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 470) return normalized;
  const cut = normalized.slice(0, 470);
  const boundary = cut.lastIndexOf(' ');
  return `${cut.slice(0, boundary > 360 ? boundary : 470)}…`;
}

export default function HistoryIndexPage() {
  const totalChapters = volumes.reduce((sum, volume) => sum + volume.chapters.length, 0);
  const completeChapters = volumes.reduce(
    (sum, volume) => sum + volume.chapters.filter((chapter) => chapter.status === 'Complete').length,
    0,
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'History of Mithila, Vajji & Anga — Complete Chapter Index',
    url: `${siteUrl}history/`,
    description:
      'Chapter-by-chapter gateway to two complementary histories of Mithila, Vajji and Anga across India and Nepal.',
    about: [
      { '@type': 'Place', name: 'Mithila' },
      { '@type': 'Place', name: 'Vajji' },
      { '@type': 'Place', name: 'Anga' },
    ],
    creator: { '@type': 'Person', name: 'Gajendra Thakur' },
    publisher: {
      '@type': 'Organization',
      name: 'Videha Maithili eJournal',
      identifier: 'ISSN 2229-547X',
    },
    hasPart: volumes.map((volume) => ({
      '@type': 'Book',
      name: volume.title,
      numberOfPages: undefined,
      numberOfItems: volume.chapters.length,
      author: { '@type': 'Person', name: 'Gajendra Thakur' },
    })),
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
        }}
      />
      <div className={styles.shell}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <a href="../">Videha Digital Research Archive</a>
          <span aria-hidden="true">/</span>
          <span>History volumes</span>
        </nav>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Mithila · Vajji · Anga · India & Nepal</p>
            <h1>Two histories, one connected regional archive</h1>
            <p className={styles.heroIntro}>
              The history collection is organised as two complementary volumes rather than a single flattened chronology. Volume I follows general and political history; Volume II reconstructs socio-cultural and economic history. Every chapter below has its own permanent page with the complete catalogue description, chapter position, source pagination or manuscript range, and full indexed section structure.
            </p>
          </div>
          <aside className={styles.heroAside}>
            <strong>Complete chapter gateway</strong>
            <p>
              {completeChapters} completed chapters are represented across {totalChapters} permanent chapter records. The chapter pages are generated from the same source-controlled research catalogue used by the main archive, so the index does not substitute generic summaries for the supplied scholarship.
            </p>
          </aside>
        </header>

        <section className={styles.volumeGrid} aria-label="Choose a history volume">
          {volumes.map((volume) => (
            <article className={styles.volumeCard} key={volume.id}>
              <span>{volume.sequence} · {volume.chapters.length} chapters</span>
              <h2>{volume.shortTitle}</h2>
              <p>{volume.description}</p>
              <a href={`#${volume.id}`}>Browse all {volume.chapters.length} chapters ↓</a>
            </article>
          ))}
        </section>

        {volumes.map((volume) => (
          <section className={styles.volumeSection} id={volume.id} key={volume.id}>
            <header className={styles.volumeHeader}>
              <div>
                <p className={styles.eyebrow}>{volume.sequence}</p>
                <h2>{volume.title}</h2>
                <p>{volume.description}</p>
              </div>
              <span className={styles.count}>
                {volume.chapters.filter((chapter) => chapter.status === 'Complete').length} / {volume.chapters.length} complete
              </span>
            </header>

            {groupByPart(volume.chapters).map((group) => (
              <section className={styles.part} key={`${volume.id}-${group.part}`}>
                <h3>{group.part}</h3>
                <ol className={styles.chapterList}>
                  {group.chapters.map((chapter) => (
                    <li className={styles.chapterItem} key={chapter.id}>
                      <span className={styles.chapterNo}>
                        CH {String(chapter.number).padStart(3, '0')}
                      </span>
                      <div>
                        <h4>
                          <a href={`../chapters/${chapter.id}/index.html`}>
                            {chapter.title}
                          </a>
                        </h4>
                        <p>{preview(chapter.summary)}</p>
                        <div className={styles.chapterMeta}>
                          <span>{chapter.status}</span>
                          <span>{chapter.sections.length} indexed sections</span>
                          <span>{chapter.pages}</span>
                        </div>
                      </div>
                      <a className={styles.openLink} href={`../chapters/${chapter.id}/index.html`}>
                        Detailed chapter page →
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </section>
        ))}

        <nav className={styles.footerLinks} aria-label="Related archive resources">
          <a href="../">Return to the research archive</a>
          <a href="../sources/index.html">Evidence and source method</a>
          <a href="../source-library/">Source PDF library</a>
        </nav>
      </div>
    </main>
  );
}
