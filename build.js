/**
 * Builds the example into dist/ for one brand: the brand that the BRAND environment
 * variable names, or `chassis` without it.
 *
 * dist/ holds:
 * - everything in src/, the same files for every brand
 * - vendor/css/: Chassis CSS, compiled from its Sass source with the design tokens of the brand
 * - vendor/js/: the Chassis JavaScript bundle, with the libraries its plugins use
 * - vendor/assets/: the folder that chassis-assets builds for the brand, as a whole: the
 *   fonts with their stylesheets and licenses in fonts/, the logos in images/logo/
 * - vendor/icons/: the Chassis Icons font stylesheet and the font files it references
 *
 * chassis-assets is the `vendor/assets` submodule, which `pnpm vendor` prepares. Paths are
 * resolved from this file, not the working directory.
 */

import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chassisPostcss } from '@chassis-ui/css/postcss'
import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import * as sass from 'sass'
import { ASSETS_FILES, ASSETS_PATH, assetsCli, assetsRepo } from './assets.js'

const DEFAULT_BRAND = 'chassis'
// The characters the fonts keep, each range in a file of its own: the languages that are
// written in Latin letters
const FONT_RANGES = ['latin', 'latin-ext']
// The JavaScript of Chassis CSS as one ES module, and the source map it names
const SCRIPTS = ['chassis.bundle.min.js', 'chassis.bundle.min.js.map']

const root = import.meta.dirname
const src = join(root, 'src')
const dist = join(root, 'dist')
const modules = join(root, 'node_modules')
const cssDir = join(modules, '@chassis-ui/css')
const tokensDir = join(modules, '@chassis-ui/tokens/dist/web/docs')
const iconsDir = join(modules, '@chassis-ui/icons/icons')

function fail(message) {
  console.error(message)
  process.exit(1)
}

// A brand has the same name here, in @chassis-ui/tokens and in chassis-assets
const brand = process.env.BRAND?.trim() || DEFAULT_BRAND

function list(names) {
  return names.map((name) => `'${name}'`).join(', ')
}

// The brands of @chassis-ui/tokens: a folder each, with a `main.scss`
function tokensBrands() {
  if (!existsSync(tokensDir)) {
    fail(`Missing source: ${tokensDir}\nRun \`pnpm install\`.`)
  }

  return readdirSync(tokensDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(tokensDir, entry.name, 'main.scss')))
    .map((entry) => entry.name)
}

// The brands of chassis-assets: `chassis.build.brands` of its package.json
function assetsBrands() {
  if (!existsSync(assetsCli)) {
    fail(`Missing source: ${assetsCli}\nRun \`pnpm vendor\`.`)
  }

  const manifest = JSON.parse(readFileSync(join(assetsRepo, 'package.json'), 'utf8'))

  return manifest.chassis?.build?.brands ?? []
}

function checkBrand() {
  const tokens = tokensBrands()
  const assets = assetsBrands()

  if (!tokens.includes(brand)) {
    fail(`BRAND=${brand}: @chassis-ui/tokens has no brand '${brand}'. It has ${list(tokens)}.`)
  }

  if (!assets.includes(brand)) {
    fail(`BRAND=${brand}: chassis-assets has no brand '${brand}'. It has ${list(assets)}.`)
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

// Builds the assets of the brand with chassis-assets, into a folder that is removed at the
// end. The build writes <out>/web/docs/<brand>/. The package that subsets the fonts is
// installed in the submodule by `pnpm vendor`.
function buildAssets(out) {
  const args = ['build', '--cwd', assetsRepo, '--out', out, '--quiet']
  args.push('--brand', brand, ...ASSETS_FILES)
  args.push('--subset', ...FONT_RANGES, '--split')

  try {
    execFileSync(process.execPath, [assetsCli, ...args], { stdio: 'inherit' })
  } catch {
    fail(`The build of ${ASSETS_PATH} failed. Run \`pnpm vendor\`.`)
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

checkBrand()

rmSync(dist, { recursive: true, force: true })

const assetsOut = mkdtempSync(join(tmpdir(), 'chassis-example-'))

try {
  buildAssets(assetsOut)

  const assets = join(assetsOut, 'web/docs', brand)

  copy(src, dist)

  mkdirSync(join(dist, 'vendor/css'), { recursive: true })
  writeFileSync(join(dist, 'vendor/css/chassis.min.css'), await compileCss())

  for (const script of SCRIPTS) {
    copy(join(cssDir, 'dist/js', script), join(dist, 'vendor/js', script))
  }

  // The assets of the brand: the whole folder, not a list of files.
  //
  // chassis-assets builds one folder per platform, app and brand, `web/docs/<brand>/` here,
  // and every brand has the same file names and the same paths in it. That folder is what a
  // project takes from chassis-assets. Copied as it is, the page links
  // `vendor/assets/fonts/text.css` or `vendor/assets/images/logo/chassis-icon-brand.svg`
  // whatever the brand, and a file that chassis-assets adds, renames or removes needs no
  // change in this script: only the page that links it changes.
  //
  // What the folder holds is decided where chassis-assets is asked for it, by ASSETS_FILES
  // of assets.js. This script names no font and no image.
  copy(assets, join(dist, 'vendor/assets'))

  copyStylesheet(
    join(iconsDir, 'chassis-icons.min.css'),
    join(dist, 'vendor/icons/chassis-icons.min.css')
  )

  console.log(`Built ${dist} for the brand '${brand}'`)
} finally {
  rmSync(assetsOut, { recursive: true, force: true })
}
