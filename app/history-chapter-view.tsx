/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported history routes. */

import type { Metadata } from 'next';
import researchData from './research-data.json';
import styles from './history/history.module.css';
import type { HistoryLanguage } from './history-view';

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

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const political = researchData.political as Chapter[];
const social = researchData.social as Chapter[];
export const historyChapters = [...political, ...social];

function volumeFor(chapter: Chapter) {
  const politicalVolume = chapter.collection.startsWith('Political');
  return {
    sequenceEn: politicalVolume ? 'Volume I' : 'Volume II',
    sequenceMai: politicalVolume ? 'खण्ड १' : 'खण्ड २',
    titleEn: politicalVolume
      ? 'General & Political History of Mithila, Vajji & Anga'
      : 'Socio-Cultural & Economic History of Mithila, Vajji & Anga',
    titleMai: politicalVolume
      ? 'मिथिला–वज्जि–अंगक सामान्य आ राजनीतिक इतिहास'
      : 'मिथिला–वज्जि–अंगक सामाजिक, सांस्कृतिक आ आर्थिक इतिहास',
    shortEn: politicalVolume ? 'General & Political History' : 'Socio-Cultural & Economic History',
    shortMai: politicalVolume ? 'सामान्य आ राजनीतिक इतिहास' : 'सामाजिक, सांस्कृतिक आ आर्थिक इतिहास',
    chapters: politicalVolume ? political : social,
    contextEn: politicalVolume
      ? 'This chapter belongs to the General & Political History volume. It is read within the connected historical geography of Mithila, Vajji and Anga across India and Nepal, with regions, polities, boundaries and institutions reconstructed for their own periods rather than treated as timeless or interchangeable.'
      : 'This chapter belongs to the Socio-Cultural & Economic History volume. It places social institutions, cultural practices and economic life within the changing historical worlds of Mithila, Vajji and Anga across India and Nepal, linking local evidence to wider structures without collapsing the three regions into a single timeless unit.',
    contextMai: politicalVolume
      ? 'ई अध्याय सामान्य आ राजनीतिक इतिहास खण्डक अङ्ग अछि। भारत आ नेपालक मिथिला, वज्जि आ अंगक जुड़ल ऐतिहासिक भूगोलमे क्षेत्र, राज्य-व्यवस्था, सीमा आ संस्थाकेँ ओकर-ओकर कालक प्रमाण अनुसार बुझल गेल अछि; ओकरा शाश्वत वा परस्पर समान इकाइ नहि मानल गेल अछि।'
      : 'ई अध्याय सामाजिक, सांस्कृतिक आ आर्थिक इतिहास खण्डक अङ्ग अछि। सामाजिक संस्था, सांस्कृतिक व्यवहार आ आर्थिक जीवनकेँ भारत आ नेपालक मिथिला, वज्जि आ अंगक बदलैत ऐतिहासिक संसारमे राखि पढ़ल गेल अछि; स्थानीय प्रमाणकेँ व्यापक संरचनासँ जोड़ल गेल अछि, मुदा तीनू क्षेत्रकेँ एक शाश्वत इकाइ नहि मानल गेल अछि।',
  };
}

