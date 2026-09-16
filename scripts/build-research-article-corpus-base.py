#!/usr/bin/env python3
from __future__ import annotations

import concurrent.futures
import html
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / '.source-books'
OUT_ROOT = ROOT / 'public' / 'research-articles'
INVENTORY_PATH = ROOT / 'app' / 'generated' / 'research-article-inventory.json'
RESEARCH_DATA_PATH = ROOT / 'app' / 'research-data.json'
V2_MAITHILI_PATH = ROOT / 'app' / 'reader-maithili-source.json'

BASE_URL = 'https://videha-ejournal.github.io/mithila-vajji-anga/'
ARCHIVE_DOI = '10.5281/zenodo.22754977'
PUBLISH_DATE = '2026/09/15'
PUBLISH_ISO = '2026-09-15'
AUTHOR = 'Gajendra Thakur'
JOURNAL = 'Videha — First Maithili Fortnightly eJournal'
ISSN = '2229-547X'
VIDEHA_URL = 'https://www.videha.co.in/'
SOURCE_REPO = 'https://github.com/videha-ejournal/videha-ejournal'
RAW_SOURCE = 'https://raw.githubusercontent.com/videha-ejournal/videha-ejournal/main/'

SOURCES = {
    'history-v1': {
        'filename': 'HISTORY_MITHILA_ANGA_VAJJI.pdf',
        'book': 'History of Mithila, Vajji & Anga in India & Nepal: From Prehistory to the Contemporary Period',
        'label': 'History of Mithila, Vajji & Anga — Volume I',
    },
    'history-v2': {
        'filename': 'History_Mithila_Vajji_Anga_Volume_II_merge.pdf',
        'book': 'History of Mithila, Vajji & Anga in India & Nepal — Volume II: Socio-Cultural-Economic History',
        'label': 'History of Mithila, Vajji & Anga — Volume II',
    },
    'philosophy-v1': {
        'filename': 'GAJENDRA_THAKUR_PARALLEL_PHILOSOPHY.pdf',
        'book': 'गजेन्द्र ठाकुरक समानान्तर दर्शन / Gajendra Thakur’s Parallel Philosophy — Volume I',
        'label': 'Parallel Philosophy — Volume I',
    },
    'philosophy-v2': {
        'filename': 'Samanantar_Darshan_Volume_II_merge.pdf',
        'book': 'गजेन्द्र ठाकुरक समानान्तर दर्शन — खण्ड २ / Gajendra Thakur’s Parallel Philosophy — Volume II',
        'label': 'Parallel Philosophy — Volume II',
    },
}

DEV_DIGITS = str.maketrans('०१२३४५६७८९', '0123456789')
PAGE_FOOTER_RE = re.compile(r'^\s*Page\s+\d+\s+of\s+\d+\s*$', re.I)
NUM_ONLY_RE = re.compile(r'^\s*\d{1,4}\s*$')


def sh(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=check, text=True)


def source_path(key: str) -> Path:
    return SOURCE_DIR / SOURCES[key]['filename']


def source_urls(key: str) -> tuple[str, str]:
    name = SOURCES[key]['filename']
    return (f'{SOURCE_REPO}/blob/main/{name}', f'{RAW_SOURCE}{name}')


def pdftotext_pages(pdf: Path) -> list[str]:
    out = SOURCE_DIR / f'{pdf.stem}.layout.txt'
    sh('pdftotext', '-layout', str(pdf), str(out))
    text = out.read_text('utf-8', errors='replace')
    pages = text.split('\f')
    while pages and not pages[-1].strip():
        pages.pop()
    return pages


def to_int(raw: str) -> int:
    return int(raw.translate(DEV_DIGITS))


def page_heading_starts(pages: list[str], pattern: re.Pattern[str], expected: int,
                        min_page: int, max_page: int | None = None) -> dict[int, int]:
    found: dict[int, int] = {}
    for pno, page in enumerate(pages, 1):
        if pno < min_page or (max_page is not None and pno > max_page):
            continue
        for line in page.splitlines():
            m = pattern.match(line)
            if not m:
                continue
            try:
                num = to_int(m.group(1))
            except ValueError:
                continue
            if 1 <= num <= expected and num not in found:
                found[num] = pno
    missing = [n for n in range(1, expected + 1) if n not in found]
    if missing:
        raise RuntimeError(f'Missing chapter start pages: {missing[:20]} (total {len(missing)})')
    return found


