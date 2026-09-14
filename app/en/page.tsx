/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages archive routes use exported documents. */

import type { Metadata } from 'next';
import { archiveBasePath } from '../archive-data';

const languageAlternates: Record<string, string> = {
  mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/',
  en: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
};

export const metadata: Metadata = {
  title: 'English Edition — Mithila–Vajji–Anga Digital Research Archive',
  description: 'English edition of the Videha source-controlled archive for the parallel history of Mithila, Vajji and Anga.',
  alternates: {
    canonical: 'https://videha-ejournal.github.io/mithila-vajji-anga/en/',
    languages: languageAlternates,
  },
};

const collections = [
  {
    href: `${archiveBasePath}/en/philosophy/`,
    title: 'Parallel Philosophy',
    text: 'Six bilingual philosophical sources: Parallel Philosophy I–II, Bhāmatī, Ātmatattvaviveka, Nyāyakusumāñjali and Tattvacintāmaṇi.',
  },
  {
    href: `${archiveBasePath}/en/literature/`,
    title: 'Parallel Literature',
    text: 'The English source edition of A Parallel History of Mithilā & Maithilī Literature, exposed only from a verified chapter inventory.',
  },
  {
    href: `${archiveBasePath}/en/panji/`,
    title: 'Decoding Panji',
    text: 'Six English source volumes on genealogy, kinship, settlement, social memory and archival practice in Mithila.',
  },
];

export default function EnglishArchivePage() {
  return (
    <>
      <a className="skip-link" href="#english-collections">Skip to English research collections</a>
      <header className="topbar">
        <a className="identity" href={`${archiveBasePath}/en/`} aria-label="Mithila–Vajji–Anga English home">
          <span className="mark" aria-hidden="true">𑒧</span>
          <span>
            <strong>Mithila–Vajji–Anga</strong>
            <small>Videha Digital Research Archive</small>
          </span>
        </a>
        <nav aria-label="English primary navigation">
          <a href={`${archiveBasePath}/en/philosophy/`}>Philosophy</a>
          <a href={`${archiveBasePath}/en/literature/`}>Literature</a>
          <a href={`${archiveBasePath}/en/panji/`}>Panji</a>
          <a href={`${archiveBasePath}/history/`}>History</a>
          <a href={`${archiveBasePath}/source-library/`}>Source PDFs</a>
        </nav>
        <a className="videha-home" href="https://www.videha.co.in/" target="_blank" rel="noreferrer">Videha ↗</a>
      </header>

      <main className="edition-page" lang="en">
        <section className="edition-hero">
          <div>
            <p className="edition-kicker">SOURCE-CONTROLLED REGIONAL ATLAS · ENGLISH EDITION</p>
            <h1>Explore Mithila, Vajji and Anga</h1>
            <p className="edition-deck">
              The English edition uses the same Videha research environment and visual system as the primary archive. History, philosophy, literature and Panji are treated as source corpora for the connected but historically distinct worlds of Mithila, Vajji and Anga in India and Nepal.
            </p>
          </div>
          <aside className="edition-method">
            <strong>One archive · two editions</strong>
            <p>
              Use the persistent मैथिली | English tabs above to move between the two editions. Permanent source records, provenance safeguards and the 178 History chapter pages remain shared across the archive.
            </p>
            <a href={`${archiveBasePath}/`} hrefLang="mai" lang="mai">मैथिली संस्करण खोलू →</a>
          </aside>
        </section>

        <section className="edition-collections" id="english-collections" aria-label="English research collections">
          <div className="edition-collections-heading">
            <div>
              <p>THE VIDEHA RESEARCH STUDIO</p>
              <h2>Three English research doors</h2>
            </div>
          </div>
          <div className="edition-collection-grid">
            {collections.map((collection) => (
              <article className="edition-collection-card" key={collection.href}>
                <h2>{collection.title}</h2>
                <p>{collection.text}</p>
                <a href={collection.href}>Open collection →</a>
              </article>
            ))}
          </div>
        </section>

        <section className="edition-history">
          <h2>History remains one connected regional archive</h2>
          <p>
            The two-volume History corpus and all 178 completed chapter pages remain intact and continue to preserve the Mithila–Vajji–Anga focus across India and Nepal.
          </p>
          <p><a href={`${archiveBasePath}/history/`}>Browse all 178 History chapters →</a></p>
        </section>
      </main>
    </>
  );
}
