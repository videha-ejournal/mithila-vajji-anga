# Videha Digital Research Archive

## Digital Humanities Research Environment for Mithila, Vajji & Anga

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

Repository PDFs can be published as verifiable source objects rather than isolated downloads. Put PDFs inside:

`public/books/`

The build will automatically create:

- stable public PDF URLs under `/mithila-vajji-anga/books/`;
- `/source-library/` — an independently discoverable source-library page;
- `/source-library/catalog.json` — a machine-readable PDF catalogue;
- `/source-library/SHA256SUMS.txt` — SHA-256 verification checksums.

PDF filenames are used as provisional display titles. For best scholarly presentation, use clear filenames such as `History_of_Mithila_Volume_I.pdf`, `Decoding_the_Panji_Volume_I.pdf`, or `Parallel_Philosophy_Volume_I.pdf`. The original PDFs remain unchanged.

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

## Deploy on GitHub Pages

The GitHub Actions workflow validates lint, the complete static build, scholarly export, permanent-record QA, datasets, sitemap, robots file, PWA manifest, archive identity page, PDF source-library catalogue and performance contract on pull requests. Pushes to `main` additionally deploy the verified `dist/client/` artifact to GitHub Pages.

The build automatically handles the project path at `videha-ejournal.github.io/mithila-vajji-anga/`.

## Editorial method

The archive distinguishes source text, material evidence, editorial interpretation, inferred discovery links, disputed/qualified claims, approximate dates, modern orientation, and planned material. Archaeological strata are not treated as ethnic labels; texts are read according to composition and transmission; inscriptions remain acts of power and piety rather than neutral chronicles; and modern coordinates do not imply timeless historical borders.

Later social classifications are not projected backwards. In particular, Śrotriya/Srotriya is not presented as a fixed medieval Maithil Brahmin sub-caste; the archive treats its distinct sub-caste emergence as a later development around 1800 CE unless source-controlled evidence requires a narrower formulation.
