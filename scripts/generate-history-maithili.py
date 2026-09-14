"""Generate the static Maithili companion bundle for all 178 history chapters."""

from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "app" / "research-data.json"
OUTPUT = ROOT / "app" / "generated" / "history-maithili.json"
CACHE = ROOT / "work" / "history-maithili-cache.json"
MOBILE_RESULT = re.compile(r'<div class="result-container">(.*?)</div>', re.S)


def chunks(text: str, limit: int = 1800) -> list[str]:
    result: list[str] = []
    remaining = text.strip()
    while remaining:
        if len(remaining) <= limit:
            result.append(remaining)
            break
        candidates = [remaining.rfind("\n\n", 0, limit), remaining.rfind(". ", 0, limit), remaining.rfind(" ", 0, limit)]
        cut = max(max(candidates), int(limit * 0.65))
        if remaining[cut : cut + 2] == ". ":
            cut += 1
        result.append(remaining[:cut].strip())
        remaining = remaining[cut:].strip()
    return result


def translate(text: str) -> str:
    query = urllib.parse.urlencode({"sl": "en", "tl": "mai", "q": text})
    request = urllib.request.Request(
        f"https://translate.google.com/m?{query}",
        headers={"User-Agent": "Mozilla/5.0 (Videha history translation maintenance)"},
    )
    for attempt in range(7):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                page = response.read().decode("utf-8")
            match = MOBILE_RESULT.search(page)
            if not match:
                raise RuntimeError("translation result was absent")
            value = html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()
            if not value:
                raise RuntimeError("translation result was empty")
            return value
        except Exception:
            if attempt == 6:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("translation failed")


def payload(chapter: dict) -> str:
    sections = "\n".join(f"• {section}" for section in chapter.get("sections", []))
    return "\n\n".join(
        part
        for part in [
            chapter["title"],
            chapter["summary"],
            f"Part and source\n{chapter['part']}\n{chapter['pages']}",
            f"Indexed chapter contents\n{sections}" if sections else "",
        ]
        if part
    )


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    chapters = [*data["political"], *data["social"]]
    if len(chapters) != 178:
        raise RuntimeError(f"Expected 178 history chapters, got {len(chapters)}")
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    chapter_chunks = {chapter["id"]: chunks(payload(chapter)) for chapter in chapters}
    missing = list(dict.fromkeys(part for parts in chapter_chunks.values() for part in parts if part not in cache))
    if missing:
        print(f"Translating {len(missing)} uncached history passages into Maithili", flush=True)
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(translate, part): part for part in missing}
            for position, future in enumerate(as_completed(futures), 1):
                part = futures[future]
                cache[part] = future.result()
                if position % 10 == 0 or position == len(missing):
                    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
                    print(f"[history translation {position}/{len(missing)}]", flush=True)
    output = {
        chapter_id: "\n\n".join(cache[part] for part in parts)
        for chapter_id, parts in chapter_chunks.items()
    }
    if len(output) != 178 or any(len(value.strip()) < 280 for value in output.values()):
        raise RuntimeError("Maithili history bundle is incomplete or contains stub readings")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(output)} Maithili history readings to {OUTPUT}")


if __name__ == "__main__":
    main()
