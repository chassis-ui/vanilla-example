/**
 * chassis-assets in this repository: where the submodule is, and which of its files the
 * example takes. vendor.js pulls these files from Git LFS, and build.js builds them.
 */

import { join } from 'node:path'

export const ASSETS_PATH = 'vendor/assets'

export const assetsRepo = join(import.meta.dirname, ASSETS_PATH)
export const assetsCli = join(assetsRepo, 'packages/assets/build/cli.js')

// The fonts and the logo of the `docs` app, as the web has them. The options are those of
// the `build` and `lfs` commands of chassis-assets.
export const ASSETS_FILES = [
  '--app',
  'docs',
  '--platform',
  'web',
  '--include',
  'fonts/**',
  'images/logo/**'
]
