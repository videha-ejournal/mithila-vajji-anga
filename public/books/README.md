# Source PDFs for the Videha Digital Research Archive

The archive supports two PDF-source paths.

## Preferred path for the main book corpus

The large book corpus is maintained in the dedicated public repository:

`https://github.com/videha-ejournal/videha-ejournal`

That repository automatically rebuilds `data/videha-pdf-catalog.json` whenever PDFs change. The Mithila–Vajji–Anga archive consumes that catalogue and the exact Git tree during its verified build.

For every external PDF, the archive records:

- the display title and repository path;
- file size;
- the exact source-repository commit observed by the build;
- the exact Git blob ID;
- a commit-pinned raw PDF URL;
- a commit-pinned GitHub source-object URL;
- the current published GitHub Pages PDF URL when supplied by the source catalogue.

This avoids duplicating hundreds of megabytes of PDFs in the website repository while still making the source objects version-specific and machine-readable.

The archive rebuilds daily as well as on normal site pushes, so newly uploaded PDFs in the dedicated source repository are automatically discovered after its catalogue workflow completes.

## Optional local archive PDFs

PDFs may still be placed directly in this `public/books/` directory. For every local `.pdf` file here, including subdirectories, the production build publishes:

- a stable public URL under `https://videha-ejournal.github.io/mithila-vajji-anga/books/`;
- an entry in `https://videha-ejournal.github.io/mithila-vajji-anga/source-library/`;
- a machine-readable record in `/source-library/catalog.json`;
- a SHA-256 verification checksum in `/source-library/SHA256SUMS.txt`.

The original PDF is not altered.

## Machine-readable verification

The generated Source PDF Library publishes:

- `/source-library/catalog.json` — combined local and external source-object catalogue;
- `/source-library/GIT-BLOB-IDS.txt` — exact Git object IDs for externally stored PDFs;
- `/source-library/SHA256SUMS.txt` — SHA-256 checksums for PDFs physically stored in this archive repository.

Git blob IDs and SHA-256 are different identifier systems and are labelled separately.

## Rights

Indexing or publishing a PDF does not change its copyright or licence. The archive-level CC BY 4.0 data licence does not automatically relicense book PDFs. The rights statement inside each PDF or its separately documented rights remains controlling.

## File size

Large PDFs should remain in the dedicated `videha-ejournal/videha-ejournal` source repository where practical. Files that exceed GitHub’s accepted individual-file size must be reduced before a normal Git push; once a reduced file is pushed successfully, the source catalogue and archive refresh pipelines will discover it automatically.
