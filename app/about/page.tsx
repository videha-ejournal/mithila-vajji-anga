import type { Metadata } from 'next';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const sourceRepository = 'https://github.com/videha-ejournal/videha-ejournal';

export const metadata: Metadata = {
  title: 'About the Archive',
  description:
    'Identity, scope and scholarly infrastructure of the Videha Digital Research Archive, a Digital Humanities Research Environment for Mithila, Vajji & Anga.',
  alternates: { canonical: `${site}/about/` },
};

const links = [
  ['Permanent records', `${site}/records/`],
  ['Versioned research data', `${site}/data/`],
  ['Videha ISBN authority', `${site}/isbn/`],
  ['Source PDF library', `${site}/source-library/`],
  ['Dedicated PDF repository', sourceRepository],
  ['Editorial method', `${site}/method/`],
  ['Rights and licensing', `${site}/rights/`],
  ['Accessibility', `${site}/accessibility/`],
];

export default function AboutArchive() {
  return (
    <main className="archive-about">
      <header>
        <p className="kicker">PREFERRED SCHOLARLY IDENTITY</p>
        <h1>Videha Digital Research Archive</h1>
        <p className="subtitle">Digital Humanities Research Environment for Mithila, Vajji &amp; Anga</p>
        <p className="lede">
          This is not merely a website associated with a set of books. It is a source-controlled digital research
          environment in which records are designed to be permanent, citable, machine-readable, versioned and
          independently discoverable.
        </p>
      </header>

      <section>
        <h2>What the archive contains</h2>
        <p>
          The environment connects regional history, genealogy and Panji research, literature, philosophical debate,
          texts and translations, people, places, chronology, maps, teaching material and research-practice tools across
          Mithila, Vajji and Anga in India and Nepal.
        </p>
      </section>

      <section>
        <h2>Scholarly infrastructure</h2>
        <ul>
          <li>Stable permanent-record URLs for histories, ideas, people, places, texts and chronology.</li>
          <li>BibTeX, RIS and CSL-JSON citation downloads for permanent records.</li>
          <li>Schema.org JSON-LD, citation metadata, canonical URLs, sitemap discovery and machine-readable indexes.</li>
          <li>Versioned JSON, CSV, NDJSON and GeoJSON research releases with SHA-256 checksums.</li>
          <li>A fail-closed 293-record Videha ISBN authority registry derived from the editor-supplied ISBN.gov.in export.</li>
          <li>Evidence-status labels, editorial method, rights matrix, accessibility statement and source-controlled QA.</li>
          <li>Shareable research-state URLs, comparison tools, multilingual search support and offline/PWA infrastructure.</li>
          <li>Commit-pinned source-book objects from the dedicated Videha PDF repository, with Git object identifiers and machine-readable provenance.</li>
        </ul>
        <p>
          Release <strong>2026.09</strong> publishes <strong>780 permanent research records</strong> and a formal
          versioned data release. The archive is maintained by Videha Maithili eJournal, ISSN 2229-547X, and edited by
          Gajendra Thakur.
        </p>
      </section>

      <section>
        <h2>Relationship to the books</h2>
        <p>
          The books, manuscripts and translations remain foundational scholarly sources, but the archive is the wider
          research environment that connects those sources to structured records, evidence notes, citations, data,
          search, comparison and discovery. Repository PDFs are therefore treated as source objects inside the archive
          rather than as isolated downloads.
        </p>
        <p>
          The principal PDF corpus is maintained in the dedicated public repository{' '}
          <a href={sourceRepository}>videha-ejournal/videha-ejournal</a>. The{' '}
          <a href={`${site}/source-library/`}>Source PDF Library</a> records the exact source-repository commit and Git
          blob ID for each indexed PDF and links to a commit-pinned copy. This means a later replacement on the source
          repository’s <code>main</code> branch does not silently alter the version cited by a particular archive build.
        </p>
        <p>
          ISBN reconciliation is controlled separately by the <a href={`${site}/isbn/`}>Videha ISBN Authority Registry</a>.
          The current authority contains 293 unique allotted ISBNs from the editor-supplied ISBN.gov.in export and overrides
          older staging or provisional ISBN lists for the edition represented by each portal record. The source spreadsheet’s
          publishing-agency/publisher column is excluded from archive ISBN metadata.
        </p>
        <p>
          The source repository rebuilds its lightweight PDF catalogue after PDF changes, while this archive performs a
          daily refresh in addition to its normal deployment builds. Newly added or reduced PDFs therefore enter the
          archive catalogue automatically after they are pushed successfully.
        </p>
      </section>

      <section>
        <h2>How to cite and verify</h2>
        <p>
          Cite the most specific permanent record whenever possible. For computational or corpus-level work, cite the
          relevant versioned dataset release. Research-data release files use SHA-256 checksums. Externally stored source
          PDFs are identified by their exact source commit and Git blob ID; these Git identifiers are kept distinct from
          SHA-256 and are not mislabeled as cryptographic release checksums.
        </p>
      </section>

      <nav aria-label="Archive resources">
        {links.map(([label, href]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </nav>

      <footer>
        <a href={`${site}/`}>← Return to the Videha Digital Research Archive</a>
        <p>© Gajendra Thakur, Editor, Videha Maithili eJournal · ISSN 2229-547X</p>
      </footer>

      <style>{`
        .archive-about{max-width:980px;margin:0 auto;padding:clamp(2rem,6vw,5rem) 1.25rem 4rem;color:#172437;font:17px/1.7 Georgia,"Times New Roman",serif}
        .archive-about header{padding-bottom:2rem;border-bottom:1px solid #c9c4b8}
        .archive-about .kicker{font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.16em;color:#8c3d24}
        .archive-about h1{font-size:clamp(2.4rem,7vw,5.2rem);line-height:.98;margin:.35rem 0 1rem;color:#0d2742}
        .archive-about .subtitle{font-size:clamp(1.15rem,3vw,1.65rem);font-weight:700;color:#8c3d24}
        .archive-about .lede{font-size:1.18rem;max-width:780px}
        .archive-about section{padding:1.8rem 0;border-bottom:1px solid #ddd7ca}
        .archive-about h2{font-size:1.55rem;color:#0d2742}
        .archive-about li{margin:.5rem 0}
        .archive-about code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#f2efe8;padding:.12rem .32rem;border-radius:4px}
        .archive-about nav{display:flex;flex-wrap:wrap;gap:.7rem;padding:2rem 0}
        .archive-about nav a{font:700 .9rem/1.2 system-ui,sans-serif;text-decoration:none;color:#174c7d;border:1px solid #aeb9c2;border-radius:999px;padding:.55rem .8rem;background:#f7f9fa}
        .archive-about a{color:#174c7d}
        .archive-about footer{padding-top:1rem;font-size:.9rem}
        .archive-about a:focus-visible{outline:3px solid #e39b45;outline-offset:3px}
      `}</style>
    </main>
  );
}
