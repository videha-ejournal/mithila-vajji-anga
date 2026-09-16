#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / '.source-books'
DETAILS_PATH = ROOT / 'app' / 'collection-details.json'
OUT_ROOT = ROOT / 'public' / 'research-articles' / 'decoding-panji'
INVENTORY_PATH = ROOT / 'app' / 'generated' / 'panji-article-inventory.json'
PUBLIC_INVENTORY_PATH = OUT_ROOT / 'inventory.json'

BASE_URL = 'https://videha-ejournal.github.io/mithila-vajji-anga/'
ARCHIVE_NAME = 'Videha Digital Research Archive: Mithila, Vajji & Anga'
AUTHOR = 'Gajendra Thakur'
VIDEHA = 'Videha — First Maithili Fortnightly eJournal'
VIDEHA_URL = 'https://www.videha.co.in/'
SOURCE_REPO = 'https://github.com/videha-ejournal/videha-ejournal'
RAW_SOURCE = 'https://raw.githubusercontent.com/videha-ejournal/videha-ejournal/main/'

SOURCES = {
    1: 'DECODING_PANJI_1.pdf',
    2: 'DECODING_PANJI_2.pdf',
    3: 'DECODING_PANJI_3.pdf',
    4: 'DECODING_PANJI_4.pdf',
    5: 'DECODING_PANJI_5.pdf',
    6: 'DECODING_PANJI_6.pdf',
}

ROMAN = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI'}
CHAPTER_RE = re.compile(r'^\s*Chapter\s+(\d+)\b\s*[:.\-–—]?\s*(.*)$', re.I)
APPENDIX_RE = re.compile(r'^\s*(Appendix|Annex(?:ure)?)\s*([A-Z0-9]+)?\s*(?:[.\-–—:]\s*(.*))?$', re.I)
PAGE_FOOTER_RE = re.compile(r'^\s*Page\s+\d+\s+(?:of\s+\d+)?\s*$', re.I)
NUMBER_ONLY_RE = re.compile(r'^\s*[ivxlcdm\d]{1,6}\s*$', re.I)

PREFIX_EXACT = {
    'abstract',
    'abstract and keywords',
    'keywords',
    'research statement',
    'prefatory note & abstract',
    'prefatory note and abstract',
    'appendices',
}
CLOSING_EXACT = {
    'conclusion',
    'conclusions',
    'overall conclusion',
    'closing note',
    'source notes',
    'notes',
    'references',
    'bibliography',
    'selected bibliography',
    'selected references',
}


def sh(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=True, text=True)


def clean(value: object) -> str:
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def normalize(value: object) -> str:
    text = unicodedata.normalize('NFKD', clean(value))
    text = ''.join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace('’', "'").replace('‘', "'").replace('–', '-').replace('—', '-')
    text = re.sub(r'[^0-9A-Za-z\u0900-\u097F]+', ' ', text).lower()
    return re.sub(r'\s+', ' ', text).strip()


def source_urls(volume: int) -> tuple[str, str]:
    filename = SOURCES[volume]
    return (
        f'{SOURCE_REPO}/blob/main/{filename}',
        f'{RAW_SOURCE}{filename}',
    )


def is_part_heading(title: str) -> bool:
    t = normalize(title)
    return bool(re.match(r'^(?:part|section)\s+(?:[ivxlcdm]+|\d+)\b', t))


def prefix_kind(title: str) -> bool:
    t = normalize(title)
    if t in PREFIX_EXACT:
        return True
    if is_part_heading(title):
        return True
    if re.match(r'^appendix\s+[a-z0-9]+$', t):
        return True
    if re.match(r'^annex(?:ure)?\s+[a-z0-9]+$', t):
        return True
    if re.match(r'^\d+\s+research abstract$', t):
        return True
    return False


