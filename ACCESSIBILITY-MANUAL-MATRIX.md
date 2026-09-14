# Videha Digital Research Archive — Manual Accessibility Certification Matrix

Release target: 2026-09-14 bilingual completion
Standard: WCAG 2.2 AA-oriented engineering and manual verification

**Certification state: PENDING HUMAN / DEVICE TESTING.**

Automated engineering checks support this matrix but cannot certify real assistive-technology behaviour. A row may be changed to `Passed` only after a human tester records the device, browser, assistive-technology version, date, tested routes, defects found, and retest result. Until then the public release must describe manual certification as Pending.

| Test | Required environment | Required checks | Status | Evidence |
|---|---|---|---|---|
| Keyboard only | Desktop, current Chromium + Firefox/Safari where available | Logical focus order; visible focus; menus, dialogs, tabs, search, map controls, language switch, citations; no keyboard trap | PENDING HUMAN TEST | Not yet device-certified |
| NVDA | Windows + current Firefox/Chrome | Landmarks, headings, link purpose, forms, live regions, language changes, Maithili/English route switch, source-language spans | PENDING HUMAN TEST | Not yet device-certified |
| JAWS | Windows + current Chrome/Edge | Same core reading/navigation matrix; forms and dynamic controls | PENDING HUMAN TEST | Not yet device-certified |
| VoiceOver macOS | macOS + Safari | Rotor headings/links, landmarks, dialogs, dynamic research controls, language announcements | PENDING HUMAN TEST | Not yet device-certified |
| VoiceOver iOS | iPhone/iPad + Safari | Touch exploration, rotor, menus, language switch, zoom/reflow, link/button labels | PENDING HUMAN TEST | Not yet device-certified |
| TalkBack | Android + Chrome | Swipe order, headings, controls, search, dynamic results, language switch, touch targets | PENDING HUMAN TEST | Not yet device-certified |
| 200% zoom | Desktop browser | No loss of text/function; controls remain operable; no horizontal reading requirement except intrinsically two-dimensional content | PENDING HUMAN TEST | Not yet device-certified |
| 400% zoom | Desktop browser | Reflow and operability; dialogs and menus remain reachable | PENDING HUMAN TEST | Not yet device-certified |
| 320 CSS px reflow | Responsive browser/device emulation plus real narrow device where possible | Reading order; no clipped content; tables/maps receive appropriate overflow treatment | PENDING HUMAN TEST | Not yet device-certified |
| Text spacing | Browser/user stylesheet | 1.5 line height, paragraph spacing, letter/word spacing without clipping or overlap | PENDING HUMAN TEST | Not yet device-certified |
| Contrast | Representative light/dark/high-contrast states | Text/non-text contrast; focus indicators; disabled/selected states; map/graph controls | PENDING HUMAN TEST | Not yet device-certified |
| Reduced motion | OS/browser prefers-reduced-motion | Slideshow/animation/motion stops or reduces; no essential information lost | PENDING HUMAN TEST | Not yet device-certified |
| Touch target | iOS + Android | Repeated controls, language switch, menus, map/graph buttons and citation controls meet usable target spacing/size | PENDING HUMAN TEST | Not yet device-certified |
| Maithili language semantics | Screen reader with Indic language support where available | Root announces `mai`; source-derived English passages marked `lang=en`; English mirror announces `en` | PENDING HUMAN TEST | Not yet device-certified |
| Listen control | Browsers exposing speech synthesis | Maithili route requests Maithili (`mai-IN`) first with declared fallback; stop/restart works; English route remains English | PENDING HUMAN TEST | Not yet device-certified |

## Required recording fields for each completed row

Tester; date/time; operating system; browser/version; assistive technology/version; device; routes tested; pass/fail per success criterion; defect links; retest date; final reviewer.

## Release rule

The automated verifier fails if this document is missing, if the certification state is changed away from Pending without recorded evidence, or if release metadata claims named assistive technologies are certified while rows remain pending. This protects against accidental or automated overclaiming.
