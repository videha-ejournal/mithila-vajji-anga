# Source PDFs for the Videha Digital Research Archive

Place source PDF books in this directory to publish them through the archive’s verified Source PDF Library.

## What the build does automatically

For every `.pdf` file under `public/books/` (including subdirectories), the production build publishes:

- a stable public URL under `https://videha-ejournal.github.io/mithila-vajji-anga/books/`;
- an entry in `https://videha-ejournal.github.io/mithila-vajji-anga/source-library/`;
- a machine-readable record in `/source-library/catalog.json`;
- a SHA-256 verification checksum in `/source-library/SHA256SUMS.txt`.

The original PDF is not altered.

## Recommended filenames

Use descriptive filenames that can serve as provisional scholarly titles, for example:

- `History_of_Mithila_Vajji_Anga_Volume_I.pdf`
- `History_of_Mithila_Vajji_Anga_Volume_II.pdf`
- `Decoding_the_Panji_of_Mithila_Volume_I.pdf`
- `Parallel_Philosophy_Volume_I.pdf`
- `Parallel_History_of_Mithila_and_Maithili_Literature_Tome_I.pdf`

Avoid opaque names such as `book1.pdf` when possible.

## Rights

Adding a PDF to this directory publishes the file; it does not change its copyright or licence. The archive-level CC BY 4.0 data licence does not automatically relicense book PDFs. Keep the applicable rights statement inside each PDF or document the rights separately.

## Repository size

GitHub imposes file-size and repository limits. Very large PDFs should be optimized or hosted in a suitable archival repository and linked from the archive rather than committed if they exceed GitHub’s practical limits.
