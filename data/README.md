# Videha ISBN Authority Data

This directory contains the source-controlled authoritative ISBN allotment registry used by the Videha Digital Research Archive.

- Authority: ISBN.gov.in portal export supplied by the editor.
- Retrieved: 14 September 2026.
- Scope: 293 unique allotted ISBNs.
- Administrator split: Gajendra 182; Kumari Prity 111.
- Conflict rule: this authority overrides all earlier Videha ISBN staging, reconciliation and provisional lists for the allotted edition represented by each portal record.
- Explicit exclusion: the source column `Name of Publishing Agency/Publisher` is not used, stored, exported, validated or displayed.
- Source payload: `videha-isbn-authority.json.gz.b64` is deterministic gzip (mtime=0), Base64-encoded for compact source control.
- Decompressed JSON SHA-256: `f072f685bcd05200a071dea218baad30298f7b4717b9cee4be6178bfdbd25df8`.
- Editor-supplied workbook SHA-256: `12aab41f16e974423e4ce8860e061f0b592bb9e156a9b8a1f884ac0d3cf4ed26`.
- Build outputs: `/data/videha-isbn-authority.json` and `/data/videha-isbn-authority.csv`.

Same-work equivalences explicitly enforced by CI:

- Gadya Padya Bharti 1 = Videha Sadeha 28 = ISBN 978-93-341-0402-8.
- Gadya Padya Bharti 2 = Videha Sadeha 37 = ISBN 978-93-5890-150-4.

The validator checks all ISBN-13 check digits, uniqueness, record count, administrator counts, aliases and archive library assignments. Ambiguous or incomplete portal titles remain authoritative portal records but are not forced onto a separate archive work without edition-level evidence.
