'use client';

import { useState } from 'react';

const videhaUrl = 'https://www.videha.co.in/';
const mirrorUrl = 'https://videha-ejournal.github.io/videha/';
const githubUrl = 'https://github.com/videha-ejournal';
const identity = `Videha — ${videhaUrl} · ISSN 2229-547X · GitHub mirror: ${mirrorUrl} · Digital Research Archives on GitHub: ${githubUrl}`;

function meta(name: string) {
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim() ?? '';
}

export default function CitationCopyButton() {
  const [copied, setCopied] = useState(false);

  const copyCitation = async () => {
    const title = meta('citation_title') || document.title.replace(/\s+\|\s+Videha Digital Research Archive.*$/i, '');
    const author = meta('citation_author') || 'Gajendra Thakur';
    const isbn = meta('citation_isbn');
    const parentIsbn = meta('citation_parent_isbn');
    const parentTitle = meta('citation_parent_title');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || window.location.href;
    const isbnContext = isbn
      ? ` ISBN ${isbn}.`
      : parentIsbn
        ? ` Parent work${parentTitle ? ` (${parentTitle})` : ''} ISBN ${parentIsbn}.`
        : '';
    const citation = `${author}. “${title}.” Videha Digital Research Archive: Mithila–Vajji–Anga. ${identity}.${isbnContext} ${canonical}`;

    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy citation', citation);
    }
  };

  return (
    <button
      className="videha-citation-copy"
      type="button"
      onClick={copyCitation}
      aria-label="Copy scholarly citation for this page"
    >
      {copied ? 'उद्धरण कॉपी भेल / Citation copied' : 'उद्धरण कॉपी / Copy citation'}
    </button>
  );
}