def closing_kind(title: str) -> bool:
    t = normalize(title)
    if t in CLOSING_EXACT:
        return True
    if re.match(r'^(?:conclusion|conclusions)(?:\s+to\b|\s*[:.-])', t):
        return True
    if re.match(r'^(?:selected\s+)?(?:references|bibliography)(?:\s+and\b|\s*$)', t):
        return True
    if re.match(r'^chapter\s+\d+\s+source notes$', t):
        return True
    return False


def plausible_title(title: str, level: int) -> bool:
    t = clean(title)
    if not t or level > 2:
        return False
    if CHAPTER_RE.match(t):
        return False
    if prefix_kind(t) or closing_kind(t):
        return False
    if len(t) < 8 or len(t) > 260:
        return False
    return True


def appendix_parts(title: str) -> tuple[str, str | None] | None:
    m = APPENDIX_RE.match(clean(title))
    if not m:
        return None
    label = clean(' '.join(part for part in [m.group(1), m.group(2)] if part))
    rest = clean(m.group(3)) or None
    return label, rest


def build_volume1_boundaries(items: list[dict]) -> list[dict]:
    first_level1 = next((i for i, item in enumerate(items) if int(item.get('level', 99)) == 1), len(items))
    boundaries: list[dict] = []
    for index, item in enumerate(items):
        level = int(item.get('level', 99))
        title = clean(item.get('title'))
        if not title:
            continue
        selected = (index < first_level1 and level == 2) or (index >= first_level1 and level == 1)
        if not selected:
            continue
        mode = 'publish'
        if prefix_kind(title):
            mode = 'forward'
        elif closing_kind(title):
            mode = 'backward'
        kind = 'appendix' if appendix_parts(title) else 'section'
        boundaries.append({
            'source_order': index + 1,
            'start_heading': title,
            'display_title': title,
            'mode': mode,
            'kind': kind,
            'force_publish': kind == 'appendix' and mode == 'publish',
            'prefix_label': title if mode == 'forward' and appendix_parts(title) else None,
        })
    return boundaries


def chapter_title(items: list[dict], chapter_index: int, marker: str) -> str | None:
    m = CHAPTER_RE.match(marker)
    if not m:
        return None
    inline = clean(m.group(2))
    if inline:
        return inline
    for item in items[chapter_index + 1:]:
        title = clean(item.get('title'))
        level = int(item.get('level', 99))
        if CHAPTER_RE.match(title):
            break
        if plausible_title(title, level):
            return title
    return None


def next_level1_title(items: list[dict], start_index: int) -> str | None:
    for item in items[start_index + 1:]:
        level = int(item.get('level', 99))
        title = clean(item.get('title'))
        if not title:
            continue
        if level < 1:
            continue
        if level == 1:
            if CHAPTER_RE.match(title) or appendix_parts(title):
                return None
            if plausible_title(title, level):
                return title
            return None
        if level > 1:
            continue
    return None


def build_later_boundaries(items: list[dict]) -> list[dict]:
    boundaries: list[dict] = []
    consumed_titles: set[int] = set()
    for index, item in enumerate(items):
        if index in consumed_titles:
            continue
        title = clean(item.get('title'))
        level = int(item.get('level', 99))
        if not title:
            continue
        match = CHAPTER_RE.match(title)
        if match:
            resolved = chapter_title(items, index, title)
            if not resolved:
                raise RuntimeError(f'Chapter {match.group(1)} has no source-verified title in collection-details.json')
            boundaries.append({
                'source_order': index + 1,
                'start_heading': title,
                'display_title': resolved,
                'mode': 'publish',
                'kind': 'chapter',
                'chapter': int(match.group(1)),
                'force_publish': True,
                'prefix_label': None,
            })
            continue
        app = appendix_parts(title)
        if app and level <= 2:
            label, rest = app
            display = rest
            if not display:
                display = next_level1_title(items, index)
                if display:
                    for j in range(index + 1, len(items)):
                        if int(items[j].get('level', 99)) == 1 and clean(items[j].get('title')) == display:
                            consumed_titles.add(j)
                            break
            display_title = f'{label} — {display}' if display else label
            boundaries.append({
                'source_order': index + 1,
                'start_heading': title,
                'display_title': display_title,
                'mode': 'publish',
                'kind': 'appendix',
                'chapter': None,
                'force_publish': True,
                'prefix_label': None,
            })
    return boundaries


