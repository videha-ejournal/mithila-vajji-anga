# Scholarly preservation and release policy

The Videha Digital Research Archive is a research venture of **Videha — First Maithili Fortnightly eJournal**, ISSN **2229-547X**.

- Primary Videha site: https://www.videha.co.in/
- GitHub mirror: https://videha-ejournal.github.io/videha/
- Digital Research Archive: https://videha-ejournal.github.io/mithila-vajji-anga/
- Repository: https://github.com/videha-ejournal/mithila-vajji-anga

## Versioned releases

A scholarly release is identified by a source-controlled `version` in `data/release-manifest.json`. For the current release the version is **2026.09** and the GitHub release tag is **v2026.09**.

A release is valid only after the production Pages workflow has passed its build, scholarly validators, deployment, and live-smoke stages. The release automation then snapshots the public release metadata and checksum-bearing corpus files. Re-running the release workflow for the same version is idempotent: it updates the release assets rather than inventing a second version.

## DOI preservation

Zenodo preservation is active. The verified DOI for the current archive/version chain is **10.5281/zenodo.22754977**.

The DOI is recorded in `data/release-manifest.json`, `CITATION.cff`, the public preservation outputs generated from the release manifest, and the scholarly release record. `.zenodo.json` remains the deposition configuration and therefore does not need to hard-code the DOI minted by Zenodo itself.

Only a DOI actually minted by the preservation service may be asserted. A guessed, placeholder, reserved-looking, or fabricated DOI is forbidden. Repository-level DOI, creator and licence metadata describe the archival/dataset layer; they do not replace item-level authorship, translation, editing, edition or rights statements.

## ORCID

No ORCID is currently asserted for the editor because none has been supplied in the source-controlled record. If a verified ORCID is provided later, it may be added to `CITATION.cff` and preservation metadata. A guessed ORCID is forbidden.

## Citation identity

Every released page and scholarly citation belongs to the parent publication identity:

**Videha — First Maithili Fortnightly eJournal · ISSN 2229-547X · https://www.videha.co.in/ · GitHub mirror https://videha-ejournal.github.io/videha/ · Digital Research Archives on GitHub https://github.com/videha-ejournal**

Work-level ISBNs are included only where the authoritative 293-record ISBN register supports that work or edition. Work ISBNs must not be propagated to individual chapters that do not independently possess an ISBN.

## Evidence refinement

Preservation does not convert candidates into evidence. Historical-geography candidates, unresolved Panji units, unreviewed translations, and named assistive-technology results remain fail-closed until the required evidence or human test actually exists. See `HISTORICAL-GEOGRAPHY-POLICY.md`, `EVIDENCE-REFINEMENT-REGISTER.md`, and `ACCESSIBILITY-TEST-PROTOCOL.md`.

## Primary/mirror parity

A separate lightweight scheduled workflow audits selected pages on `videha.co.in` and the GitHub mirror. It records availability, publication-identity markers, and normalized content fingerprints without delaying the main research-archive deployment. Content drift is reported; it is not silently overwritten.
