import { ArrowLeft, ExternalLink, FileText } from 'lucide-react';
/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages uses full document navigation for exported secondary routes. */
import learningData from '../learning-data.json';

export const metadata = {
  title: 'Cited chronology records | Mithila–Vajji–Anga',
  description: 'Stable source records for the Videha historical research chronology.',
};
export const dynamic = 'force-static';

export default function SourcesPage() {
  return (
    <main className="reference-page" id="top">
      <header className="reference-hero">
        <a href="../index.html#doors"><ArrowLeft /> Return to the four doors</a>
        <p className="eyebrow">VIDEHA SOURCE REGISTER</p>
        <h1>Stable records for the research chronology</h1>
        <p>Each entry has a permanent fragment link for citation and verification. Page references identify the supplied research volume; public facsimile links will be added only when an approved digital edition is available.</p>
        <div className="reference-meta"><strong>{learningData.chronology.length} cited entries</strong><span>Last updated 6 September 2026</span></div>
      </header>
      <nav className="reference-actions" aria-label="Source register controls">
        <a href="../index.html#wing-2">Historical map</a><a href="../index.html#explorer">Browse histories</a><a href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha <ExternalLink /></a>
      </nav>
      <section className="source-register" aria-labelledby="source-register-title">
        <h2 id="source-register-title">Chronology source records</h2>
        {learningData.chronology.map((item) => (
          <article key={item.id} id={`record-${item.id}`}>
            <FileText aria-hidden="true" />
            <div><span>{item.displayDate}</span><h3>{item.label}</h3><p>{item.source}</p><a href={`#record-${item.id}`} aria-label={`Permanent link to ${item.label}`}>Permanent link to this record</a></div>
          </article>
        ))}
      </section>
    </main>
  );
}