def build_boundaries(volume: int, detail: dict) -> list[dict]:
    items = detail.get('items') if isinstance(detail, dict) else None
    if not isinstance(items, list):
        raise RuntimeError(f'panji-{volume} has no source heading inventory')
    boundaries = build_volume1_boundaries(items) if volume == 1 else build_later_boundaries(items)
    if not boundaries:
        raise RuntimeError(f'No article boundaries were derived for Decoding Panji Volume {volume}')
    return boundaries


def pdf_lines(pdf: Path) -> tuple[list[dict], list[str]]:
    text_path = SOURCE_DIR / f'{pdf.stem}.panji.layout.txt'
    sh('pdftotext', '-layout', str(pdf), str(text_path))
    raw = text_path.read_text('utf-8', errors='replace')
    pages = raw.split('\f')
    while pages and not pages[-1].strip():
        pages.pop()
    lines: list[dict] = []
    page_norms: list[str] = []
    for page_number, page in enumerate(pages, 1):
        page_lines = page.splitlines()
        page_norms.append(normalize(' '.join(page_lines)))
        for line in page_lines:
            lines.append({'page': page_number, 'text': line})
    return lines, page_norms


def toc_pages(boundaries: list[dict], page_norms: list[str]) -> set[int]:
    targets = []
    for boundary in boundaries:
        target = normalize(boundary['start_heading'])
        if len(target) >= 14:
            targets.append(target)
    dense: set[int] = set()
    for pno, page in enumerate(page_norms, 1):
        hits = 0
        for target in targets:
            if target in page:
                hits += 1
                if hits >= 5:
                    dense.add(pno)
                    break
    return dense


def toc_like(text: str) -> bool:
    raw = clean(text)
    return bool(re.search(r'\.{3,}\s*\d+\s*$', raw) or re.search(r'\s{4,}\d+\s*$', raw))


def ordered_token_match(target: str, candidate: str) -> float:
    wanted = target.split()
    have = candidate.split()
    if not wanted or not have:
        return 0.0
    pos = 0
    hits = 0
    for token in wanted:
        try:
            found = have.index(token, pos)
        except ValueError:
            continue
        hits += 1
        pos = found + 1
    return hits / len(wanted)


def locate_heading(lines: list[dict], boundary: dict, start_at: int, excluded_pages: set[int]) -> tuple[int, int]:
    target = normalize(boundary['start_heading'])
    if not target:
        raise RuntimeError(f'Empty normalized heading: {boundary}')
    target_core = re.sub(r'^(?:chapter\s+\d+|[ivxlcdm]+|\d+)\s+', '', target).strip()
    best: tuple[float, int, int] | None = None
    for i in range(max(0, start_at), len(lines)):
        if lines[i]['page'] in excluded_pages:
            continue
        if toc_like(lines[i]['text']):
            continue
        for width in (1, 2, 3, 4):
            if i + width > len(lines):
                break
            block = lines[i:i + width]
            if any(row['page'] in excluded_pages for row in block):
                continue
            window_raw = ' '.join(row['text'] for row in block)
            if toc_like(window_raw):
                continue
            window = normalize(window_raw)
            if not window:
                continue
            if target in window or (len(window) >= 16 and window in target):
                return i, width
            if target_core and len(target_core) >= 16 and target_core in window:
                return i, width
            score = ordered_token_match(target, window)
            if len(target.split()) >= 5 and score >= 0.86:
                if best is None or score > best[0]:
                    best = (score, i, width)
        if best and i - best[1] > 500:
            break
    if best:
        return best[1], best[2]
    raise RuntimeError(f'Could not locate source heading in PDF after line {start_at}: {boundary["start_heading"]}')


