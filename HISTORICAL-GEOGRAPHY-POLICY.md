# Historical Geography Evidence Policy

Status: **source-controlled qualified historical layers · 14 September 2026**

The Videha Digital Research Archive treats published place coordinates, cultural-region envelopes and reconstructed historical polity geometry as different classes of evidence.

## Current release rule

- Existing point coordinates are **modern orientation/reference aids** unless a record explicitly carries verified historical-location evidence.
- A modern orientation point does **not** assert that an ancient or historical settlement occupied that exact coordinate.
- A modern orientation point does **not** imply a timeless political, cultural, linguistic, dynastic, or administrative border.
- Null geometry means that no coordinate is asserted by the released dataset.
- Qualified reconstructed non-point geometry may be released only through the source-controlled `data/historical-boundaries.geojson` layer and only after the production evidence gate passes.
- Released historical polygons are research envelopes, not cadastral, legal, surveyed, or exact ancient frontiers.

## Qualified historical boundary layer

The current source-controlled layer contains three deliberately qualified polygons:

1. **Mithila historical-cultural frame (Karan 1984)** — a schematic cultural-region envelope based on Pradyumna P. Karan, “Landscape, Religion and Folk Art in Mithila: An Indian Cultural Region,” *Journal of Cultural Geography* 5(1) (1984), pp. 85–101, especially the explicit Himalayan-foothill/Ganges/Gandak/Kosi framing and Fig. 1. This is not represented as a single-period political frontier.
2. **Vajji approximate polity envelope, c. 500 BCE** — a simplified derivative of the historical map `Mahajanapadas (c. 500 BCE)` by Avantiputra7 on Wikimedia Commons. The source itself describes the realm boundaries as approximate and cites H. C. Raychaudhuri, Irfan & Faiz Habib, J. E. Schwartzberg, Upinder Singh and related scholarship.
3. **Anga approximate polity envelope, c. 500 BCE** — the same source/method and the same explicit uncertainty rule as Vajji.

The Vajji and Anga derivatives retain the source map’s **CC BY-SA 3.0** attribution and derivative notice. Coordinates are intentionally simplified for web research orientation. No polygon is evidence for a modern territorial claim.

## Fail-closed rule for historical geometry

A historical point, line, polygon, multipolygon, corridor, or boundary may be published as historical geometry only when its source-controlled feature metadata marks the geometry as verified and supplies both:

1. `sourceCitation` — a human-readable citation identifying the evidence used for the geometry; and
2. `sourceUrl` — a stable URL for the cited source or source record.

Non-point geometry additionally requires all of the following:

- `historicalBoundaryAsserted: true`;
- `geometryScope`;
- `periodLabel`;
- `precision`;
- `method`; and
- `notExactFrontier: true`.

The production verifier rejects non-point historical geometry that lacks any of these fields. Where the evidence supports only an approximate, disputed, reconstructed, cultural-region, or multi-hypothesis geography, that qualification must be represented explicitly rather than converted into a single certain boundary.

## Source-work candidates are not geometry evidence

The source-controlled registry `data/historical-geography-evidence.json` may identify books or PDFs as **historical-geography source candidates** when their source-work identity is already verified. Candidate status does not assert that the PDF contains a usable map, does not identify a page, and does not license a boundary reconstruction.

A candidate becomes usable for historical geometry only after all of the following are independently verified and recorded: `geometryEvidenceStatus=verified`, an exact `pageLocator`, a human-readable `sourceCitation`, a stable `sourceUrl`, and a defined `geometryScope`. Until then, `usableForHistoricalGeometry` must remain `false` and those page-level geometry-evidence fields remain null.

The current qualified boundary layer therefore does **not** change the unresolved status of the two History-PDF candidates. Those PDFs remain candidates until their own page-level map evidence is independently verified.

Production resolves each candidate against the commit-pinned Videha source library and publishes the result at `/data/historical-geography-evidence.json`, preserving the source commit, Git blob identity and SHA-256 where available.

## Machine-readable outputs

Each scholarly data release publishes:

- `places.geojson`, containing modern orientation/reference points plus any qualified source-controlled historical geometry;
- `historical-geography.json`, a manifest recording coordinate role, historical-geometry status, evidence requirements, uncertainty metadata and summary counts; and
- `SHA256SUMS.txt`, regenerated after geography metadata and qualified boundaries are finalized.

The archive also publishes `/data/historical-geography-evidence.json` for source-work candidates and their page-level geometry-evidence status.

## Scholarly scope

The governing geographical and historical focus remains **Mithila–Vajji–Anga in India and Nepal**. Historical geometry is added only when the evidence is sufficiently defensible and its uncertainty is visible in the machine-readable record; absence of a polygon remains preferable to a visually persuasive but unsupported reconstruction.

## Accessibility and publication gates

This policy does not weaken accessibility certification or publication completeness gates. Automated accessibility engineering checks are distinct from named assistive-technology certification. NVDA, JAWS, VoiceOver and TalkBack results may be marked passed only after those technologies have actually been run and the result recorded. Literature, Panji and classical-Philosophy detail publication remains fail-closed under the existing source/editorial checks.
