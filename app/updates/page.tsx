import { ArrowLeft, Check, CircleDashed } from 'lucide-react';
/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported secondary routes. */

export const metadata = {
  title: 'Status and roadmap | Mithila–Vajji–Anga',
  description: 'Changelog, completion status, release history, and roadmap for the living Videha research archive.',
  alternates: { canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/updates/' },
};
export const dynamic = 'force-static';

const changes = [
  ['13 September 2026', 'Published scholarly infrastructure release 2026.09: permanent record pages, BibTeX/RIS/CSL-JSON citations, record comparison, shareable research-state URLs, structured metadata, rights and method statements, versioned JSON/CSV/NDJSON/GeoJSON downloads with checksums, expanded sitemap/robots discovery, and offline/PWA support.'],
  ['13 September 2026', 'Added a formal WCAG 2.2 AA-oriented accessibility statement, multilingual/diacritic-tolerant permanent-record search, explicit machine-translation warning, and CI checks for the generated scholarly export.'],
  ['6 September 2026', 'Completed the 172-idea Parallel Philosophy archive and replaced Multiscript Reader machine text with supplied Maithili for both volumes wherever bilingual source text is available.'],
  ['5 September 2026', 'Completed the history archive: added source-derived summaries and section maps for all supplied Volume II Chapters 87–150, bringing the programme to 178 out of 178 completed chapters.'],
  ['5 September 2026', 'Reframed the homepage around four research doors; added federated search, graph facets, map-context warning, stable source records, and keyboard improvements.'],
  ['4 September 2026', 'Added the first bundled Maithili readings and retained Tirhuta conversion. These were superseded by supplied bilingual source text on 6 September.'],
];

export default function UpdatesPage() {
  return (
    <main className="reference-page" id="top">
      <header className="reference-hero">
        <a href="../index.html#doors"><ArrowLeft /> Return to the four doors</a>
        <p className="eyebrow">LIVING ARCHIVE STATUS</p>
        <h1>What is complete, what changed, and what comes next</h1>
        <p>This register makes the archive’s developing scope explicit. Both the 178-chapter historical programme and the 172-idea philosophical programme are complete, and release 2026.09 adds a durable scholarly publication layer around them.</p>
        <div className="reference-meta"><strong>Last updated 13 September 2026</strong><span>Scholarly infrastructure release 2026.09</span></div>
      </header>
      <section className="status-ledger">
        <article><Check /><div><h2>History</h2><strong>178 out of 178 completed</strong><p>Volume I: all 28 chapters supplied. Volume II: all 150 chapters supplied, indexed, summarised, and mapped by section.</p></div></article>
        <article><Check /><div><h2>Parallel Philosophy</h2><strong>172 out of 172 completed</strong><p>Volume I: all 72 bilingual chapters supplied. Volume II: all 100 Maithili chapters supplied, with English readings throughout.</p></div></article>
        <article><Check /><div><h2>Scholarly publication layer</h2><strong>Permanent records · citations · datasets · PWA</strong><p>Stable URLs, citation exports, evidence labels, structured metadata, comparison, research-data releases, accessibility/method/rights statements, and expanded discovery are generated from the source corpus on every build.</p></div></article>
      </section>
      <section className="change-log"><p className="eyebrow">CHANGELOG</p><h2>Recent archive changes</h2>{changes.map(([date, text]) => <article key={`${date}-${text}`}><time>{date}</time><p>{text}</p></article>)}</section>
      <section className="roadmap"><p className="eyebrow">ROADMAP</p><h2>Next source-controlled additions</h2><ul><li><CircleDashed /> Add approved public facsimiles or stable edition links to source records where publication rights permit.</li><li><CircleDashed /> Continue manual keyboard, screen-reader, mobile, zoom/reflow, contrast, and touch-target testing as interactive tools grow.</li><li><CircleDashed /> Add georeferenced historical layers only where source-controlled boundary geometries become defensible; modern orientation points must not be mistaken for reconstructed frontiers.</li></ul></section>
    </main>
  );
}
