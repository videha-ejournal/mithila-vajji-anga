# Videha ISBN Authority Data

This directory contains the source-controlled authoritative ISBN allotment registry used by the Videha Digital Research Archive.

- Authority: ISBN.gov.in portal export supplied by the editor.
- Retrieved: 14 September 2026.
- Scope: 293 unique allotted ISBNs.
- Administrator split: Gajendra 182; Kumari Prity 111.
- Conflict rule: this authority overrides all earlier Videha ISBN staging, reconciliation and provisional lists for the allotted edition represented by each portal record.
- Source payload: `videha-isbn-authority.json.gz.b64` is deterministic gzip (mtime=0), Base64-encoded for compact source control.
- Decompressed JSON SHA-256: `a0df666c62305a01edca47f2ac150edc58f1fee99aa29aa53ba6b6c670faeb30`.
- Build outputs: `/data/videha-isbn-authority.json` and `/data/videha-isbn-authority.csv`.

Same-work equivalences explicitly enforced by CI:

- Gadya Padya Bharti 1 = Videha Sadeha 28 = ISBN 978-93-341-0402-8.
- Gadya Padya Bharti 2 = Videha Sadeha 37 = ISBN 978-93-5890-150-4.

The validator checks all ISBN-13 check digits, uniqueness, record count, administrator counts, aliases and the archive library assignments. Ambiguous/incomplete portal titles remain authoritative portal records but are not forced onto a separate archive work without edition-level evidence.
