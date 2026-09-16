#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / 'scripts' / 'build-panji-article-corpus.py'

spec = importlib.util.spec_from_file_location('mva_panji_corpus_base', BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f'Cannot load Decoding Panji corpus generator: {BASE_SCRIPT}')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


def strip_enumerator(value: str) -> str:
    text = base.normalize(value)
    return re.sub(r'^(?:(?:[ivxlcdm]+)|(?:\d+(?:\.\d+)*))\s+', '', text).strip()


def prefix_kind_strict(title: str) -> bool:
    normalized = base.normalize(title)
    core = strip_enumerator(title)
    if normalized in base.PREFIX_EXACT or core in base.PREFIX_EXACT:
        return True
    if base.is_part_heading(title):
        return True
    if re.match(r'^appendix\s+[a-z0-9]+$', core):
        return True
    if re.match(r'^annex(?:ure)?\s+[a-z0-9]+$', core):
        return True
    if core == 'research abstract':
        return True
    return False


def closing_kind_strict(title: str) -> bool:
    normalized = base.normalize(title)
    core = strip_enumerator(title)
    if normalized in base.CLOSING_EXACT or core in base.CLOSING_EXACT:
        return True
    if re.match(r'^(?:overall\s+)?conclusions?(?:\s+to\b|\s*[:.-]|\s*$)', core):
        return True
    if re.match(r'^(?:selected?\s+)?(?:references|bibliography)(?:\s+and\b|\s*$)', core):
        return True
    if re.match(r'^chapter\s+\d+\s+source notes$', core):
        return True
    return False


def locate_heading_strict(lines: list[dict], boundary: dict, start_at: int, excluded_pages: set[int]) -> tuple[int, int]:
    target = base.normalize(boundary['start_heading'])
    if not target:
        raise RuntimeError(f'Empty normalized heading: {boundary}')
    target_core = re.sub(r'^(?:chapter\s+\d+|[ivxlcdm]+|\d+(?:\.\d+)*)\s+', '', target).strip()
    short_target = len(target.split()) <= 3 or len(target) < 16
    best: tuple[float, int, int] | None = None

    for i in range(max(0, start_at), len(lines)):
        if lines[i]['page'] in excluded_pages:
            continue
        if base.toc_like(lines[i]['text']):
            continue

        for width in (1, 2, 3, 4):
            if i + width > len(lines):
                break
            block = lines[i:i + width]
            if any(row['page'] in excluded_pages for row in block):
                continue
            window_raw = ' '.join(row['text'] for row in block)
            if base.toc_like(window_raw):
                continue
            window = base.normalize(window_raw)
            if not window:
                continue

            if short_target:
                # Generic headings such as Abstract, Conclusion or Appendix must
                # match a compact heading line, never an incidental prose mention.
                if width == 1 and (
                    window == target
                    or (window.startswith(target + ' ') and len(window) <= len(target) + 24)
                    or (target_core and window == target_core)
                ):
                    return i, width
                continue

            if target in window or (len(window) >= 16 and window in target):
                return i, width
            if target_core and len(target_core) >= 16 and target_core in window:
                return i, width

            score = base.ordered_token_match(target, window)
            if len(target.split()) >= 5 and score >= 0.86:
                if best is None or score > best[0]:
                    best = (score, i, width)

        if best and i - best[1] > 500:
            break

    if best:
        return best[1], best[2]
    raise RuntimeError(f'Could not locate source heading in PDF after line {start_at}: {boundary["start_heading"]}')


base.prefix_kind = prefix_kind_strict
base.closing_kind = closing_kind_strict
base.locate_heading = locate_heading_strict
base.main()
