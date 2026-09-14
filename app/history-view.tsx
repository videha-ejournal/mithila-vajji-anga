/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported history routes. */

import researchData from './research-data.json';
import styles from './history/history.module.css';

export type HistoryLanguage = 'mai' | 'en';

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
  sequenceEn: string;
  sequenceMai: string;
  titleEn: string;
  titleMai: string;
  shortTitleEn: string;
  shortTitleMai: string;
  descriptionEn: string;
  descriptionMai: string;
  chapters: Chapter[];
};

const political = researchData.political as Chapter[];
const social = researchData.social as Chapter[];

export const allHistoryChapters = [...political, ...social];

const volumes: VolumeDefinition[] = [
  {
    id: 'volume-i',
    sequenceEn: 'Volume I',
    sequenceMai: 'खण्ड १',
    titleEn: 'General & Political History of Mithila, Vajji & Anga',
    titleMai: 'मिथिला–वज्जि–अंगक सामान्य आ राजनीतिक इतिहास',
    shortTitleEn: 'General & Political History',
    shortTitleMai: 'सामान्य आ राजनीतिक इतिहास',
    descriptionEn:
      'The first volume reconstructs the changing historical geography and political worlds of Mithila, Vajji and Anga: environment and settlement, early polities, texts and archaeology, kingdoms and dynasties, institutions and routes, India–Nepal connections, colonial transformations and modern political change. It treats regional names and boundaries historically rather than projecting a timeless map backward across the evidence.',
    descriptionMai:
      'पहिल खण्ड मिथिला, वज्जि आ अंगक बदलैत ऐतिहासिक भूगोल आ राजनीतिक संसारक अध्ययन करैत अछि—पर्यावरण आ बसोबास, आरम्भिक राज्य-व्यवस्था, पाठ आ पुरातत्त्व, राजवंश, संस्था, मार्ग, भारत–नेपाल सम्बन्ध, औपनिवेशिक परिवर्तन आ आधुनिक राजनीतिक बदलाव धरि। क्षेत्रक नाम आ सीमा समय-सापेक्ष ऐतिहासिक प्रमाणक आधार पर बुझल गेल अछि।',
    chapters: political,
  },
  {
    id: 'volume-ii',
    sequenceEn: 'Volume II',
    sequenceMai: 'खण्ड २',
    titleEn: 'Socio-Cultural & Economic History of Mithila, Vajji & Anga',
    titleMai: 'मिथिला–वज्जि–अंगक सामाजिक, सांस्कृतिक आ आर्थिक इतिहास',
    shortTitleEn: 'Socio-Cultural & Economic History',
    shortTitleMai: 'सामाजिक, सांस्कृतिक आ आर्थिक इतिहास',
    descriptionEn:
      'The second volume follows the social, cultural and economic structures through which the region was repeatedly remade: agrarian life, land and labour, household and kinship, caste and class, gender, religion, education, language, literature, arts, markets, migration, infrastructure, rivers, public institutions, media, heritage and the contemporary cultural economy across India and Nepal.',
    descriptionMai:
      'दोसर खण्ड ओहि सामाजिक, सांस्कृतिक आ आर्थिक संरचनाक अनुशीलन करैत अछि जाहिसँ ई क्षेत्र बेराबेरी नव रूप ग्रहण करैत रहल—कृषि-जीवन, भूमि आ श्रम, परिवार आ नातेदारी, जाति आ वर्ग, लैङ्गिक सम्बन्ध, धर्म, शिक्षा, भाषा, साहित्य, कला, बाजार, प्रवासन, आधारभूत संरचना, नदी, सार्वजनिक संस्था, मीडिया, धरोहर आ भारत–नेपालक समकालीन सांस्कृतिक अर्थव्यवस्था धरि।',
    chapters: social,
  },
];

