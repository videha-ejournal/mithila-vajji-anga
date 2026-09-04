from __future__ import annotations

import json
import random
import re
import unicodedata
from pathlib import Path

from docx import Document
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
GAZETTEER = ROOT.parent / "gazetteer"
HISTORY_PDF = Path(
    r"C:\Users\DELL\Desktop\01_DONE_FINAL\FINAL\History_of_Mithila_Vajji_Anga\KDP PAPERBACK\HISTORY_MITHILA_ANGA_VAJJI_KDP_PAGE636_FINAL_SAFE.pdf"
)
HISTORY_DOCX = [
    Path(r"C:\Users\DELL\Desktop\01_DONE_FINAL\FINAL\History_of_Mithila_Vajji_Anga\00_Volume_2\Part 5\History_Mithila_Vajji_Anga_Volume_II_Cumulative_Part_36_onward_Chapter43_6x9_Hardback.docx"),
    Path(r"C:\Users\DELL\Desktop\01_DONE_FINAL\FINAL\History_of_Mithila_Vajji_Anga\00_Volume_2\Part 6\History_Mithila_Vajji_Anga_Volume_II_Cumulative_Part_44_onward_Chapter51_6x9_Hardback.docx"),
]


def read_json(name: str):
    return json.loads((APP / name).read_text(encoding="utf-8"))


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def ascii_key(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.casefold())
    folded = "".join(char for char in folded if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", folded).strip()


def short(text: str, limit: int = 260) -> str:
    text = clean(text)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0] + "…"


def load_source_chunks():
    chunks = []
    reader = PdfReader(str(HISTORY_PDF))
    for page_number, page in enumerate(reader.pages, start=1):
        text = clean(page.extract_text() or "")
        if text:
            chunks.append(
                {
                    "text": text,
                    "key": ascii_key(text),
                    "source": "A History of Mithila, Vajji & Anga, Volume I",
                    "locator": f"PDF page {page_number}",
                }
            )
    for path in HISTORY_DOCX:
        document = Document(path)
        for paragraph_number, paragraph in enumerate(document.paragraphs, start=1):
            text = clean(paragraph.text)
            if len(text) >= 40:
                chunks.append(
                    {
                        "text": text,
                        "key": ascii_key(text),
                        "source": "A History of Mithila, Vajji & Anga, Volume II",
                        "locator": f"{path.stem} · paragraph {paragraph_number}",
                    }
                )
    return chunks


def build_ngrams(chunks):
    grams = set()
    for chunk in chunks:
        words = chunk["key"].split()
        for size in range(1, 5):
            grams.update(" ".join(words[index : index + size]) for index in range(len(words) - size + 1))
    return grams


def load_admin_names():
    names = {}
    for line in (GAZETTEER / "admin1CodesASCII.txt").read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            names[parts[0]] = parts[1]
    return names


