#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / '.source-books'
OUT_ROOT = ROOT / 'public' / 'research-articles' / 'decoding-panji'
INVENTORY_PATH = ROOT / 'app' / 'generated' / 'panji-article-inventory.json'
PUBLIC_INVENTORY_PATH = OUT_ROOT / 'inventory.json'
BASE_URL = 'https://videha-ejournal.github.io/mithila-vajji-anga/'
AUTHOR = 'Gajendra Thakur'
ARCHIVE = 'Videha Digital Research Archive: Mithila, Vajji & Anga'
VIDEHA_URL = 'https://www.videha.co.in/'
SOURCE_REPO = 'https://github.com/videha-ejournal/videha-ejournal'
RAW_SOURCE = 'https://raw.githubusercontent.com/videha-ejournal/videha-ejournal/main/'

SOURCES = {n: f'DECODING_PANJI_{n}.pdf' for n in range(1, 7)}
EXPECTED = {1: 20, 2: 38, 3: 32, 4: 87, 5: 40, 6: 30}
ROMAN = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI'}
# Match only a bare chapter heading or a punctuation-delimited title; reject prose such as ‘Chapter 16 will…’.
CHAPTER_RE = re.compile(r'^\s*Chapter\s+(\d+)\b(?:\s*[.:\-–—]\s*(.*))?\s*$', re.I)
PAGE_FOOTER_RE = re.compile(r'^\s*(?:Page\s+)?\d+(?:\s+of\s+\d+)?\s*$', re.I)
PART_RE = re.compile(r'^\s*Part\s+(?:[IVXLCDM]+|\d+)\b', re.I)
APPENDIX_RE = re.compile(r'^\s*(?:Appendix|Annex(?:ure)?)\s+[A-Z0-9]+\b', re.I)
FINAL_BACK_RE = re.compile(r'^\s*(?:Bibliography|Selected Bibliography|Index|About the Author)\b', re.I)


def clean(value: object) -> str:
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def run_pdftotext(pdf: Path) -> list[list[str]]:
    target = SOURCE_DIR / f'{pdf.stem}.chapter-layout.txt'
    subprocess.run(['pdftotext', '-layout', str(pdf), str(target)], check=True)
    raw = target.read_text('utf-8', errors='replace')
    pages = [page.splitlines() for page in raw.split('\f')]
    while pages and not any(line.strip() for line in pages[-1]):
        pages.pop()
    return pages


def flatten(pages: list[list[str]]) -> list[dict]:
    rows: list[dict] = []
    for page_no, lines in enumerate(pages, 1):
        for line_no, text in enumerate(lines):
            rows.append({'page': page_no, 'line': line_no, 'text': text})
    return rows


def chapter_occurrences(rows: list[dict]) -> tuple[dict[int, list[int]], set[int]]:
    by_chapter: dict[int, list[int]] = defaultdict(list)
    per_page: dict[int, int] = defaultdict(int)
    for idx, row in enumerate(rows):
        match = CHAPTER_RE.match(row['text'])
        if not match:
            continue
        number = int(match.group(1))
        by_chapter[number].append(idx)
        per_page[row['page']] += 1
    # TOC pages carry several chapter headings together; body chapter openings do not.
    toc_pages = {page for page, count in per_page.items() if count >= 4}
    return by_chapter, toc_pages


def hybrid_first_chapter_start(rows: list[dict], toc_pages: set[int]) -> int | None:
    """Locate Chapter 1 when the final TOC page also begins the chapter body.

    Some source PDFs put the last contents entries at the top of a page and
    immediately continue with Chapter 1 prose on that same page. Keep the
    strict heading parser and accept this fallback only when substantial prose
    follows the final formal TOC chapter entry.
    """
    if not toc_pages:
        return None
    final_toc_page = max(toc_pages)
    marker_indices = [
        idx for idx, row in enumerate(rows)
        if row['page'] == final_toc_page and CHAPTER_RE.match(row['text'])
    ]
    if not marker_indices:
        return None
    last_marker = marker_indices[-1]
    tail_indices: list[int] = []
    for idx in range(last_marker + 1, len(rows)):
        row = rows[idx]
        if row['page'] != final_toc_page:
            break
        value = clean(row['text'])
        if not value or PAGE_FOOTER_RE.match(value):
            continue
        tail_indices.append(idx)
    if len(tail_indices) < 4:
        return None
    tail_text = ' '.join(clean(rows[idx]['text']) for idx in tail_indices)
    if len(tail_text) < 300:
        return None
    return tail_indices[0]


