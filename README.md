# Chassis vanilla HTML example

> One HTML page styled with Chassis CSS and Chassis Icons, built from one codebase
> for one brand at a time.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/chassis-ui/vanilla-example/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/chassis-ui/vanilla-example/actions/workflows/ci.yml)

The page uses no framework and no bundler. A build takes the name of a brand and
gives the page the design tokens, the fonts and the logo of that brand. The
source of the page is the same for every brand.

This repository is deployed as two websites, from the same commit:

| Site                                                         | Brand     |
| ------------------------------------------------------------ | --------- |
| [example-1.chassis-ui.com](https://example-1.chassis-ui.com) | `chassis` |
| [example-2.chassis-ui.com](https://example-2.chassis-ui.com) | `sinefil` |

The page has six sections, and a sticky header that follows them:

- a header with a segmented navigation that marks the section in view and
  moves the links that do not fit into a menu, and a theme menu for light, dark
  and the default, which follows the system
- features, with the fonts and the corner radii of the build, read from the
  page itself
- pricing, with cards, a monthly and yearly switch and a comparison table
- a dashboard, with a filtered table, a menu on each row, a drawer, a modal and
  an alert
- a contact form, with a combobox, a datepicker and a chip input, and a toast
  when it is sent
- questions about the page, in an accordion

The data is made up, and nothing that is typed leaves the page.

## Build

The build needs [Node.js](https://nodejs.org) 22.12 or later, [pnpm](https://pnpm.io)
and [Git LFS](https://git-lfs.com).

```sh
git clone https://github.com/chassis-ui/vanilla-example.git
cd vanilla-example
pnpm install
pnpm vendor
pnpm build
```

Then serve the page and open the address it prints,
`http://localhost:4173`:

```sh
pnpm dev
```

The page loads its scripts as ES modules, which a browser does not load from a
file on the disk: `dist/index.html` opened as a file is styled, and its menus
and dialogs do not open.

| Command        | What it does                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `pnpm install` | Installs Chassis CSS, Chassis Icons, Chassis Tokens and the build tools      |
| `pnpm vendor`  | Prepares the `vendor/assets` submodule, the source of the fonts and the logo |
| `pnpm build`   | Writes the page to `dist/` for one brand                                     |
| `pnpm dev`     | Serves the page from `src/` and `dist/`, and reloads it when `src/` changes  |
| `pnpm lint`    | Checks the scripts with ESLint and the formatting with Prettier              |
| `pnpm format`  | Formats the files with Prettier                                              |

`pnpm vendor` is needed once after a clone, and again when the commit of the
submodule changes. [Assets](#assets) describes what it does.

## Brands

The `BRAND` environment variable names the brand of a build. Without it the
brand is `chassis`.

```sh
pnpm build                  # the chassis brand
BRAND=sinefil pnpm build    # the sinefil brand
```

Each build replaces `dist/`. The files have the same names and the same paths in
every brand, so the page links the same files whatever the brand.

A brand has to exist under the same name in two places:

- `@chassis-ui/tokens`, as the folder `dist/web/docs/<brand>/` of the package
- chassis-assets, in `chassis.build.brands` of its `package.json`

The build checks both before it writes anything. With a name that one of them
does not have, it stops and prints the brands that exist:

```
BRAND=acme: @chassis-ui/tokens has no brand 'acme'. It has 'chassis', 'sinefil'.
```

## Editing the page

`pnpm dev` runs `dev.js`, a server of the page for editing it. It needs a build
first, and no package of its own.

- **It serves `src/` over `dist/`.** A file of `src/` is served from there, and
  `vendor/` from the last build. A change to `index.html`, `styles.css`,
  `theme.js` or `script.js` needs no build. A change of the brand, the tokens,
  Chassis CSS or the submodule does: run `pnpm build` while the server runs,
  then reload the page.
- **It reloads the page** when a file of `src/` changes.
- **It sends the headers of `vercel.json`.** A `style` attribute, an inline
  script or a file of another host fails here as it fails on the sites, with a
  message in the console of the browser. A static file server such as
  `pnpm dlx serve dist` sends no such header.

The `PORT` environment variable changes the port, `4173` without it. The server
adds one script to the HTML it serves, `/__dev/reload.js`, which the deployed
sites do not have.

## What the build does

The source of the page is in `src/`. `build.js` copies it to `dist/`, together
with the files of the brand:

| Folder           | Files                                                                              | From                |
| ---------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `vendor/css/`    | Chassis CSS, compiled from its Sass source with the tokens of the brand            | `@chassis-ui/css`   |
| `vendor/js/`     | `chassis.bundle.min.js`, the Chassis JavaScript as one ES module, and its map      | `@chassis-ui/css`   |
| `vendor/assets/` | The folder of the brand, as a whole: the fonts in `fonts/`, the logos in `images/` | chassis-assets      |
| `vendor/icons/`  | The icon font stylesheet and its font files                                        | `@chassis-ui/icons` |

### The CSS of a brand

`chassis.min.css` in `dist/css/` of `@chassis-ui/css` is the `chassis` brand. A
page that needs no other brand links that file and compiles nothing.

For another brand the CSS is compiled from the Sass source of Chassis CSS, as
[Sass customization](https://chassis-ui.com/css/docs/customize/sass/) describes.
Chassis CSS loads its design tokens under the name `chassis-tokens`, and the
project decides which file answers to that name. `compileCss()` of `build.js`
does it in two steps:

1. **Sass.** The build compiles `@chassis-ui/css/scss/chassis` with a Sass
   importer that answers `chassis-tokens` with
   `dist/web/docs/<brand>/main.scss` of `@chassis-ui/tokens`.
2. **PostCSS.** The plugins of `@chassis-ui/css/postcss` add the `--cx-` prefix
   to the custom properties, and Autoprefixer adds the vendor prefixes for the
   browser list of Chassis CSS.

A project with one brand needs no importer. It has a `_chassis-tokens.scss` on
its Sass load paths, which forwards the tokens of its brand. The importer is
here because the brand of this build is decided when the build runs.

### The scripts of the page

The page loads three scripts, all files of the site:

- `theme.js` sets the theme that the visitor chose, and runs the theme menu.
  It is loaded without `defer`, so the theme is set before the first paint.
  Chassis CSS reads the theme from the `data-cx-theme` attribute of `<html>`:
  `light`, `dark`, or no attribute for the system preference.
- `vendor/js/chassis.bundle.min.js` is the JavaScript of Chassis CSS, with the
  two libraries its plugins use. It is the same file for every brand. The
  components start from their `data-cx-*` attributes, and the page has no code
  for them.
- `script.js` is what the page adds: the toast of the demos, the switches of
  the prices and of the period, the filter and the rows of the table, and the
  mark of the section navigation when its links are in the menu.

### Assets

The fonts and the logos are in
[chassis-assets](https://github.com/chassis-ui/assets), which is not on npm. This
repository has it as a Git submodule at `vendor/assets`, pinned to a commit of
its `app/docs` branch. Its fonts are Git LFS files.

`pnpm vendor` runs `vendor.js`, which:

1. checks out the submodule at the pinned commit
2. pulls the Git LFS files that the build reads, the fonts and the logos, and
   leaves the other files of the submodule as pointers
3. installs the package of the chassis-assets build inside the submodule, which
   holds the package that subsets a font

`build.js` then runs the build of chassis-assets for the brand, and copies the
folder it writes, `web/docs/<brand>/`, to `dist/vendor/assets/` as a whole. That
folder is how a project takes its assets from chassis-assets: every brand has
the same file names and the same paths in it, so the build names no font and no
image, and a file that chassis-assets adds or renames needs no change in
`build.js`. The folder holds more than the page links, such as the fonts of each
weight beside the variable fonts.

`ASSETS_FILES` of `assets.js` says what the build asks for: the `docs` app, the
web, and of the app the fonts and the logos. Without its `--include` option the
folder holds every asset of the app, and `pnpm vendor` pulls many times more
from Git LFS.

The fonts keep the characters of the languages that are
written in Latin letters, in a file per range, such as `text-latin.woff2` and
`text-latin-ext.woff2`. A browser loads the file of a range when the page has a
character of it.

`assets.js` holds what the two scripts share: the path of the submodule and what
the example asks it for.

To move the submodule to the latest commit of `app/docs`:

```sh
GIT_LFS_SKIP_SMUDGE=1 git submodule update --remote vendor/assets
git add vendor/assets
pnpm vendor
```

Stage the submodule before `pnpm vendor`, which checks out the commit that the
repository records. Build every brand, then commit `vendor/assets`.

A project that has no use for a submodule takes the archive of a brand from a
[release of chassis-assets](https://github.com/chassis-ui/assets/releases).

## Adding a brand

Nothing in this repository lists the brands, so a brand that exists in
`@chassis-ui/tokens` and in chassis-assets builds with its name:

```sh
BRAND=<brand> pnpm build
```

When the brand is new in one of the two, update that side first:

1. For the tokens, install a version of `@chassis-ui/tokens` that has the brand.
2. For the fonts and the logo, move the submodule to a commit of chassis-assets
   that has the brand, as [Assets](#assets) describes.

Then add the brand to the `brand` list of the build job in
`.github/workflows/ci.yml`, and give it a site as [Deployment](#deployment)
describes.

## Deployment

Each brand is a project of its own on [Vercel](https://vercel.com). Every project
is connected to this repository, and a push to `main` deploys all of them from
the same commit. The projects differ in one setting, the `BRAND` environment
variable, and in their domain.

| Vercel project      | `BRAND`   | Domain                     | Address on Vercel              |
| ------------------- | --------- | -------------------------- | ------------------------------ |
| `chassis-example-1` | `chassis` | `example-1.chassis-ui.com` | `chassis-example-1.vercel.app` |
| `chassis-example-2` | `sinefil` | `example-2.chassis-ui.com` | `chassis-example-2.vercel.app` |

### What the projects share

`vercel.json` holds the build and the headers, so no project overrides them:

- the commands: `pnpm install --frozen-lockfile`, then
  `pnpm vendor && pnpm build`
- the output folder, `dist`
- an `X-Robots-Tag: noindex, nofollow` header on every response: the sites are
  examples, and search engines do not index them
- a `Content-Security-Policy` header that allows the files of the site itself
  and nothing else. The one exception is `data:` images, which Chassis CSS uses
  for the small icons of its components, such as the arrow of a select field.
  The policy refuses an inline script, a `<style>` element and a `style`
  attribute in the HTML. The Chassis JavaScript places a menu or a calendar
  through the style property of the element, which the policy allows

### Project settings

Every project has the same settings on Vercel, except for the value of `BRAND`:

| Setting                   | Value                                                     |
| ------------------------- | --------------------------------------------------------- |
| Git repository            | `chassis-ui/vanilla-example`, with `main` as the branch   |
| Root Directory            | `./`, the root of the repository                          |
| Application Preset        | Other                                                     |
| Build and Output Settings | No override: the commands and the folder of `vercel.json` |
| Environment Variables     | `BRAND`, the name of the brand                            |
| Node.js Version           | 24.x                                                      |
| Git LFS                   | Enabled                                                   |

The submodule needs no setting. chassis-assets is a public repository, and
`pnpm vendor` checks it out at the pinned commit and pulls its fonts from Git LFS
while the site is built.

Each domain is a `CNAME` record in the DNS of `chassis-ui.com`, named after the
subdomain, such as `example-1`. Its value is the one that Vercel shows for the
domain of the project, and it differs between projects.

The addresses of the table above are public. The other addresses that Vercel
generates for a deployment ask for a Vercel login.

### Deploying another brand

1. Create a Vercel project from this repository, with the settings of the table
   above. Vercel accepts several projects for one repository.
2. Set `BRAND` to the name of the brand, before the first deployment.
3. Deploy, then set the Node.js version and enable Git LFS in the settings of
   the project. They apply from the next deployment.
4. Add the domain to the project, and its `CNAME` record to the DNS of
   `chassis-ui.com`.
5. Add the project to the table of this section, and the site to the table at
   the top of this file.

## Repository layout

```
src/              The page: index.html, theme.js, script.js and styles.css
build.js          Builds dist/ for the brand that BRAND names
dev.js            Serves the page while it is edited, with the headers of vercel.json
vendor.js         Prepares the vendor/assets submodule
assets.js         What the two scripts share about chassis-assets
vendor/assets/    The chassis-assets submodule: fonts and logos
vercel.json       The build and the headers of the deployed sites
.github/          The CI workflow and the Dependabot configuration
```

The build writes the site to `dist/`, which is not committed.

## License

[MIT](LICENSE)
