# Videha Manual Accessibility Certification Protocol

Date baseline: **14 September 2026**  
Target: **WCAG 2.2 AA-oriented conformance process**  
Scope: Maithili root edition and English `/en/` mirror, plus representative History, source, archive-detail and research-tool routes.

This protocol is deliberately separate from CI. It must be executed with the named assistive technologies and real browser/device environments before the archive is described as manually certified.

## Recording rule

For every run record: date, tester, operating system/device, browser and version, assistive technology and version, exact route, result, defect reference, fix commit, and retest result. A row is **Passed** only after the test was actually performed and any blocking defect was retested.

## Core route sample

Test at minimum:

- `/mithila-vajji-anga/` — Maithili root mirror;
- `/mithila-vajji-anga/en/` — English mirror;
- one permanent History chapter;
- `/sources/` and `/data/`;
- one published Philosophy/Literature/Panji detail route where the fail-closed publication gate currently permits publication;
- the Historical map, translation panel, assistive-tech panel and global search workflow.

## Keyboard and focus

1. Reload the route and use only keyboard input.
2. Activate the skip link and confirm focus/reading position moves to the intended research entry point.
3. Traverse header, edition switch, search, 41-language translator, research doors/tabs, map controls, dialogs/panels, footer and back-to-top control.
4. Confirm logical tab order, no keyboard trap, no unreachable control and no unexpected focus loss after opening/closing panels.
5. Confirm visible focus in default, dark and high-contrast modes.
6. Repeat at 200% and 400% zoom and at 320 CSS px reflow.

## NVDA — Windows

Run current NVDA with current Firefox and current Chrome or Edge. Verify headings, landmarks, link/button names, form labels, expanded/pressed states, panel opening/closing announcements, search result updates, reading order, edition switch, map control names, image alternatives and error/status messages.

## JAWS — Windows

Run current JAWS with current Edge or Chrome. Verify headings/landmarks quick navigation, forms mode, labels, buttons, dynamic panels, search, translation controls, map controls, reading order and edition switch.

## VoiceOver — macOS and iOS

Run current VoiceOver with Safari on macOS and on a current iOS device. Verify rotor navigation, headings, landmarks, buttons, links, forms, reading order, panel state, edition switch, map controls, zoom/reflow and touch exploration on iOS.

## TalkBack — Android

Run current TalkBack with Chrome on a current Android device. Verify swipe order, touch exploration, control names/states, dialogs/panels, search, translator, map controls, edition switch and large-target mode.

## Visual/reflow/perceptual checks

- 200% and 400% browser zoom: no lost content or function.
- 320 CSS px: no page-level two-dimensional scrolling except intrinsically wide data where an accessible local scroller is provided.
- Default, dark and high-contrast modes: text, controls, state indicators and focus remain perceivable.
- OS `prefers-reduced-motion` plus archive Stop Motion: no essential information depends on animation.
- Large-target mode on touch hardware: controls remain usable and approximately 44 × 44 CSS px or larger.
- Hide-images mode: information needed to use the archive remains available in text.

## Speech, translation and media

- Start Listen, interrupt with Stop, repeat, move focus, change route and confirm speech does not become trapped or overlap uncontrollably.
- Exercise the 41-language selector, confirm source-language handling and machine-translation warning.
- Confirm meaningful images have useful alternatives; decorative images are silent; captions/transcripts exist where prerecorded media requires them.

## Pass condition

Manual certification can change from **PENDING** to **PASSED** only when all named environments above have actual recorded results and no blocking defect remains open. CI, emulation, static analysis, automated browser testing or code inspection can support this process but cannot substitute for the named assistive technologies and physical-device checks.
