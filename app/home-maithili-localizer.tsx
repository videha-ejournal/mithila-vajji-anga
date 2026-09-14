'use client';

import { useEffect } from 'react';

const scopedSelectors = [
  'header',
  '.videha-tools',
  '.journey-nav',
  '.intro',
  '.literary-atlas-feature',
  '.research-studio',
  '.global-search',
  '.project-status',
  '.cover-showcase',
  '.time-control',
  '.filter-panel',
  '.tabbar',
  '.status-card',
];

const replacements: Array<[string, string]> = [
  ['Videha historical research', 'विदेह ऐतिहासिक शोध'],
  ['Status & updates', 'स्थिति आ नव जानकारी'],
  ['Browse archive', 'संग्रह देखू'],
  ['Research rooms', 'शोध-कक्ष'],
  ['Start', 'आरम्भ'],
  ['Search', 'खोज'],
  ['About', 'परिचय'],
  ['Translate with AI', 'ए.आइ. द्वारा अनुवाद करू'],
  ['Translate this English page', 'एहि मैथिली पन्नाक अनुवाद करू'],
  ['Source language:', 'मूल भाषा:'],
  ['target languages', 'लक्ष्य भाषा'],
  ['Translate into', 'जाहि भाषामे अनुवाद चाही'],
  ['Translate in a new tab', 'नव टैबमे अनुवाद खोलू'],
  ['Free machine translation may contain errors. The original English page remains authoritative.', 'मशीन अनुवादमे त्रुटि भऽ सकैत अछि। मूल शोध-स्रोत आ विदेहक सम्पादित पाठे प्रमाण मानल जाएत।'],
  ['Assistive Tech', 'सहायक सुविधा'],
  ['Choose a path', 'शोधक बाट चुनू'],
  ['Historical map', 'ऐतिहासिक मानचित्र'],
  ['Knowledge graph', 'ज्ञान-आलेख'],
  ['Research practice', 'शोध-अभ्यास'],
  ['You are in', 'अहाँ एतय छी'],
  ['Section', 'खण्ड'],
  ['SOURCE-CONTROLLED REGIONAL ATLAS', 'स्रोत-नियन्त्रित क्षेत्रीय मानचित्र'],
  ['Explore Mithila, Vajji and Anga', 'मिथिला, वज्जि आ अंगक अन्वेषण करू'],
  ['A guided entrance to the Videha archive: genealogy, regional history, philosophical debate, texts, and translation across India and Nepal. Choose a research question first; the archive will then lead you to the relevant evidence, chapter, or tool.', 'विदेह शोध-संग्रहक ई निर्देशित प्रवेश भारत आ नेपालक वंशावली, क्षेत्रीय इतिहास, दार्शनिक शास्त्रार्थ, ग्रन्थ आ अनुवाद धरि पहुँच दैत अछि। पहिने अपन शोध-प्रश्न चुनू; संग्रह अहाँ केँ सम्बन्धित प्रमाण, अध्याय वा शोध-साधन धरि लऽ जाएत।'],
  ['Genealogy', 'वंशावली'],
  ['History', 'इतिहास'],
  ['Debate', 'शास्त्रार्थ'],
  ['Texts', 'ग्रन्थ'],
  ['Search archive', 'संग्रहमे खोजू'],
  ['How to read this archive', 'एहि संग्रह केँ कोना पढ़ी'],
  ['Entries distinguish supplied text, editorial interpretation, inferred discovery links, and planned material. Dates, map points, and contested claims carry source or method notes so they can be checked rather than merely accepted.', 'प्रविष्टिसभ मूल प्रदत्त पाठ, सम्पादकीय व्याख्या, खोज-आधारित सम्बन्ध आ योजनाबद्ध सामग्री केँ अलग-अलग चिन्हित करैत अछि। तिथि, मानचित्र-बिन्दु आ विवादित कथनक संग स्रोत अथवा पद्धति-टिप्पणी देल गेल अछि, जाहिसँ पाठक ओकर जाँच कऽ सकथि।'],
  ['Read the evidentiary method', 'प्रमाण-पद्धति पढ़ू'],
  ['FROM THE VIDEHA LIBRARY · A LITERARY ATLAS', 'विदेह पुस्तकालयसँ · साहित्यिक मानचित्र'],
  ['Picture stories, literature, translation and manuscript archives—with an English criticism reading room.', 'चित्रकथा, साहित्य, अनुवाद आ पाण्डुलिपि-संग्रह—अंग्रेजी आलोचना-पाठ कक्षक संग।'],
  ['Explore the literary atlas', 'साहित्यिक मानचित्र देखू'],
  ['THE VIDEHA RESEARCH STUDIO', 'विदेह शोध-स्टूडियो'],
  ['Four doors into one archive', 'एक संग्रहमे प्रवेशक चारि बाट'],
  ['Choose the question closest to yours. Each door leads to specialist tools without requiring you to understand the archive’s full structure first.', 'अपन शोधसँ सभसँ लग प्रश्न चुनू। संग्रहक सम्पूर्ण बनावट पहिने बुझब आवश्यक नहि; प्रत्येक बाट अपन विशेष शोध-साधन धरि लऽ जाएत।'],
  ['Read genealogy', 'वंशावली पढ़ू'],
  ['Decode people, lineages, villages, and marriage relations', 'व्यक्ति, वंश, गाम आ विवाह-सम्बन्धक अभिलेख बुझू'],
  ['Six Panji volumes', 'पञ्जीक छह खण्ड'],
  ['Panji laboratory', 'पञ्जी शोधशाला'],
  ['Follow history', 'इतिहासक क्रम देखू'],
  ['Move from dated evidence to chapters and changing landscapes', 'तिथि-सहित प्रमाणसँ अध्याय आ बदलैत भू-दृश्य धरि बढ़ू'],
  ['178 chapters', '१७८ अध्याय'],
  ['Cited records', 'उद्धृत अभिलेख'],
  ['Enter a debate', 'शास्त्रार्थमे प्रवेश करू'],
  ['Compare Pūrvapakṣa, Uttarapakṣa, and parallel conclusions', 'पूर्वपक्ष, उत्तरपक्ष आ समानान्तर निष्कर्षक तुलना करू'],
  ['Multiscript reader', 'बहुलिपि पाठक'],
  ['Work with texts', 'ग्रन्थक संग काज करू'],
  ['Open translations, books, teaching material, and source practice', 'अनुवाद, पुस्तक, शिक्षण-सामग्री आ स्रोत-पद्धति खोलू'],
  ['Classroom', 'कक्षा'],
  ['Library', 'पुस्तकालय'],
  ['ONE SEARCH · THE WHOLE ARCHIVE', 'एक खोज · समस्त संग्रह'],
  ['Find a person, place, text, chapter, or idea', 'व्यक्ति, स्थान, ग्रन्थ, अध्याय वा विचार खोजू'],
  ['Results open in the relevant research path.', 'परिणाम सम्बन्धित शोध-पथमे खुलत।'],
  ['Search across', 'एहि सभमे खोजू:'],
  ['indexed records', 'अनुक्रमित अभिलेख'],
  ['Search the complete Videha archive', 'सम्पूर्ण विदेह शोध-संग्रहमे खोजू'],
  ['Search across the full archive…', 'समस्त संग्रहमे खोजू…'],
  ['Limit global search by record type', 'अभिलेखक प्रकार अनुसार खोज सीमित करू'],
  ['People', 'व्यक्ति'],
  ['Histories', 'इतिहास'],
  ['Ideas', 'विचार'],
  ['Places', 'स्थान'],
  ['Chronology', 'कालक्रम'],
  ['best matches', 'सर्वाधिक मेल'],
  ['No matching records', 'मेल खाइत अभिलेख नहि भेटल'],
  ['A LIVING, SOURCE-CONTROLLED ARCHIVE', 'जीवित, स्रोत-नियन्त्रित शोध-संग्रह'],
  ['Clear about what is complete—and what comes next', 'की पूर्ण अछि आ आगाँ की होयत—ई स्पष्ट अछि'],
  ['Last updated', 'अन्तिम अद्यतन'],
  ['completed', 'पूर्ण'],
  ['Count key:', 'गणनाक आधार:'],
  ['Read the changelog and roadmap', 'परिवर्तन-विवरण आ आगामी योजना पढ़ू'],
  ['THE VIDEHA LIBRARY', 'विदेह पुस्तकालय'],
  ['The books behind the archive', 'एहि संग्रहक आधार-पुस्तकसभ'],
  ['Browse the covers of the histories, Panji studies, philosophical research, and Sanskrit–Maithili translations that sustain this growing digital research environment.', 'इतिहास, पञ्जी-अध्ययन, दार्शनिक शोध आ संस्कृत–मैथिली अनुवादक ओहि पुस्तकसभक आवरण देखू जे एहि बढ़ैत डिजिटल शोध-परिवेशक आधार अछि।'],
  ['Filter book covers', 'पुस्तक-आवरण छाँटू'],
  ['All', 'सभ'],
  ['Parallel research', 'समानान्तर शोध'],
  ['Translations', 'अनुवाद'],
  ['Book cover slideshow', 'पुस्तक-आवरण प्रदर्शन'],
  ['Previous book cover', 'पहिलुक पुस्तक-आवरण'],
  ['Next book cover', 'अगिला पुस्तक-आवरण'],
  ['Open this collection', 'ई संग्रह खोलू'],
  ['Pause', 'रोकू'],
  ['Play', 'चलाउ'],
  ['Historical period controls', 'ऐतिहासिक काल-नियन्त्रण'],
  ['YEAR', 'वर्ष'],
  ['Previous historical anchor', 'पहिलुक ऐतिहासिक बिन्दु'],
  ['Next historical anchor', 'अगिला ऐतिहासिक बिन्दु'],
  ['Selected year', 'चुनल वर्ष'],
  ['Timeline from 1800 BCE to 2026 CE', '१८०० ईसा पूर्वसँ २०२६ ईस्वी धरि कालरेखा'],
  ['Research controls', 'शोध-नियन्त्रण'],
  ['Collection', 'संग्रह'],
  ['All collections', 'सभ संग्रह'],
  ['Volume', 'खण्ड'],
  ['All volumes', 'सभ खण्ड'],
  ['Status', 'स्थिति'],
  ['All statuses', 'सभ स्थिति'],
  ['Complete', 'पूर्ण'],
  ['Planned', 'योजनाबद्ध'],
  ['Shelf', 'पुस्तक-श्रेणी'],
  ['All shelves', 'सभ पुस्तक-श्रेणी'],
  ['Filter only the current archive view', 'केवल वर्तमान संग्रह-दृश्य छाँटू'],
  ['Place, person, chapter, idea…', 'स्थान, व्यक्ति, अध्याय, विचार…'],
  ['THE STORY · PREHISTORY → TODAY', 'इतिहासक धारा · प्रागैतिहाससँ आइ धरि'],
  ['Earlier', 'पहिने'],
  ['Later', 'आगाँ'],
  ['Archive at a glance', 'संग्रह एक नजरिमे'],
  ['historical chapters completed', 'ऐतिहासिक अध्याय पूर्ण'],
  ['philosophy ideas completed', 'दार्शनिक विचार पूर्ण'],
  ['literary and intellectual figures', 'साहित्यिक आ बौद्धिक व्यक्तित्व'],
  ['Curated explorer:', 'सम्पादित अन्वेषक:'],
  ['places and heritage sites', 'स्थान आ धरोहर-स्थल'],
  ['Map gazetteer:', 'मानचित्र स्थान-सूची:'],
  ['sourced reference points', 'स्रोत-सहित सन्दर्भ-बिन्दु'],
  ['Research views', 'शोध-दृश्य'],
  ['Curated places', 'सम्पादित स्थान'],
  ['Vision', 'दृष्टि'],
  ['Text size', 'अक्षर आकार'],
  ['High contrast', 'उच्च विरोधाभास'],
  ['Colour filter', 'रङ्ग छन्नी'],
  ['Hide images', 'चित्र नुकाउ'],
  ['Reading and cognition', 'पठन आ बोध'],
  ['Reader view', 'पाठक-दृश्य'],
  ['Increase line, word, and letter spacing', 'पाँति, शब्द आ अक्षरक बीच दूरी बढ़ाउ'],
  ['Readable line width', 'सुगम पाँति-चौड़ाइ'],
  ['Highlight links', 'लिङ्क स्पष्ट करू'],
  ['Stop animation and motion', 'चलचित्र आ गति रोकू'],
  ['Motor and screen-reader support', 'गतिशीलता आ स्क्रीन-पाठक सहायता'],
  ['Large buttons and links', 'पैघ बटन आ लिङ्क'],
  ['Large cursor', 'पैघ कर्सर'],
  ['Read the complete page aloud', 'सम्पूर्ण पन्ना सुनाउ'],
  ['Reset all settings', 'सभ सेटिङ्ग फेर मूल रूपमे करू'],
  ['Close translator', 'अनुवाद पटल बन्न करू'],
  ['Close assistive technology settings', 'सहायक सुविधा पटल बन्न करू'],
  ['Toggle menu', 'मेनू खोलू वा बन्न करू'],
  ['Primary navigation', 'मुख्य नेविगेशन'],
  ['Page sections', 'पन्नाक खण्डसभ'],
  ['Jump to a page section', 'पन्नाक खण्ड पर जाउ'],
];

