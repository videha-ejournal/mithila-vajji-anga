'use client';

import { useEffect, useState } from 'react';
import { Accessibility, ExternalLink, Languages, Pause, Volume2, X } from 'lucide-react';
import styles from './persistent-accessibility-dock.module.css';

type Locale = 'mai' | 'en';
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

const classMap = (prefs: AssistivePrefs) => ({
  'contrast-dark': prefs.contrast === 'dark',
  'contrast-light': prefs.contrast === 'light',
  'filter-gray': prefs.filter === 'gray',
  'filter-invert': prefs.filter === 'invert',
  'extra-spacing': prefs.spacing,
  'readable-width': prefs.readableWidth,
  'highlight-links': prefs.highlightLinks,
  'hide-images': prefs.hideImages,
  'stop-motion': prefs.stopMotion,
  'large-targets': prefs.largeTargets,
  'large-cursor': prefs.largeCursor,
  'reader-view': prefs.readerView,
});

export default function PersistentAccessibilityDock({ locale }: { locale: Locale }) {
  const [translateOpen, setTranslateOpen] = useState(false);
  const [assistiveOpen, setAssistiveOpen] = useState(false);
  const [translationTarget, setTranslationTarget] = useState(locale === 'mai' ? 'en' : 'mai');
  const [assistivePrefs, setAssistivePrefs] = useState(defaultAssistivePrefs);
  const [listening, setListening] = useState(false);
  const [listenStatus, setListenStatus] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mvaAssistivePrefs');
      if (saved) setAssistivePrefs({ ...defaultAssistivePrefs, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${assistivePrefs.scale}%`;
    const classes = classMap(assistivePrefs);
    Object.entries(classes).forEach(([name, enabled]) => document.body.classList.toggle(name, enabled));
    try {
      localStorage.setItem('mvaAssistivePrefs', JSON.stringify(assistivePrefs));
    } catch {}
  }, [assistivePrefs]);

  const updateAssistive = <K extends keyof AssistivePrefs>(key: K, value: AssistivePrefs[K]) =>
    setAssistivePrefs((current) => ({ ...current, [key]: value }));

  const listenToPage = () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setListenStatus('Browser text-to-speech is not available.');
      return;
    }
    if (listening) {
      window.speechSynthesis.cancel();
      setListening(false);
      setListenStatus('Reading stopped.');
      return;
    }
    const main = document.querySelector('main#top') ?? document.querySelector('main') ?? document.body;
    const text = main.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (!text) {
      setListenStatus('No readable text found.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'mai' ? 'hi-IN' : 'en-IN';
    utterance.onend = () => {
      setListening(false);
      setListenStatus('Reading complete.');
    };
    utterance.onerror = () => {
      setListening(false);
      setListenStatus('Text-to-speech stopped.');
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setListening(true);
    setListenStatus('Reading the page aloud.');
  };

  const openTranslation = (target = translationTarget) => {
    const current = new URL(window.location.href);
    const translatedHost = `${current.hostname.replace(/-/g, '--').replace(/\./g, '-')}.translate.goog`;
    const separator = current.search ? '&' : '?';
    const translated = `https://${translatedHost}${current.pathname}${current.search}${separator}_x_tr_sl=en&_x_tr_tl=${encodeURIComponent(target)}&_x_tr_hl=${encodeURIComponent(target)}&_x_tr_pto=wapp`;
    window.open(translated, '_blank', 'noopener,noreferrer');
  };

  const copy = locale === 'mai'
    ? {
        label: 'विदेह पहुँच-सहायता',
        listen: listening ? 'रोकू' : 'सुनू',
        translate: '41 भाषा अनुवाद',
        assistive: 'सहायक तकनीक',
        translateHeading: '41 भाषा अनुवाद',
        source: 'स्रोत भाषा: English',
        choose: 'भाषा चुनू',
        go: 'नव टैबमे अनुवाद खोलू',
        assistiveHeading: 'सहायक तकनीक · Assistive Tech',
      }
    : {
        label: 'Videha accessibility and translation tools',
        listen: listening ? 'Stop' : 'Listen',
        translate: 'Translate · 41 languages',
        assistive: 'Assistive Tech',
        translateHeading: 'Translate this page · 41 languages',
        source: 'Source language: English',
        choose: 'Choose language',
        go: 'Open translation in a new tab',
        assistiveHeading: 'Assistive Tech · सहायक तकनीक',
      };

  return (
    <aside className={styles.dock} aria-label={copy.label} data-persistent-accessibility-dock="true">
      <button type="button" onClick={listenToPage} aria-pressed={listening}>
        {listening ? <Pause aria-hidden="true" /> : <Volume2 aria-hidden="true" />} {copy.listen}
      </button>
      <output className={styles.srOnly} aria-live="polite">{listenStatus}</output>
      <button
        type="button"
        onClick={() => { setTranslateOpen((open) => !open); setAssistiveOpen(false); }}
        aria-expanded={translateOpen}
        aria-controls="persistent-translate-panel"
      >
        <Languages aria-hidden="true" /> {copy.translate}
      </button>
      <button
        type="button"
        onClick={() => { setAssistiveOpen((open) => !open); setTranslateOpen(false); }}
        aria-expanded={assistiveOpen}
        aria-controls="persistent-assistive-panel"
      >
        <Accessibility aria-hidden="true" /> {copy.assistive}
      </button>

      {translateOpen && (
        <section className={styles.panel} id="persistent-translate-panel" role="dialog" aria-label={copy.translateHeading}>
          <div className={styles.panelHeading}>
            <strong>{copy.translateHeading}</strong>
            <button type="button" onClick={() => setTranslateOpen(false)} aria-label="Close translator"><X /></button>
          </div>
          <p>{copy.source}</p>
          <label className={styles.selectLabel}>
            <span>{copy.choose}</span>
            <select value={translationTarget} onChange={(event) => setTranslationTarget(event.target.value)}>
              {translationLanguages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <div className={styles.quickLanguages} aria-label="Quick languages">
            {[['mai', 'Maithili'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['ne', 'Nepali']].map(([code, label]) => (
              <button type="button" key={code} onClick={() => openTranslation(code)}>{label}</button>
            ))}
          </div>
          <button type="button" className={styles.primary} onClick={() => openTranslation()}>{copy.go}</button>
          <small>Machine translation may contain errors; consult the source page for scholarly use.</small>
        </section>
      )}

      {assistiveOpen && (
        <section className={styles.panel} id="persistent-assistive-panel" role="dialog" aria-label={copy.assistiveHeading}>
          <div className={styles.panelHeading}>
            <strong>{copy.assistiveHeading}</strong>
            <button type="button" onClick={() => setAssistiveOpen(false)} aria-label="Close assistive technology settings"><X /></button>
          </div>
          <h4>Vision</h4>
          <div className={styles.row}>
            <span>Text size</span>
            <div><button type="button" onClick={() => updateAssistive('scale', Math.max(80, assistivePrefs.scale - 10))}>A−</button><b>{assistivePrefs.scale}%</b><button type="button" onClick={() => updateAssistive('scale', Math.min(200, assistivePrefs.scale + 10))}>A+</button></div>
          </div>
          <div className={styles.row}><span>High contrast</span><div>{([['off','Normal'],['dark','Dark'],['light','Light']] as const).map(([mode,label]) => <button type="button" key={mode} aria-pressed={assistivePrefs.contrast === mode} onClick={() => updateAssistive('contrast', mode)}>{label}</button>)}</div></div>
          <div className={styles.row}><span>Colour filter</span><div>{([['off','Normal'],['gray','Gray'],['invert','Invert']] as const).map(([mode,label]) => <button type="button" key={mode} aria-pressed={assistivePrefs.filter === mode} onClick={() => updateAssistive('filter', mode)}>{label}</button>)}</div></div>
          <button type="button" aria-pressed={assistivePrefs.hideImages} onClick={() => updateAssistive('hideImages', !assistivePrefs.hideImages)}>Hide images</button>
          <h4>Reading and cognition</h4>
          <button type="button" aria-pressed={assistivePrefs.readerView} onClick={() => updateAssistive('readerView', !assistivePrefs.readerView)}>Reader view</button>
          <button type="button" aria-pressed={assistivePrefs.spacing} onClick={() => updateAssistive('spacing', !assistivePrefs.spacing)}>Increase line, word, and letter spacing</button>
          <button type="button" aria-pressed={assistivePrefs.readableWidth} onClick={() => updateAssistive('readableWidth', !assistivePrefs.readableWidth)}>Readable line width</button>
          <button type="button" aria-pressed={assistivePrefs.highlightLinks} onClick={() => updateAssistive('highlightLinks', !assistivePrefs.highlightLinks)}>Highlight links</button>
          <button type="button" aria-pressed={assistivePrefs.stopMotion} onClick={() => updateAssistive('stopMotion', !assistivePrefs.stopMotion)}>Stop animation and motion</button>
          <h4>Motor and screen-reader support</h4>
          <button type="button" aria-pressed={assistivePrefs.largeTargets} onClick={() => updateAssistive('largeTargets', !assistivePrefs.largeTargets)}>Large buttons and links</button>
          <button type="button" aria-pressed={assistivePrefs.largeCursor} onClick={() => updateAssistive('largeCursor', !assistivePrefs.largeCursor)}>Large cursor</button>
          <button type="button" onClick={listenToPage}>Read the complete page aloud</button>
          <a href="https://www.nvaccess.org/download/" target="_blank" rel="noreferrer">Download free NVDA screen reader <ExternalLink /></a>
          <a href="https://www.videha.co.in/script-converter.html" target="_blank" rel="noreferrer">Devanagari ↔ Braille converter <ExternalLink /></a>
          <button type="button" className={styles.reset} onClick={() => setAssistivePrefs(defaultAssistivePrefs)}>Reset all settings</button>
          <small>Preferences are saved on this device and reuse the archive’s existing accessibility classes.</small>
        </section>
      )}
    </aside>
  );
}
