# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project

The Chassis vanilla HTML example: one HTML page styled with Chassis CSS and Chassis
Icons, with no framework and no bundler. A build writes the page for one brand, with
the design tokens, the fonts and the logo of that brand. The repository is deployed as a
site per brand, from the same commit. It is an example, not a package: nothing is
published, and there are no changesets or releases.

```
src/              # The page: index.html, assets/css/styles.css, assets/js/{theme,script}.js. The same for every brand
build.js          # Builds dist/ for the brand that the BRAND environment variable names
dev.js            # Serves src/ over dist/ with the headers of vercel.json, reloads on a change
vercel.json       # Install and build commands, output folder, response headers
.github/          # CI (lint, a build per brand) and Dependabot
```

Related repositories (separate git projects): `chassis-website-tokens`, `chassis-css`,
`chassis-icons`, `chassis-assets`, `chassis-website`.

## Setup and commands

- Package manager: **pnpm** (see `packageManager` in package.json). Do not use npm or yarn.
- Node: 24 (`.nvmrc`); `engines` allows `>=22.12.0`.
- Install: `pnpm install`
- Build: `pnpm build` for the `chassis` brand, `BRAND=<brand> pnpm build` for another. A
  build replaces `dist/`. The first build of a brand downloads its archive from the
  chassis-assets release into `.cache/assets/`
- Serve: `pnpm dev` at `http://localhost:4173` (`PORT` changes it), after a build. It
  serves `src/` over `dist/`, sends the headers of `vercel.json` and reloads the page when
  `src/` changes
- Lint: `pnpm lint` (ESLint, then Prettier in check mode)
- Format: `pnpm format` (Prettier, write mode)

There are no tests. Before a task is done, run `pnpm lint` and build **every** brand of
the build job in `.github/workflows/ci.yml`. After a change to the page, the styles, the
scripts or the headers, serve the page with `pnpm dev` (the scripts are ES modules, which
do not load from a `file:` address) and open each brand in a browser, in light and in
dark, at a desktop and at a phone width. Check that the console has no message.

## Rules

- **One brand per build.** The brand comes from `BRAND`, and `chassis` is the default.
  The output is `dist/` itself. Do not add a list of brands to this repository, a
  `dist/<brand>/` folder or a page that redirects to a brand.
- **The source is the same for every brand.** Nothing in `src/` names a brand or branches
  on one. What differs between brands comes from `@chassis-ui/website-tokens` and
  chassis-assets, under the same file names and paths.
- **The assets of a brand are unpacked as a folder.** `build.js` unpacks the archive of the
  brand from the chassis-assets release to `dist/assets/`, whole, but the folders of
  `ASSETS_SKIP`. Do not name a font or an image in `build.js`, and do not copy assets
  file by file.
- **Every file but `index.html` is under `assets/`**, in a folder of its kind: `css/`,
  `js/`, `icons/`, and the folders of the archive, which the build writes beside them. A
  file of the archive that the build writes too fails the build. `src/` has the same
  paths as `dist/`, as `dev.js` serves the one over the other. Do not add a `vendor/`.
- **The archive is checked** against the SHA-256 that GitHub records for it. Keep that
  check, and do not download an asset from anywhere but the release.
- **The build fails on an unknown brand**, before it writes `dist/`, and names the brands
  that exist in `@chassis-ui/website-tokens` and in the release. Keep that check when
  changing `build.js`.
- **Changes to the assets belong in the `chassis-assets` repository**, and reach this one
  with a release.
- **Do not depend on `@chassis-ui/docs`.** It is a tool of the documentation sites.
- **Do not move `ASSETS_VERSION`** unless the task asks for it. The steps are under
  "Assets" in `README.md`.
- **The page loads its own files only.** The `Content-Security-Policy` of `vercel.json`
  allows the site itself, and `data:` images for Chassis CSS. Do not add an inline script,
  an inline style, a `style` attribute or a file from another host: a width is a utility
  class (`w-50` on a progress bar), and an event handler is in `script.js`. A change to
  what the page loads is a change to that header, checked in a browser.
- **One page, in sections.** Each section of `index.html` has an `id` and a link in the
  header navigation, which ScrollSpy follows. Do not add a second page.
- **Components come from Chassis CSS.** Markup follows the Chassis CSS documentation, and
  behavior is `data-cx-*` attributes read by `assets/js/chassis.bundle.min.js`.
  `script.js` holds only what the demos of the page add, and `styles.css` only what no
  Chassis class does.
- **`theme.js` is loaded without `defer`**, so that a saved theme is set before the first
  paint. Keep it small and free of imports.
- **Keep the example small.** No framework, no bundler, no dependency that the page or
  its build does not need. A reader should be able to follow `build.js` from top to bottom.
- Formatting is enforced by Prettier (`.prettierrc.json`): do not hand-format against it.
  CSS files are not formatted by Prettier.
- Keep `README.md` true: it documents the commands, the brand check and the deployment.
  Every path, command and option in it must exist as written.

## Cautions

- Never commit or push without being asked. Every push to `main` deploys every site.
- Work that belongs in a sibling repository is not done from a session in this
  repository: tell the maintainer.
- Do not edit generated or fetched files: `dist/`, `.cache/`, `node_modules/`.