def load_places(chunks):
    ngrams = build_ngrams(chunks)
    admin_names = load_admin_names()
    candidates = []
    for country in ("IN", "NP"):
        path = GAZETTEER / country / f"{country}.txt"
        with path.open(encoding="utf-8") as handle:
            for line in handle:
                parts = line.rstrip("\n").split("\t")
                if len(parts) < 19:
                    continue
                lat, lon = float(parts[4]), float(parts[5])
                if not (21.0 <= lat <= 30.8 and 81.0 <= lon <= 91.5):
                    continue
                if parts[6] not in {"P", "A", "H", "L", "S", "T"}:
                    continue
                aliases = [parts[1], parts[2], *parts[3].split(",")]
                keys = []
                for alias in aliases:
                    key = ascii_key(alias)
                    if len(key) >= 4 and len(key.split()) <= 4:
                        keys.append((alias, key))
                matched = next(((alias, key) for alias, key in keys if key in ngrams), None)
                population = int(parts[14] or 0)
                if not matched and population < 8000:
                    continue
                source_chunk = None
                if matched:
                    alias, key = matched
                    source_chunk = next((chunk for chunk in chunks if re.search(rf"\b{re.escape(key)}\b", chunk["key"])), None)
                candidates.append(
                    {
                        "geonameId": parts[0],
                        "name": parts[1],
                        "asciiName": parts[2],
                        "latitude": lat,
                        "longitude": lon,
                        "countryCode": country,
                        "admin": admin_names.get(f"{country}.{parts[10]}", parts[10]),
                        "featureCode": parts[7],
                        "population": population,
                        "bookMention": bool(source_chunk),
                        "context": short(source_chunk["text"], 300) if source_chunk else "Modern orientation point in the GeoNames gazetteer; no historical claim is inferred from its inclusion.",
                        "source": f"{source_chunk['source']} · {source_chunk['locator']}" if source_chunk else "GeoNames geographical database · modern orientation record",
                    }
                )
    # Collapse duplicate names to the strongest gazetteer record, preferring a manuscript mention.
    unique = {}
    for item in candidates:
        key = ascii_key(item["name"])
        score = (1 if item["bookMention"] else 0, item["population"])
        if key not in unique or score > unique[key][0]:
            unique[key] = (score, item)
    places = [item for _, item in unique.values()]
    important = {
        "janakpur", "darbhanga", "vaishali", "patna", "bhagalpur", "gaya", "rajgir",
        "sitamarhi", "madhubani", "muzaffarpur", "samastipur", "purnia", "munger",
        "biratnagar", "lumbini", "kathmandu", "simraungadh", "motihari", "hajipur",
    }
    places.sort(
        key=lambda item: (
            ascii_key(item["name"]) in important,
            item["bookMention"],
            item["population"],
        ),
        reverse=True,
    )
    selected = places[:120]
    for index, item in enumerate(selected, start=1):
        item["id"] = f"place-{index}"
        item["frame"] = (
            "Named in the history corpus; coordinates are modern orientation data."
            if item["bookMention"]
            else "Regional gazetteer orientation; inclusion does not assert ancient identity."
        )
    return selected


DATE_PATTERN = re.compile(
    r"\b(?:c\.?\s*)?(?P<start>\d{1,4})(?:\s*[–—-]\s*(?P<end>\d{1,4}))?\s*(?P<era>BCE|BC|CE|AD)\b|\b(?P<year>1[0-9]{3}|20[0-2][0-9])\b",
    re.IGNORECASE,
)
HISTORICAL_TERMS = re.compile(
    r"\b(king|kingdom|dynast|rul|reign|empire|period|centur|inscription|excavat|archae|"
    r"founded|establish|built|temple|monast|stupa|council|invasion|movement|language|"
    r"literat|publish|born|died|court|trade|migration|settlement|capital|war|treaty|"
    r"colonial|independence|university|journal|manuscript|print|translation)\w*\b",
    re.IGNORECASE,
)


def date_value(match):
    if match.group("year"):
        return int(match.group("year")), match.group(0)
    year = int(match.group("start"))
    era = match.group("era").upper()
    return (-year if era in {"BCE", "BC"} else year), match.group(0)


def load_chronology(chunks):
    records = []
    seen = set()
    for chunk in chunks:
        sentences = re.split(r"(?<=[.!?])\s+", chunk["text"])
        for sentence in sentences:
            sentence = clean(sentence)
            if not (55 <= len(sentence) <= 620) or not HISTORICAL_TERMS.search(sentence):
                continue
            if re.search(r"\b(ISBN|doi|https?://|accessed)\b", sentence, re.IGNORECASE):
                continue
            match = DATE_PATTERN.search(sentence)
            if not match:
                continue
            value, display = date_value(match)
            if value > 2026 or value == 0:
                continue
            signature = (value, ascii_key(sentence)[:160])
            if signature in seen:
                continue
            seen.add(signature)
            records.append(
                {
                    "id": f"chronology-{len(records) + 1}",
                    "date": value,
                    "displayDate": display,
                    "label": short(sentence, 245),
                    "source": f"{chunk['source']} · {chunk['locator']}",
                }
            )
    records.sort(key=lambda item: (item["date"], item["label"]))
    # Evenly sample the whole historical range while retaining deterministic order.
    if len(records) > 160:
        step = (len(records) - 1) / 159
        records = [records[round(index * step)] for index in range(160)]
    for index, item in enumerate(records, start=1):
        item["id"] = f"chronology-{index}"
    return records


