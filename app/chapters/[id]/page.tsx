import type { Metadata } from 'next';
import researchData from '../../research-data.json';
import styles from '../../history/history.module.css';

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

type PageProps = {
  params: Promise<{ id: string }>;
};

const siteUrl = 'https://videha-ejournal.github.io/mithila-vajji-anga/';
const political = researchData.political as Chapter[];
const social = researchData.social as Chapter[];
const chapters = [...political, ...social];

function volumeFor(chapter: Chapter) {
  const isPolitical = chapter.collection.startsWith('Political');
  return {
    sequence: isPolitical ? 'Volume I' : 'Volume II',
    title: isPolitical
      ? 'General & Political History of Mithila, Vajji & Anga'
      : 'Socio-Cultural & Economic History of Mithila, Vajji & Anga',
    shortTitle: isPolitical
      ? 'General & Political History'
      : 'Socio-Cultural & Economic History',
    chapters: isPolitical ? political : social,
    context: isPolitical
      ? 'This chapter belongs to the General & Political History volume. It is read within the connected historical geography of Mithila, Vajji and Anga across India and Nepal, with regions, polities, boundaries and institutions reconstructed for their own periods rather than treated as timeless or interchangeable.'
      : 'This chapter belongs to the Socio-Cultural & Economic History volume. It places social institutions, cultural practices and economic life within the changing historical worlds of Mithila, Vajji and Anga across India and Nepal, linking local evidence to wider structures without collapsing the three regions into a single timeless unit.',
  };
}

function metadataDescription(chapter: Chapter) {
  const text = chapter.summary.replace(/\s+/g, ' ').trim();
  if (text.length <= 300) return text;
  const cut = text.slice(0, 300);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export function generateStaticParams() {
  return chapters.map((chapter) => ({ id: chapter.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const chapter = chapters.find((item) => item.id === id);
  if (!chapter) {
    return {
      title: 'History chapter not found',
      robots: { index: false, follow: false },
    };
  }

  const volume = volumeFor(chapter);
  const canonical = `${siteUrl}chapters/${chapter.id}/`;
  const description = metadataDescription(chapter);

  return {
    title: `Chapter ${chapter.number}: ${chapter.title} — ${volume.shortTitle}`,
    description,
    alternates: { canonical },
    keywords: [
      chapter.title,
      'Mithila history',
      'Vajji history',
      'Anga history',
      volume.shortTitle,
      chapter.part,
      'Gajendra Thakur',
      'Videha Digital Research Archive',
    ],
    openGraph: {
      type: 'article',
      url: canonical,
      title: `Chapter ${chapter.number}: ${chapter.title}`,
      description,
    },
    other: {
      citation_title: chapter.title,
      citation_author: 'Gajendra Thakur',
      citation_journal_title: 'Videha Maithili eJournal',
      citation_issn: '2229-547X',
      citation_publication_date: '2026',
    },
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { id } = await params;
  const chapter = chapters.find((item) => item.id === id);

  if (!chapter) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <a href="../../history/index.html">History volumes</a>
          </nav>
          <header className={styles.chapterHero}>
            <p className={styles.eyebrow}>History chapter</p>
            <h1>Chapter not found</h1>
            <p className={styles.chapterDeck}>
              The requested chapter is not part of the source-controlled two-volume history catalogue.
            </p>
          </header>
        </div>
      </main>
    );
  }

  const volume = volumeFor(chapter);
  const chapterIndex = volume.chapters.findIndex((item) => item.id === chapter.id);
  const previous = chapterIndex > 0 ? volume.chapters[chapterIndex - 1] : undefined;
  const next =
    chapterIndex >= 0 && chapterIndex < volume.chapters.length - 1
      ? volume.chapters[chapterIndex + 1]
      : undefined;
  const canonical = `${siteUrl}chapters/${chapter.id}/`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    '@id': canonical,
    url: canonical,
    name: chapter.title,
    position: chapter.number,
    description: chapter.summary,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: 'Gajendra Thakur' },
    publisher: {
      '@type': 'Organization',
      name: 'Videha Maithili eJournal',
      identifier: 'ISSN 2229-547X',
    },
    isPartOf: {
      '@type': 'Book',
      name: volume.title,
      author: { '@type': 'Person', name: 'Gajendra Thakur' },
    },
    about: [
      { '@type': 'Place', name: 'Mithila' },
      { '@type': 'Place', name: 'Vajji' },
      { '@type': 'Place', name: 'Anga' },
    ],
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
          <a href="../../">Videha Digital Research Archive</a>
          <span aria-hidden="true">/</span>
          <a href="../../history/index.html">History volumes</a>
          <span aria-hidden="true">/</span>
          <span>{volume.sequence} · Chapter {chapter.number}</span>
        </nav>

        <article>
          <header className={styles.chapterHero}>
            <p className={styles.eyebrow}>{volume.sequence} · {volume.shortTitle}</p>
            <span className={styles.chapterCode}>
              Chapter {String(chapter.number).padStart(3, '0')} · {chapter.status}
            </span>
            <h1>{chapter.title}</h1>
            <p className={styles.chapterDeck}>
              A permanent research page in the two-volume History of Mithila, Vajji & Anga. The description below is the full source-controlled catalogue account for this chapter, followed by its complete indexed section structure.
            </p>

            <dl className={styles.metaGrid}>
              <div>
                <dt>Book</dt>
                <dd>{volume.sequence} · {volume.shortTitle}</dd>
              </div>
              <div>
                <dt>Part</dt>
                <dd>{chapter.part}</dd>
              </div>
              <div>
                <dt>Source locator</dt>
                <dd>{chapter.pages}</dd>
              </div>
              <div>
                <dt>Research structure</dt>
                <dd>{chapter.sections.length} indexed sections</dd>
              </div>
            </dl>
          </header>

          <div className={styles.articleGrid}>
            <div>
              <section className={styles.prose} aria-labelledby="description-heading">
                <h2 id="description-heading">Detailed chapter description</h2>
                <p>{chapter.summary}</p>
              </section>

              <section className={styles.contextBox} aria-labelledby="context-heading">
                <h2 id="context-heading">Place in the two-volume history</h2>
                <p>{volume.context}</p>
              </section>
            </div>

            <aside className={styles.contents} aria-labelledby="contents-heading">
              <h2 id="contents-heading">Indexed chapter contents</h2>
              {chapter.sections.length > 0 ? (
                <ol>
                  {chapter.sections.map((section) => (
                    <li key={section}>{section}</li>
                  ))}
                </ol>
              ) : (
                <p>No section-level index is recorded for this chapter.</p>
              )}
            </aside>
          </div>

          {(previous || next) && (
            <nav className={styles.chapterNav} aria-label="Adjacent chapters in this volume">
              {previous ? (
                <a href={`../${previous.id}/index.html`}>
                  <small>← Previous chapter</small>
                  <strong>{previous.number}. {previous.title}</strong>
                </a>
              ) : <span />}
              {next ? (
                <a href={`../${next.id}/index.html`}>
                  <small>Next chapter →</small>
                  <strong>{next.number}. {next.title}</strong>
                </a>
              ) : <span />}
            </nav>
          )}
        </article>

        <nav className={styles.footerLinks} aria-label="Related archive resources">
          <a href="../../history/index.html">All chapters in both history volumes</a>
          <a href="../../sources/index.html">Evidence and source method</a>
          <a href="../../source-library/">Source PDF library</a>
          <a href="../../">Main archive</a>
        </nav>
      </div>
    </main>
  );
}