function groupByPart(chapters: Chapter[]) {
  const groups: Array<{ part: string; chapters: Chapter[] }> = [];
  for (const chapter of chapters) {
    const previous = groups.at(-1);
    if (previous?.part === chapter.part) previous.chapters.push(chapter);
    else groups.push({ part: chapter.part, chapters: [chapter] });
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

export default function HistoryView({ language }: { language: HistoryLanguage }) {
  const mai = language === 'mai';
  const totalChapters = volumes.reduce((sum, volume) => sum + volume.chapters.length, 0);
  const completeChapters = volumes.reduce(
    (sum, volume) => sum + volume.chapters.filter((chapter) => chapter.status === 'Complete').length,
    0,
  );
  const base = mai ? '..' : '../..';

  return (
    <main className={styles.page} lang={language}>
      <div className={styles.shell}>
        <div className={styles.breadcrumbs}>
          <nav aria-label={mai ? 'पथ' : 'Breadcrumb'}>
            <a href={`${base}/`}>{mai ? 'विदेह डिजिटल शोध अभिलेखागार' : 'Videha Digital Research Archive'}</a>
            <span aria-hidden="true">/</span>
            <span>{mai ? 'इतिहासक खण्ड' : 'History volumes'}</span>
          </nav>
          <nav aria-label={mai ? 'भाषा' : 'Language'}>
            <a href={mai ? '../en/history/' : '../../history/'} hrefLang={mai ? 'en' : 'mai'}>
              {mai ? 'English' : 'मैथिली'}
            </a>
          </nav>
        </div>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Mithila · Vajji · Anga · India & Nepal</p>
            <h1>{mai ? 'दू इतिहास, एक जुड़ल क्षेत्रीय अभिलेखागार' : 'Two histories, one connected regional archive'}</h1>
            <p className={styles.heroIntro}>
              {mai
                ? 'इतिहास-संग्रहकेँ एक सपाट कालक्रमक बदला दू परस्परपूरक खण्डमे व्यवस्थित कएल गेल अछि। पहिल खण्ड सामान्य आ राजनीतिक इतिहासक अनुसरण करैत अछि; दोसर खण्ड सामाजिक, सांस्कृतिक आ आर्थिक इतिहासक पुनर्निर्माण करैत अछि। नीचाँक १७८ अध्यायक सभ स्थायी अभिलेख स्रोत-नियन्त्रित शोध-सूचीसँ बनैत अछि।'
                : 'The history collection is organised as two complementary volumes rather than a single flattened chronology. Volume I follows general and political history; Volume II reconstructs socio-cultural and economic history. Every chapter below has its own permanent page with the complete catalogue description, chapter position, source pagination or manuscript range, and full indexed section structure.'}
            </p>
          </div>
          <aside className={styles.heroAside}>
            <strong>{mai ? 'पूर्ण अध्याय-दुआरि' : 'Complete chapter gateway'}</strong>
            <p>
              {mai
                ? `${completeChapters} पूर्ण अध्याय ${totalChapters} स्थायी अध्याय-अभिलेखमे उपलब्ध अछि। शीर्षक, शोध-सारांश आ खण्ड-सूची मूल स्रोत-सूचीमे अंग्रेजीमे सत्यापित अछि; समीक्षित मैथिली रूप उपलब्ध नहि रहने ओकरा स्रोत-भाषामे स्पष्ट रूपेँ राखल गेल अछि।`
                : `${completeChapters} completed chapters are represented across ${totalChapters} permanent chapter records. The chapter pages are generated from the same source-controlled research catalogue used by the main archive, so the index does not substitute generic summaries for the supplied scholarship.`}
            </p>
          </aside>
        </header>

        {mai && (
          <aside className={styles.heroAside} role="note" lang="mai">
            <strong>भाषा-नीति</strong>
            <p>
              ई पन्नाक नेविगेशन आ सम्पादकीय व्याख्या मैथिलीमे अछि। अध्यायक स्रोत-सत्यापित अंग्रेजी शीर्षक, सारांश आ सूचीकेँ समीक्षित मैथिली पाठ उपलब्ध होएबा धरि अंग्रेजीमे राखल गेल अछि; मशीनी अनुवादकेँ प्रामाणिक पाठक रूपमे प्रकाशित नहि कएल जाइत अछि।
            </p>
          </aside>
        )}

        <section className={styles.volumeGrid} aria-label={mai ? 'इतिहासक खण्ड चुनू' : 'Choose a history volume'}>
          {volumes.map((volume) => (
            <article className={styles.volumeCard} key={volume.id}>
              <span>{mai ? volume.sequenceMai : volume.sequenceEn} · {volume.chapters.length} {mai ? 'अध्याय' : 'chapters'}</span>
              <h2>{mai ? volume.shortTitleMai : volume.shortTitleEn}</h2>
              <p>{mai ? volume.descriptionMai : volume.descriptionEn}</p>
              <a href={`#${volume.id}`}>
                {mai ? `सभ ${volume.chapters.length} अध्याय देखू ↓` : `Browse all ${volume.chapters.length} chapters ↓`}
              </a>
            </article>
          ))}
        </section>

        {volumes.map((volume) => (
          <section className={styles.volumeSection} id={volume.id} key={volume.id}>
            <header className={styles.volumeHeader}>
              <div>
                <p className={styles.eyebrow}>{mai ? volume.sequenceMai : volume.sequenceEn}</p>
                <h2>{mai ? volume.titleMai : volume.titleEn}</h2>
                <p>{mai ? volume.descriptionMai : volume.descriptionEn}</p>
              </div>
              <span className={styles.count}>
                {volume.chapters.filter((chapter) => chapter.status === 'Complete').length} / {volume.chapters.length} {mai ? 'पूर्ण' : 'complete'}
              </span>
            </header>

            {groupByPart(volume.chapters).map((group) => (
              <section className={styles.part} key={`${volume.id}-${group.part}`}>
                <h3 lang="en">{group.part}</h3>
                {mai && <p lang="mai">ऊपरक भाग-शीर्षक स्रोत-सूचीमे अंग्रेजीमे सत्यापित अछि।</p>}
                <ol className={styles.chapterList}>
                  {group.chapters.map((chapter) => (
                    <li className={styles.chapterItem} key={chapter.id}>
                      <span className={styles.chapterNo}>
                        {mai ? 'अ.' : 'CH'} {String(chapter.number).padStart(3, '0')}
                      </span>
                      <div>
                        <h4>
                          <a href={`${base}/${mai ? '' : ''}chapters/${chapter.id}/`} lang="en">
                            {chapter.title}
                          </a>
                        </h4>
                        <p lang="en">{preview(chapter.summary)}</p>
                        <div className={styles.chapterMeta}>
                          <span>{mai ? 'पूर्ण' : chapter.status}</span>
                          <span>{chapter.sections.length} {mai ? 'अनुक्रमित खण्ड' : 'indexed sections'}</span>
                          <span lang="en">{chapter.pages}</span>
                        </div>
                      </div>
                      <a className={styles.openLink} href={`${base}/chapters/${chapter.id}/`}>
                        {mai ? 'विस्तृत अध्याय-अभिलेख →' : 'Detailed chapter page →'}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </section>
        ))}

        <nav className={styles.footerLinks} aria-label={mai ? 'सम्बन्धित अभिलेखागार स्रोत' : 'Related archive resources'}>
          <a href={`${base}/`}>{mai ? 'शोध-अभिलेखागार पर आपस जाउ' : 'Return to the research archive'}</a>
          <a href={`${base}/sources/`}>{mai ? 'साक्ष्य आ स्रोत-पद्धति' : 'Evidence and source method'}</a>
          <a href={`${base}/source-library/`}>{mai ? 'स्रोत PDF पुस्तकालय' : 'Source PDF library'}</a>
        </nav>
      </div>
    </main>
  );
}
