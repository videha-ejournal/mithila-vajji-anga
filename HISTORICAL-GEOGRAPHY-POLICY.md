# Historical Geography Evidence Policy

Status: **source-controlled baseline · 14 September 2026**

The Videha Digital Research Archive treats published place coordinates and reconstructed historical geography as different classes of evidence.

## Current release rule

- Existing point coordinates are **modern orientation/reference aids** unless a record explicitly carries verified historical-location evidence.
- A modern orientation point does **not** assert that an ancient or historical settlement occupied that exact coordinate.
- A modern orientation point does **not** imply a timeless political, cultural, linguistic, dynastic, or administrative border.
- Null geometry means that no coordinate is asserted by the released dataset.
- This baseline adds **no reconstructed historical frontier or boundary polygon**.

## Fail-closed rule for future historical geometry

A future historical point, line, polygon, multipolygon, corridor, or boundary may be published as historical geometry only when its source-controlled feature metadata marks the geometry as verified and supplies both:

1. `sourceCitation` — a human-readable citation identifying the evidence used for the geometry; and
2. `sourceUrl` — a stable URL for the cited source or source record.

Non-point geometry additionally requires `historicalBoundaryAsserted: true`. The production verifier rejects non-point historical geometry that lacks these fields.

Where the evidence supports only an approximate, disputed, reconstructed, or multi-hypothesis geography, that qualification must be represented explicitly rather than converted into a single certain boundary.

## Source-work candidates are not geometry evidence

The source-controlled registry `data/historical-geography-evidence.json` may identify books or PDFs as **historical-geography source candidates** when their source-work identity is already verified. Candidate status does not assert that the PDF contains a usable map, does not identify a page, and does not license a boundary reconstruction.

A candidate becomes usable for historical geometry only after all of the following are independently verified and recorded: `geometryEvidenceStatus=verified`, an exact `pageLocator`, a human-readable `sourceCitation`, a stable `sourceUrl`, and a defined `geometryScope`. Until then, `usableForHistoricalGeometry` must remain `false` and those page-level geometry-evidence fields remain null.

Production resolves each candidate against the commit-pinned Videha source library and publishes the result at `/data/historical-geography-evidence.json`, preserving the source commit, Git blob identity and SHA-256 where available.

## Machine-readable outputs

Each scholarly data release publishes:

- `places.geojson`, whose feature properties distinguish `modern-orientation`, `none`, and verified historical roles; and
- `historical-geography.json`, a manifest recording coordinate role, historical-geometry status, evidence requirements, and summary counts.

The archive also publishes `/data/historical-geography-evidence.json` for source-work candidates and their page-level geometry-evidence status.

The release checksum file is regenerated after geography metadata is finalized.

## Scholarly scope

The governing geographical and historical focus remains **Mithila–Vajji–Anga in India and Nepal**. Historical geometry is added only when the evidence is sufficiently defensible; absence of a polygon is preferable to a visually persuasive but unsupported reconstruction.

## Accessibility and publication gates

This policy does not alter accessibility certification or publication completeness gates. Manual NVDA, JAWS, VoiceOver, TalkBack and physical device/browser testing remains Pending until actually performed. Literature, Panji and classical-Philosophy detail publication remains fail-closed under the existing source/editorial checks.
