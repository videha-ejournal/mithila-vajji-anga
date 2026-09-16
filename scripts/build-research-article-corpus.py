#!/usr/bin/env python3
from __future__ import annotations

import concurrent.futures
import importlib.util
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / 'scripts' / 'build-research-article-corpus-base.py'

spec = importlib.util.spec_from_file_location('mva_research_corpus_base', BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f'Cannot load corpus generator base: {BASE_SCRIPT}')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


def _checked(command: list[str], *, timeout: int, env: dict[str, str] | None = None) -> subprocess.CompletedProcess:
    try:
        result = subprocess.run(
            command,
            text=True,
            capture_output=True,
            timeout=timeout,
            env=env,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f'Command timed out after {timeout}s: {" ".join(command)}') from exc
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or '')[-1000:]
        raise RuntimeError(f'Command failed ({result.returncode}): {" ".join(command)}\n{detail}')
    return result


def ocr_v1_maithili_streamed(pdf: Path, start_page: int, end_page: int, work: Path) -> dict[int, str]:
    """OCR Volume-I Maithili without materializing hundreds of PNGs at once.

    Each missing PDF page is rendered independently as a temporary 300-DPI
    grayscale PGM, OCR'd, then immediately deleted.  Successful page text is
    retained in the existing text checkpoint directory.  This preserves the
    source, resolution, Tesseract language model, OEM and PSM used by the
    original generator while bounding disk use and preventing one external
    process from hanging the Pages build indefinitely.
    """
    work.mkdir(parents=True, exist_ok=True)
    image_dir = work / 'images'
    text_dir = work / 'text'
    image_dir.mkdir(exist_ok=True)
    text_dir.mkdir(exist_ok=True)

    expected = list(range(start_page, end_page + 1))
    existing = {p: text_dir / f'page-{p:04d}.txt' for p in expected}
    missing = [p for p, path in existing.items() if not path.exists() or path.stat().st_size == 0]

    # Remove only stale image scratch data. Text checkpoints are deliberately kept.
    for old in image_dir.iterdir():
        if old.is_dir():
            shutil.rmtree(old, ignore_errors=True)
        else:
            old.unlink(missing_ok=True)

    if missing:
        workers = max(2, min(4, os.cpu_count() or 2))
        print(f'Volume-I Maithili OCR: {len(missing)} pages pending; {workers} bounded workers at 300 DPI.', flush=True)

        def one(pno: int) -> int:
            target = text_dir / f'page-{pno:04d}.txt'
            if target.exists() and target.stat().st_size > 0:
                return pno

            scratch = image_dir / f'page-{pno:04d}'
            scratch.mkdir(parents=True, exist_ok=True)
            prefix = scratch / 'page'
            image = scratch / 'page.pgm'
            outbase = text_dir / f'page-{pno:04d}'
            try:
                _checked(
                    [
                        'pdftoppm', '-f', str(pno), '-l', str(pno), '-singlefile',
                        '-r', '300', '-gray', str(pdf), str(prefix),
                    ],
                    timeout=300,
                )
                if not image.exists() or image.stat().st_size == 0:
                    raise RuntimeError(f'PDF page {pno} did not render to {image}')

                tess_env = os.environ.copy()
                # One Tesseract thread per worker avoids OpenMP oversubscription.
                tess_env.setdefault('OMP_THREAD_LIMIT', '1')
                _checked(
                    [
                        'tesseract', str(image), str(outbase), '-l', 'Devanagari+eng',
                        '--oem', '1', '--psm', '6',
                    ],
                    timeout=300,
                    env=tess_env,
                )
                if not target.exists() or target.stat().st_size == 0:
                    raise RuntimeError(f'Tesseract produced no text for PDF page {pno}')
                return pno
            finally:
                shutil.rmtree(scratch, ignore_errors=True)

        completed = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(one, pno): pno for pno in missing}
            for future in concurrent.futures.as_completed(futures):
                pno = futures[future]
                try:
                    future.result()
                except Exception as exc:
                    raise RuntimeError(f'Volume-I Maithili OCR failed at PDF page {pno}: {exc}') from exc
                completed += 1
                if completed % 25 == 0 or completed == len(missing):
                    print(f'Volume-I Maithili OCR progress: {completed}/{len(missing)} pages.', flush=True)

    absent = [p for p, path in existing.items() if not path.exists() or path.stat().st_size == 0]
    if absent:
        raise RuntimeError(f'Volume-I Maithili OCR incomplete; missing pages: {absent[:20]} (total {len(absent)})')

    shutil.rmtree(image_dir, ignore_errors=True)
    return {p: existing[p].read_text('utf-8', errors='replace') for p in expected}


base.ocr_v1_maithili = ocr_v1_maithili_streamed
base.main()
