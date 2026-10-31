/**
 * Builds the example into dist/ for one brand: the brand that the BRAND environment
 * variable names, or `chassis` without it.
 *
 * dist/ holds index.html, and every other file under assets/:
 * - everything in src/, the same files for every brand: the page's own css/ and js/
 * - css/: Chassis CSS, compiled from its Sass source with the design tokens of the brand
 * - js/: the Chassis JavaScript bundle, with the libraries its plugins use
 * - icons/: the Chassis Icons font stylesheet and the font files it references
 * - the archive of the brand from a release of chassis-assets, as a whole: the fonts with
 *   their stylesheet and licenses in fonts/, the logos in images/, and the rest of its
 *   folders. A file of the archive that the build writes too fails the build
 *
 * The archive is downloaded once into .cache/assets/ and checked against the SHA-256 that
 * GitHub publishes for it. Paths are resolved from this file, not the working directory.
 */

import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chassisPostcss } from '@chassis-ui/css/postcss'
import autoprefixer from 'autoprefixer'
import { unzipSync } from 'fflate'
import postcss from 'postcss'
import * as sass from 'sass'

const DEFAULT_BRAND = 'chassis'
// The release of chassis-assets that the fonts and the logos come from
const ASSETS_VERSION = '0.5.0'
const ASSETS_RELEASE = `https://api.github.com/repos/chassis-ui/assets/releases/tags/v${ASSETS_VERSION}`
// The folders of an archive that the page has no use for: the design exports of the docs app,
// most of its size
const ASSETS_SKIP = ['images/figma/', 'images/home/']
// The JavaScript of Chassis CSS as one ES module, and the source map it names
const SCRIPTS = ['chassis.bundle.min.js', 'chassis.bundle.min.js.map']

const root = import.meta.dirname
const src = join(root, 'src')
const dist = join(root, 'dist')
const assets = join(dist, 'assets')
const modules = join(root, 'node_modules')
const cssDir = join(modules, '@chassis-ui/css')
const tokensDir = join(modules, '@chassis-ui/website-tokens/dist/web/docs')
const iconsDir = join(modules, '@chassis-ui/icons/icons')
const assetsCache = join(root, '.cache/assets', `v${ASSETS_VERSION}`)

function fail(message) {
  console.error(message)
  process.exit(1)
}

// A brand has the same name here, in @chassis-ui/website-tokens and in chassis-assets
const brand = process.env.BRAND?.trim() || DEFAULT_BRAND

function list(names) {
  return names.map((name) => `'${name}'`).join(', ')
}

// The brands of @chassis-ui/website-tokens: a folder each, with a `main.scss`
function tokensBrands() {
  if (!existsSync(tokensDir)) {
    fail(`Missing source: ${tokensDir}\nRun \`pnpm install\`.`)
  }

  return readdirSync(tokensDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(tokensDir, entry.name, 'main.scss')))
    .map((entry) => entry.name)
}

// The archives of the release, one per platform, app and brand. The page takes the web
// archive of the `docs` app: chassis-assets-web-docs-<brand>-<version>.zip. Returns, by
// brand, its name, its download address and its SHA-256, from .cache/assets/ when an
// earlier build asked GitHub for them already.
async function assetsArchives() {
  const cached = join(assetsCache, 'release.json')

  if (existsSync(cached)) {
    return JSON.parse(readFileSync(cached, 'utf8'))
  }

  // A token raises the limit of the GitHub API, 60 requests an hour without one
  const token = process.env.GITHUB_TOKEN
  const response = await fetch(ASSETS_RELEASE, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }).catch((error) => fail(`${ASSETS_RELEASE}: ${error.message}`))

  if (!response.ok) {
    fail(`${ASSETS_RELEASE}: HTTP ${response.status}`)
  }

  const prefix = 'chassis-assets-web-docs-'
  const suffix = `-${ASSETS_VERSION}.zip`
  const archives = {}

  for (const { name, browser_download_url: url, digest } of (await response.json()).assets) {
    if (name.startsWith(prefix) && name.endsWith(suffix)) {
      archives[name.slice(prefix.length, -suffix.length)] = { name, url, digest }
    }
  }

  mkdirSync(assetsCache, { recursive: true })
  writeFileSync(cached, `${JSON.stringify(archives, null, 2)}\n`)

  return archives
}

function checkBrand(archives) {
  const tokens = tokensBrands()
  const assets = Object.keys(archives)

  if (!tokens.includes(brand)) {
    fail(
      `BRAND=${brand}: @chassis-ui/website-tokens has no brand '${brand}'. It has ${list(tokens)}.`
    )
  }

  if (!assets.includes(brand)) {
    fail(
      `BRAND=${brand}: chassis-assets ${ASSETS_VERSION} has no brand '${brand}'. It has ${list(assets)}.`
    )
  }
}

