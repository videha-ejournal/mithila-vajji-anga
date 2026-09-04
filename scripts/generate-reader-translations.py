"""Build the Multiscript Reader's offline Maithili translation bundle.

Google's public web translator is used while maintaining the archive, rather
than from a visitor's browser.  GitHub Pages can then serve the translated
readings without depending on cross-origin requests or per-visitor rate limits.
"""

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
OUTPUT = ROOT / "app" / "reader-maithili.json"
CACHE = ROOT / "work" / "reader-maithili-cache.json"
MOBILE_RESULT = re.compile(r'<div class="result-container">(.*?)</div>', re.S)


def chunks(text: str, limit: int = 1500) -> list[str]:
    result: list[str] = []
    remaining = text.strip()
    while remaining:
        if len(remaining) <= limit:
            result.append(remaining)
            break
        candidates = [
            remaining.rfind("\n\n", 0, limit),
            remaining.rfind(". ", 0, limit),
            remaining.rfind(" ", 0, limit),
        ]
        cut = max(max(candidates), int(limit * 0.65))
        if remaining[cut : cut + 2] == ". ":
            cut += 1
        result.append(remaining[:cut].strip())
        remaining = remaining[cut:].strip()
    return result


def google_mobile_translate(text: str) -> str:
    query = urllib.parse.urlencode({"sl": "en", "tl": "mai", "q": text})
    request = urllib.request.Request(
        f"https://translate.google.com/m?{query}",
        headers={"User-Agent": "Mozilla/5.0 (Videha archive translation build)"},
    )
    for attempt in range(7):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                page = response.read().decode("utf-8")
            match = MOBILE_RESULT.search(page)
            if not match:
                raise RuntimeError("translation result was absent")
            return html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()
        except Exception:
            if attempt == 6:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("translation failed")


def reader_records() -> list[dict]:
    deep = json.loads((ROOT / "app" / "deep-data.json").read_text(encoding="utf-8"))
    volume_two = json.loads((ROOT / "app" / "ideas-volume2.json").read_text(encoding="utf-8"))
    records = []
    for item in deep["philosophyChapters"]:
        records.append((f"reader-v1-{item['id']}", item))
    for item in volume_two:
        if item["status"] == "Available in English":
            records.append((item["id"], item))
    return [{**item, "id": record_id} for record_id, item in records]


def reader_text(item: dict) -> str:
    parts = [item["title"], item["summary"]]
    for key, label in (
        ("purvapaksha", "Pūrvapakṣa"),
        ("uttarapaksha", "Uttarapakṣa"),
        ("synthesis", "Parallel conclusion"),
    ):
        if item.get(key):
            parts.append(f"{label}\n{item[key]}")
    if item.get("sections"):
        parts.append("Chapter structure\n" + "\n".join(item["sections"]))
    return "\n\n".join(parts)


def main() -> None:
    CACHE.parent.mkdir(exist_ok=True)
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    records = reader_records()
    record_chunks = {item["id"]: chunks(reader_text(item)) for item in records}
    missing = list(dict.fromkeys(
        part for parts in record_chunks.values() for part in parts if part not in cache
    ))
    if missing:
        print(f"Translating {len(missing)} uncached passages with Google Translate", flush=True)
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = {executor.submit(google_mobile_translate, part): part for part in missing}
            for position, future in enumerate(as_completed(futures), 1):
                part = futures[future]
                cache[part] = future.result()
                CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"[translation {position:03}/{len(missing)}]", flush=True)
    output: dict[str, str] = {}
    total_chunks = sum(len(parts) for parts in record_chunks.values())
    completed_chunks = 0
    for position, item in enumerate(records, 1):
        translated_parts = [cache[part] for part in record_chunks[item["id"]]]
        completed_chunks += len(translated_parts)
        output[item["id"]] = "\n\n".join(translated_parts)
        print(f"[{position:03}/{len(records)}] {item['id']} ({completed_chunks}/{total_chunks} chunks)", flush=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(output)} complete readings to {OUTPUT}")


if __name__ == "__main__":
    main()
