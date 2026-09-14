import { ArrowLeft, Check, CircleDashed } from 'lucide-react';
/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported secondary routes. */

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

const changesEn = [
  ['14 September 2026', 'Completed the true bilingual release pass: the Maithili route now carries a Maithili interface rather than English interface copy under Maithili metadata; History receives paired Maithili and English index/chapter routes; Sources, Updates, About and ISBN receive genuine language-aware editions; content-language checks now fail the build on regression.'],
  ['14 September 2026', 'Integrated the authoritative 293-record ISBN register, excluded the publishing-agency source column, enforced same-work equivalences, and preserved the editor-supplied Atmatattvaviveka ISBN.'],
  ['14 September 2026', 'Formalized WCAG 2.2 AA-oriented engineering checks. Manual NVDA, JAWS, VoiceOver, TalkBack, zoom/reflow and touch-target certification remains Pending until tested on the relevant devices.'],
  ['13 September 2026', 'Published scholarly infrastructure release 2026.09: permanent records, citations, datasets, structured metadata, checksums, sitemap/robots discovery and offline/PWA support.'],
];

const changesMai = [
  ['१४ सितम्बर २०२६', 'वास्तविक द्विभाषी प्रकाशन-पास पूरा कएल गेल: मैथिली पथ पर आब मैथिली इंटरफेस अछि, केवल मैथिली मेटाडेटाक भीतर अंग्रेजी इंटरफेस नहि। इतिहासक सूची आ १७८ अध्यायक मैथिली–अंग्रेजी जोड़ीदार पथ बनाओल गेल; स्रोत, अद्यतन, परिचय आ ISBN लेल सेहो वास्तविक भाषा-अनुरूप संस्करण जोड़ल गेल; भाषा-विषयक प्रतिगमन पर बिल्ड आब असफल होएत।'],
  ['१४ सितम्बर २०२६', '२९३-अभिलेखक प्रामाणिक ISBN सूची समाहित कएल गेल; प्रकाशन-संस्था/Publisher स्रोत-स्तम्भ पूर्णतः बाहर राखल गेल; समान-कृति नाम-सम्बन्ध लागू कएल गेल; सम्पादक-देल आत्मतत्त्वविवेक ISBN सुरक्षित कएल गेल।'],
  ['१४ सितम्बर २०२६', 'WCAG 2.2 AA उन्मुख अभियान्त्रिकी-जाँच औपचारिक कएल गेल। NVDA, JAWS, VoiceOver, TalkBack, zoom/reflow आ touch-targetक वास्तविक उपकरण-जाँच पूरा होएबा धरि मानवीय प्रमाणन Pending रहत।'],
  ['१३ सितम्बर २०२६', 'शोध-अवसंरचना 2026.09 प्रकाशित भेल: स्थायी अभिलेख, उद्धरण, डेटासेट, संरचित मेटाडेटा, checksum, sitemap/robots खोज-सहायता आ offline/PWA समर्थन।'],
];

