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

The page shows:

- context classes that re-color a card and its content
- a contact form built from form fields, with a small script that shows a sent
  state
- button and badge sizes and styles
- icon font glyphs in buttons and cards
- the fonts and the logo of the brand

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

Then open `dist/index.html` in a browser.

| Command        | What it does                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `pnpm install` | Installs Chassis CSS, Chassis Icons, Chassis Tokens and the build tools      |
| `pnpm vendor`  | Prepares the `vendor/assets` submodule, the source of the fonts and the logo |
| `pnpm build`   | Writes the page to `dist/` for one brand                                     |
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

## What the build does

The source of the page is in `src/`. `build.js` copies it to `dist/`, together
with the files of the brand:

| Folder                | Files                                                                               | From                |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------- |
| `vendor/css/`         | Chassis CSS, compiled from its Sass source with the tokens of the brand             | `@chassis-ui/css`   |
| `vendor/fonts/`       | `text.css`, `display.css` and `code.css`, the font files they load and the licenses | chassis-assets      |
| `vendor/images/logo/` | The logo of the brand                                                               | chassis-assets      |
| `vendor/icons/`       | The icon font stylesheet and its font files                                         | `@chassis-ui/icons` |

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

`build.js` then runs the build of chassis-assets for the brand, with the fonts
and the logo only. The fonts keep the characters of the languages that are
written in Latin letters, in a file per range, such as `text-latin.woff2` and
`text-latin-ext.woff2`. A browser loads the file of a range when the page has a
character of it.

`assets.js` holds what the two scripts share: the path of the submodule and the
files that the example takes from it.

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
is connected to this repository and deploys the same commit. The projects differ
in one setting, the `BRAND` environment variable, and in their domain.

`vercel.json` holds what the projects share:

- the commands: `pnpm install --frozen-lockfile`, then
  `pnpm vendor && pnpm build`
- the output folder, `dist`
- an `X-Robots-Tag: noindex, nofollow` header on every response: the sites are
  examples, and search engines do not index them
- a `Content-Security-Policy` header that allows the files of the site itself
  and nothing else. The one exception is `data:` images, which Chassis CSS uses
  for the small icons of its components, such as the arrow of a select field

To deploy another brand, create a Vercel project from this repository, set
`BRAND` to the name of the brand for every environment of the project, and add
the domain.

## Repository layout

```
src/              The page: index.html, script.js and styles.css
build.js          Builds dist/ for the brand that BRAND names
vendor.js         Prepares the vendor/assets submodule
assets.js         What the two scripts share about chassis-assets
vendor/assets/    The chassis-assets submodule: fonts and logos
vercel.json       The build and the headers of the deployed sites
.github/          The CI workflow and the Dependabot configuration
```

The build writes the site to `dist/`, which is not committed.

## License

[MIT](LICENSE)
