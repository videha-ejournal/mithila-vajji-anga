/* oxlint-disable next/no-html-link-for-pages -- GitHub Pages archive routes use exported documents. */

import type { Metadata } from 'next';
import { archiveBasePath } from '../archive-data';
import styles from '../archive/archive.module.css';

const languageAlternates: Record<string, string> = {
  mai: 'https://videha-ejournal.github.io/mithila-vajji-anga/',
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
    <main className={styles.page} lang="en">
      <div className={styles.shell}>
        <div className={styles.topline}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <a href={`${archiveBasePath}/`}>Maithili primary edition</a>
          </nav>
          <nav className={styles.language} aria-label="Language">
            <a href={`${archiveBasePath}/`} hrefLang="mai">मैथिली</a>
          </nav>
        </div>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Videha Digital Research Archive</p>
          <h1>Mithila–Vajji–Anga · English Edition</h1>
          <p className={styles.deck}>
            The English edition sits under /en/ while Maithili remains the primary edition at the normal site paths. History, philosophy, literature and Panji are treated as source corpora for the connected but historically distinct worlds of Mithila, Vajji and Anga in India and Nepal.
          </p>
        </header>
        <section className={styles.grid} aria-label="English research collections">
          {collections.map((collection) => (
            <article className={styles.card} key={collection.href}>
              <h2>{collection.title}</h2>
              <p>{collection.text}</p>
              <p><a className={styles.textLink} href={collection.href}>Open collection →</a></p>
            </article>
          ))}
        </section>
        <section className={styles.source}>
          <h2>History remains intact</h2>
          <p>The existing two-volume History corpus and all 178 completed chapter pages remain unchanged by this bilingual archive expansion.</p>
          <p><a className={styles.textLink} href={`${archiveBasePath}/history/`}>Browse History →</a></p>
        </section>
      </div>
    </main>
  );
}