function description(chapter: Chapter, language: HistoryLanguage) {
  if (language === 'mai') {
    return `अध्याय ${chapter.number}क स्थायी शोध-अभिलेख। स्रोत-सत्यापित शीर्षक, सारांश आ खण्ड-सूची मूल अंग्रेजी स्रोत-भाषामे सुरक्षित अछि।`;
  }
  const text = chapter.summary.replace(/\s+/g, ' ').trim();
  if (text.length <= 300) return text;
  const cut = text.slice(0, 300);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export function historyStaticParams() {
  return historyChapters.map((chapter) => ({ id: chapter.id }));
}

export function historyChapterMetadata(id: string, language: HistoryLanguage): Metadata {
  const chapter = historyChapters.find((item) => item.id === id);
  const mai = language === 'mai';
  if (!chapter) {
    return { title: mai ? 'इतिहास-अध्याय नहि भेटल' : 'History chapter not found', robots: { index: false, follow: false } };
  }
  const volume = volumeFor(chapter);
  const maiUrl = `${site}/chapters/${chapter.id}/`;
  const enUrl = `${site}/en/chapters/${chapter.id}/`;
  return {
    title: mai
      ? `अध्याय ${chapter.number}: ${chapter.title} — ${volume.shortMai}`
      : `Chapter ${chapter.number}: ${chapter.title} — ${volume.shortEn}`,
    description: description(chapter, language),
    alternates: {
      canonical: mai ? maiUrl : enUrl,
      languages: { mai: maiUrl, en: enUrl, 'x-default': maiUrl },
    },
    openGraph: {
      type: 'article',
      url: mai ? maiUrl : enUrl,
      title: mai ? `अध्याय ${chapter.number}: ${chapter.title}` : `Chapter ${chapter.number}: ${chapter.title}`,
      description: description(chapter, language),
    },
    other: {
      citation_title: chapter.title,
      citation_author: 'Gajendra Thakur',
      citation_journal_title: 'Videha Maithili eJournal',
      citation_issn: '2229-547X',
      citation_publication_date: '2026',
      'DC.language': language,
    },
  };
}

export default function HistoryChapterView({ id, language }: { id: string; language: HistoryLanguage }) {
  const mai = language === 'mai';
  const chapter = historyChapters.find((item) => item.id === id);
  const editionBase = mai ? `${site}` : `${site}/en`;
  if (!chapter) {
    return (
      <main className={styles.page} lang={language}>
        <div className={styles.shell}>
          <header className={styles.chapterHero}>
            <p className={styles.eyebrow}>{mai ? 'इतिहास-अध्याय' : 'History chapter'}</p>
            <h1>{mai ? 'अध्याय नहि भेटल' : 'Chapter not found'}</h1>
          </header>
        </div>
      </main>
    );
  }

  const volume = volumeFor(chapter);
  const chapterIndex = volume.chapters.findIndex((item) => item.id === chapter.id);
  const previous = chapterIndex > 0 ? volume.chapters[chapterIndex - 1] : undefined;
  const next = chapterIndex < volume.chapters.length - 1 ? volume.chapters[chapterIndex + 1] : undefined;
  const maiUrl = `${site}/chapters/${chapter.id}/`;
  const enUrl = `${site}/en/chapters/${chapter.id}/`;
  const canonical = mai ? maiUrl : enUrl;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': canonical,
    url: canonical,
    inLanguage: language,
    isAccessibleForFree: true,
    mainEntity: {
      '@type': 'Chapter',
      name: chapter.title,
      position: chapter.number,
      description: chapter.summary,
      inLanguage: 'en',
      author: { '@type': 'Person', name: 'Gajendra Thakur' },
      isPartOf: { '@type': 'Book', name: volume.titleEn },
      about: [{ '@type': 'Place', name: 'Mithila' }, { '@type': 'Place', name: 'Vajji' }, { '@type': 'Place', name: 'Anga' }],
    },
  };

  return (
    <main className={styles.page} lang={language}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />
      <div className={styles.shell}>
        <div className={styles.breadcrumbs}>
          <nav aria-label={mai ? 'पथ' : 'Breadcrumb'}>
            <a href={`${editionBase}/`}>{mai ? 'विदेह डिजिटल शोध अभिलेखागार' : 'Videha Digital Research Archive'}</a>
            <span aria-hidden="true">/</span>
            <a href={`${editionBase}/history/`}>{mai ? 'इतिहासक खण्ड' : 'History volumes'}</a>
            <span aria-hidden="true">/</span>
            <span>{mai ? volume.sequenceMai : volume.sequenceEn} · {mai ? 'अध्याय' : 'Chapter'} {chapter.number}</span>
          </nav>
          <nav aria-label={mai ? 'भाषा' : 'Language'}>
            <a href={mai ? enUrl : maiUrl} hrefLang={mai ? 'en' : 'mai'}>{mai ? 'English' : 'मैथिली'}</a>
          </nav>
        </div>

        <article>
          <header className={styles.chapterHero}>
            <p className={styles.eyebrow}>{mai ? `${volume.sequenceMai} · ${volume.shortMai}` : `${volume.sequenceEn} · ${volume.shortEn}`}</p>
            <span className={styles.chapterCode}>{mai ? 'अध्याय' : 'Chapter'} {String(chapter.number).padStart(3, '0')} · {mai ? 'पूर्ण' : chapter.status}</span>
            <h1 lang="en">{chapter.title}</h1>
            <p className={styles.chapterDeck}>
              {mai
                ? 'ई दू-खण्डीय मिथिला–वज्जि–अंग इतिहासक स्थायी शोध-पन्ना अछि। नीचाँक विस्तृत अध्याय-विवरण आ सम्पूर्ण खण्ड-सूची स्रोत-सत्यापित अंग्रेजी सूचीसँ यथावत् देल गेल अछि।'
                : 'A permanent research page in the two-volume History of Mithila, Vajji & Anga. The description below is the full source-controlled catalogue account for this chapter, followed by its complete indexed section structure.'}
            </p>
            {mai && (
              <div className={styles.contextBox} role="note">
                <strong>स्रोत-भाषा सूचना</strong>
                <p>समीक्षित मैथिली अध्याय-सारांश उपलब्ध नहि रहने स्रोत-सत्यापित अंग्रेजी पाठ यथावत् राखल गेल अछि। मशीनी अनुवाद प्रकाशित नहि कएल गेल अछि।</p>
              </div>
            )}
            <dl className={styles.metaGrid}>
              <div><dt>{mai ? 'पोथी' : 'Book'}</dt><dd>{mai ? `${volume.sequenceMai} · ${volume.shortMai}` : `${volume.sequenceEn} · ${volume.shortEn}`}</dd></div>
              <div><dt>{mai ? 'भाग' : 'Part'}</dt><dd lang="en">{chapter.part}</dd></div>
              <div><dt>{mai ? 'स्रोत-स्थान' : 'Source locator'}</dt><dd lang="en">{chapter.pages}</dd></div>
              <div><dt>{mai ? 'शोध-संरचना' : 'Research structure'}</dt><dd>{chapter.sections.length} {mai ? 'अनुक्रमित खण्ड' : 'indexed sections'}</dd></div>
            </dl>
          </header>

          <div className={styles.articleGrid}>
            <div>
              <section className={styles.prose} aria-labelledby="description-heading">
                <h2 id="description-heading">{mai ? 'विस्तृत अध्याय-विवरण' : 'Detailed chapter description'}</h2>
                <p lang="en">{chapter.summary}</p>
              </section>
              <section className={styles.contextBox} aria-labelledby="context-heading">
                <h2 id="context-heading">{mai ? 'दू-खण्डीय इतिहासमे स्थान' : 'Place in the two-volume history'}</h2>
                <p>{mai ? volume.contextMai : volume.contextEn}</p>
              </section>
            </div>
            <aside className={styles.contents} aria-labelledby="contents-heading">
              <h2 id="contents-heading">{mai ? 'अनुक्रमित अध्याय-सामग्री' : 'Indexed chapter contents'}</h2>
              {chapter.sections.length > 0 ? (
                <ol lang="en">{chapter.sections.map((section) => <li key={section}>{section}</li>)}</ol>
              ) : (
                <p>{mai ? 'ई अध्यायक खण्ड-स्तरीय सूची दर्ज नहि अछि।' : 'No section-level index is recorded for this chapter.'}</p>
              )}
            </aside>
          </div>

          {(previous || next) && (
            <nav className={styles.chapterNav} aria-label={mai ? 'एहि खण्डक लगपासक अध्याय' : 'Adjacent chapters in this volume'}>
              {previous ? <a href={`${editionBase}/chapters/${previous.id}/`}><small>{mai ? '← पछिला अध्याय' : '← Previous chapter'}</small><strong lang="en">{previous.number}. {previous.title}</strong></a> : <span />}
              {next ? <a href={`${editionBase}/chapters/${next.id}/`}><small>{mai ? 'अगिला अध्याय →' : 'Next chapter →'}</small><strong lang="en">{next.number}. {next.title}</strong></a> : <span />}
            </nav>
          )}
        </article>

        <nav className={styles.footerLinks} aria-label={mai ? 'सम्बन्धित अभिलेखागार स्रोत' : 'Related archive resources'}>
          <a href={`${editionBase}/history/`}>{mai ? 'दुनू इतिहास-खण्डक सभ अध्याय' : 'All chapters in both history volumes'}</a>
          <a href={`${editionBase}/sources/`}>{mai ? 'साक्ष्य आ स्रोत-पद्धति' : 'Evidence and source method'}</a>
          <a href={`${site}/source-library/`}>{mai ? 'स्रोत PDF पुस्तकालय' : 'Source PDF library'}</a>
          <a href={`${editionBase}/`}>{mai ? 'मुख्य अभिलेखागार' : 'Main archive'}</a>
        </nav>
      </div>
    </main>
  );
}