function isScoped(node: Node): boolean {
  const element = node.nodeType === Node.ELEMENT_NODE
    ? (node as Element)
    : node.parentElement;
  return Boolean(element?.closest(scopedSelectors.join(',')));
}

function localizeText(value: string): string {
  let result = value;
  for (const [from, to] of replacements) result = result.replaceAll(from, to);
  return result;
}

function localizeElement(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    if (isScoped(current)) textNodes.push(current as Text);
    current = walker.nextNode();
  }
  for (const node of textNodes) {
    const next = localizeText(node.data);
    if (next !== node.data) node.data = next;
  }

  const elements = root instanceof Element
    ? [root, ...root.querySelectorAll('*')]
    : [...root.querySelectorAll('*')];
  for (const element of elements) {
    if (!isScoped(element)) continue;
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const next = localizeText(value);
      if (next !== value) element.setAttribute(attribute, next);
    }
  }
}

function openTranslation(target: string) {
  const current = new URL(window.location.href);
  const translatedHost = `${current.hostname.replace(/-/g, '--').replace(/\./g, '-')}.translate.goog`;
  const separator = current.search ? '&' : '?';
  const translated = `https://${translatedHost}${current.pathname}${current.search}${separator}_x_tr_sl=mai&_x_tr_tl=${encodeURIComponent(target)}&_x_tr_hl=${encodeURIComponent(target)}&_x_tr_pto=wapp`;
  const opened = window.open(translated, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.assign(translated);
}

export default function HomeMaithiliLocalizer() {
  useEffect(() => {
    if (/\/en(?:\/|$)/.test(window.location.pathname)) return;

    document.documentElement.lang = 'mai';
    document.documentElement.dataset.edition = 'mai';
    localizeElement(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) localizeElement(node as Element);
          else if (node.nodeType === Node.TEXT_NODE && isScoped(node)) {
            const text = node as Text;
            const next = localizeText(text.data);
            if (next !== text.data) text.data = next;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    let speaking = false;
    const clickCapture = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest('button');
      if (!button) return;

      const translatePanel = button.closest('.translate-panel');
      if (translatePanel) {
        const quick = button.closest('.translate-quick');
        const labels: Record<string, string> = {
          Maithili: 'mai',
          Hindi: 'hi',
          Bengali: 'bn',
          Nepali: 'ne',
        };
        const code = quick ? labels[button.textContent?.trim() ?? ''] : undefined;
        if (code || button.classList.contains('translate-go')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const selected = translatePanel.querySelector('select') as HTMLSelectElement | null;
          openTranslation(code ?? selected?.value ?? 'en');
          return;
        }
      }

      if (button.parentElement?.classList.contains('videha-tools') && button.textContent?.includes('सुनू')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
        if (speaking) {
          window.speechSynthesis.cancel();
          speaking = false;
          return;
        }
        const text = (document.querySelector('main')?.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith('mai'))
          ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('hi'))
          ?? null;
        utterance.lang = utterance.voice?.lang ?? 'mai-IN';
        utterance.rate = 0.9;
        utterance.onend = () => { speaking = false; };
        utterance.onerror = () => { speaking = false; };
        speaking = true;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    };
    document.addEventListener('click', clickCapture, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', clickCapture, true);
      if (speaking) window.speechSynthesis?.cancel();
    };
  }, []);

  return null;
}