function copy(from, to) {
  if (!existsSync(from)) {
    const hint = from.includes('node_modules') ? '\nRun `pnpm install`.' : ''
    fail(`Missing source: ${from}${hint}`)
  }
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
}

// Copies a stylesheet and the files it loads with relative url()s, which stay next to it.
function copyStylesheet(from, to) {
  copy(from, to)
  for (const [, url] of readFileSync(from, 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const file = url.split(/[?#]/)[0]
    copy(join(dirname(from), file), join(dirname(to), file))
  }
}

// The archive of the brand, from the cache or downloaded into it, and checked either way
// against the SHA-256 of the release
async function assetsArchive({ name, url, digest }) {
  const cached = join(assetsCache, name)
  let data

  if (existsSync(cached)) {
    data = readFileSync(cached)
  } else {
    const response = await fetch(url).catch((error) => fail(`${url}: ${error.message}`))

    if (!response.ok) {
      fail(`${url}: HTTP ${response.status}`)
    }

    data = Buffer.from(await response.arrayBuffer())
  }

  const sha256 = `sha256:${createHash('sha256').update(data).digest('hex')}`

  if (sha256 !== digest) {
    fail(
      `${name}: the SHA-256 is ${sha256}, and the release has ${digest}.\nRemove ${assetsCache}.`
    )
  }

  if (!existsSync(cached)) {
    writeFileSync(cached, data)
  }

  return data
}

// Writes the files of an archive into a folder, but those of ASSETS_SKIP. A file that is
// there already fails, rather than replace a file of the build.
function unpack(data, to) {
  const files = unzipSync(data, {
    filter: ({ name }) => !name.endsWith('/') && !ASSETS_SKIP.some((skip) => name.startsWith(skip))
  })

  for (const [name, content] of Object.entries(files)) {
    const file = join(to, name)

    if (!file.startsWith(to + sep)) {
      fail(`The archive has a file outside its folder: ${name}`)
    }
    mkdirSync(dirname(file), { recursive: true })
    try {
      writeFileSync(file, content, { flag: 'wx' })
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      fail(`The archive has ${name}, which the build writes too.`)
    }
  }
}

// Chassis CSS loads its design tokens as `chassis-tokens`, and the importer answers with
// the tokens of the brand. A project with one brand has a `_chassis-tokens.scss` on its
// Sass load paths instead, which forwards the same file.
async function compileCss() {
  const tokens = join(tokensDir, brand, 'main.scss')

  const { css } = sass.compileString('@use "@chassis-ui/css/scss/chassis";', {
    importers: [
      { findFileUrl: (url) => (url === 'chassis-tokens' ? pathToFileURL(tokens) : null) }
    ],
    loadPaths: [modules],
    style: 'compressed'
  })

  // The prefix of the custom properties, `--cx-`, is added after Sass. Autoprefixer finds
  // its browser list from `from`: the `.browserslistrc` of Chassis CSS.
  const result = await postcss([...chassisPostcss(), autoprefixer()]).process(css, {
    from: join(cssDir, 'scss/chassis.scss'),
    map: false
  })

  return result.css
}

const archives = await assetsArchives()

checkBrand(archives)

const archive = await assetsArchive(archives[brand])

rmSync(dist, { recursive: true, force: true })

copy(src, dist)

mkdirSync(join(assets, 'css'), { recursive: true })
writeFileSync(join(assets, 'css/chassis.min.css'), await compileCss())

for (const script of SCRIPTS) {
  copy(join(cssDir, 'dist/js', script), join(assets, 'js', script))
}

copyStylesheet(join(iconsDir, 'chassis-icons.min.css'), join(assets, 'icons/chassis-icons.min.css'))

// The assets of the brand: the whole archive, not a list of files.
//
// chassis-assets releases one archive per platform, app and brand, and every brand has the
// same file names and the same paths in it. That archive is what a project takes from
// chassis-assets. Unpacked as it is, the page links `assets/fonts/fonts.css` or
// `assets/images/favicon.svg` whatever the brand, and a file that chassis-assets adds,
// renames or removes needs no change in this script: only the page that links it changes.
//
// The folders the page has no use for are left out by ASSETS_SKIP. This script names no
// font and no image. The archive goes last, beside the files above, so that a file it has
// as well fails the build instead of replacing one of them.
unpack(archive, assets)

console.log(`Built ${dist} for the brand '${brand}' with chassis-assets ${ASSETS_VERSION}`)