def marker_page(pages: list[str], marker: str, min_page: int) -> int | None:
    for pno, page in enumerate(pages, 1):
        if pno >= min_page and marker in page:
            return pno
    return None


def clean_page_text(text: str) -> str:
    lines = []
    for raw in text.replace('\u00ad', '').splitlines():
        line = raw.rstrip()
        if PAGE_FOOTER_RE.match(line):
            continue
        if NUM_ONLY_RE.match(line) and len(line.strip()) <= 4:
            continue
        lines.append(line)
    out = []
    blanks = 0
    for line in lines:
        if line.strip():
            blanks = 0
            out.append(line)
        else:
            blanks += 1
            if blanks <= 2:
                out.append('')
    return '\n'.join(out).strip()


def chapter_chunk_from_pages(pages: list[str], start: int, end: int,
                             heading_pattern: re.Pattern[str], chapter_number: int) -> str:
    chunk_pages = pages[start - 1:end]
    if not chunk_pages:
        raise RuntimeError(f'Empty page range {start}-{end}')
    first = chunk_pages[0]
    lines = first.splitlines()
    heading_idx = None
    for i, line in enumerate(lines):
        m = heading_pattern.match(line)
        if m and to_int(m.group(1)) == chapter_number:
            heading_idx = i
            break
    if heading_idx is not None:
        chunk_pages[0] = '\n'.join(lines[heading_idx + 1:])
    return clean_page_text('\n\n'.join(chunk_pages))


def ocr_v1_maithili(pdf: Path, start_page: int, end_page: int, work: Path) -> dict[int, str]:
    work.mkdir(parents=True, exist_ok=True)
    image_dir = work / 'images'
    text_dir = work / 'text'
    image_dir.mkdir(exist_ok=True)
    text_dir.mkdir(exist_ok=True)

    expected = list(range(start_page, end_page + 1))
    existing = {p: text_dir / f'page-{p:04d}.txt' for p in expected}
    if not all(path.exists() and path.stat().st_size > 0 for path in existing.values()):
        for old in image_dir.glob('*'):
            old.unlink()
        sh('pdftoppm', '-f', str(start_page), '-l', str(end_page), '-r', '300',
           '-gray', '-png', str(pdf), str(image_dir / 'page'))
        images = sorted(image_dir.glob('page-*.png'))
        if len(images) != len(expected):
            raise RuntimeError(f'Expected {len(expected)} OCR images, got {len(images)}')

        def one(item: tuple[int, Path]) -> tuple[int, int]:
            pno, image = item
            outbase = text_dir / f'page-{pno:04d}'
            cp = subprocess.run(
                ['tesseract', str(image), str(outbase), '-l', 'Devanagari+eng', '--oem', '1', '--psm', '6'],
                text=True, capture_output=True,
            )
            if cp.returncode != 0:
                raise RuntimeError(f'Tesseract failed on PDF page {pno}: {cp.stderr[-500:]}')
            return pno, cp.returncode

        workers = max(2, min(4, os.cpu_count() or 2))
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            list(pool.map(one, zip(expected, images)))
        shutil.rmtree(image_dir)

    return {p: (text_dir / f'page-{p:04d}.txt').read_text('utf-8', errors='replace') for p in expected}


def strip_ocr_heading(text: str, chapter_number: int) -> str:
    lines = text.splitlines()
    idx = None
    pattern = re.compile(r'^\s*अध्याय\s+([०-९0-9]{1,3})\s*[—-]')
    for i, line in enumerate(lines):
        m = pattern.match(line)
        if m and to_int(m.group(1)) == chapter_number:
            idx = i
            break
    if idx is not None:
        lines = lines[idx + 1:]
    return clean_page_text('\n'.join(lines))


def esc(v: object) -> str:
    return html.escape(str(v), quote=True)


