#!/usr/bin/env python3
"""Compatibility entry point for the Decoding Panji chapter-only corpus builder.

The authoritative implementation is scripts/run-panji-article-corpus.py.
Keeping this filename as a thin launcher prevents older local workflows from
re-entering the retired section/appendix splitter.
"""
from pathlib import Path
import runpy

SCRIPT = Path(__file__).with_name('run-panji-article-corpus.py')
runpy.run_path(str(SCRIPT), run_name='__main__')
