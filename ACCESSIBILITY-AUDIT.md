# Videha Digital Research Archive — Accessibility Audit Ledger

Release audit date: **14 September 2026**  
Target: **WCAG 2.2 AA-oriented conformance process**  
Engineering verification: **RELEASE-BLOCKING CI GATE**  
Manual certification status: **PENDING**

This ledger separates release-engineering safeguards from testing that must be performed with real browsers, devices, keyboards, screen readers, zoom/reflow settings and touch input. Passing CI is not represented as full WCAG 2.2 AA certification.

## Automated/release engineering safeguards

Every production build now runs `scripts/verify-accessibility-engineering.mjs` after final release-integrity processing. Deployment fails unless the following safeguards pass on the final Maithili and English mirror output:

- a keyboard Skip link remains present;
- visible `:focus-visible` styling with a 3 px outline and offset remains present;
- reduced-motion support remains present;
- the 44 × 44 px large-target assistive mode remains present;
- semantic header/navigation/main structure remains present on both mirrors;
- root output declares `lang="mai"` and `/en/` declares `lang="en"`;
- Listen, Stop, Translate and Assistive Tech controls remain present on both mirrors;
- responsive viewport metadata remains present;
- every rendered entry-page image carries an `alt` attribute;
- ARIA expanded/pressed/label semantics remain represented in the interactive source;
- the full 41-language translation inventory remains present;
- manual certification remains explicitly Pending until named assistive technologies are actually run.

A successful build publishes the machine-readable result at `/data/accessibility-engineering-report.json`. The report explicitly states that engineering verification does not substitute for NVDA, JAWS, VoiceOver, TalkBack, physical-device or human perceptual testing.

Existing release-integrity checks additionally protect reciprocal Maithili/English metadata, identical mirror structure/stylesheets, title/favicon consistency, the 178 History permanent pages and the fail-closed Literature, Panji and classical-Philosophy publication gates.

## Human/manual test matrix

The following must be actually tested and recorded before the archive is described as manually certified for WCAG 2.2 AA. Use `ACCESSIBILITY-TEST-PROTOCOL.md` and record browser/OS/device/AT version, route tested, result, defect reference and retest result for each row.

| Area | Required human/manual test | Status |
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

Accessibility changes are additive. Existing archive content, the 178 History pages, the source/provenance safeguards, the Maithili/English mirror architecture and the Mithila–Vajji–Anga scholarly focus must not be removed to satisfy this checklist.
