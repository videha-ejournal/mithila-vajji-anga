# Videha Digital Research Archive

## Digital Humanities Research Environment for Mithila, Vajji & Anga

### Local development

Run `npm run dev`. Startup exports the ISBN registry, performs the existing strict Panji source audit, prepares the lightweight search index, and applies the homepage performance optimization. Both Windows CRLF and LF source files are supported.

The homepage needs the complete 247-record Panji article inventory. If the local inventory is missing or invalid, development downloads the published source-pinned inventory and validates its six volume counts and unique records before saving it. A valid local inventory works offline; chapter links continue to use their existing canonical URLs. This does not regenerate or edit scholarly text. The full `npm run build` publication pipeline still regenerates its PDF-derived corpus and requires its existing Poppler, Python and Tesseract dependencies.

The **Videha Digital Research Archive** is a responsive, accessible, source-controlled digital humanities research environment for the connected histories, genealogy, literature, philosophy, places, texts and chronology of Mithila, Vajji and Anga across India and Nepal. It is part of the Videha research ecosystem and links to [videha.co.in](https://www.videha.co.in/).

This repository is intentionally positioned as **more than a website associated with the books**. Its records are designed to be **permanent, citable, machine-readable, versioned and independently discoverable**.

## Research architecture

- `app/page.tsx` — the interactive research environment: four research doors, archive search, chronology, curated places, histories, library, people, ideas, accessibility controls, and guided research rooms.
- `app/about/page.tsx` — the archive identity, scope, scholarly infrastructure and preferred public description.
- `app/research-data.json` — the completed 178-chapter historical programme: 28 chapters in Volume I and 150 chapters in Volume II.
- `app/deep-data.json` and `app/ideas-volume2.json` — the completed 172-idea Parallel Philosophy programme.
- `app/reader-maithili-source.json` — source-controlled supplied Maithili readings for all 172 philosophy chapters.
- `public/data/reader-maithili.json` — on-demand Multiscript Reader bundle, kept out of the initial page download.
- `app/library-data.json` — the Panji, parallel research, and Sanskrit–Maithili philosophy shelves.
- `app/learning-data.json` — source-led chronology, place, classroom, and research-practice data.
- `app/globals.css`, `app/research-expansion.css`, and `app/learning-lab.css` — visual and responsive systems.
- `components/scholarly-toolbar.tsx` — permanent archive navigation, shareable research-state URLs, PWA registration, translation warning, and lightweight image loading enhancement.

## Scholarly export

`scripts/scholarly-export.mjs` runs after every successful static build. It derives a durable publication layer directly from the source-controlled corpus rather than copying records by hand.

It generates:

- permanent record pages for histories, philosophical ideas/debates, people, places, texts, and chronology;
- BibTeX, RIS, and CSL-JSON citation downloads for every permanent record;
- record-level Schema.org JSON-LD, citation metadata, evidence/status badges, and historical safeguards;
- a multilingual/diacritic-tolerant permanent-record search page;
- side-by-side comparison with shareable URLs;
- editorial method, accessibility, rights, and data-download pages;
- versioned JSON, CSV, NDJSON, and GeoJSON releases with SHA-256 checksums;
- an expanded sitemap and `robots.txt`;
- a web-app manifest, service worker, and offline fallback;
- a machine-readable scholarly-export QA report used by CI.

The current release identifier is **2026.09**.

## Permanent, citable, machine-readable, versioned, discoverable

The archive’s preferred identity is:

**Videha Digital Research Archive: Digital Humanities Research Environment for Mithila, Vajji & Anga**

The global layout publishes canonical, Open Graph, Twitter, Dublin Core-style, citation, authorship, publisher, ISSN, WebSite, DataCatalog and Dataset metadata. The repository also contains `CITATION.cff` so GitHub can expose the preferred archive citation.

Permanent records use URLs in the form:

`https://videha-ejournal.github.io/mithila-vajji-anga/records/<type>/<id>/`

The archive identity page is:

`https://videha-ejournal.github.io/mithila-vajji-anga/about/`

## Source PDF Library

The principal PDF corpus is maintained separately at:

`https://github.com/videha-ejournal/videha-ejournal`

That source repository automatically publishes a lightweight PDF catalogue after PDF changes. During every verified archive build, `scripts/source-library.mjs` reads the source catalogue and the exact Git tree, then publishes a version-specific Source PDF Library without copying the large binary corpus into this website repository.

For each external PDF the generated archive catalogue records:

- source repository and branch;
- exact source commit;
- exact Git blob ID;
- file size and media type;
- commit-pinned raw PDF URL;
- commit-pinned GitHub object URL;
- current source-repository Pages URL where supplied.

The generated outputs are:

- `/source-library/` — independently discoverable human-readable source library;
- `/source-library/catalog.json` — combined machine-readable catalogue;
- `/source-library/GIT-BLOB-IDS.txt` — exact Git object IDs for external PDFs;
- `/source-library/SHA256SUMS.txt` — SHA-256 checksums for any PDFs physically stored under this repository’s optional `public/books/` path.

The archive workflow also runs daily at 02:17 UTC (07:47 IST), in addition to normal pushes and manual runs, so newly uploaded or reduced PDFs in the dedicated source repository are incorporated automatically after that repository’s catalogue workflow completes.

External Git blob IDs are not described as SHA-256 checksums; each identifier type is preserved accurately. Indexing a PDF does not change its copyright or licence.

## Performance and media delivery

The production build defers the largest specialist research datasets until they are needed, creates a lightweight global-search derivative for the gateway, enforces an initial-JavaScript performance budget, and automatically generates WebP and AVIF derivatives for applicable PNG/JPEG assets. CI fails if the performance contract regresses.

## Accessibility

The interactive interface includes a skip link, semantic landmarks, keyboard-operable research tabs and controls, reduced-motion handling, read-aloud support, and an assistive settings panel. The generated scholarly layer publishes a formal WCAG 2.2 AA-oriented accessibility statement and continuing audit checklist.

## Rights and licensing

- Repository-authored software code: MIT (`LICENSE`).
- Original normalized structured research data: CC BY 4.0 (`LICENSE-DATA.md`).
- Portal-level rights matrix and exclusions: `RIGHTS.md`.
- Book covers, manuscript reproductions, archival images, quoted third-party text, map bases, external editions and repository PDFs retain their applicable source rights unless explicitly licensed otherwise.

## Edit locally

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local address shown.
4. Run `npm run lint`.
5. Run `npm run build` before publishing; the static site and scholarly export are written to `dist/client/`.

Local builds attempt to read the external public PDF repository and gracefully continue with local PDFs if it is temporarily unreachable. CI sets `REQUIRE_EXTERNAL_SOURCE_LIBRARY=1`, so production publication fails rather than silently omitting the dedicated source repository.

## Deploy on GitHub Pages

The GitHub Actions workflow validates lint, the complete static build, scholarly export, permanent-record QA, datasets, sitemap, robots file, PWA manifest, archive identity page, commit-pinned external PDF source-library catalogue and performance contract on pull requests. Pushes to `main` additionally deploy the verified `dist/client/` artifact to GitHub Pages. A daily scheduled build refreshes the external source-PDF catalogue.

The build automatically handles the project path at `videha-ejournal.github.io/mithila-vajji-anga/`.

## Editorial method

The archive distinguishes source text, material evidence, editorial interpretation, inferred discovery links, disputed/qualified claims, approximate dates, modern orientation, and planned material. Archaeological strata are not treated as ethnic labels; texts are read according to composition and transmission; inscriptions remain acts of power and piety rather than neutral chronicles; and modern coordinates do not imply timeless historical borders.

Later social classifications are not projected backwards. In particular, Śrotriya/Srotriya is not presented as a fixed medieval Maithil Brahmin sub-caste; the archive treats its distinct sub-caste emergence as a later development around 1800 CE unless source-controlled evidence requires a narrower formulation.
