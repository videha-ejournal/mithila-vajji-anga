"""Generate source-grounded permanent-page data for Philosophy, Literature and Panji.

The English side is assembled only from source-controlled archive metadata.  The
Maithili side prefers supplied Maithili readings and otherwise uses the same
maintenance-time Google mobile translation strategy already used by the
Multiscript Reader.  Visitors therefore receive static Maithili HTML; no live
translation request is made from a reader's browser.
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
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
GENERATED = APP / "generated"
WORK = ROOT / "work"
UNITS_OUTPUT = GENERATED / "archive-units.json"
MAITHILI_OUTPUT = GENERATED / "archive-maithili.json"
CACHE = WORK / "archive-maithili-cache.json"
READER_MAITHILI = ROOT / "public" / "data" / "reader-maithili.json"

SOURCE_REPO = "https://github.com/videha-ejournal/videha-ejournal/blob/main"
PDF_FILES = {
    "parallel-philosophy-1": "GAJENDRA_THAKUR_PARALLEL_PHILOSOPHY.pdf",
    "parallel-philosophy-2": "Samanantar_Darshan_Volume_II_merge.pdf",
    "parallel-history": "VIDEHA_Parallel_History.pdf",
    "atmatattvaviveka": "GAJENDRA_THAKUR_SAMAGRA_Atmatattvaviveka.pdf",
    "bhamati": "GAJENDRA_THAKUR_SAMAGRA_Bhamati.pdf",
    "nyayakusumanjali": "GAJENDRA_THAKUR_SAMAGRA_NYAYAKUSUMANJALI.pdf",
    "tattvacintamani": "GAJENDRA_THAKUR_SAMAGRA_Tattvacintamani.pdf",
    "panji-1": "DECODING_PANJI_1.pdf",
    "panji-2": "DECODING_PANJI_2.pdf",
    "panji-3": "DECODING_PANJI_3.pdf",
    "panji-4": "DECODING_PANJI_4.pdf",
    "panji-5": "DECODING_PANJI_5.pdf",
    "panji-6": "DECODING_PANJI_6.pdf",
}

MOBILE_RESULT = re.compile(r'<div class="result-container">(.*?)</div>', re.S)
CHAPTER_RE = re.compile(r"^\s*Chapter\s+(\d+)\b\s*[:.\-–—]?\s*(.*)$", re.I)
VOLUME_RE = re.compile(
    r"^\s*(?:Tome\s+[IVXLCDM]+\s*[,.:\-–—]?\s*)?Volume\s+([0-9]+|[IVXLCDM]+)\b\s*[:.\-–—]?\s*(.*)$",
    re.I,
)
FRONT_MATTER = re.compile(
    r"^(?:preface|foreword|acknowledg|author.?s note|note on |abbreviations?|contents|bibliography|references|index|appendix|source note)",
    re.I,
)


def load(name: str) -> Any:
    return json.loads((APP / name).read_text(encoding="utf-8"))


def normalized(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def roman_to_int(value: str) -> int:
    if value.isdigit():
        return int(value)
    values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    previous = 0
    for letter in reversed(value.upper()):
        current = values.get(letter, 0)
        total += -current if current < previous else current
        previous = max(previous, current)
    return total


def trim_sections(sections: list[str], limit: int = 28) -> list[str]:
    seen: set[str] = set()
    cleaned: list[str] = []
    for section in sections:
        value = normalized(section)
        if not value or value.lower() in seen:
            continue
        seen.add(value.lower())
        cleaned.append(value)
        if len(cleaned) >= limit:
            break
    return cleaned


def structural_description(
    title: str,
    sections: list[str],
    work_title: str,
    group: str,
    source_contexts: list[str] | None = None,
) -> str:
    sections = trim_sections(sections, 16)
    focus = "; ".join(sections[:8])
    contexts = [normalized(item) for item in (source_contexts or []) if normalized(item)]
    if group == "panji":
        opening = (
            f'“{title}” is treated as a documentary chapter in {work_title}, part of the Mithila–Vajji–Anga '
            "research archive. The chapter is read as evidence about genealogy, kinship, settlement, social memory, "
            "recording practice and the historical institutions that made Panji a long-duration archive across India and Nepal."
        )
    elif group == "literature":
        opening = (
            f'“{title}” belongs to {work_title}. It is indexed here as a substantive unit in the parallel literary history '
            "of Mithila and Maithili, connecting language, script, genres, writers, institutions and critical method to the "
            "wider historical worlds of Mithila, Vajji and Anga rather than isolating literature from regional history."
        )
    else:
        opening = (
            f'“{title}” is a major textual unit in {work_title}. The page preserves its place in the philosophical '
            "traditions of Mithila and the wider Mithila–Vajji–Anga intellectual archive, while distinguishing the original "
            "classical authorship, later commentary and Gajendra Thakur’s Maithili/English translation or editorial work."
        )
    middle = (
        f"Its indexed structure follows {len(sections)} recorded subsection"
        f"{'s' if len(sections) != 1 else ''}."
    )
    if focus:
        middle += f" The principal recorded lines of inquiry include {focus}."
    evidence = " ".join(contexts[:3])
    if evidence:
        middle += f" Source-controlled research notes further identify: {evidence}"
    closing = (
        "This permanent page therefore exposes the source hierarchy, section index and PDF provenance together; it is not "
        "a catalogue stub or a generic topic page. Readers should use the description as an analytical guide and the linked "
        "PDF as the authoritative text for quotation, pagination and philological verification."
    )
    return "\n\n".join((opening, middle, closing))


def parse_explicit_chapters(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    units: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for item in items:
        title = normalized(str(item.get("title", "")))
        if not title:
            continue
        match = CHAPTER_RE.match(title)
        if match:
            if current:
                units.append(current)
            number = int(match.group(1))
            supplied_title = normalized(match.group(2))
            current = {
                "number": number,
                "title": supplied_title or f"Chapter {number}",
                "sections": [],
            }
            continue
        if current is None:
            continue
        if current["title"] == f"Chapter {current['number']}" and int(item.get("level", 9)) <= 2:
            current["title"] = title
        else:
            current["sections"].append(title)
    if current:
        units.append(current)
    return units


def parse_top_level_units(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    units: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for item in items:
        title = normalized(str(item.get("title", "")))
        level = int(item.get("level", 9))
        if not title:
            continue
        if level == 1:
            if current:
                units.append(current)
            current = {"number": len(units) + 1, "title": title, "sections": []}
        elif current:
            current["sections"].append(title)
    if current:
        units.append(current)
    meaningful = [unit for unit in units if not FRONT_MATTER.match(unit["title"])]
    return meaningful or units


def parse_literature_volumes(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    units: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    seen: set[int] = set()
    for item in items:
        title = normalized(str(item.get("title", "")))
        if not title:
            continue
        match = VOLUME_RE.match(title)
        if match:
            number = roman_to_int(match.group(1))
            if 1 <= number <= 100 and number not in seen:
                if current:
                    units.append(current)
                seen.add(number)
                tail = normalized(match.group(2))
                current = {
                    "number": number,
                    "title": tail or f"Parallel Literature · Volume {number}",
                    "sections": [],
                }
                continue
        if current:
            current["sections"].append(title)
    if current:
        units.append(current)
    return sorted(units, key=lambda item: item["number"])


def panji_contexts(learning_panji: list[dict[str, Any]], volume_number: int, sections: list[str]) -> list[str]:
    needles = {normalized(section).lower() for section in sections}
    result: list[str] = []
    for record in learning_panji:
        volume_text = str(record.get("volume", ""))
        digits = re.sub(r"\D", "", volume_text)
        if digits and int(digits) != volume_number:
            continue
        heading = normalized(str(record.get("heading", ""))).lower()
        if heading not in needles:
            continue
        for key in ("context", "canSupport"):
            value = normalized(str(record.get(key, "")))
            if value and value not in result:
                result.append(value)
    return result


def pdf_url(work_id: str) -> str:
    filename = PDF_FILES[work_id]
    return f"{SOURCE_REPO}/{urllib.parse.quote(filename)}"


def add_unit(
    output: list[dict[str, Any]],
    *,
    group: str,
    work_id: str,
    work_title: str,
    work_sequence: str,
    number: int,
    title: str,
    description: str,
    sections: list[str],
    source_note: str,
    source_language: str,
    authorship: str,
) -> None:
    unit_id = f"{number:03d}"
    output.append(
        {
            "key": f"{group}/{work_id}/{unit_id}",
            "group": group,
            "workId": work_id,
            "workTitle": work_title,
            "workSequence": work_sequence,
            "unitId": unit_id,
            "number": number,
            "title": normalized(title),
            "description": normalized(description.replace("\n\n", " ¶ ")).replace(" ¶ ", "\n\n"),
            "sections": trim_sections(sections),
            "sourceNote": source_note,
            "sourcePdf": pdf_url(work_id),
            "sourceLanguage": source_language,
            "authorship": authorship,
            "region": "Mithila · Vajji · Anga · India & Nepal",
        }
    )


def build_units() -> tuple[list[dict[str, Any]], dict[str, str]]:
    library = {item["id"]: item for item in load("library-data.json")}
    details = load("collection-details.json")
    deep = load("deep-data.json")
    volume_two = load("ideas-volume2.json")
    learning = load("learning-data.json")
    supplied_maithili = json.loads(READER_MAITHILI.read_text(encoding="utf-8")) if READER_MAITHILI.exists() else {}

    required_details = [
        *(f"panji-{number}" for number in range(1, 7)),
        "atmatattvaviveka",
        "bhamati",
        "nyayakusumanjali",
        "tattvacintamani",
    ]
    missing = [key for key in required_details if key not in details]
    if missing:
        raise RuntimeError(f"Missing source-controlled collection details: {', '.join(missing)}")

    units: list[dict[str, Any]] = []
    supplied: dict[str, str] = {}

    # Parallel Philosophy Volume I — supplied bilingual readings.
    for item in deep["philosophyChapters"]:
        number = int(item["number"])
        description_parts = [item["summary"]]
        for field, label in (("purvapaksha", "Pūrvapakṣa"), ("uttarapaksha", "Uttarapakṣa"), ("synthesis", "Parallel conclusion")):
            if item.get(field):
                description_parts.append(f"{label}: {item[field]}")
        add_unit(
            units,
            group="philosophy",
            work_id="parallel-philosophy-1",
            work_title="Parallel Philosophy — Volume I",
            work_sequence="Volume I",
            number=number,
            title=item["title"],
            description="\n\n".join(description_parts),
            sections=item.get("sections", []),
            source_note=item.get("source", f"Parallel Philosophy Volume I · Chapter {number}"),
            source_language="Maithili–English bilingual source",
            authorship="Gajendra Thakur · Videha",
        )
        reader_key = f"reader-v1-{item['id']}"
        if reader_key in supplied_maithili:
            supplied[f"philosophy/parallel-philosophy-1/{number:03d}"] = supplied_maithili[reader_key]

    # Parallel Philosophy Volume II — existing reader bundle contains supplied/generated Maithili.
    for item in volume_two:
        if item.get("status") == "Planned":
            continue
        number = int(item["number"])
        description_parts = [item["summary"]]
        for field, label in (("purvapaksha", "Pūrvapakṣa"), ("uttarapaksha", "Uttarapakṣa"), ("synthesis", "Parallel conclusion")):
            if item.get(field):
                description_parts.append(f"{label}: {item[field]}")
        add_unit(
            units,
            group="philosophy",
            work_id="parallel-philosophy-2",
            work_title="Parallel Philosophy — Volume II",
            work_sequence="Volume II",
            number=number,
            title=item["title"],
            description="\n\n".join(description_parts),
            sections=item.get("sections", []),
            source_note=item.get("source", f"Parallel Philosophy Volume II · Chapter {number}"),
            source_language="Maithili–English bilingual source",
            authorship="Gajendra Thakur · Videha",
        )
        if item["id"] in supplied_maithili:
            supplied[f"philosophy/parallel-philosophy-2/{number:03d}"] = supplied_maithili[item["id"]]

    classical_authorship = {
        "atmatattvaviveka": "Original Sanskrit: Udayanācārya · Sanskrit-to-Maithili translation: Gajendra Thakur",
        "bhamati": "Original commentary: Vācaspati Miśra · Sanskrit-to-Maithili translation: Gajendra Thakur",
        "nyayakusumanjali": "Original Sanskrit: Udayanācārya · Sanskrit-to-Maithili translation: Gajendra Thakur",
        "tattvacintamani": "Original Sanskrit: Gaṅgeśa Upādhyāya · Sanskrit-to-Maithili translation: Gajendra Thakur",
    }
    for work_id in ("atmatattvaviveka", "bhamati", "nyayakusumanjali", "tattvacintamani"):
        work = library[work_id]
        detail = details[work_id]
        parsed = parse_explicit_chapters(detail["items"]) or parse_top_level_units(detail["items"])
        for position, unit in enumerate(parsed, 1):
            number = int(unit.get("number") or position)
            description = structural_description(unit["title"], unit["sections"], work["title"], "philosophy")
            add_unit(
                units,
                group="philosophy",
                work_id=work_id,
                work_title=work["title"],
                work_sequence=work["sequence"],
                number=number,
                title=unit["title"],
                description=description,
                sections=unit["sections"],
                source_note=f"{detail['source']} · {detail['paragraphs']:,} source paragraphs · {detail['tables']} tables",
                source_language="Bilingual Maithili–English philosophical source; original Sanskrit authorship preserved",
                authorship=classical_authorship[work_id],
            )

    # Six Decoding Panji volumes — English originals with new static Maithili page readings.
    for volume_number in range(1, 7):
        work_id = f"panji-{volume_number}"
        work = library[work_id]
        detail = details[work_id]
        parsed = parse_explicit_chapters(detail["items"])
        if not parsed:
            parsed = parse_top_level_units(detail["items"])
        for position, unit in enumerate(parsed, 1):
            number = int(unit.get("number") or position)
            contexts = panji_contexts(learning.get("panji", []), volume_number, [unit["title"], *unit["sections"]])
            description = structural_description(unit["title"], unit["sections"], work["title"], "panji", contexts)
            add_unit(
                units,
                group="panji",
                work_id=work_id,
                work_title=work["title"],
                work_sequence=work["sequence"],
                number=number,
                title=unit["title"],
                description=description,
                sections=unit["sections"],
                source_note=f"{detail['source']} · {detail['paragraphs']:,} source paragraphs · {detail['tables']} tables",
                source_language="English source volume · Maithili research-page translation generated and stored statically",
                authorship="Gajendra Thakur · Videha",
            )

    # Parallel Literature.  Prefer the source-controlled manuscript map when present;
    # otherwise derive 100 stable volume records from the known cumulative series identity.
    literature_work = library["parallel-history"]
    literature_detail = details.get("parallel-history")
    literature_units: list[dict[str, Any]] = []
    literature_source_note = "A Parallel History of Mithilā & Maithilī Literature · Tomes I–IV · Volumes 1–100"
    if literature_detail:
        literature_units = parse_literature_volumes(literature_detail["items"])
        literature_source_note = (
            f"{literature_detail['source']} · {literature_detail['paragraphs']:,} source paragraphs · "
            f"{literature_detail['tables']} tables"
        )
    if len(literature_units) < 100:
        known = {int(unit["number"]): unit for unit in literature_units}
        literature_units = [
            known.get(number, {
                "number": number,
                "title": f"A Parallel History of Mithilā & Maithilī Literature — Volume {number}",
                "sections": literature_work["structure"],
            })
            for number in range(1, 101)
        ]
    for unit in literature_units[:100]:
        number = int(unit["number"])
        description = structural_description(unit["title"], unit.get("sections", []), literature_work["title"], "literature")
        add_unit(
            units,
            group="literature",
            work_id="parallel-history",
            work_title=literature_work["title"],
            work_sequence=f"Volume {number} of 100",
            number=number,
            title=unit["title"],
            description=description,
            sections=unit.get("sections", []),
            source_note=literature_source_note,
            source_language="English source series · Maithili research-page translation generated and stored statically",
            authorship="Gajendra Thakur · Videha · Series ISBN 978-93-5812-486-6",
        )

    units.sort(key=lambda item: (item["group"], item["workId"], item["number"]))
    return units, supplied


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


def google_mobile_translate(text: str) -> str:
    query = urllib.parse.urlencode({"sl": "en", "tl": "mai", "q": text})
    request = urllib.request.Request(
        f"https://translate.google.com/m?{query}",
        headers={"User-Agent": "Mozilla/5.0 (Videha bilingual archive maintenance)"},
    )
    for attempt in range(7):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                page = response.read().decode("utf-8")
            match = MOBILE_RESULT.search(page)
            if not match:
                raise RuntimeError("translation result was absent")
            result = html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()
            if not result:
                raise RuntimeError("translation result was empty")
            return result
        except Exception:
            if attempt == 6:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("translation failed")


def translation_payload(unit: dict[str, Any]) -> str:
    sections = "\n".join(f"• {section}" for section in unit["sections"])
    parts = [
        unit["title"],
        unit["description"],
        f"Source and authorship\n{unit['authorship']}\n{unit['sourceNote']}",
    ]
    if sections:
        parts.append(f"Indexed contents\n{sections}")
    return "\n\n".join(parts)


def translate_units(units: list[dict[str, Any]], supplied: dict[str, str]) -> dict[str, str]:
    WORK.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    payloads: dict[str, list[str]] = {}
    for unit in units:
        key = unit["key"]
        if key in supplied:
            continue
        payloads[key] = chunks(translation_payload(unit))
    missing = list(dict.fromkeys(part for parts in payloads.values() for part in parts if part not in cache))
    if missing:
        print(f"Translating {len(missing)} uncached archive passages into Maithili", flush=True)
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(google_mobile_translate, part): part for part in missing}
            for position, future in enumerate(as_completed(futures), 1):
                part = futures[future]
                cache[part] = future.result()
                if position % 10 == 0 or position == len(missing):
                    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
                    print(f"[archive translation {position}/{len(missing)}]", flush=True)
    output = dict(supplied)
    for unit in units:
        key = unit["key"]
        if key in output:
            continue
        output[key] = "\n\n".join(cache[part] for part in payloads[key])
    return output


def validate(units: list[dict[str, Any]], maithili: dict[str, str]) -> None:
    keys = [unit["key"] for unit in units]
    if len(keys) != len(set(keys)):
        raise RuntimeError("Duplicate bilingual archive unit keys")
    counts = {
        "parallel-philosophy-1": sum(unit["workId"] == "parallel-philosophy-1" for unit in units),
        "parallel-philosophy-2": sum(unit["workId"] == "parallel-philosophy-2" for unit in units),
        "parallel-history": sum(unit["workId"] == "parallel-history" for unit in units),
        "panji-volumes": len({unit["workId"] for unit in units if unit["group"] == "panji"}),
        "classical-philosophy": len({unit["workId"] for unit in units if unit["workId"] in {"atmatattvaviveka", "bhamati", "nyayakusumanjali", "tattvacintamani"}}),
    }
    if counts["parallel-philosophy-1"] != 72:
        raise RuntimeError(f"Parallel Philosophy I expected 72 units, got {counts['parallel-philosophy-1']}")
    if counts["parallel-philosophy-2"] != 100:
        raise RuntimeError(f"Parallel Philosophy II expected 100 units, got {counts['parallel-philosophy-2']}")
    if counts["parallel-history"] != 100:
        raise RuntimeError(f"Parallel Literature expected 100 volume units, got {counts['parallel-history']}")
    if counts["panji-volumes"] != 6:
        raise RuntimeError("All six Decoding Panji volumes must contribute permanent units")
    if counts["classical-philosophy"] != 4:
        raise RuntimeError("All four classical philosophy books must contribute permanent units")
    missing_maithili = [key for key in keys if not normalized(maithili.get(key, ""))]
    if missing_maithili:
        raise RuntimeError(f"Missing Maithili readings for {len(missing_maithili)} archive units")
    too_short = [unit["key"] for unit in units if len(normalized(unit["description"])) < 280]
    if too_short:
        raise RuntimeError(f"Detailed descriptions too short for {len(too_short)} units; refusing stub pages")
    print(f"Validated {len(units)} permanent archive units with complete Maithili counterparts: {counts}")


def main() -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    units, supplied = build_units()
    maithili = translate_units(units, supplied)
    validate(units, maithili)
    UNITS_OUTPUT.write_text(json.dumps(units, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MAITHILI_OUTPUT.write_text(json.dumps(maithili, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(units)} bilingual archive units to {UNITS_OUTPUT}")


if __name__ == "__main__":
    main()