def clean_body(rows: list[dict]) -> str:
    out: list[str] = []
    blanks = 0
    for row in rows:
        line = row['text'].replace('\u00ad', '').rstrip()
        if PAGE_FOOTER_RE.match(line):
            continue
        if NUMBER_ONLY_RE.match(line.strip()) and len(line.strip()) <= 6:
            continue
        if line.strip():
            blanks = 0
            out.append(line)
        else:
            blanks += 1
            if blanks <= 2:
                out.append('')
    return '\n'.join(out).strip()


def word_count(text: str) -> int:
    return len(re.findall(r'[\w\u0900-\u097F]+', text, flags=re.UNICODE))


def substantial(text: str) -> bool:
    return word_count(text) >= 140 or len(re.sub(r'\s+', '', text)) >= 1000


def append_segment(target: dict, segment: dict) -> None:
    if segment['body']:
        target['body'] = (target['body'].rstrip() + '\n\n' + segment['body'].lstrip()).strip()
    target['start_page'] = min(target['start_page'], segment['start_page'])
    target['end_page'] = max(target['end_page'], segment['end_page'])
    target.setdefault('merged_headings', []).append(segment['boundary']['display_title'])


def assemble_articles(volume: int, segments: list[dict]) -> list[dict]:
    articles: list[dict] = []
    pending: list[dict] = []
    for segment in segments:
        boundary = segment['boundary']
        mode = boundary['mode']
        if mode == 'forward':
            pending.append(segment)
            continue
        if mode == 'backward':
            if articles:
                append_segment(articles[-1], segment)
            else:
                pending.append(segment)
            continue

        force = bool(boundary.get('force_publish'))
        qualifies = force or substantial(segment['body'])
        if not qualifies:
            if articles:
                append_segment(articles[-1], segment)
            else:
                pending.append(segment)
            continue

        display_title = boundary['display_title']
        prefix_labels = [
            clean(p['boundary'].get('prefix_label'))
            for p in pending
            if clean(p['boundary'].get('prefix_label'))
        ]
        if prefix_labels and not normalize(display_title).startswith(normalize(prefix_labels[-1])):
            display_title = f'{prefix_labels[-1]} — {display_title}'

        body_parts = [p['body'] for p in pending if p['body']] + [segment['body']]
        start_page = min([p['start_page'] for p in pending] + [segment['start_page']])
        article = {
            'volume': volume,
            'source_order': boundary['source_order'],
            'title': display_title,
            'kind': boundary['kind'],
            'chapter': boundary.get('chapter'),
            'body': '\n\n'.join(body_parts).strip(),
            'start_page': start_page,
            'end_page': segment['end_page'],
            'source_heading': boundary['start_heading'],
            'merged_headings': [p['boundary']['display_title'] for p in pending],
        }
        pending = []
        articles.append(article)

    if pending:
        if not articles:
            raise RuntimeError(f'All Volume {volume} candidate units collapsed as non-substantial')
        for segment in pending:
            append_segment(articles[-1], segment)
    return articles


def build_volume(volume: int, detail: dict) -> list[dict]:
    boundaries = build_boundaries(volume, detail)
    pdf = SOURCE_DIR / SOURCES[volume]
    if not pdf.exists():
        raise RuntimeError(f'Missing source PDF: {pdf}')
    lines, page_norms = pdf_lines(pdf)
    excluded = toc_pages(boundaries, page_norms)
    matches: list[tuple[int, int]] = []
    cursor = 0
    for boundary in boundaries:
        line_index, width = locate_heading(lines, boundary, cursor, excluded)
        matches.append((line_index, width))
        cursor = line_index + max(1, width)

    segments: list[dict] = []
    for i, boundary in enumerate(boundaries):
        start, width = matches[i]
        end = matches[i + 1][0] if i + 1 < len(matches) else len(lines)
        rows = lines[start:end]
        if not rows:
            raise RuntimeError(f'Empty segment for Volume {volume}: {boundary["display_title"]}')
        body = clean_body(rows)
        segments.append({
            'boundary': boundary,
            'body': body,
            'start_page': rows[0]['page'],
            'end_page': rows[-1]['page'],
            'word_count': word_count(body),
        })

    articles = assemble_articles(volume, segments)
    if volume == 1 and len(articles) < 10:
        raise RuntimeError(f'Volume I produced only {len(articles)} substantial article units; expected a materially larger research structure')
    if volume > 1 and not any(a['kind'] == 'chapter' for a in articles):
        raise RuntimeError(f'Volume {volume} produced no formal chapter articles')
    return articles


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def article_route(volume: int, stable_id: str) -> str:
    suffix = stable_id.rsplit('-', 1)[-1]
    return f'research-articles/decoding-panji/volume-{volume}/article-{suffix}/'


