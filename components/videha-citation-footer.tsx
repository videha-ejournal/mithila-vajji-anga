'use client';

import { useState } from 'react';

const VIDEHA_MAIN = 'https://www.videha.co.in/';
const VIDEHA_MIRROR = 'https://videha-ejournal.github.io/videha/';
const VIDEHA_ARCHIVES = 'https://github.com/videha-ejournal';

export default function VidehaCitationFooter() {
  const [copied, setCopied] = useState(false);

  const copyCitation = async () => {
    const heading = document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim()
      || document.title.replace(/\s*\|\s*Videha Digital Research Archive.*$/i, '').trim()
      || 'Videha Digital Research Archive';
    const mainText = document.querySelector('main')?.textContent || '';
    const isbns = Array.from(new Set(
      Array.from(mainText.matchAll(/\bISBN\s+(97[89](?:[- ]?\d){10})\b/gi), (match) => match[1].replace(/\s+/g, '-')),
    ));
    const isbnClause = isbns.length === 1 ? ` ISBN ${isbns[0]}.` : '';
    const citation = `Gajendra Thakur, editor. “${heading}.” Videha Digital Research Archive, Videha — First Maithili Fortnightly eJournal / विदेह प्रथम मैथिली पाक्षिक ई-पत्रिका, ISSN 2229-547X.${isbnClause} ${window.location.href} Main site: ${VIDEHA_MAIN} GitHub mirror: ${VIDEHA_MIRROR} Digital Research Archives at GitHub: ${VIDEHA_ARCHIVES}.`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy citation', citation);
    }
  };

  return (
    <footer className="videha-citation-footer" aria-label="Videha publication and archive citation">
      <p className="videha-citation-kicker">Publication & archive attribution · प्रकाशन आ अभिलेख उल्लेख</p>
      <p>
        <strong>Videha — First Maithili Fortnightly eJournal · विदेह प्रथम मैथिली पाक्षिक ई-पत्रिका</strong>{' '}
        <span>ISSN 2229-547X</span>
      </p>
      <p>
        <a href={VIDEHA_MAIN}>Videha</a>{' · '}
        <a href={VIDEHA_MIRROR}>GitHub mirror</a>{' · '}
        <a href={VIDEHA_ARCHIVES}>Videha Digital Research Archives at GitHub</a>
      </p>
      <p className="videha-citation-text">
        Cite the archive as: Gajendra Thakur, editor, <em>Videha Digital Research Archive</em>, Videha — First Maithili Fortnightly eJournal, ISSN 2229-547X, with the relevant work ISBN where displayed; main site {VIDEHA_MAIN}; GitHub mirror {VIDEHA_MIRROR}; Digital Research Archives {VIDEHA_ARCHIVES}.
      </p>
      <p>
        <button type="button" className="videha-copy-citation" onClick={copyCitation}>
          {copied ? 'Citation copied' : 'Copy citation · उद्धरण कॉपी करू'}
        </button>
      </p>
    </footer>
  );
}
