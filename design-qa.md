# Design QA — Mithila–Vajji–Anga Explorer

- Source visual truth: https://www.bharatrajya.com/explore?year=1700
- Implementation: http://localhost:3000/
- Viewport: 1280 × 720 CSS px; in-app browser capture
- State compared: source Kingdoms explore overview; implementation Chronology explore overview
- Source pixels: 1280 × 720
- Implementation pixels: 1280 × 720
- Density normalization: equal-size browser captures in one comparison input

## Full-view comparison evidence

Both views use the same primary information architecture: dark persistent header, editorial title, prominent year field and timeline slider, era chips, a four-part tab bar, dense searchable records, and a selected-record context area. The implementation intentionally replaces the all-India kingdom dataset and orange reference branding with the manuscript-derived Mithila–Vajji–Anga archive and Videha identity. It retains the reference's compact research-workspace silhouette while improving small-screen navigation.

## Focused comparison evidence

- Typography: both use a high-contrast serif for editorial headings and a compact sans serif for controls. The implementation preserves readable 16px body defaults and avoids truncated labels.
- Spacing and layout: controls, tabs, records, and side panels align to a consistent 8px-radius card system. The 1280px three-column workspace and stacked mobile layout show no overlap or clipped controls.
- Colors and tokens: navy navigation and active tabs preserve the reference hierarchy; saffron is reserved for actions and temporal emphasis; green and ochre communicate completion states with sufficient contrast.
- Image quality: the only content image is the manuscript's own 2026 orientation map, rendered sharply and clearly labelled as modern orientation rather than an ancient border.
- Copy and content: all visible historical text is original to the project and grounded in the supplied manuscripts. Completed and planned chapters are explicitly separated.
- Icons: one consistent Lucide icon family is used for navigation, tabs, evidence, search, and state cues.
- Accessibility: semantic labels, tab roles, native selects, native range/input controls, alt text, a skip link, responsive navigation, and reduced-motion handling are present.

## Interaction checks

- Timeline range and earlier/later controls update the selected event.
- Era chips update the result set.
- Chronology, Places, Chapters, and Sources tabs switch correctly.
- Collection, volume, and status dropdowns filter the chapter index.
- Archive search filters records; the tested combination “Socio-cultural-economic history” + “Complete” + “Vaishali” returned three relevant chapters.
- Chapter-content disclosure expands and displays the manuscript-derived summary and section index.
- No blocking browser-console errors were observed.

## Findings

No actionable P0, P1, or P2 differences remain. The visual differences from BharatRajya are intentional: Videha branding, source-specific terminology, manuscript status, and the use of an editorial orientation map rather than an unsupported reconstructed territorial map.

## Follow-up polish

- P3: a future data release could add georeferenced historical layers if source-controlled boundary geometries become available.

## Comparison history

Initial implementation was checked at desktop and mobile widths. The mobile layout stacks the workspace, turns the navigation into a menu, makes era chips horizontally scrollable, and avoids the reference site's horizontal header overflow. No P0/P1/P2 fix cycle was required after the combined comparison.

final result: passed