def assign_identity(records: list[dict]) -> None:
    occurrences: defaultdict[tuple[int, str], int] = defaultdict(int)
    for record in records:
        key = (record['volume'], normalize(record['title']))
        occurrences[key] += 1
        occurrence = occurrences[key]
        digest = hashlib.sha1(
            f"decoding-panji|v{record['volume']}|{normalize(record['title'])}|{occurrence}".encode('utf-8')
        ).hexdigest()[:12]
        stable_id = f'decoding-panji-v{record["volume"]}-{digest}'
        route = article_route(record['volume'], stable_id)
        source_html, source_pdf = source_urls(record['volume'])
        record.update({
            'stable_id': stable_id,
            'route': route,
            'canonical': BASE_URL + route,
            'language': 'en',
            'language_label': 'English',
            'source_file': SOURCES[record['volume']],
            'source_book': f'Decoding the Panji of Mithila — Volume {ROMAN[record["volume"]]}',
            'source_volume': ROMAN[record['volume']],
            'source_html': source_html,
            'source_pdf': source_pdf,
            'source_pages': f"{record['start_page']}–{record['end_page']}",
            'source_locator': f"PDF pp. {record['start_page']}–{record['end_page']} · source heading: {record['source_heading']}",
            'article_pdf': None,
        })

    for volume in range(1, 7):
        volume_records = [r for r in records if r['volume'] == volume]
        for index, record in enumerate(volume_records):
            record['volume_article_number'] = index + 1
            record['previous'] = volume_records[index - 1]['canonical'] if index > 0 else None
            record['next'] = volume_records[index + 1]['canonical'] if index + 1 < len(volume_records) else None