def select_body_starts(rows: list[dict], expected: int) -> list[int]:
    occurrences, toc_pages = chapter_occurrences(rows)
    if toc_pages:
        body_min_page = max(toc_pages) + 1
    else:
        body_min_page = 2

    starts: list[int] = []
    cursor = -1
    missing: list[int] = []
    for chapter in range(1, expected + 1):
        candidates = [
            idx for idx in occurrences.get(chapter, [])
            if idx > cursor and rows[idx]['page'] >= body_min_page and rows[idx]['page'] not in toc_pages
        ]
        # A final contents page may be a hybrid page: TOC entries first, then
        # actual Chapter 1 prose. Accept only that narrowly validated case.
        if not candidates and chapter == 1:
            hybrid = hybrid_first_chapter_start(rows, toc_pages)
            if hybrid is not None and hybrid > cursor:
                candidates = [hybrid]
        if not candidates:
            missing.append(chapter)
            continue
        chosen = candidates[0]
        starts.append(chosen)
        cursor = chosen
    if missing or len(starts) != expected:
        present = sorted(n for n in occurrences if 1 <= n <= expected)
        raise RuntimeError(
            f'Formal chapter extraction failed: expected Chapters 1-{expected}; '
            f'missing body starts {missing}; detected chapter numbers {present}'
        )
    return starts


def extract_title(rows: list[dict], start: int, chapter: int) -> str:
    match = CHAPTER_RE.match(rows[start]['text'])
    if not match or int(match.group(1)) != chapter:
        # On a validated hybrid TOC/body page, Chapter 1 can begin as prose
        # without repeating its heading. Recover only its formal TOC title.
        if chapter == 1:
            for row in rows[:start]:
                prior = CHAPTER_RE.match(row['text'])
                if prior and int(prior.group(1)) == 1:
                    prior_title = clean(prior.group(2)).lstrip('-–—.: ')
                    if prior_title:
                        return prior_title
        raise RuntimeError(f'Chapter marker mismatch at Chapter {chapter}')
    title = clean(match.group(2)).lstrip('-–—.: ')
    if title:
        # Capture a visibly indented continuation line for wrapped long titles.
        base_indent = len(rows[start]['text']) - len(rows[start]['text'].lstrip())
        for offset in (1, 2):
            if start + offset >= len(rows):
                break
            nxt = rows[start + offset]
            if nxt['page'] != rows[start]['page'] or not nxt['text'].strip():
                break
            if CHAPTER_RE.match(nxt['text']) or PART_RE.match(nxt['text']) or APPENDIX_RE.match(nxt['text']):
                break
            indent = len(nxt['text']) - len(nxt['text'].lstrip())
            continuation = clean(nxt['text'])
            if indent >= base_indent + 2 and len(continuation) <= 180:
                title = f'{title} {continuation}'
            else:
                break
        return clean(title)

    for offset in range(1, 5):
        if start + offset >= len(rows):
            break
        nxt = rows[start + offset]
        if nxt['page'] != rows[start]['page']:
            break
        candidate = clean(nxt['text'])
        if candidate and not PAGE_FOOTER_RE.match(candidate):
            return candidate
    raise RuntimeError(f'Chapter {chapter} has no extractable title')


def semantic_end(rows: list[dict], start: int, next_start: int | None, final: bool) -> int:
    hard_end = next_start if next_start is not None else len(rows)
    # Do not absorb book-level parts/appendices into the preceding chapter.
    for idx in range(start + 8, hard_end):
        text = rows[idx]['text']
        if PART_RE.match(text) or APPENDIX_RE.match(text) or (final and FINAL_BACK_RE.match(text)):
            return idx
    return hard_end


def body_text(rows: list[dict], start: int, end: int) -> str:
    output: list[str] = []
    blank = False
    for row in rows[start:end]:
        text = row['text'].replace('\u00ad', '').rstrip()
        if PAGE_FOOTER_RE.match(text):
            continue
        if text.strip():
            output.append(text)
            blank = False
        elif not blank:
            output.append('')
            blank = True
    return '\n'.join(output).strip()


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def chapter_html(record: dict, body: str, previous: dict | None, following: dict | None) -> str:
    structured = {
        '@context': 'https://schema.org',
        '@type': 'Chapter',
        'name': record['title'],
        'author': {'@type': 'Person', 'name': AUTHOR},
        'inLanguage': 'en',
        'url': record['canonical'],
        'pagination': record['source_pages'],
        'isPartOf': {
            '@type': 'Book',
            'name': record['source_book'],
            'author': {'@type': 'Person', 'name': AUTHOR},
        },
        'isBasedOn': record['source_pdf'],
    }
    prev_link = f'<a rel="prev" href="{esc(previous["canonical"])}">← Chapter {previous["chapter"]}</a>' if previous else '<span></span>'
    next_link = f'<a rel="next" href="{esc(following["canonical"])}">Chapter {following["chapter"]} →</a>' if following else '<span></span>'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(record['title'])} | Decoding the Panji of Mithila Volume {ROMAN[record['volume']]}</title>
