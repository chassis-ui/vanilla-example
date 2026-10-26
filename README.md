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

## How it works

A **brand** is a name, such as `chassis`, that picks a look: the colors, the
fonts, the corner radii and the logo. The colors and the sizes are **design
tokens**, values with names such as `primary` or `radius-md`, which
[Chassis Tokens](https://chassis-ui.com/tokens/) keeps as Sass files, one
folder per brand. The fonts and the logos are files of
[chassis-assets](https://github.com/chassis-ui/assets), one archive per brand.

`pnpm build` reads the brand from the `BRAND` environment variable and writes
the site to `dist/`, from four sources:

```
BRAND=<brand> pnpm build

From                          How        To dist/
src/index.html, src/assets/   copied     index.html, assets/css/styles.css,
                                         assets/js/theme.js and script.js
@chassis-ui/css, Sass source  compiled   assets/css/chassis.min.css
  with the tokens of the
  brand in @chassis-ui/tokens
@chassis-ui/css, JavaScript   copied     assets/js/chassis.bundle.min.js
@chassis-ui/icons             copied     assets/icons/
chassis-assets, the archive   unpacked   assets/fonts/, assets/images/, ...
  of the brand in a release
```

Every brand gets the same file names: `dist/assets/css/chassis.min.css` exists
for every brand, and only what is in it differs. That is why one `index.html`
serves every brand, and why nothing in `src/` names a brand.

`dist/` is a static site. Vercel serves it as it is, and `pnpm dev` serves it on
your computer while you edit `src/`.

The components of the page, such as the menus, the drawer and the modal, need
no code of the page: the Chassis JavaScript finds them by their `data-cx-*`
attributes, such as `data-cx-toggle="menu"`, as
[JavaScript](https://chassis-ui.com/css/docs/getting-started/javascript/)
describes. The [Chassis CSS documentation](https://chassis-ui.com/css/docs/)
has the markup of each component.

## Build

The build needs [Node.js](https://nodejs.org) 22.12 or later and
[pnpm](https://pnpm.io), and access to GitHub, where it downloads the fonts and
the logos of the brand the first time.

```sh
git clone https://github.com/chassis-ui/vanilla-example.git
cd vanilla-example
pnpm install
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

| Command        | What it does                                                                |
| -------------- | --------------------------------------------------------------------------- |
| `pnpm install` | Installs Chassis CSS, Chassis Icons, Chassis Tokens and the build tools     |
| `pnpm build`   | Writes the page to `dist/` for one brand                                    |
| `pnpm dev`     | Serves the page from `src/` and `dist/`, and reloads it when `src/` changes |
| `pnpm lint`    | Checks the scripts with ESLint and the formatting with Prettier             |
| `pnpm format`  | Formats the files with Prettier                                             |

## Brands

The `BRAND` environment variable names the brand of a build. Without it the
brand is `chassis`.

```sh
pnpm build                  # the chassis brand
BRAND=<brand> pnpm build    # another brand
```

Each build replaces `dist/`. The files have the same names and the same paths in
every brand, so the page links the same files whatever the brand.

A brand has to exist under the same name in two places:

- `@chassis-ui/tokens`, as the folder `dist/web/docs/<brand>/` of the package
- chassis-assets, as an archive of the release that the build takes,
  `chassis-assets-web-docs-<brand>-<version>.zip`

The build checks both before it writes `dist/`. With a name that one of them
does not have, it stops and prints the brands that exist:

```
BRAND=acme: @chassis-ui/tokens has no brand 'acme'. It has 'chassis', …
```

## Editing the page

`pnpm dev` runs `dev.js`, a server of the page for editing it. It needs a build
first, and no package of its own.

- **It serves `src/` over `dist/`.** A file of `src/` is served from there, and
  the files of the packages and of the brand from the last build. A change to
  `index.html`, `styles.css`, `theme.js` or `script.js` needs no build. A change
  of the brand, the tokens, Chassis CSS or the release of chassis-assets does:
  run `pnpm build` while the server runs, then reload the page.
- **It reloads the page** when a file of `src/` changes.
- **It sends the headers of `vercel.json`.** A `style` attribute, an inline
  script or a file of another host fails here as it fails on the sites, with a
  message in the console of the browser. The header is a
  [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
  A static file server such as `pnpm dlx serve dist` sends no such header.

The server shows the brand of the last build. To see another brand, build it in
a second terminal while the server runs, then reload the page:

```sh
BRAND=<brand> pnpm build
```

The `PORT` environment variable changes the port, `4173` without it. The server
adds one script to the HTML it serves, `/__dev/reload.js`, which the deployed
sites do not have.

## What the build does

The source of the page is in `src/`: `index.html`, and the page's own
stylesheet and scripts in `assets/css/` and `assets/js/`. `build.js` copies it
to `dist/`, and writes the files of the packages and of the brand beside them,
so that every file but `index.html` is under `dist/assets/`:

| Folder           | Files                                                                         | From                |
| ---------------- | ----------------------------------------------------------------------------- | ------------------- |
| `assets/css/`    | `chassis.min.css`, compiled from the Sass source with the tokens of the brand | `@chassis-ui/css`   |
| `assets/js/`     | `chassis.bundle.min.js`, the Chassis JavaScript as one ES module, and its map | `@chassis-ui/css`   |
| `assets/icons/`  | The icon font stylesheet and its font files                                   | `@chassis-ui/icons` |
| `assets/fonts/`  | The fonts of the brand, with `fonts.css` and their licenses                   | chassis-assets      |
| `assets/images/` | The logos, the favicons and the icons of a web app                            | chassis-assets      |

The archive of chassis-assets also adds `icons/cx-sprite.svg` and
`other/manifest.json`, which the page does not link.

### The CSS of a brand

The package `@chassis-ui/css` comes with its CSS compiled for the `chassis`
brand, `node_modules/@chassis-ui/css/dist/css/chassis.min.css`. A page that
needs no other brand links that file and compiles nothing.

For another brand the CSS is compiled from the Sass source of Chassis CSS, as
[Sass customization](https://chassis-ui.com/css/docs/customize/sass/) describes.
Chassis CSS loads its design tokens under the name `chassis-tokens`, and the
project decides which file answers to that name. `compileCss()` of `build.js`
does it in two steps:

1. **Sass.** The build compiles `@chassis-ui/css/scss/chassis` with a Sass
   [importer](https://sass-lang.com/documentation/js-api/interfaces/fileimporter/),
   a function that tells Sass which file to load for a name. It answers
   `chassis-tokens` with `dist/web/docs/<brand>/main.scss` of
   `@chassis-ui/tokens`.
2. **PostCSS.** The plugins of `@chassis-ui/css/postcss` add the `--cx-` prefix
   to the custom properties, and Autoprefixer adds the vendor prefixes for the
   browser list of Chassis CSS.

A project with one brand needs no importer. It has a `_chassis-tokens.scss` in
a folder of its Sass
[load paths](https://sass-lang.com/documentation/at-rules/use/#load-paths),
which loads the tokens of its brand with
[`@forward`](https://sass-lang.com/documentation/at-rules/forward/). The
importer is here because the brand of this build is decided when the build
runs.

### The styles and scripts of the page

The page loads two stylesheets of its own beside those of the packages:

- `assets/fonts/fonts.css`, from chassis-assets, declares the fonts of the
  brand under the names that the tokens use.
- `assets/css/styles.css` holds what no Chassis class does, such as the three
  columns of the header and the logo of each theme. Its rules are in the
  `custom` [cascade layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
  of Chassis CSS, which comes before the `utilities` layer: a utility class
  such as `d-none` wins over a rule of `styles.css`, whatever their selectors.

It loads three scripts, all files of the site:

- `assets/js/theme.js` sets the theme that the visitor chose, and runs the
  theme menu. It is loaded without `defer`, so the theme is set before the
  first paint. Chassis CSS reads the theme from the `data-cx-theme` attribute
  of `<html>`: `light`, `dark`, or no attribute for the system preference, as
  [Color modes](https://chassis-ui.com/css/docs/customize/color-modes/)
  describes.
- `assets/js/chassis.bundle.min.js` is the JavaScript of Chassis CSS, with the
  two libraries its plugins use: [Floating UI](https://floating-ui.com), which
  places the menus, and [Vanilla Calendar Pro](https://vanilla-calendar.pro),
  the calendar of the datepicker. It is the same file for every brand.
- `assets/js/script.js` is what the page adds: the toast of the demos, the
  switches of the prices and of the period, the filter and the rows of the
  table, and the mark of the section navigation when its links are in the
  menu. It listens to the events of the components, such as
  `activate.cx.scrollspy` and `show.cx.drawer`, which the page of each
  component in the Chassis CSS documentation lists, for example
  [ScrollSpy](https://chassis-ui.com/css/docs/components/scrollspy/) and
  [Drawer](https://chassis-ui.com/css/docs/components/drawer/).

The page works around one bug of Chassis CSS: its two `.table-responsive`
wrappers have the `position-relative` class, without which a table widens the
page on a phone
([chassis-ui/css#79](https://github.com/chassis-ui/css/issues/79)). Remove the
class once a version of `@chassis-ui/css` with the fix is installed.

### Assets

The fonts and the logos are in
[chassis-assets](https://github.com/chassis-ui/assets), which is not on npm. Each
[release of chassis-assets](https://github.com/chassis-ui/assets/releases) has
an archive per platform, app and brand. The build takes the web archive of the
`docs` app for the brand, `chassis-assets-web-docs-<brand>-<version>.zip`, from
the release that `ASSETS_VERSION` of `build.js` names.

`build.js`:

1. asks the GitHub API for the archives of the release, which give the brands
   that chassis-assets has, and checks the brand against them
2. downloads the archive of the brand, and checks it against the SHA-256 that
   GitHub records for it
3. unpacks it to `dist/assets/` as a whole, but the folders of `ASSETS_SKIP`:
   the design exports of the `docs` app, most of the size of an archive. It
   goes beside the files that the build writes there, and a file of the archive
   with the path of one of them fails the build

That archive is how a project takes its assets from chassis-assets: every brand
has the same file names and the same paths in it, so the build names no font
and no image, and a file that chassis-assets adds or renames needs no change in
`build.js`. The folder holds more than the page links, such as the fonts of each
weight beside the variable fonts, and the icons of a web app.

The archives and the list of the release are kept in `.cache/assets/`, so a
build downloads nothing when they are there. A `GITHUB_TOKEN` environment
variable raises the limit of the GitHub API, 60 requests an hour without one:
CI sets it.

To move to another release of chassis-assets, change `ASSETS_VERSION` in
`build.js`, update the page for the files that the release renames, and build
every brand.

## Adding a brand

Nothing in this repository lists the brands, so a brand that exists in
`@chassis-ui/tokens` and in chassis-assets builds with its name:

```sh
BRAND=<brand> pnpm build
```

When the brand is new in one of the two, update that side first:

1. For the tokens, install a version of `@chassis-ui/tokens` that has the brand.
2. For the fonts and the logo, move to a release of chassis-assets that has
   the brand, as [Assets](#assets) describes.

Then add the brand to the `brand` list of the build job in
`.github/workflows/ci.yml`, and give it a site as [Deployment](#deployment)
describes.

## Troubleshooting

What the build, the server or the browser may print, and what to do:

- **`BRAND=acme: @chassis-ui/tokens has no brand 'acme'`**, or **chassis-assets
  … has no brand**. Check the spelling of `BRAND`. For a new brand, see
  [Adding a brand](#adding-a-brand).
- **`https://api.github.com/…: HTTP 403`**. The GitHub API answers 60 requests
  an hour without a token
  ([rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)).
  Wait, or set `GITHUB_TOKEN` to a GitHub token. On Vercel, add it as an
  environment variable of the project.
- **`…: fetch failed`** on a first build. The build downloads the list of the
  release and the archive of the brand from GitHub once, then keeps them in
  `.cache/assets/`. Build once with a connection.
- **`chassis-assets-web-docs-….zip: the SHA-256 is …, and the release has …`**.
  The archive in `.cache/assets/` is damaged. Remove that folder and build
  again. If a fresh download fails too, the release has changed: tell the
  maintainers of chassis-assets.
- **`The archive has <path>, which the build writes too.`** A release of
  chassis-assets has a file at a path that the build writes, under
  `dist/assets/css/`, `js/` or `icons/`. Rename the file of the build, or ask
  the maintainers of chassis-assets about theirs.
- **`Missing build: dist/assets/css/chassis.min.css`** from `pnpm dev`. Run
  `pnpm build` first.
- **`Port 4173 is in use`** from `pnpm dev`. Another server runs on that port,
  often an earlier `pnpm dev`. Stop it, or choose another port:
  `PORT=4180 pnpm dev`.
- **`Refused to … because it violates the following Content Security Policy`**
  in the console of the browser. The page used an inline script, a `<style>`
  element, a `style` attribute or a file of another host. Move the script to
  `assets/js/script.js`, and use a utility class or `assets/css/styles.css` for
  the style.
- **The menus and the dialogs do not open**, on `dist/index.html` opened as a
  file. A browser does not load
  [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
  from a `file:` address. Use `pnpm dev`.
- **`pnpm dev` shows the other brand.** It serves the last build. Run
  `BRAND=<brand> pnpm build`, then reload the page.

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

- the commands: `pnpm install --frozen-lockfile`, then `pnpm build`
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

The assets need no setting. chassis-assets is a public repository, and the
build downloads the archive of the brand from its release while the site is
built.

Each domain is a `CNAME` record in the DNS of `chassis-ui.com`, named after the
subdomain, such as `example-1`. Its value is the one that Vercel shows for the
domain of the project, and it differs between projects.

The addresses of the table above are public. The other addresses that Vercel
generates for a deployment ask for a Vercel login.

### Deploying another brand

1. Create a Vercel project from this repository, with the settings of the table
   above. Vercel accepts several projects for one repository.
2. Set `BRAND` to the name of the brand, before the first deployment.
3. Deploy, then set the Node.js version in the settings of the project. It
   applies from the next deployment.
4. Add the domain to the project, and its `CNAME` record to the DNS of
   `chassis-ui.com`.
5. Add the project to the table of this section, and the site to the table at
   the top of this file.

## Repository layout

```
src/              The page: index.html, and its styles and scripts in assets/
build.js          Builds dist/ for the brand that BRAND names
dev.js            Serves the page while it is edited, with the headers of vercel.json
vercel.json       The build and the headers of the deployed sites
.github/          The CI workflow and the Dependabot configuration
AGENTS.md         The rules of this repository, for AI coding agents and people
```

The build writes the site to `dist/`, and keeps the downloads of chassis-assets
in `.cache/assets/`. Neither is committed.

## License

[MIT](LICENSE)