def article_html(rec: dict) -> str:
    title = rec['title']
    canonical = rec['canonical']
    lang = rec['language']
    alt_tags = '\n'.join(
        f'  <link rel="alternate" hreflang="{esc(code)}" href="{esc(url)}">'
        for code, url in rec.get('alternates', {}).items()
    )
    jsonld = {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        'headline': title,
        'author': {'@type': 'Person', 'name': AUTHOR},
        'datePublished': PUBLISH_ISO,
        'inLanguage': lang,
        'url': canonical,
        'isBasedOn': {
            '@type': 'Book', 'name': rec['source_book'], 'url': rec['source_html'],
            'author': {'@type': 'Person', 'name': AUTHOR},
        },
        'publisher': {'@type': 'Organization', 'name': JOURNAL, 'url': VIDEHA_URL},
        'isPartOf': {
            '@type': 'CreativeWorkSeries',
            'name': 'Videha Digital Research Archive: Mithila, Vajji & Anga',
            'url': BASE_URL,
        },
    }
    jsonld_text = json.dumps(jsonld, ensure_ascii=False).replace('</', '<\\/')
    pages = rec.get('source_pages_display', '')
    citation = (
        f'{AUTHOR}. “{title}.” {JOURNAL}, Research Article Edition, 2026. '
        f'Based on {rec["source_label"]}, Chapter {rec["chapter"]}{pages}. '
        f'Videha Digital Research Archive: Mithila, Vajji & Anga.'
    )
    pair_link = ''
    if rec.get('counterpart'):
        pair_label = 'Read English counterpart' if lang == 'mai' else 'मैथिली संस्करण पढ़ू'
        pair_link = f'<a class="button" href="{esc(rec["counterpart"])}">{esc(pair_label)}</a>'
    provenance_class = 'warning' if rec.get('ocr') else 'note'
    return f'''<!doctype html>
<html lang="{esc(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)} — Gajendra Thakur — Videha Research Article</title>
  <meta name="description" content="Research article edition by Gajendra Thakur, based on {esc(rec['source_label'])}, Chapter {rec['chapter']}.">
  <link rel="canonical" href="{esc(canonical)}">
{alt_tags}
  <meta name="citation_title" content="{esc(title)}">
  <meta name="citation_author" content="{esc(AUTHOR)}">
  <meta name="citation_publication_date" content="{PUBLISH_DATE}">
  <meta name="citation_journal_title" content="{esc(JOURNAL)}">
  <meta name="citation_issn" content="{ISSN}">
  <meta name="citation_public_url" content="{esc(canonical)}">
  <meta name="citation_language" content="{esc(lang)}">
  <meta name="citation_pdf_url" content="{esc(rec['source_pdf'])}">
  <script type="application/ld+json">{jsonld_text}</script>
  <style>
    :root {{ color-scheme: light dark; --max: 980px; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Georgia, 'Noto Serif Devanagari', 'Noto Serif', serif; line-height: 1.65; }}
    a {{ text-underline-offset: .15em; }}
    .skip {{ position: absolute; left: -9999px; top: auto; }} .skip:focus {{ left: 1rem; top: 1rem; z-index: 10; padding: .5rem; background: Canvas; }}
    header, main, footer {{ width: min(var(--max), calc(100% - 2rem)); margin-inline: auto; }}
    header {{ padding: 1.2rem 0 .8rem; border-bottom: 1px solid GrayText; }}
    main {{ padding: 1.4rem 0 3rem; }}
    .eyebrow {{ font-size: .9rem; letter-spacing: .04em; text-transform: uppercase; }}
    h1 {{ line-height: 1.2; }}
    .meta, .citation, .note, .warning {{ padding: 1rem; border: 1px solid GrayText; border-radius: .35rem; margin: 1rem 0; }}
    .warning {{ border-width: 2px; }}
    .button {{ display: inline-block; padding: .55rem .8rem; border: 1px solid currentColor; border-radius: .3rem; margin-right: .5rem; }}
    .article-text {{ white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.7; }}
    footer {{ border-top: 1px solid GrayText; padding: 1rem 0 2rem; font-size: .9rem; }}
  </style>
</head>
<body>
<a class="skip" href="#article">Skip to article text</a>
<header>
  <div class="eyebrow">Videha Research Article Edition · Mithila–Vajji–Anga</div>
  <h1>{esc(title)}</h1>
  <p><strong>{esc(AUTHOR)}</strong> · {esc(rec['collection_label'])} · Chapter {rec['chapter']}</p>
  <nav aria-label="Article navigation"><a href="{BASE_URL}research-articles/">Research articles index</a> · <a href="{esc(rec['source_html'])}">Source book PDF</a></nav>
</header>
<main id="article">
  <section class="meta" aria-labelledby="source-heading">
    <h2 id="source-heading">Source and scholarly status</h2>
    <p><strong>Source:</strong> {esc(rec['source_book'])}; Chapter {rec['chapter']}{esc(pages)}.</p>
    <p><strong>Language:</strong> {esc(rec['language_label'])}. <strong>Article author:</strong> {esc(AUTHOR)}.</p>
    <p><strong>Archive-level DOI:</strong> <a href="https://doi.org/{ARCHIVE_DOI}">{ARCHIVE_DOI}</a> — this DOI identifies the repository/archive record, not this individual article.</p>
    {pair_link}
  </section>
  <section class="citation" aria-labelledby="cite-heading">
    <h2 id="cite-heading">How to cite this article edition</h2>
    <p><cite>{esc(citation)}</cite></p>
    <p><a href="{esc(rec['source_pdf'])}">Authoritative source PDF</a></p>
  </section>
  <aside class="{provenance_class}" aria-label="Text provenance"><strong>Text provenance:</strong> {esc(rec['source_note'])}</aside>
  <article aria-labelledby="article-text-heading">
    <h2 id="article-text-heading">Full chapter text</h2>
    <div class="article-text">{esc(rec['body'])}</div>
  </article>
</main>
<footer>Research article edition © Gajendra Thakur; source-book rights remain as stated in the linked source PDF. · Videha — First Maithili Fortnightly eJournal · ISSN {ISSN} · <a href="{VIDEHA_URL}">www.videha.co.in</a></footer>
</body>
</html>
'''


