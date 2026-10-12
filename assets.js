/**
 * chassis-assets in this repository: where the submodule is, and which of its files the
 * example takes. vendor.js pulls these files from Git LFS, and build.js builds them.
 */

import { join } from 'node:path'

export const ASSETS_PATH = 'vendor/assets'

export const assetsRepo = join(import.meta.dirname, ASSETS_PATH)
export const assetsCli = join(assetsRepo, 'packages/assets/build/cli.js')

// What the example asks chassis-assets for: the `docs` app as the web has it, and of that
// app the fonts and the logos. build.js copies the folder that comes out as a whole. The
// options are those of the `build` and `lfs` commands of chassis-assets; without
// `--include`, the folder holds every asset of the app, and `pnpm vendor` pulls them all.
export const ASSETS_FILES = [
  '--app',
  'docs',
  '--platform',
  'web',
  '--include',
  'fonts/**',
  'images/logo/**'
]
