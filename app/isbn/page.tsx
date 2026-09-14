import type { Metadata } from 'next';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';

export const metadata: Metadata = {
  title: 'Videha ISBN Authority Registry',
  description:
    'The authoritative 293-record ISBN allotment registry for Videha bibliographic reconciliation, sourced from the ISBN.gov.in portal export retrieved 14 September 2026.',
  alternates: { canonical: `${site}/isbn/` },
};

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

export default function IsbnRegistryPage() {
  const jsonUrl = `${site}/data/videha-isbn-authority.json`;
  const csvUrl = `${site}/data/videha-isbn-authority.csv`;

  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Videha ISBN Authority Registry',
    description:
      'Authoritative 293-record Videha ISBN allotment registry supporting the Mithila–Vajji–Anga research archive.',
    url: `${site}/isbn/`,
    identifier: 'VIDEHA-ISBN-AUTHORITY-293-2026-09-14',
    dateModified: '2026-09-14',
    publisher: {
      '@type': 'Organization',
      name: 'Videha Maithili eJournal',
      identifier: 'ISSN 2229-547X',
      url: 'https://www.videha.co.in/',
    },
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: jsonUrl },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: csvUrl },
    ],
  };

  return (
    <main className="isbn-registry">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <header>
        <p className="kicker">AUTHORITATIVE BIBLIOGRAPHIC REGISTER</p>
        <h1>Videha ISBN Authority Registry</h1>
        <p className="lede">
          This register is derived from the editor-supplied ISBN.gov.in allotment export retrieved
          14 September 2026. It contains <strong>293 unique allotted ISBNs</strong> and supersedes
          every earlier Videha ISBN staging, reconciliation or provisional list.
        </p>
        <div className="summary" aria-label="Registry summary">
          <span><strong>293</strong> unique ISBNs</span>
          <span><strong>182</strong> Gajendra</span>
          <span><strong>111</strong> Kumari Prity</span>
          <span><strong>293/293</strong> valid ISBN-13</span>
        </div>
        <p>
          <a href={jsonUrl}>Download complete JSON registry</a>{' · '}
          <a href={csvUrl}>Download complete CSV registry</a>{' · '}
          <a href={`${site}/source-library/`}>Source PDF Library</a>
        </p>
      </header>

      <section>
        <h2>Authority and conflict policy</h2>
        <p>
          When this registry conflicts with older Videha ISBN metadata, this registry is authoritative
          for the allotted edition represented by the portal record. Exact or normalized title is
          matched first, then author/editor and edition are checked. Translations, adaptations, format
          changes and language editions remain separate bibliographic entities unless explicitly
          identified as the same edition. A PDF inherits an ISBN only when it is demonstrably that edition.
        </p>
      </section>

      <section>
        <h2>Same-work equivalences</h2>
        <p>
          The following names identify the same works and therefore must not generate duplicate bibliographic records:
        </p>
        <ul>
          {equivalences.map((item) => (
            <li key={item.isbn}>
              <strong>{item.aliases.join(' = ')}</strong> → <code>{item.isbn}</code>
              <br />
              <span lang="mai">{item.portalTitle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Machine-readable authority data</h2>
        <p>
          The downloadable registry preserves the complete portal-derived record set, including title,
          author/editor, language, edition, year, publication date, product form, country, allotment status,
          publisher, administrator, application identifiers, portal verification notes and allotment counters.
          The build fails if record count, uniqueness, ISBN-13 check digits, administrator totals, equivalence
          mappings or canonical archive ISBN assignments drift from this authority.
        </p>
      </section>

      <footer>
        <a href={`${site}/`}>← Return to the Videha Digital Research Archive</a>
        <p>© Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN 2229-547X</p>
      </footer>

      <style>{`
        .isbn-registry{max-width:980px;margin:0 auto;padding:clamp(2rem,6vw,5rem) 1.25rem 4rem;color:#172437;font:17px/1.7 Georgia,"Times New Roman",serif}
        .isbn-registry header{padding-bottom:2rem;border-bottom:1px solid #c9c4b8}
        .isbn-registry .kicker{font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.16em;color:#8c3d24}
        .isbn-registry h1{font-size:clamp(2.4rem,7vw,5rem);line-height:.98;margin:.35rem 0 1rem;color:#0d2742}
        .isbn-registry .lede{font-size:1.16rem;max-width:820px}
        .isbn-registry .summary{display:flex;flex-wrap:wrap;gap:.65rem;margin:1.25rem 0}
        .isbn-registry .summary span{font:700 .88rem/1.2 system-ui,sans-serif;border:1px solid #aeb9c2;border-radius:999px;padding:.55rem .75rem;background:#f7f9fa}
        .isbn-registry section{padding:1.8rem 0;border-bottom:1px solid #ddd7ca}
        .isbn-registry h2{font-size:1.55rem;color:#0d2742}
        .isbn-registry li{margin:.7rem 0}
        .isbn-registry code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#f2efe8;padding:.12rem .32rem;border-radius:4px}
        .isbn-registry a{color:#174c7d}
        .isbn-registry footer{padding-top:2rem;font-size:.9rem}
        .isbn-registry a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}
      `}</style>
    </main>
  );
}