def index_html(records: list[dict]) -> str:
    groups = [
        ('History — Volume I', [r for r in records if r['series']=='history' and r['volume']==1]),
        ('History — Volume II', [r for r in records if r['series']=='history' and r['volume']==2]),
        ('Parallel Philosophy — Volume I — Maithili', [r for r in records if r['series']=='philosophy' and r['volume']==1 and r['language']=='mai']),
        ('Parallel Philosophy — Volume I — English', [r for r in records if r['series']=='philosophy' and r['volume']==1 and r['language']=='en']),
        ('Parallel Philosophy — Volume II — Maithili', [r for r in records if r['series']=='philosophy' and r['volume']==2 and r['language']=='mai']),
        ('Parallel Philosophy — Volume II — English', [r for r in records if r['series']=='philosophy' and r['volume']==2 and r['language']=='en']),
    ]
    sections=[]
    for heading, items in groups:
        lis='\n'.join(f'<li><a href="{esc(r["canonical"])}">{r["chapter"]}. {esc(r["title"])}</a></li>' for r in items)
        sections.append(f'<section><h2>{esc(heading)} <small>({len(items)})</small></h2><ol>{lis}</ol></section>')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>522 Research Articles — Gajendra Thakur — Mithila–Vajji–Anga</title><link rel="canonical" href="{BASE_URL}research-articles/"><style>body{{font-family:Georgia,'Noto Serif Devanagari',serif;line-height:1.55;max-width:1050px;margin:auto;padding:1rem}}li{{margin:.3rem 0}}small{{font-weight:normal}}</style></head><body><main><h1>Research Articles by Gajendra Thakur</h1><p><strong>522 full-text chapter article editions:</strong> 178 History articles and 344 Parallel Philosophy articles (172 Maithili + 172 English). The source books are preserved in the Videha eJournal repository. Each article carries its own canonical URL, scholarly citation metadata and source-book citation.</p>{''.join(sections)}</main><footer><p>Videha — First Maithili Fortnightly eJournal · ISSN {ISSN} · <a href="{VIDEHA_URL}">www.videha.co.in</a></p></footer></body></html>'''


def record_route(series: str, volume: int, chapter: int, lang: str | None = None) -> str:
    if series == 'history':
        return f'research-articles/history/volume-{volume}/chapter-{chapter:03d}/'
    return f'research-articles/parallel-philosophy/volume-{volume}/{lang}/chapter-{chapter:03d}/'


def add_record(records: list[dict], *, series: str, volume: int, chapter: int, title: str, body: str,
               source_key: str, language: str, language_label: str, source_note: str,
               source_pages: str = '', ocr: bool = False) -> None:
    route = record_route(series, volume, chapter, language if series == 'philosophy' else None)
    source_html, source_pdf = source_urls(source_key)
    info = SOURCES[source_key]
    records.append({
        'series': series, 'volume': volume, 'chapter': chapter, 'title': title.strip(),
        'language': language, 'language_label': language_label, 'route': route,
        'canonical': BASE_URL + route, 'source_key': source_key, 'source_book': info['book'],
        'source_label': info['label'], 'source_html': source_html, 'source_pdf': source_pdf,
        'source_pages_display': f' (PDF pp. {source_pages})' if source_pages else '',
        'source_note': source_note,
        'collection_label': 'History of Mithila–Vajji–Anga' if series == 'history' else 'Parallel Philosophy / समानान्तर दर्शन',
        'ocr': ocr, 'body': body,
    })


def main() -> None:
    missing = [str(source_path(k)) for k in SOURCES if not source_path(k).exists()]
    if missing:
        raise SystemExit('Missing source PDFs: ' + ', '.join(missing))
    if not RESEARCH_DATA_PATH.exists() or not V2_MAITHILI_PATH.exists():
        raise SystemExit('Required repository chapter data is missing.')

    research = json.loads(RESEARCH_DATA_PATH.read_text('utf-8'))
    history_v1_meta = research.get('political', [])
    history_v2_meta = research.get('social', [])
    if len(history_v1_meta) != 28 or len(history_v2_meta) != 150:
        raise RuntimeError(f'Expected History 28+150 metadata records, found {len(history_v1_meta)}+{len(history_v2_meta)}')

    pages_h1 = pdftotext_pages(source_path('history-v1'))
    pages_h2 = pdftotext_pages(source_path('history-v2'))
    pages_p1 = pdftotext_pages(source_path('philosophy-v1'))
    pages_p2 = pdftotext_pages(source_path('philosophy-v2'))

    h1_pat = re.compile(r'^\s*Chapter\s+(\d{1,3})\.\s*(.*)$', re.I)
    h2_pat = re.compile(r'^\s*(?:Chapter|CHAPTER)\s+(\d{1,3})\s*[—-]\s*(.*)$')
    pm_pat = re.compile(r'^\s*अध्याय\s+([०-९0-9]{1,3})\s*[—-]\s*(.*)$')
    pe_pat = re.compile(r'^\s*Chapter\s+(\d{1,3})\s*[—-]\s*(.*)$')

    h1_starts = page_heading_starts(pages_h1, h1_pat, 28, 9)
    h2_starts = page_heading_starts(pages_h2, h2_pat, 150, 15)
    p1_m_starts = page_heading_starts(pages_p1, pm_pat, 72, 8, 533)
    p1_e_starts = page_heading_starts(pages_p1, pe_pat, 72, 500)
    p2_m_starts = page_heading_starts(pages_p2, pm_pat, 100, 8, 717)
    p2_e_starts = page_heading_starts(pages_p2, pe_pat, 100, 720)

    h1_back = marker_page(pages_h1, 'Consolidated chronology', 600) or len(pages_h1) + 1
    h2_back = marker_page(pages_h2, 'Selected Chronology', 1500) or len(pages_h2) + 1
    p2_e_back = marker_page(pages_p2, 'Philosophical and Intellectual Chronology', 1150) or len(pages_p2) + 1

    records: list[dict] = []
    native_note = 'Full text reproduced from the searchable text layer of the author’s source book; page headers/footers are lightly normalized for HTML presentation. The linked source PDF remains authoritative.'

    for volume, meta, pages, starts, pattern, source_key, final_end in [
        (1, history_v1_meta, pages_h1, h1_starts, h1_pat, 'history-v1', h1_back - 1),
        (2, history_v2_meta, pages_h2, h2_starts, h2_pat, 'history-v2', h2_back - 1),
    ]:
        for n in range(1, len(meta) + 1):
            start = starts[n]
            end = starts[n + 1] - 1 if n < len(meta) else final_end
            body = chapter_chunk_from_pages(pages, start, end, pattern, n)
            title = meta[n - 1].get('title') or f'Chapter {n}'
            add_record(records, series='history', volume=volume, chapter=n, title=title, body=body,
                       source_key=source_key, language='en', language_label='English',
                       source_note=native_note, source_pages=f'{start}–{end}')

    ocr_text = ocr_v1_maithili(source_path('philosophy-v1'), p1_m_starts[1], p1_e_starts[1] - 1, ROOT / '.article-ocr-v1')
    ocr_note = ('Image-derived Devanagari transcription from the author’s source PDF because its legacy embedded text map corrupts Maithili characters. No translation or abridgement is applied; the linked source PDF/page images remain authoritative for verification.')
    for n in range(1, 73):
        start = p1_m_starts[n]
        end = p1_m_starts[n + 1] - 1 if n < 72 else p1_e_starts[1] - 1
        raw = '\n\n'.join(ocr_text[p] for p in range(start, end + 1))
        body = strip_ocr_heading(raw, n)
        title = None
        for line in ocr_text[start].splitlines():
            m = pm_pat.match(line)
            if m and to_int(m.group(1)) == n:
                title = m.group(2).strip()
                break
        if not title:
            title = f'अध्याय {n}'
        add_record(records, series='philosophy', volume=1, chapter=n, title=title, body=body,
                   source_key='philosophy-v1', language='mai', language_label='Maithili',
                   source_note=ocr_note, source_pages=f'{start}–{end}', ocr=True)

    for n in range(1, 73):
        start = p1_e_starts[n]
        end = p1_e_starts[n + 1] - 1 if n < 72 else len(pages_p1)
        first = pages_p1[start - 1]
        title = next((m.group(2).strip() for line in first.splitlines() if (m := pe_pat.match(line)) and int(m.group(1)) == n), f'Chapter {n}')
        body = chapter_chunk_from_pages(pages_p1, start, end, pe_pat, n)
        add_record(records, series='philosophy', volume=1, chapter=n, title=title, body=body,
                   source_key='philosophy-v1', language='en', language_label='English',
                   source_note=native_note, source_pages=f'{start}–{end}')

    v2_mai = json.loads(V2_MAITHILI_PATH.read_text('utf-8'))
    for n in range(1, 101):
        key = f'philosophy-v2-{n}'
        text = v2_mai.get(key)
        if not isinstance(text, str) or len(text.strip()) < 200:
            raise RuntimeError(f'Missing/short clean Maithili source for {key}')
        lines = text.strip().splitlines()
        title = f'अध्याय {n}'
        if lines:
            m = pm_pat.match(lines[0])
            if m and to_int(m.group(1)) == n:
                title = m.group(2).strip()
                lines = lines[1:]
        body = clean_page_text('\n'.join(lines))
        start = p2_m_starts[n]
        end = p2_m_starts[n + 1] - 1 if n < 100 else 717
        add_record(records, series='philosophy', volume=2, chapter=n, title=title, body=body,
                   source_key='philosophy-v2', language='mai', language_label='Maithili',
                   source_note='Full Maithili chapter text reproduced from the clean source-controlled text already used by the Videha Mithila–Vajji–Anga archive; the linked author PDF is the authoritative book edition.',
                   source_pages=f'{start}–{end}' if n < 100 else '')

    for n in range(1, 101):
        start = p2_e_starts[n]
        end = p2_e_starts[n + 1] - 1 if n < 100 else p2_e_back - 1
        first = pages_p2[start - 1]
        title = next((m.group(2).strip() for line in first.splitlines() if (m := pe_pat.match(line)) and int(m.group(1)) == n), f'Chapter {n}')
        body = chapter_chunk_from_pages(pages_p2, start, end, pe_pat, n)
        add_record(records, series='philosophy', volume=2, chapter=n, title=title, body=body,
                   source_key='philosophy-v2', language='en', language_label='English',
                   source_note=native_note, source_pages=f'{start}–{end}')

    if len(records) != 522:
        raise RuntimeError(f'Expected exactly 522 article records, found {len(records)}')

    lookup = {(r['series'], r['volume'], r['chapter'], r['language']): r for r in records}
    for r in records:
        if r['series'] != 'philosophy':
            r['alternates'] = {'en': r['canonical'], 'x-default': r['canonical']}
            continue
        other_lang = 'en' if r['language'] == 'mai' else 'mai'
        counterpart = lookup[(r['series'], r['volume'], r['chapter'], other_lang)]['canonical']
        mai = lookup[(r['series'], r['volume'], r['chapter'], 'mai')]['canonical']
        en = lookup[(r['series'], r['volume'], r['chapter'], 'en')]['canonical']
        r['counterpart'] = counterpart
        r['alternates'] = {'mai': mai, 'en': en, 'x-default': en}

    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    for r in records:
        path = ROOT / 'public' / r['route'] / 'index.html'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(article_html(r), 'utf-8')
    (OUT_ROOT / 'index.html').write_text(index_html(records), 'utf-8')

    INVENTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    INVENTORY_PATH.write_text(json.dumps([{k: v for k, v in r.items() if k != 'body'} for r in records], ensure_ascii=False, indent=2) + '\n', 'utf-8')

    counts = {
        'history': sum(r['series'] == 'history' for r in records),
        'philosophy-maithili': sum(r['series'] == 'philosophy' and r['language'] == 'mai' for r in records),
        'philosophy-english': sum(r['series'] == 'philosophy' and r['language'] == 'en' for r in records),
        'total': len(records),
    }
    print('Research article corpus generated:', counts)


if __name__ == '__main__':
    main()