def rotated_options(answer, pool, index, count=4):
    other = [value for value in pool if value != answer]
    choices = [answer] + [other[(index * 7 + offset * 13) % len(other)] for offset in range(count - 1)]
    return choices[index % count :] + choices[: index % count]


def build_identity(people):
    names = [person["name"] for person in people]
    result = []
    for index, person in enumerate(people):
        result.append(
            {
                "id": person["id"],
                "name": person["name"],
                "clues": [
                    f"My indexed field is {person['field']}.",
                    f"My indexed era is {person['era']}.",
                    short(person["description"], 260),
                ],
                "choices": rotated_options(person["name"], names, index),
                "source": person["source"],
            }
        )
    return result


def build_panji(collections):
    result = []
    for volume_number in range(1, 7):
        key = f"panji-{volume_number}"
        collection = collections[key]
        parent = ""
        selected = []
        for item in collection["items"]:
            title = clean(item["title"])
            if item["level"] == 1 and not re.fullmatch(r"Chapter\s+\d+", title, re.IGNORECASE):
                parent = title
            if len(title) < 12 or re.fullmatch(r"(opening|conclusion|source notes?|chapter\s+\d+)", title, re.IGNORECASE):
                continue
            selected.append((item, parent))
        # Thirty actual headings per volume, spread through the document.
        step = max(1, len(selected) // 30)
        chosen = selected[::step][:30]
        for item, parent in chosen:
            result.append(
                {
                    "id": f"panji-{len(result) + 1}",
                    "heading": item["title"],
                    "level": item["level"],
                    "context": parent or f"Decoding the Panji of Mithila, Volume {volume_number}",
                    "volume": f"Volume {volume_number}",
                    "source": collection["source"],
                    "canSupport": "The presence and hierarchy of this heading in the indexed manuscript structure.",
                    "cannotProve": "The truth of every historical or genealogical proposition discussed under the heading; the underlying passage and cited evidence must be read.",
                }
            )
    return result


def build_comparators(chapters):
    result = []
    for chapter in chapters:
        result.append(
            {
                "id": f"concept-{len(result) + 1}",
                "name": f"Ch. {chapter['number']}: {chapter['title']}",
                "question": chapter["title"],
                "method": chapter["summary"],
                "purvapaksha": chapter["purvapaksha"],
                "uttarapaksha": chapter["uttarapaksha"],
                "synthesis": chapter["synthesis"],
                "source": f"Gajendra Thakur's Parallel Philosophy · {chapter['part']} · Chapter {chapter['number']}",
            }
        )
    for chapter in chapters:
        for section in chapter["sections"]:
            result.append(
                {
                    "id": f"concept-{len(result) + 1}",
                    "name": section,
                    "question": f"How does “{section}” develop the chapter's inquiry?",
                    "method": chapter["summary"],
                    "purvapaksha": chapter["purvapaksha"],
                    "uttarapaksha": chapter["uttarapaksha"],
                    "synthesis": chapter["synthesis"],
                    "source": f"Gajendra Thakur's Parallel Philosophy · {chapter['part']} · Chapter {chapter['number']} · indexed section",
                }
            )
            if len(result) >= 144:
                return result
    return result


ARCH_KEYWORDS = re.compile(
    r"archae|architect|temple|stupa|monast|fort|palace|settle|urban|house|brick|road|"
    r"route|river|water|tank|pond|craft|sculpt|art|material|site|landscape|gate|wall|"
    r"city|town|village|monument|pillar|cave|terracotta|pottery|ceramic",
    re.IGNORECASE,
)


def diagram_family(text):
    key = ascii_key(text)
    if any(word in key for word in ("river", "water", "pond", "tank")):
        return "water"
    if any(word in key for word in ("route", "road", "trade", "corridor")):
        return "route"
    if any(word in key for word in ("temple", "stupa", "monast", "shrine")):
        return "sacred"
    if any(word in key for word in ("fort", "wall", "gate", "palace")):
        return "fort"
    return "settlement"


def build_architecture(research):
    result = []
    for collection in (research["political"], research["social"]):
        for chapter in collection:
            for section in chapter["sections"]:
                if not ARCH_KEYWORDS.search(section):
                    continue
                result.append(
                    {
                        "id": f"architecture-{len(result) + 1}",
                        "name": section,
                        "period": chapter["part"],
                        "family": diagram_family(section),
                        "parts": [
                            f"Indexed topic: {section}",
                            f"Parent chapter: {chapter['title']}",
                            f"Volume context: {chapter['volume']}",
                            f"Editorial status: {chapter['status']}",
                        ],
                        "caution": "This diagram is an interpretive navigation aid keyed to a source heading, not a reconstruction of a particular excavated structure.",
                        "source": f"{chapter['collection']} · {chapter['volume']} · {chapter['part']} · Chapter {chapter['number']} · {chapter['pages']}",
                    }
                )
                if len(result) >= 120:
                    return result
    return result


def archive_records(research, library, people, philosophy):
    records = []
    for collection_name in ("political", "social"):
        for chapter in research[collection_name]:
            records.append(
                {
                    "id": chapter["id"],
                    "kind": "History chapter",
                    "title": chapter["title"],
                    "text": short(chapter["summary"], 300),
                    "source": f"{chapter['collection']} · {chapter['volume']} · {chapter['part']} · {chapter['pages']}",
                }
            )
    for work in library:
        records.append({"id": work["id"], "kind": "Book", "title": work["title"], "text": short(work["description"], 300), "source": f"{work['creator']} · {work['sequence']} · {work['extent']}"})
    for person in people:
        records.append({"id": person["id"], "kind": "Biographical index", "title": person["name"], "text": short(person["description"], 300), "source": person["source"]})
    for chapter in philosophy:
        records.append({"id": chapter["id"], "kind": "Philosophical argument", "title": chapter["title"], "text": short(chapter["summary"], 300), "source": f"Parallel Philosophy · {chapter['part']} · Chapter {chapter['number']}"})
    return records


def build_questions(records):
    kinds = sorted({record["kind"] for record in records})
    result = []
    for index, record in enumerate(records[:180]):
        result.append(
            {
                "id": f"question-{index + 1}",
                "claim": record["text"],
                "answer": record["kind"],
                "options": rotated_options(record["kind"], kinds, index),
                "why": f"This excerpt is indexed as “{record['title']}” in {record['source']}.",
                "source": record["source"],
            }
        )
    return result


def main():
    research = read_json("research-data.json")
    library = read_json("library-data.json")
    deep = read_json("deep-data.json")
    collections = read_json("collection-details.json")
    chunks = load_source_chunks()
    records = archive_records(research, library, deep["people"], deep["philosophyChapters"])
    questions = build_questions(records)
    data = {
        "provenance": {
            "history": "A History of Mithila, Vajji & Anga, Volumes I–II (attached author manuscripts)",
            "panji": "Decoding the Panji of Mithila, Volumes I–VI (indexed author manuscripts)",
            "philosophy": "Gajendra Thakur's Parallel Philosophy (indexed author manuscript)",
            "people": "A Parallel History of Mithila & Maithili Literature catalog",
            "coordinates": "GeoNames geographical database, CC BY 4.0; modern orientation only",
        },
        "places": load_places(chunks),
        "chronology": load_chronology(chunks),
        "identities": build_identity(deep["people"]),
        "panji": build_panji(collections),
        "comparators": build_comparators(deep["philosophyChapters"]),
        "architecture": build_architecture(research),
        "detective": questions,
        "daily": questions[:120],
        "classification": questions[30:150],
        "debates": [
            {
                "id": chapter["id"],
                "topic": chapter["title"],
                "objection": chapter["purvapaksha"],
                "proof": chapter["summary"],
                "response": chapter["uttarapaksha"],
                "synthesis": chapter["synthesis"],
                "source": f"Gajendra Thakur's Parallel Philosophy · {chapter['part']} · Chapter {chapter['number']}",
            }
            for chapter in deep["philosophyChapters"]
        ],
    }
    (APP / "learning-data.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: len(value) for key, value in data.items() if isinstance(value, list)}, indent=2))


if __name__ == "__main__":
    random.seed(7)
    main()
