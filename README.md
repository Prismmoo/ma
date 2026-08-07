# NN Cyberspace

[![Deploy](https://github.com/Prismmoo/ma/actions/workflows/deploy.yml/badge.svg)](https://github.com/Prismmoo/ma/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/Prismmoo/ma/actions/workflows/codeql.yml/badge.svg)](https://github.com/Prismmoo/ma/actions/workflows/codeql.yml)

Futuristic digital art, physical canvases, and immersive spatial previews.

- **Live site:** https://prismmoo.github.io/ma/
- **Repository:** https://github.com/Prismmoo/ma

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Base path](#base-path)
- [Deployment](#deployment)
- [SEO](#seo)
- [License](#license)

## Features

| Section | What it does |
| --- | --- |
| Home | Hero video, featured pieces, entry points to every section |
| Gallery | Browsable catalogue of available artwork with filters |
| Visualizer | Previews a piece inside a staged interior |
| Artists | Biography and background for each artist |
| Stickers | Sticker catalogue and configurator |
| Packs | Bundled collections offered as a single purchase |
| 3D painting | Three-dimensional canvas viewer |
| Upload | Customer-supplied artwork intake |

Every section is code-split and loaded on demand.

## Tech stack

- **Vite 6** — build tool and dev server
- **React 19** — UI, with `React.lazy` for each section
- **TypeScript 5.8** — type checking via `npm run lint`
- **Tailwind CSS 4** — styling, through the official Vite plugin
- **Motion** — animation
- **lucide-react** — icons

## Getting started

```bash
npm ci
npm run dev
```

The dev server listens on port 3000.

Copy `.env.example` to `.env.local` and fill in the values before testing order
submission.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | TypeScript check, no emit |
| `npm test` | Unit tests via the Node test runner |
| `npm run art:sync` | Regenerate the art catalogue |
| `npm run art:verify` | Check every catalogue image URL |
| `npm run report:bundle` | Build and report bundle sizes |
| `npm run report:source` | Report source tree sizes |
| `npm run audit:catalog` | Validate catalogue integrity |
| `npm run clean` | Remove build output |

## Project structure

```
src/
  components/     UI components
  hooks/          React hooks
  lib/            Catalogue, ordering, and helper logic
  generated/      Generated art catalogue — do not edit by hand
public/
  rooms/          Interior preview photography
  robots.txt      Crawler policy
  sitemap.xml     Sitemap
scripts/          Maintenance scripts
tests/            Unit tests
```

## Base path

This is a GitHub Pages **project site**, so it is served from a sub-path that
matches the repository name:

| Value | |
| --- | --- |
| Repository name | `ma` |
| `base` | `/ma/` |
| URL | `https://prismmoo.github.io/ma/` |

`/ma/` appears in four files that must always agree: `vite.config.ts`,
`.github/workflows/deploy.yml`, `.github/workflows/quality.yml`, and
`playwright.config.ts`. See `DEPLOYMENT.md`.

## Deployment

Pushing to the default branch triggers `.github/workflows/deploy.yml`, which
installs dependencies, builds, verifies that the built HTML really references
`/ma/assets/`, checks that the SEO files reached `dist/`, and publishes to
GitHub Pages.

One-time setup in the repository settings:

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. **Settings → Secrets and variables → Actions:** add `VITE_ORDER_WEB_APP_URL`

No personal access token is required; the workflow uses the automatic
`GITHUB_TOKEN`.

## SEO

This is a client-rendered single page application with no router, so exactly
one URL is indexable. `public/sitemap.xml` lists that URL plus the six room
photographs; `public/robots.txt` allows the JavaScript bundle, which Google
must fetch in order to see any content at all.

Because the site lives at `/ma/`, crawlers read `robots.txt` from
`https://prismmoo.github.io/robots.txt` and not from this repository. Renaming
the repository to `prismmoo.github.io` would move the site to the origin root
and give this file real authority.

Submit the sitemap in Google Search Console as the relative path
`sitemap.xml` under the URL-prefix property `https://prismmoo.github.io/ma/`.

## License

All rights reserved.
