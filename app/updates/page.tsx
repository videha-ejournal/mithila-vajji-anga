import { ArrowLeft, Check, CircleDashed } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Status and roadmap | Mithila–Vajji–Anga',
  description: 'Changelog, completion status, and roadmap for the living Videha research archive.',
};

const changes = [
  ['5 September 2026', 'Reframed the homepage around four research doors; added federated search, graph facets, map-context warning, stable source records, and keyboard improvements.'],
  ['4 September 2026', 'Added reliable bundled Maithili readings for all 118 completed philosophy ideas and retained Tirhuta conversion.'],
  ['4 September 2026', 'Expanded all 28 Volume I history chapters and all 86 supplied Volume II chapters; translated and structured 46 supplied Volume II philosophy chapters in English.'],
];

export default function UpdatesPage() {
  return (
    <main className="reference-page" id="top">
      <header className="reference-hero">
        <Link href="../#doors"><ArrowLeft /> Return to the four doors</Link>
        <p className="eyebrow">LIVING ARCHIVE STATUS</p>
        <h1>What is complete, what changed, and what comes next</h1>
        <p>This register makes the archive’s developing scope explicit. “Planned” means no completed supplied chapter is claimed.</p>
        <div className="reference-meta"><strong>Last updated 5 September 2026</strong><span>Maintained by the Videha research ecosystem</span></div>
      </header>
      <section className="status-ledger">
        <article><Check /><div><h2>History</h2><strong>114 of 178 chapters complete</strong><p>Volume I: 28 supplied. Volume II: 86 supplied; 64 retained as planned scope.</p></div></article>
        <article><Check /><div><h2>Parallel Philosophy</h2><strong>118 of 172 ideas complete</strong><p>Volume I: 72 supplied. Volume II: 46 supplied in English translation; 54 retained as planned scope.</p></div></article>
        <article><Check /><div><h2>Discovery infrastructure</h2><strong>880 graph records · 160 chronology records</strong><p>People, places, texts, ideas, dated claims, Panji headings, and source-led learning records remain searchable.</p></div></article>
      </section>
      <section className="change-log"><p className="eyebrow">CHANGELOG</p><h2>Recent archive changes</h2>{changes.map(([date, text]) => <article key={date}><time>{date}</time><p>{text}</p></article>)}</section>
      <section className="roadmap"><p className="eyebrow">ROADMAP</p><h2>Next source-controlled additions</h2><ul><li><CircleDashed /> Add Volume II history Chapters 87–150 only as manuscripts are supplied.</li><li><CircleDashed /> Add Parallel Philosophy Volume II Chapters 47–100 only as source chapters are supplied.</li><li><CircleDashed /> Add approved public facsimiles or stable edition links to source records where publication rights permit.</li><li><CircleDashed /> Continue keyboard, screen-reader, and mobile testing as interactive tools grow.</li></ul></section>
    </main>
  );
}