export default function UpdatesView({ language }: { language: 'mai' | 'en' }) {
  const mai = language === 'mai';
  const base = mai ? site : `${site}/en`;
  const changes = mai ? changesMai : changesEn;
  return (
    <main className="reference-page" id="top" lang={language}>
      <header className="reference-hero">
        <a href={`${base}/#doors`}><ArrowLeft /> {mai ? 'चारि शोध-दुआरि पर आपस जाउ' : 'Return to the four doors'}</a>
        <p className="eyebrow">{mai ? 'जीवित अभिलेखागारक स्थिति' : 'LIVING ARCHIVE STATUS'}</p>
        <h1>{mai ? 'की पूरा भेल, की बदलल, आ आगाँ की बाँकी अछि' : 'What is complete, what changed, and what comes next'}</h1>
        <p>
          {mai
            ? '१७८-अध्यायक इतिहास आ १७२-विचारक समानान्तर दर्शन कार्यक्रम पूर्ण अछि। द्विभाषी प्रकाशन, स्रोत-सत्यापन, ISBN, पहुँचयोग्यता आ डिजिटल-मानविकी अवसंरचना fail-closed नियमसँ चलैत अछि।'
            : 'Both the 178-chapter historical programme and the 172-idea philosophical programme are complete. Bilingual publication, source verification, ISBN, accessibility and digital-humanities infrastructure operate under fail-closed release rules.'}
        </p>
        <div className="reference-meta"><strong>{mai ? 'अन्तिम अद्यतन १४ सितम्बर २०२६' : 'Last updated 14 September 2026'}</strong><span>{mai ? 'द्विभाषी प्रकाशन-अखण्डता' : 'Bilingual release integrity'}</span></div>
        <a href={mai ? `${site}/en/updates/` : `${site}/updates/`} hrefLang={mai ? 'en' : 'mai'}>{mai ? 'English' : 'मैथिली'}</a>
      </header>
      <section className="status-ledger">
        <article><Check /><div><h2>{mai ? 'इतिहास' : 'History'}</h2><strong>{mai ? '१७८ मे १७८ पूर्ण' : '178 out of 178 completed'}</strong><p>{mai ? 'खण्ड १: २८ अध्याय; खण्ड २: १५० अध्याय। मैथिली इंटरफेस आ अंग्रेजी स्रोत-पाठक स्पष्ट भाषा-चिन्हन संग १७८ जोड़ीदार अध्याय-पथ उपलब्ध अछि।' : 'Volume I: 28 chapters; Volume II: 150 chapters. All 178 now have paired Maithili-interface and English routes with explicit source-language marking.'}</p></div></article>
        <article><Check /><div><h2>{mai ? 'समानान्तर दर्शन' : 'Parallel Philosophy'}</h2><strong>{mai ? '१७२ मे १७२ पूर्ण' : '172 out of 172 completed'}</strong><p>{mai ? 'खण्ड १क ७२ आ खण्ड २क १०० अध्याय स्रोत-सूचीमे उपलब्ध अछि।' : 'Volume I: 72 chapters; Volume II: 100 chapters.'}</p></div></article>
        <article><Check /><div><h2>{mai ? 'ISBN प्रामाणिक सूची' : 'ISBN authority'}</h2><strong>293 / 293</strong><p>{mai ? 'प्रकाशन-संस्था/Publisher स्रोत-स्तम्भ उपयोग नहि कएल जाइत अछि। पुरान विरोधी ISBN पर प्रामाणिक सूची प्रभावी अछि।' : 'The publishing-agency/Publisher source column is not used. The authoritative registry overrides older conflicting ISBN metadata.'}</p></div></article>
        <article><CircleDashed /><div><h2>{mai ? 'मानवीय पहुँचयोग्यता प्रमाणन' : 'Manual accessibility certification'}</h2><strong>Pending</strong><p>{mai ? 'स्वचालित अभियान्त्रिकी-जाँच सक्रिय अछि; वास्तविक NVDA, JAWS, VoiceOver, TalkBack, 200–400% zoom, 320px reflow आ touch-target परीक्षण मानवीय/उपकरण जाँच बिना Passed नहि कहल जाएत।' : 'Automated engineering checks are active; real NVDA, JAWS, VoiceOver, TalkBack, 200–400% zoom, 320px reflow and touch-target testing will not be marked Passed without human/device testing.'}</p></div></article>
      </section>
      <section className="change-log"><p className="eyebrow">{mai ? 'परिवर्तन-सूची' : 'CHANGELOG'}</p><h2>{mai ? 'हालक अभिलेखागार परिवर्तन' : 'Recent archive changes'}</h2>{changes.map(([date, text]) => <article key={`${date}-${text}`}><time>{date}</time><p>{text}</p></article>)}</section>
      <section className="roadmap"><p className="eyebrow">{mai ? 'आगाँक काज' : 'ROADMAP'}</p><h2>{mai ? 'केवल प्रमाण-आधारित बाँकी काज' : 'Remaining source-controlled work'}</h2><ul><li><CircleDashed /> {mai ? 'पञ्जी स्रोत-संरचनाक १०५ अनसुलझल बिन्दु स्रोत-जाँचसँ समाधान करू; ताहि धरि विस्तृत कृत्रिम inventory प्रकाशित नहि होएत।' : 'Resolve the 105 Panji source-structure issues through source review; no synthetic detail inventory will be published meanwhile.'}</li><li><CircleDashed /> {mai ? 'मानवीय सहायक-तकनीक matrix वास्तविक उपकरण पर पूरा करू।' : 'Complete the manual assistive-technology matrix on real devices.'}</li><li><CircleDashed /> {mai ? 'स्रोत-नियन्त्रित सीमा-ज्यामिति प्रमाणित भेले पर मात्र नव ऐतिहासिक भू-स्तर जोड़ू।' : 'Add further historical geometry only when source-controlled boundary evidence becomes defensible.'}</li></ul></section>
    </main>
  );
}