def article_html(record: dict) -> str:
    canonical = record['canonical']
    title = record['title']
    source_book = record['source_book']
    source_pages = record['source_pages']
    jsonld = {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        'headline': title,
        'author': {'@type': 'Person', 'name': AUTHOR},
        'inLanguage': 'en',
        'url': canonical,
        'isBasedOn': {
            '@type': 'Book',
            'name': source_book,
            'url': record['source_html'],
            'author': {'@type': 'Person', 'name': AUTHOR},
        },
        'isPartOf': {
            '@type': 'CreativeWorkSeries',
            'name': ARCHIVE_NAME,
            'url': BASE_URL,
        },
    }
    jsonld_text = json.dumps(jsonld, ensure_ascii=False).replace('</', '<\\/')
    citation = (
        f'{AUTHOR}. “{title}.” Scholarly HTML article edition derived from {source_book}, '
        f'PDF pp. {source_pages}. {ARCHIVE_NAME}.'
    )
    prev_link = f'<a rel="prev" href="{esc(record["previous"])}">← Previous article</a>' if record.get('previous') else ''
    next_link = f'<a rel="next" href="{esc(record["next"])}">Next article →</a>' if record.get('next') else ''
    nav_sep = ' · ' if prev_link and next_link else ''
    provenance = (
        f'Full text is reproduced from the searchable text layer of {record["source_file"]}. '
        'Article boundaries use source-controlled heading structure and are accepted only when the corresponding heading is located in the authoritative PDF. '
        'Short structural fragments are merged into an adjacent substantial unit rather than published as artificial pages.'
    )
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)} — Decoding the Panji of Mithila — Gajendra Thakur</title>
  <meta name="description" content="Source-derived scholarly article by Gajendra Thakur from {esc(source_book)}, {esc(record['source_locator'])}.">
  <link rel="canonical" href="{esc(canonical)}">
  <link rel="alternate" hreflang="en" href="{esc(canonical)}">
  <link rel="alternate" hreflang="x-default" href="{esc(canonical)}">
  <meta name="citation_title" content="{esc(title)}">
  <meta name="citation_author" content="{esc(AUTHOR)}">
  <meta name="citation_public_url" content="{esc(canonical)}">
  <meta name="citation_language" content="en">
  <script type="application/ld+json">{jsonld_text}</script>
  <style>
    :root {{ color-scheme: light dark; --max: 980px; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Georgia, 'Noto Serif', serif; line-height: 1.68; }}
    a {{ text-underline-offset: .16em; }}
    .skip {{ position: absolute; left: -9999px; }} .skip:focus {{ left: 1rem; top: 1rem; z-index: 10; background: Canvas; padding: .5rem; }}
    header, main, footer {{ width: min(var(--max), calc(100% - 2rem)); margin-inline: auto; }}
    header {{ padding: 1.4rem 0 1rem; border-bottom: 1px solid GrayText; }}
    main {{ padding: 1.4rem 0 3rem; }}
    h1 {{ line-height: 1.18; }}
    .eyebrow {{ font-size: .82rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }}
    .meta, .citation, .provenance {{ padding: 1rem; margin: 1rem 0; border: 1px solid GrayText; border-radius: .45rem; }}
    .source-text {{ white-space: pre-wrap; overflow-wrap: anywhere; }}
    .pager {{ display: flex; flex-wrap: wrap; justify-content: space-between; gap: .75rem; margin: 1rem 0; }}
    footer {{ border-top: 1px solid GrayText; padding: 1rem 0 2rem; font-size: .9rem; }}
  </style>
</head>
<body data-panji-article-id="{esc(record['stable_id'])}">
<a class="skip" href="#article-text">Skip to article text</a>
<header>
  <p class="eyebrow">Decoding Panji · Volume {ROMAN[record['volume']]} · Mithila–Vajji–Anga research archive</p>
  <h1>{esc(title)}</h1>
  <p><strong>{esc(AUTHOR)}</strong> · English scholarly article edition · {esc(record['source_locator'])}</p>
  <nav><a href="{BASE_URL}research-articles/decoding-panji/">Decoding Panji article directory</a> · <a href="{BASE_URL}panji/">Panji collection</a> · <a href="{esc(record['source_html'])}">Source book</a></nav>
</header>
<main>
  <section class="meta" aria-labelledby="source-heading">
    <h2 id="source-heading">Source and provenance</h2>
    <p><strong>Source book:</strong> {esc(source_book)}.</p>
    <p><strong>Source locator:</strong> {esc(record['source_locator'])}.</p>
    <p><strong>Stable record ID:</strong> <code>{esc(record['stable_id'])}</code>.</p>
    <p><a href="{esc(record['source_pdf'])}">Open the authoritative source PDF</a>.</p>
  </section>
  <section class="citation" aria-labelledby="citation-heading">
    <h2 id="citation-heading">Citation</h2>
    <p><cite>{esc(citation)}</cite></p>
    <p>This is a book-derived scholarly record hosted by the Videha research archive; no journal ISSN is asserted as article metadata.</p>
  </section>
  <aside class="provenance" aria-label="Text provenance"><strong>Text provenance:</strong> {esc(provenance)}</aside>
  <article id="article-text" aria-labelledby="article-text-heading">
    <h2 id="article-text-heading">Source-derived article text</h2>
    <div class="source-text">{esc(record['body'])}</div>
  </article>
  <nav class="pager" aria-label="Previous and next articles">{prev_link}{nav_sep}{next_link}</nav>
  <p><a href="{BASE_URL}research-articles/">All scholarly article collections</a> · <a href="{BASE_URL}">Mithila–Vajji–Anga archive home</a></p>