<link rel="canonical" href="{esc(record['canonical'])}">
<meta name="citation_title" content="{esc(record['title'])}"><meta name="citation_author" content="{AUTHOR}"><meta name="citation_public_url" content="{esc(record['canonical'])}"><meta name="citation_language" content="en">
<meta name="description" content="Source-derived Chapter {record['chapter']} from Decoding the Panji of Mithila Volume {ROMAN[record['volume']]}, preserved in the Videha Digital Research Archive for Mithila, Vajji & Anga.">
<script type="application/ld+json">{json.dumps(structured, ensure_ascii=False)}</script>
<style>body{{margin:0;background:#f6f1e6;color:#1e2925;font:17px/1.72 Georgia,serif}}main{{width:min(920px,calc(100% - 2rem));margin:0 auto;padding:2rem 0 4rem}}a{{color:#704817}}.crumbs,.source,.nav,footer{{font-family:system-ui,sans-serif}}h1{{font-size:clamp(2rem,5vw,3.5rem);line-height:1.12;color:#17243a}}.kicker{{font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.09em;color:#8a4b0f;text-transform:uppercase}}.source{{padding:1rem;border:1px solid #cfbf9d;border-radius:12px;background:#fffaf0}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:16px/1.7 Georgia,serif;background:#fff;padding:1.25rem;border:1px solid #ddd4c3;border-radius:12px}}.nav{{display:flex;justify-content:space-between;gap:1rem;margin:1.5rem 0}}footer{{margin-top:2rem;padding-top:1rem;border-top:1px solid #c9bea8;font-size:.88rem}}</style></head>
<body><main data-panji-article-id="{record['stable_id']}" data-panji-chapter="{record['chapter']}">
<nav class="crumbs"><a href="{BASE_URL}">Mithila–Vajji–Anga archive</a> · <a href="{BASE_URL}research-articles/decoding-panji/">Decoding Panji</a> · Volume {ROMAN[record['volume']]}</nav>
<p class="kicker">Decoding the Panji of Mithila · Volume {ROMAN[record['volume']]} · Chapter {record['chapter']}</p><h1>{esc(record['title'])}</h1>
<div class="source"><strong>Source-derived chapter text.</strong> Source: <a href="{esc(record['source_html'])}">{esc(record['source_file'])}</a>, PDF pp. {esc(record['source_pages'])}. The web page preserves one formal book chapter as one HTML document; book-level appendices and front/back matter are not promoted to separate chapter pages.</div>
<pre>{esc(body)}</pre><nav class="nav">{prev_link}{next_link}</nav>
<footer>© Gajendra Thakur, Editor, Videha — First Maithili Fortnightly eJournal · ISSN 2229-547X · <a href="{VIDEHA_URL}">www.videha.co.in</a></footer>
</main></body></html>'''


def index_html(records: list[dict]) -> str:
    groups: list[str] = []
    for volume in range(1, 7):
        chapter_links = ''.join(
            f'<li><a href="{esc(r["canonical"])}">Chapter {r["chapter"]}: {esc(r["title"])}</a> <small>PDF pp. {esc(r["source_pages"])}</small></li>'
            for r in records if r['volume'] == volume
        )
        groups.append(f'<section><h2>Volume {ROMAN[volume]} — {EXPECTED[volume]} chapters</h2><ol>{chapter_links}</ol></section>')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Decoding the Panji of Mithila — Chapter Corpus</title><link rel="canonical" href="{BASE_URL}research-articles/decoding-panji/"><style>body{{font:16px/1.6 system-ui,sans-serif;max-width:1100px;margin:auto;padding:2rem;background:#fbf8f0;color:#1c2924}}a{{color:#704817}}section{{background:white;border:1px solid #ddd3bd;border-radius:12px;padding:1rem 1.3rem;margin:1rem 0}}li{{margin:.35rem 0}}small{{color:#5d675f}}</style></head><body><h1>Decoding the Panji of Mithila — Volumes I–VI</h1><p>{len(records)} source-derived chapter pages. Governing rule: one formal book chapter per HTML page; appendices, front matter and other book apparatus do not create extra HTML records.</p>{''.join(groups)}</body></html>'''


def main() -> None:
    if shutil.which('pdftotext') is None:
        raise RuntimeError('pdftotext (Poppler) is required for Decoding Panji chapter extraction')
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    INVENTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Remove only the generated Panji subtree before rebuilding it deterministically.
    for child in OUT_ROOT.iterdir():
        if child.name in {'inventory.json', 'manifest.json'}:
            child.unlink(missing_ok=True)
        elif child.is_dir() or child.name == 'index.html':
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()

    all_records: list[dict] = []
    payloads: dict[str, str] = {}
    for volume in range(1, 7):
        pdf = SOURCE_DIR / SOURCES[volume]
        if not pdf.exists():
            raise RuntimeError(f'Missing source PDF: {pdf}')
        pages = run_pdftotext(pdf)
        rows = flatten(pages)
        starts = select_body_starts(rows, EXPECTED[volume])
        source_html = f'{SOURCE_REPO}/blob/main/{SOURCES[volume]}'
        source_pdf = f'{RAW_SOURCE}{SOURCES[volume]}'
        volume_records: list[dict] = []
        for idx, start in enumerate(starts):
            chapter = idx + 1
            next_start = starts[idx + 1] if idx + 1 < len(starts) else None
            end = semantic_end(rows, start, next_start, final=next_start is None)
            text = body_text(rows, start, end)
            if len(text) < 400:
                raise RuntimeError(f'Volume {volume} Chapter {chapter} extracted too little source text ({len(text)} chars)')
            title = extract_title(rows, start, chapter)
            start_page = rows[start]['page']
            end_page = rows[max(start, end - 1)]['page']
            route = f'research-articles/decoding-panji/volume-{volume}/chapter-{chapter:02d}'
            canonical = f'{BASE_URL}{route}/'
            record = {
                'stable_id': f'panji-v{volume}-ch{chapter:02d}',
                'volume': volume,
                'chapter': chapter,
                'title': title,
                'language': 'en',
                'route': route,
                'canonical': canonical,
                'source_file': SOURCES[volume],
                'source_book': f'Decoding the Panji of Mithila — Volume {ROMAN[volume]}',
                'source_volume': ROMAN[volume],
                'source_html': source_html,
                'source_pdf': source_pdf,
                'source_pages': f'{start_page}-{end_page}',
                'source_locator': f'PDF pp. {start_page}-{end_page}; formal Chapter {chapter}',
                'source_repository': 'videha-ejournal/videha-ejournal',
                'source_commit': '0000000000000000000000000000000000000000',
                'kind': 'chapter',
                'article_pdf': None,
                'body_sha256': hashlib.sha256(text.encode('utf-8')).hexdigest(),
            }
            volume_records.append(record)
            payloads[record['stable_id']] = text
        if len(volume_records) != EXPECTED[volume]:
            raise RuntimeError(f'Volume {volume}: expected {EXPECTED[volume]} chapters, got {len(volume_records)}')
        all_records.extend(volume_records)

    if len(all_records) != sum(EXPECTED.values()):
        raise RuntimeError(f'Expected {sum(EXPECTED.values())} total chapters, got {len(all_records)}')

    for pos, record in enumerate(all_records):
        same_volume = [r for r in all_records if r['volume'] == record['volume']]
        local_index = same_volume.index(record)
        previous = same_volume[local_index - 1] if local_index > 0 else None
        following = same_volume[local_index + 1] if local_index + 1 < len(same_volume) else None
        target = ROOT / 'public' / record['route'] / 'index.html'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(chapter_html(record, payloads[record['stable_id']], previous, following), 'utf-8')

    OUT_ROOT.joinpath('index.html').write_text(index_html(all_records), 'utf-8')
    serialized = json.dumps(all_records, ensure_ascii=False, indent=2) + '\n'
    INVENTORY_PATH.write_text(serialized, 'utf-8')
    PUBLIC_INVENTORY_PATH.write_text(serialized, 'utf-8')
    print('Decoding Panji chapter-only corpus generated:', {str(v): EXPECTED[v] for v in EXPECTED}, 'total=', len(all_records))


if __name__ == '__main__':
    main()
