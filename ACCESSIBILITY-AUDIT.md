# Videha Digital Research Archive — Accessibility Audit Ledger

Release audit date: **14 September 2026**  
Target: **WCAG 2.2 AA-oriented conformance process**  
Manual certification status: PENDING

This ledger separates automated release safeguards from testing that must be performed with real browsers, devices, keyboards, screen readers, zoom/reflow settings and touch input. Passing CI is not represented as full WCAG 2.2 AA certification.

## Automated release safeguards

Every production build must verify the following before deployment:

- a visible Skip link and semantic navigation/accessibility labels remain present;
- keyboard focus styling uses a visible `:focus-visible` treatment;
- reduced-motion support remains present;
- the 44 × 44 px large-target assistive mode remains present;
- the 41-language translation selector remains complete;
- Listen, Stop and Assistive Tech controls remain available on both mirrored entry pages;
- the Maithili and English entry pages retain the same structural interface and stylesheet bundle;
- title, favicon, reciprocal edition switch, canonical URLs and `hreflang` metadata remain consistent;
- the root edition declares `mai` and the `/en/` edition declares `en` in the exported HTML;
- all 178 History permanent pages remain present;
- Literature, Panji and classical Philosophy detail publication remains fail-closed until the existing source/editorial gates pass.

The build publishes the machine-readable result at `/data/release-integrity-report.json`.

## Manual test matrix

The following must be tested and recorded before the archive is described as manually certified for WCAG 2.2 AA. Record browser/OS version, route tested, result, defect reference and retest result for each row.

| Area | Required manual test | Status |
| --- | --- | --- |
| Keyboard | Keyboard-only traversal of header, edition switch, 41-language translator, search, research tabs, dialogs/panels and footer/back-to-top controls; no keyboard trap | Pending |
| Focus | Visible focus indicator remains perceivable in normal, dark and high-contrast modes | Pending |
| NVDA | NVDA with current Firefox and Chrome/Edge on Windows; headings, landmarks, labels, state changes and reading order | Pending |
| JAWS | JAWS with current Edge/Chrome on Windows; headings, landmarks, forms, buttons and dynamic panels | Pending |
| VoiceOver | VoiceOver with Safari on macOS and iOS; rotor navigation, buttons, forms, reading order and edition switch | Pending |
| TalkBack | TalkBack with Chrome on Android; reading order, touch exploration, controls and dialogs | Pending |
| Zoom | 200% and 400% browser zoom without loss of content or function | Pending |
| Reflow | 320 CSS-pixel viewport/reflow without two-dimensional scrolling except where intrinsically necessary | Pending |
| Contrast | Text, controls, focus indicators and state indicators in default and assistive contrast modes | Pending |
| Motion | OS reduced-motion preference plus archive Stop Motion control | Pending |
| Touch targets | Mobile controls and large-target mode, including translation and assistive panels | Pending |
| Speech | Listen/Stop start, interruption, route change, focus and repeated-use behaviour | Pending |
| Translation | 41-language selector, source-language handling and machine-translation warning | Pending |
| Images/media | Alternative text, hide-images mode, captions/transcripts where media requires them | Pending |

## Reporting rule

A manual row becomes **Passed** only after the named assistive technology/device test has actually been performed and any blocking defect has been retested. Unrun rows remain **Pending**. Automated CI may support these checks but may not change a manual row to Passed.

## Release principle

Accessibility changes are additive. Existing archive content, the 178 History pages, the source/provenance safeguards and the Mithila–Vajji–Anga scholarly focus must not be removed to satisfy this checklist.
