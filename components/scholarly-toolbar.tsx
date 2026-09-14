'use client';

import { useEffect, useRef, useState } from 'react';

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

type ContrastMode = 'off' | 'dark' | 'light';
type ColourFilter = 'off' | 'gray' | 'invert';
type AssistivePrefs = {
  scale: number;
  contrast: ContrastMode;
  filter: ColourFilter;
  spacing: boolean;
  readableWidth: boolean;
  highlightLinks: boolean;
  hideImages: boolean;
  stopMotion: boolean;
  largeTargets: boolean;
  largeCursor: boolean;
  readerView: boolean;
};

const defaultAssistivePrefs: AssistivePrefs = {
  scale: 100,
  contrast: 'off',
  filter: 'off',
  spacing: false,
  readableWidth: false,
  highlightLinks: false,
  hideImages: false,
  stopMotion: false,
  largeTargets: false,
  largeCursor: false,
  readerView: false,
};

const translationLanguages = [
  ['as', 'Assamese · অসমীয়া'],
  ['bn', 'Bengali · বাংলা'],
  ['brx', 'Bodo · बड़ो'],
  ['doi', 'Dogri · डोगरी'],
  ['en', 'English · अंग्रेजी'],
  ['gu', 'Gujarati · ગુજરાતી'],
  ['hi', 'Hindi · हिन्दी'],
  ['kn', 'Kannada · ಕನ್ನಡ'],
  ['ks', 'Kashmiri · کٲشُر'],
  ['gom', 'Konkani · कोंकणी'],
  ['mai', 'Maithili · मैथिली'],
  ['ml', 'Malayalam · മലയാളം'],
  ['mni-Mtei', 'Manipuri · ꯃꯩꯇꯩꯂꯣꯟ'],
  ['mr', 'Marathi · मराठी'],
  ['ne', 'Nepali · नेपाली'],
  ['or', 'Odia · ଓଡ଼ିଆ'],
  ['pa', 'Punjabi · ਪੰਜਾਬੀ'],
  ['sa', 'Sanskrit · संस्कृतम्'],
  ['sat', 'Santhali · ᱥᱟᱱᱛᱟᱲᱤ'],
  ['sd', 'Sindhi · سنڌي'],
  ['ta', 'Tamil · தமிழ்'],
  ['te', 'Telugu · తెలుగు'],
  ['ur', 'Urdu · اردو'],
  ['zh-CN', 'Mandarin Chinese · 中文'],
  ['yue', 'Cantonese · 粵語'],
  ['fa', 'Persian · فارسی'],
  ['iw', 'Hebrew · עברית'],
  ['bo', 'Tibetan · བོད་སྐད་'],
  ['si', 'Sinhala · සිංහල'],
  ['es', 'Spanish · Español'],
  ['fr', 'French · Français'],
  ['de', 'German · Deutsch'],
  ['pt', 'Portuguese · Português'],
  ['it', 'Italian · Italiano'],
  ['ru', 'Russian · Русский'],
  ['ar', 'Arabic · العربية'],
  ['ja', 'Japanese · 日本語'],
  ['ko', 'Korean · 한국어'],
  ['id', 'Indonesian · Bahasa Indonesia'],
  ['th', 'Thai · ไทย'],
  ['tr', 'Turkish · Türkçe'],
] as const;

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

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('/mithila-vajji-anga/sw.js', {
      scope: '/mithila-vajji-anga/',
      updateViaCache: 'none',
    });
    await registration.update();
  } catch {}
}

