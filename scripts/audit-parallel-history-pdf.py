#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

DEV_DIGITS = str.maketrans('०१२३४५६७८९', '0123456789')
CHAPTER_PATTERNS = [
    re.compile(r'^\s*(?:Chapter|CHAPTER)\s*[-–—:. ]*([0-9]{1,3})\b\s*[:.\-–—]?\s*(.*)$'),
    re.compile(r'^\s*अध्याय\s*[-–—:. ]*([०-९0-9]{1,3})\b\s*[:.\-–—]?\s*(.*)$'),
]


def clean(value: str) -> str:
    value = unicodedata.normalize('NFKC', value or '')
    value = value.replace('\u00ad', '')
    value = value.replace('–', '-').replace('—', '-')
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def norm(value: str) -> str:
    value = clean(value).casefold()
    value = re.sub(r'[^0-9a-z\u0900-\u097f]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def parse_number(value: str) -> int:
    return int(value.translate(DEV_DIGITS))


def heading_candidates(pages: list[str]) -> list[dict]:
    out: list[dict] = []
    for page_no, page in enumerate(pages, 1):
        for line_no, line in enumerate(page.splitlines(), 1):
            for pattern in CHAPTER_PATTERNS:
                match = pattern.match(line)
                if not match:
                    continue
                out.append({
                    'number': parse_number(match.group(1)),
                    'page': page_no,
                    'line': line_no,
                    'raw': clean(line),
                    'inlineTitle': clean(match.group(2)),
                })
                break
    return out


def title_hits(title: str, pages: list[str]) -> list[int]:
    needle = norm(title)
    if not needle:
        return []
    hits = []
    for page_no, page in enumerate(pages, 1):
        page_norm = norm(page)
        if needle in page_norm:
            hits.append(page_no)
    return hits


def nearby_title_match(title: str, page: str, max_lines: int = 8) -> bool:
    target = norm(title)
    if not target:
        return False
    lines = [clean(line) for line in page.splitlines() if clean(line)]
    for start in range(len(lines)):
        combined = ''
        for end in range(start, min(len(lines), start + max_lines)):
            combined = clean(f'{combined} {lines[end]}')
            candidate = norm(combined)
            if target in candidate or candidate in target:
                if min(len(target), len(candidate)) >= max(12, int(len(target) * 0.70)):
                    return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description='Audit Parallel History chapter/title boundaries against extracted PDF text.')
    parser.add_argument('--inventory', default='app/literature-inventory.json')
    parser.add_argument('--text', required=True, help='pdftotext -layout output; form-feed page boundaries must be preserved')
    parser.add_argument('--pdfinfo', default=None)
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--git-blob-sha', required=True)
    parser.add_argument('--source-sha256', default=None)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    inventory_path = Path(args.inventory)
    text_path = Path(args.text)
    if not inventory_path.exists() or not text_path.exists():
        raise SystemExit('Required inventory or extracted PDF text is missing.')

    inventory = json.loads(inventory_path.read_text('utf-8'))
    if not isinstance(inventory, list) or len(inventory) != 100:
        raise SystemExit(f'Expected exactly 100 literature inventory units, found {len(inventory) if isinstance(inventory, list) else "non-list"}.')
    numbers = [int(item.get('number', -1)) for item in inventory]
    if numbers != list(range(1, 101)):
        raise SystemExit('Literature inventory is not contiguous 1–100; refusing source audit.')

    raw_text = text_path.read_text('utf-8', errors='replace')
    pages = raw_text.split('\f')
    while pages and not pages[-1].strip():
        pages.pop()
    if not pages:
        raise SystemExit('Extracted PDF has no text pages.')

    candidates = heading_candidates(pages)
    by_number: dict[int, list[dict]] = {}
    for candidate in candidates:
        by_number.setdefault(candidate['number'], []).append(candidate)

    units = []
    for item in inventory:
        number = int(item['number'])
        title = clean(item.get('title', ''))
        markers = by_number.get(number, [])
        exact_hits = title_hits(title, pages)
        marker_title_pages = []
        for marker in markers:
            page_no = marker['page']
            if nearby_title_match(title, pages[page_no - 1]):
                marker_title_pages.append(page_no)
            elif marker['inlineTitle'] and (
                norm(title) in norm(marker['inlineTitle']) or norm(marker['inlineTitle']) in norm(title)
            ):
                marker_title_pages.append(page_no)

        body_candidates = sorted(set(marker_title_pages or exact_hits))
        units.append({
            'number': number,
            'tome': item.get('tome'),
            'expectedTitle': title,
            'chapterMarkerHits': markers,
            'exactTitlePageHits': exact_hits,
            'markerAndTitlePageHits': sorted(set(marker_title_pages)),
            'candidateBoundaryPages': body_candidates,
            'status': (
                'marker-and-title-confirmed' if marker_title_pages
                else 'title-only-confirmed' if exact_hits
                else 'unresolved'
            ),
            'verificationSources': item.get('verificationSources', []),
            'inventorySourceNote': item.get('sourceNote'),
        })

    marker_title_confirmed = sum(unit['status'] == 'marker-and-title-confirmed' for unit in units)
    title_only = sum(unit['status'] == 'title-only-confirmed' for unit in units)
    unresolved = sum(unit['status'] == 'unresolved' for unit in units)
    unique_boundary = sum(len(unit['candidateBoundaryPages']) == 1 for unit in units)
    duplicate_markers = {
        str(number): hits for number, hits in sorted(by_number.items())
        if 1 <= number <= 100 and len(hits) > 1
    }
    out_of_range_markers = [hit for hit in candidates if hit['number'] < 1 or hit['number'] > 100]

    report = {
        'schemaVersion': 1,
        'source': {
            'filename': 'VIDEHA_Parallel_History.pdf',
            'sourceRepository': 'videha-ejournal/videha-ejournal',
            'sourceCommit': args.source_commit,
            'gitBlobSha': args.git_blob_sha,
            'sourceSha256': args.source_sha256,
            'pdfPages': len(pages),
            'pdfInfo': Path(args.pdfinfo).read_text('utf-8', errors='replace') if args.pdfinfo and Path(args.pdfinfo).exists() else None,
        },
        'expectedUnitCount': 100,
        'summary': {
            'chapterMarkerCandidateCount': len(candidates),
            'markerAndTitleConfirmedUnits': marker_title_confirmed,
            'titleOnlyConfirmedUnits': title_only,
            'unresolvedUnits': unresolved,
            'unitsWithSingleCandidateBoundaryPage': unique_boundary,
            'duplicateChapterMarkerNumbers': sorted(int(key) for key in duplicate_markers),
            'outOfRangeMarkerCount': len(out_of_range_markers),
        },
        'publicationGate': {
            'articlePublicationApproved': False,
            'reason': 'Diagnostic only. Article publication remains blocked until each intended unit has one source-verified body boundary and the extracted full-text range is reviewed for overlap/omission.',
        },
        'duplicateMarkers': duplicate_markers,
        'outOfRangeMarkers': out_of_range_markers,
        'units': units,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', 'utf-8')

    print(
        'Parallel History PDF audit: '
        f'{len(pages)} pages; {marker_title_confirmed} marker+title; '
        f'{title_only} title-only; {unresolved} unresolved; '
        f'{unique_boundary} single-page boundary candidates.'
    )
    print('Publication gate remains CLOSED by design.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
