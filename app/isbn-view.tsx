/* oxlint-disable next/no-html-link-for-pages -- exported GitHub Pages routes use full document navigation. */

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

const equivalences = [
  {
    isbn: '978-93-341-0402-8',
    aliases: ['Gadya Padya Bharti 1', 'Videha Sadeha 28'],
    portalTitle: 'विदेह सदेह २८ अनूदित गद्य आ पद्य अंक १ to ३५०',
  },
  {
    isbn: '978-93-5890-150-4',
    aliases: ['Gadya Padya Bharti 2', 'Videha Sadeha 37'],
    portalTitle: 'गद्य पद्य भारती अनुवाद खण्ड 2 विदेह सदेह 37',
  },
];

export default function IsbnView({ language }: { language: 'mai' | 'en' }) {
  const mai = language === 'mai';
  const jsonUrl = `${site}/data/videha-isbn-authority.json`;
  const csvUrl = `${site}/data/videha-isbn-authority.csv`;
  const pageUrl = mai ? `${site}/isbn/` : `${site}/en/isbn/`;
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Videha ISBN Authority Registry',
    description: 'Authoritative 293-record Videha ISBN allotment registry supporting the Mithila–Vajji–Anga research archive.',
    url: pageUrl,
    identifier: 'VIDEHA-ISBN-AUTHORITY-293-2026-09-14',
    dateModified: '2026-09-14',
    inLanguage: language,
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: jsonUrl },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: csvUrl },
    ],
  };

  return (
    <main className="isbn-registry" lang={language}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd).replaceAll('<', '\\u003c') }} />
      <header>
        <p className="kicker">{mai ? 'प्रामाणिक ग्रन्थसूची अभिलेख' : 'AUTHORITATIVE BIBLIOGRAPHIC REGISTER'}</p>
        <h1>{mai ? 'विदेह ISBN प्रामाणिक सूची' : 'Videha ISBN Authority Registry'}</h1>
        <p className="lede">
          {mai
            ? <>ई सूची सम्पादक-देल ISBN.gov.in allotment export पर आधारित अछि। एहिमे <strong>२९३ टा अद्वितीय आवंटित ISBN</strong> अछि आ ई पुरान Videha staging, reconciliation वा provisional ISBN सूची पर प्रभावी अछि।</>
            : <>This registry is derived from the editor-supplied ISBN.gov.in allotment export. It contains <strong>293 unique allotted ISBNs</strong> and supersedes every earlier Videha ISBN staging, reconciliation or provisional list.</>}
        </p>
        <div className="summary" aria-label={mai ? 'सूची-सार' : 'Registry summary'}>
          <span><strong>293</strong> {mai ? 'अद्वितीय ISBN' : 'unique ISBNs'}</span>
          <span><strong>293/293</strong> {mai ? 'मान्य ISBN-13' : 'valid ISBN-13'}</span>
          <span><strong>0</strong> {mai ? 'publisher-source field' : 'publisher-source fields'}</span>
        </div>
        <p><a href={jsonUrl}>{mai ? 'सम्पूर्ण JSON सूची' : 'Download complete JSON registry'}</a>{' · '}<a href={csvUrl}>{mai ? 'सम्पूर्ण CSV सूची' : 'Download complete CSV registry'}</a>{' · '}<a href={mai ? `${site}/en/isbn/` : `${site}/isbn/`} hrefLang={mai ? 'en' : 'mai'}>{mai ? 'English' : 'मैथिली'}</a></p>
      </header>

      <section>
        <h2>{mai ? 'प्रामाणिकता आ विरोध-समाधान नीति' : 'Authority and conflict policy'}</h2>
        <p>{mai ? 'पुरान विदेह ISBN मेटाडेटासँ विरोध भेला पर एहि २९३-अभिलेखक सूचीमे देल allotment record सम्बन्धित संस्करण लेल प्रामाणिक मानल जाएत। शीर्षकक exact/normalized मिलानक बाद author/editor आ edition जाँचल जाइत अछि। अनुवाद, रूपान्तर, format वा भाषा-संस्करण अलग bibliographic entity रहैत अछि, जँ तक ओकरा स्पष्ट रूपेँ एकहि संस्करण नहि कहल गेल हो।' : 'When this registry conflicts with older Videha ISBN metadata, this 293-record authority is controlling for the allotted edition represented by the portal record. Exact or normalized title is matched first, then author/editor and edition are checked. Translations, adaptations, format changes and language editions remain separate bibliographic entities unless explicitly identified as the same edition.'}</p>
        <p><strong>{mai ? 'सम्पादकीय निर्देश:' : 'Editorial instruction:'}</strong> {mai ? 'स्रोत spreadsheet केर “Name of Publishing Agency/Publisher” स्तम्भ पूर्णतः बाहर अछि। ओकरा store, export, validation वा reconciliation मे उपयोग नहि कएल जाइत अछि।' : 'The source spreadsheet column “Name of Publishing Agency/Publisher” is excluded completely. It is not stored, exported, validated or used for reconciliation.'}</p>
      </section>

      <section>
        <h2>{mai ? 'एकहि कृतिक समान नाम' : 'Same-work equivalences'}</h2>
        <ul>{equivalences.map((item) => <li key={item.isbn}><strong>{item.aliases.join(' = ')}</strong> → <code>{item.isbn}</code><br /><span lang="mai">{item.portalTitle}</span></li>)}</ul>
      </section>

      <section>
        <h2>{mai ? 'विशेष सम्पादकीय ISBN निर्धारण' : 'Explicit editorial ISBN assignment'}</h2>
        <p><strong>आत्मतत्त्वविवेक / Ātmatattvaviveka:</strong> <code>978-93-5943-857-3</code></p>
      </section>

      <section>
        <h2>{mai ? 'मशीन-पठनीय प्रामाणिक डेटा' : 'Machine-readable authority data'}</h2>
        <p>{mai ? 'बिल्ड २९३ अभिलेख, अद्वितीयता, ISBN-13 check digit, समान-कृति mapping, canonical archive assignment आ publisher-source column केर अनुपस्थितिक fail-closed जाँच करैत अछि।' : 'The build fails closed if record count, uniqueness, ISBN-13 check digits, equivalence mappings, canonical archive assignments or exclusion of the publisher-source column drift from the authority.'}</p>
      </section>

      <footer><a href={mai ? `${site}/` : `${site}/en/`}>{mai ? '← विदेह डिजिटल शोध अभिलेखागार पर आपस जाउ' : '← Return to the Videha Digital Research Archive'}</a><p>© Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN 2229-547X</p></footer>

      <style>{`
        .isbn-registry{max-width:980px;margin:0 auto;padding:clamp(2rem,6vw,5rem) 1.25rem 4rem;color:#172437;font:17px/1.7 Georgia,"Times New Roman",serif}
        .isbn-registry header{padding-bottom:2rem;border-bottom:1px solid #c9c4b8}.isbn-registry .kicker{font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.16em;color:#8c3d24}.isbn-registry h1{font-size:clamp(2.4rem,7vw,5rem);line-height:.98;margin:.35rem 0 1rem;color:#0d2742}.isbn-registry .lede{font-size:1.16rem;max-width:820px}.isbn-registry .summary{display:flex;flex-wrap:wrap;gap:.65rem;margin:1.25rem 0}.isbn-registry .summary span{font:700 .88rem/1.2 system-ui,sans-serif;border:1px solid #aeb9c2;border-radius:999px;padding:.55rem .75rem;background:#f7f9fa}.isbn-registry section{padding:1.8rem 0;border-bottom:1px solid #ddd7ca}.isbn-registry h2{font-size:1.55rem;color:#0d2742}.isbn-registry li{margin:.7rem 0}.isbn-registry code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#f2efe8;padding:.12rem .32rem;border-radius:4px}.isbn-registry a{color:#174c7d}.isbn-registry footer{padding-top:2rem;font-size:.9rem}.isbn-registry a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}
      `}</style>
    </main>
  );
}