export default function ScholarlyToolbar() {
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);
  const [listenStatus, setListenStatus] = useState('');
  const [translationTarget, setTranslationTarget] = useState('mai');
  const [assistivePrefs, setAssistivePrefs] = useState(defaultAssistivePrefs);
  const speechRunRef = useRef(0);

  useEffect(() => {
    restoreInterfaceFromUrl();
    enhanceImages();

    try {
      const saved = localStorage.getItem('mvaAssistivePrefs');
      if (saved) {
        const parsed = { ...defaultAssistivePrefs, ...JSON.parse(saved) } as AssistivePrefs;
        queueMicrotask(() => setAssistivePrefs(parsed));
      }
    } catch {}

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
      void registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }

    return () => {
      document.removeEventListener('input', eventHandler, true);
      document.removeEventListener('change', eventHandler, true);
      document.removeEventListener('click', eventHandler, true);
      window.removeEventListener('load', registerServiceWorker);
      observer.disconnect();
      speechRunRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const classes = {
      'contrast-dark': assistivePrefs.contrast === 'dark',
      'contrast-light': assistivePrefs.contrast === 'light',
      'filter-gray': assistivePrefs.filter === 'gray',
      'filter-invert': assistivePrefs.filter === 'invert',
      'extra-spacing': assistivePrefs.spacing,
      'readable-width': assistivePrefs.readableWidth,
      'highlight-links': assistivePrefs.highlightLinks,
      'hide-images': assistivePrefs.hideImages,
      'stop-motion': assistivePrefs.stopMotion,
      'large-targets': assistivePrefs.largeTargets,
      'large-cursor': assistivePrefs.largeCursor,
      'reader-view': assistivePrefs.readerView,
    };
    document.documentElement.style.fontSize = `${assistivePrefs.scale}%`;
    Object.entries(classes).forEach(([name, enabled]) => document.body.classList.toggle(name, enabled));
    try {
      localStorage.setItem('mvaAssistivePrefs', JSON.stringify(assistivePrefs));
    } catch {}
  }, [assistivePrefs]);

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

  const listenToPage = () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setListenStatus('Listen is not supported by this browser.');
      return;
    }
    if (listening) {
      speechRunRef.current += 1;
      window.speechSynthesis.cancel();
      setListening(false);
      setListenStatus('Reading stopped.');
      return;
    }

    const main = document.querySelector<HTMLElement>('main');
    const text = (main?.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (!text) {
      setListenStatus('No readable page text was found.');
      return;
    }

    const sentences = text.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) ?? [text];
    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if (`${current} ${sentence}`.trim().length > 700 && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = `${current} ${sentence}`;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    const run = speechRunRef.current + 1;
    speechRunRef.current = run;
    let index = 0;
    const pageLanguage = main?.getAttribute('lang') || document.documentElement.lang || 'en';

    const speakNext = () => {
      if (speechRunRef.current !== run) return;
      const chunk = chunks[index++];
      if (!chunk) {
        setListening(false);
        setListenStatus('Reading finished.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunk);
      const voices = window.speechSynthesis.getVoices();
      const prefix = pageLanguage.toLowerCase().split('-')[0];
      utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix))
        ?? voices.find((voice) => voice.lang.toLowerCase() === 'en-in')
        ?? voices[0];
      utterance.lang = utterance.voice?.lang ?? (prefix === 'mai' ? 'hi-IN' : pageLanguage);
      utterance.onend = speakNext;
      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') return;
        setListening(false);
        setListenStatus('Reading could not continue. Please try Listen again.');
      };
      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    setListening(true);
    setListenStatus('Reading the page aloud. Select Stop to end reading.');
    window.setTimeout(speakNext, 50);
  };

  const openTranslation = (target = translationTarget) => {
    const current = new URL(window.location.href);
    const translatedHost = `${current.hostname.replace(/-/g, '--').replace(/\./g, '-')}.translate.goog`;
    const translated = new URL(`${current.protocol}//${translatedHost}${current.pathname}${current.search}${current.hash}`);
    translated.searchParams.set('_x_tr_sl', 'auto');
    translated.searchParams.set('_x_tr_tl', target);
    translated.searchParams.set('_x_tr_hl', target);
    window.open(translated.toString(), '_blank', 'noopener,noreferrer');
  };

  const setPref = <K extends keyof AssistivePrefs>(key: K, value: AssistivePrefs[K]) => {
    setAssistivePrefs((current) => ({ ...current, [key]: value }));
  };

  return (
    <aside className="scholarly-toolbar" aria-label="Videha Digital Research Archive tools">
      <details>
        <summary>Archive & access tools</summary>

        <section className="universal-accessibility" aria-label="Accessibility and language tools">
          <div className="access-actions">
            <button type="button" onClick={listenToPage} aria-pressed={listening}>
              {listening ? '■ Stop' : '🔊 Listen'}
            </button>
            <output className="toolbar-sr" aria-live="polite">{listenStatus}</output>
          </div>

          <label className="translate-control">
            <span>Translate · {translationLanguages.length} languages</span>
            <select value={translationTarget} onChange={(event) => setTranslationTarget(event.target.value)}>
              {translationLanguages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => openTranslation()}>Open translated page</button>

          <details className="assistive-details">
            <summary>♿ Assistive Tech</summary>
            <div className="assistive-grid">
              <div className="assistive-row">
                <span>Text size · {assistivePrefs.scale}%</span>
                <span>
                  <button type="button" onClick={() => setPref('scale', Math.max(80, assistivePrefs.scale - 10))}>A−</button>
                  <button type="button" onClick={() => setPref('scale', Math.min(180, assistivePrefs.scale + 10))}>A+</button>
                </span>
              </div>
              <div className="assistive-row three">
                <span>Contrast</span>
                <span>
                  <button type="button" aria-pressed={assistivePrefs.contrast === 'off'} onClick={() => setPref('contrast', 'off')}>Normal</button>
                  <button type="button" aria-pressed={assistivePrefs.contrast === 'dark'} onClick={() => setPref('contrast', 'dark')}>Dark</button>
                  <button type="button" aria-pressed={assistivePrefs.contrast === 'light'} onClick={() => setPref('contrast', 'light')}>High</button>
                </span>
              </div>
              <div className="assistive-row three">
                <span>Colour</span>
                <span>
                  <button type="button" aria-pressed={assistivePrefs.filter === 'off'} onClick={() => setPref('filter', 'off')}>Normal</button>
                  <button type="button" aria-pressed={assistivePrefs.filter === 'gray'} onClick={() => setPref('filter', 'gray')}>Gray</button>
                  <button type="button" aria-pressed={assistivePrefs.filter === 'invert'} onClick={() => setPref('filter', 'invert')}>Invert</button>
                </span>
              </div>
              {([
                ['spacing', 'Extra spacing'],
                ['readableWidth', 'Readable width'],
                ['highlightLinks', 'Highlight links'],
                ['hideImages', 'Hide images'],
                ['stopMotion', 'Stop motion'],
                ['largeTargets', 'Large targets'],
                ['largeCursor', 'Large cursor'],
                ['readerView', 'Reader view'],
              ] as Array<[keyof AssistivePrefs, string]>).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="assistive-toggle"
                  aria-pressed={Boolean(assistivePrefs[key])}
                  onClick={() => setPref(key, !assistivePrefs[key] as never)}
                >
                  {label}
                </button>
              ))}
              <button type="button" className="assistive-reset" onClick={() => setAssistivePrefs(defaultAssistivePrefs)}>Reset accessibility settings</button>
              <a className="accessibility-link" href={`${site}/accessibility/`}>Accessibility statement →</a>
            </div>
          </details>
        </section>

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
        .scholarly-toolbar{position:fixed;right:14px;bottom:14px;z-index:10000;max-width:min(460px,calc(100vw - 28px));font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#152238;filter:none!important}
        .scholarly-toolbar>details{background:#fffdf8;border:1px solid #bfc6cc;border-radius:12px;box-shadow:0 10px 30px rgba(13,39,66,.18);overflow:hidden;max-height:min(82vh,720px);overflow-y:auto}
        .scholarly-toolbar>details>summary{cursor:pointer;background:#0d2742;color:white;padding:.7rem .9rem;font-weight:800;letter-spacing:.02em}
        .universal-accessibility{padding:.75rem;border-bottom:1px solid #ddd2ba;background:#fffaf0}
        body:has(.videha-tools) .scholarly-toolbar .universal-accessibility{display:none}
        .access-actions{display:flex;align-items:center;gap:.45rem;margin-bottom:.55rem}
        .translate-control{display:grid;gap:.3rem;font-weight:750;margin:.45rem 0}
        .translate-control select{width:100%;padding:.5rem;border:1px solid #aeb7bf;border-radius:7px;background:white;color:#152238;font:inherit}
        .assistive-details{margin-top:.55rem;border-top:1px solid #e0d5bf;padding-top:.5rem}
        .assistive-details>summary{cursor:pointer;font-weight:800;color:#742323}
        .assistive-grid{display:grid;gap:.4rem;margin-top:.55rem}
        .assistive-row{display:flex;align-items:center;justify-content:space-between;gap:.4rem;font-size:.82rem;font-weight:700}
        .assistive-row>span:last-child{display:flex;gap:.25rem;flex-wrap:wrap;justify-content:flex-end}
        .assistive-toggle{width:100%;text-align:left}
        .scholarly-toolbar nav{display:flex;flex-wrap:wrap;gap:.4rem;padding:.75rem .75rem .35rem}
        .scholarly-toolbar nav a,.accessibility-link{color:#174c7d;background:#f3f6f8;border:1px solid #d5dbe0;border-radius:999px;padding:.35rem .55rem;text-decoration:none;font-weight:700}
        .scholarly-toolbar button{margin:.25rem 0;border:1px solid #0d2742;border-radius:8px;background:#0d2742;color:white;padding:.48rem .62rem;font:inherit;font-weight:700;cursor:pointer}
        .scholarly-toolbar>details>button{margin:.25rem .75rem .45rem}
        .assistive-grid button{background:white;color:#152238}
        .assistive-grid button[aria-pressed='true'],.assistive-reset{background:#742323;color:white}
        .scholarly-toolbar p{margin:.25rem .75rem .75rem;padding:.55rem .65rem;border-left:4px solid #b45d1a;background:#fff5df;font-size:.82rem}
        .toolbar-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .scholarly-toolbar a:focus-visible,.scholarly-toolbar button:focus-visible,.scholarly-toolbar summary:focus-visible,.scholarly-toolbar select:focus-visible{outline:3px solid #e39b45;outline-offset:2px}
        body:not(:has(.videha-tools)).reader-view main{max-width:78ch;margin-inline:auto}
        @media(max-width:640px){.scholarly-toolbar{right:8px;bottom:8px;max-width:calc(100vw - 16px)}.scholarly-toolbar>details:not([open]){max-width:220px}.assistive-row{align-items:flex-start;flex-direction:column}}
        @media print{.scholarly-toolbar{display:none!important}}
      `}</style>
    </aside>
  );
}
