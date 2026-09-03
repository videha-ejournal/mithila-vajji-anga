# Mithila–Vajji–Anga

A responsive, accessible historical research portal for the connected histories of Mithila, Vajji, and Anga. The site is designed for the Videha research ecosystem and links to [videha.co.in](https://www.videha.co.in/).

## Structure

- `app/page.tsx` — page content, search, filters, and navigation
- `app/globals.css` — visual system and responsive layout
- `app/layout.tsx` — site metadata and document shell
- `public/` — static assets, including the favicon
- `.github/workflows/deploy-pages.yml` — automatic GitHub Pages deployment
- `next.config.ts` — static export and repository-path support

## Edit locally

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local address shown.
4. Run `npm run build` before publishing; the static site is written to `dist/client/`.

## Deploy on GitHub Pages

1. Create a new GitHub repository (for example, `mithila-vajji-anga`).
2. Upload all files from this package to the repository root and commit them to the `main` branch.
3. Open **Settings → Pages** in GitHub.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Open the **Actions** tab and allow the included deployment workflow to finish.
6. GitHub will show the public site address in the successful deployment summary.

The workflow automatically handles both a project site (`username.github.io/repository-name/`) and a root site (`username.github.io/`).

## Editorial note

The chronology and summaries are structured starting points. Before treating the site as a publication, add source-level citations, competing interpretations, and confidence notes to each historical claim.
