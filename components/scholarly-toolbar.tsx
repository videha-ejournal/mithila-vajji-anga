'use client';

import { useEffect, useState } from 'react';

const site = 'https://videha-ejournal.github.io/mithila-vajji-anga';
const managedParams = [
  'mva_tab',
  'mva_q',
  'mva_collection',
  'mva_volume',
  'mva_status',
  'mva_shelf',
  'mva_year',
];

function setNativeValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLInputElement
    ? HTMLInputElement.prototype
    : HTMLSelectElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLInputElement ? 'input' : 'change', { bubbles: true }));
}

function labelledSelect(labelText: string): HTMLSelectElement | null {
  const label = Array.from(document.querySelectorAll<HTMLLabelElement>('.filter-panel label'))
    .find((candidate) => candidate.textContent?.trim().startsWith(labelText));
  return (label?.querySelector('select') as HTMLSelectElement | null) ?? null;
}

function currentTab() {
  const selected = document.querySelector<HTMLButtonElement>('.tabbar [role="tab"][aria-selected="true"]');
  return selected?.id.replace('research-tab-', '') ?? '';
}

function syncUrlFromInterface() {
  if (!document.querySelector('#explorer')) return;
  const url = new URL(window.location.href);
  managedParams.forEach((key) => url.searchParams.delete(key));

  const tab = currentTab();
  if (tab && tab !== 'chronology') url.searchParams.set('mva_tab', tab);

  const query = document.querySelector<HTMLInputElement>('.filter-panel input[placeholder*="Place"]')?.value.trim();
  if (query) url.searchParams.set('mva_q', query);

  const collection = labelledSelect('Collection')?.value;
  const volume = labelledSelect('Volume')?.value;
  const status = labelledSelect('Status')?.value;
  const shelf = labelledSelect('Shelf')?.value;
  if (collection && collection !== 'All collections') url.searchParams.set('mva_collection', collection);
  if (volume && volume !== 'All volumes') url.searchParams.set('mva_volume', volume);
  if (status && status !== 'All statuses') url.searchParams.set('mva_status', status);
  if (shelf && shelf !== 'All shelves') url.searchParams.set('mva_shelf', shelf);

  const year = document.querySelector<HTMLInputElement>('.time-control input[type="number"]')?.value;
  if (year && year !== '2026') url.searchParams.set('mva_year', year);

  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function restoreInterfaceFromUrl() {
  if (!document.querySelector('#explorer')) return;
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('mva_tab');
  if (tab) document.querySelector<HTMLButtonElement>(`#research-tab-${CSS.escape(tab)}`)?.click();

  window.setTimeout(() => {
    const values: Array<[HTMLInputElement | HTMLSelectElement | null, string | null]> = [
      [document.querySelector<HTMLInputElement>('.filter-panel input[placeholder*="Place"]'), params.get('mva_q')],
      [labelledSelect('Collection'), params.get('mva_collection')],
      [labelledSelect('Volume'), params.get('mva_volume')],
      [labelledSelect('Status'), params.get('mva_status')],
      [labelledSelect('Shelf'), params.get('mva_shelf')],
      [document.querySelector<HTMLInputElement>('.time-control input[type="number"]'), params.get('mva_year')],
    ];
    for (const [element, value] of values) {
      if (element && value) setNativeValue(element, value);
    }
    window.setTimeout(syncUrlFromInterface, 60);
  }, 180);
}

function enhanceImages() {
  for (const image of document.querySelectorAll<HTMLImageElement>('img')) {
    image.decoding = 'async';
    if (!image.loading && image.getBoundingClientRect().top > window.innerHeight * 1.25) image.loading = 'lazy';
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('/mithila-vajji-anga/sw.js', { scope: '/mithila-vajji-anga/' })
    .catch(() => undefined);
}

export default function ScholarlyToolbar() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    restoreInterfaceFromUrl();
    enhanceImages();

    const eventHandler = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest('#explorer, .time-control, .tabbar')) window.setTimeout(syncUrlFromInterface, 40);
    };
    document.addEventListener('input', eventHandler, true);
    document.addEventListener('change', eventHandler, true);
    document.addEventListener('click', eventHandler, true);

    const observer = new MutationObserver(() => enhanceImages());
    observer.observe(document.body, { childList: true, subtree: true });

    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }

    return () => {
      document.removeEventListener('input', eventHandler, true);
      document.removeEventListener('change', eventHandler, true);
      document.removeEventListener('click', eventHandler, true);
      window.removeEventListener('load', registerServiceWorker);
      observer.disconnect();
    };
  }, []);

  const copyShareableLink = async () => {
    syncUrlFromInterface();
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy shareable research URL', window.location.href);
    }
  };

  return (
    <aside className="scholarly-toolbar" aria-label="Videha Digital Research Archive tools">
      <details>
        <summary>Archive tools</summary>
        <nav aria-label="Permanent scholarly resources">
          <a href={`${site}/about/`}>About archive</a>
          <a href={`${site}/history/`}>History volumes</a>
          <a href={`${site}/records/`}>Permanent records</a>
          <a href={`${site}/compare/`}>Compare</a>
          <a href={`${site}/method/`}>Method</a>
          <a href={`${site}/data/`}>Data</a>
          <a href={`${site}/source-library/`}>Source PDFs</a>
          <a href={`${site}/accessibility/`}>Accessibility</a>
          <a href={`${site}/rights/`}>Rights</a>
        </nav>
        <button type="button" onClick={copyShareableLink}>{copied ? 'Link copied' : 'Copy shareable research view'}</button>
        <p><strong>Translation notice:</strong> machine-generated translations are convenience copies only; cite the source-controlled Videha text.</p>
      </details>
      <style>{`
        .scholarly-toolbar{position:fixed;right:14px;bottom:14px;z-index:10000;max-width:min(420px,calc(100vw - 28px));font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#152238;filter:none!important}
        .scholarly-toolbar details{background:#fffdf8;border:1px solid #bfc6cc;border-radius:12px;box-shadow:0 10px 30px rgba(13,39,66,.18);overflow:hidden}
        .scholarly-toolbar summary{cursor:pointer;background:#0d2742;color:white;padding:.7rem .9rem;font-weight:800;letter-spacing:.02em}
        .scholarly-toolbar nav{display:flex;flex-wrap:wrap;gap:.4rem;padding:.75rem .75rem .35rem}
        .scholarly-toolbar nav a{color:#174c7d;background:#f3f6f8;border:1px solid #d5dbe0;border-radius:999px;padding:.35rem .55rem;text-decoration:none;font-weight:700}
        .scholarly-toolbar button{margin:.25rem .75rem .45rem;border:1px solid #0d2742;border-radius:8px;background:#0d2742;color:white;padding:.5rem .65rem;font:inherit;font-weight:700;cursor:pointer}
        .scholarly-toolbar p{margin:.25rem .75rem .75rem;padding:.55rem .65rem;border-left:4px solid #b45d1a;background:#fff5df;font-size:.82rem}
        .scholarly-toolbar a:focus-visible,.scholarly-toolbar button:focus-visible,.scholarly-toolbar summary:focus-visible{outline:3px solid #e39b45;outline-offset:2px}
        @media(max-width:640px){.scholarly-toolbar{right:8px;bottom:8px;max-width:calc(100vw - 16px)}.scholarly-toolbar details:not([open]){max-width:180px}}
        @media print{.scholarly-toolbar{display:none!important}}
      `}</style>
    </aside>
  );
}