</main>
<footer>© Gajendra Thakur · Institutional context: {esc(VIDEHA)}, ISSN 2229-547X · <a href="{VIDEHA_URL}">www.videha.co.in</a></footer>
</body>
</html>
'''


def index_html(records: list[dict]) -> str:
    sections = []
    for volume in range(1, 7):
        items = [r for r in records if r['volume'] == volume]
        links = '\n'.join(
            f'<li><a href="{esc(r["canonical"])}">{i + 1}. {esc(r["title"])}</a> <small>({esc(r["kind"])}, PDF pp. {esc(r["source_pages"])})</small></li>'
            for i, r in enumerate(items)
        )
        source_html, _ = source_urls(volume)
        sections.append(
            f'<section id="volume-{volume}"><h2>Volume {ROMAN[volume]} <small>({len(items)} articles)</small></h2>'
            f'<p><a href="{esc(source_html)}">Source PDF</a></p><ol>{links}</ol></section>'
        )
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Decoding the Panji of Mithila — Scholarly Article Directory</title>
<link rel="canonical" href="{BASE_URL}research-articles/decoding-panji/">
<style>body{{font-family:Georgia,'Noto Serif',serif;line-height:1.55;max-width:1120px;margin:auto;padding:1rem}}section{{margin:2rem 0}}li{{margin:.4rem 0}}small{{font-weight:normal}}</style></head>
<body><main><h1>Decoding the Panji of Mithila — Volumes I–VI</h1>
<p><strong>{len(records)} source-derived scholarly HTML articles by Gajendra Thakur.</strong> Volume I is segmented by its substantial source heading structure rather than forced into a chapter-only model; short structural fragments are merged instead of being published as thin pages. Volumes II–VI preserve formal chapters and substantive appendices/annexures.</p>
{''.join(sections)}</main><footer><p>{esc(ARCHIVE_NAME)} · <a href="{VIDEHA_URL}">Videha</a></p></footer></body></html>'''


def main() -> None:
    if not DETAILS_PATH.exists():
        raise SystemExit(f'Missing source structure: {DETAILS_PATH}')
    details = json.loads(DETAILS_PATH.read_text('utf-8'))
    records: list[dict] = []
    for volume in range(1, 7):
        detail = details.get(f'panji-{volume}')
        if not isinstance(detail, dict):
            raise RuntimeError(f'Missing panji-{volume} in collection-details.json')
        volume_records = build_volume(volume, detail)
        records.extend(volume_records)
        print(f'Decoding Panji Volume {ROMAN[volume]}: {len(volume_records)} substantial article units', flush=True)

    assign_identity(records)
    stable_ids = [r['stable_id'] for r in records]
    canonicals = [r['canonical'] for r in records]
    if len(stable_ids) != len(set(stable_ids)):
        raise RuntimeError('Duplicate Decoding Panji stable IDs detected')
    if len(canonicals) != len(set(canonicals)):
        raise RuntimeError('Duplicate Decoding Panji canonical URLs detected')

    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    for record in records:
        path = ROOT / 'public' / record['route'] / 'index.html'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(article_html(record), 'utf-8')

    (OUT_ROOT / 'index.html').write_text(index_html(records), 'utf-8')
    public_records = [{k: v for k, v in record.items() if k != 'body'} for record in records]
    INVENTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    INVENTORY_PATH.write_text(json.dumps(public_records, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    PUBLIC_INVENTORY_PATH.write_text(json.dumps(public_records, ensure_ascii=False, indent=2) + '\n', 'utf-8')

    counts = Counter(record['volume'] for record in records)
    kinds = Counter(record['kind'] for record in records)
    print('Decoding Panji corpus generated:', {
        'total': len(records),
        'by_volume': {ROMAN[v]: counts[v] for v in range(1, 7)},
        'by_kind': dict(kinds),
    }, flush=True)


if __name__ == '__main__':
    main()
