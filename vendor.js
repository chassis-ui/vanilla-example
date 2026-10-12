/**
 * Prepares chassis-assets, the `vendor/assets` submodule, for build.js:
 * - checks the submodule out at the commit that this repository pins
 * - pulls the Git LFS files that the build reads: the fonts and the logos of every brand
 * - installs the package of the chassis-assets build, which holds the package that subsets
 *   a font
 *
 * It is needed once after a clone, and again when the pin moves. Nothing in the submodule
 * is edited: what the install writes there is ignored by chassis-assets.
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { ASSETS_FILES, ASSETS_PATH, assetsCli, assetsRepo } from './assets.js'

const root = import.meta.dirname

function fail(message) {
  console.error(message)
  process.exit(1)
}

// Runs a program without a shell, except on Windows, where `pnpm` is a `.cmd` file.
// Returns what it printed when `quiet` is set, and prints it otherwise.
function run(command, args, { cwd = root, quiet = false, env = {} } = {}) {
  if (!quiet) {
    console.log(`$ ${[command, ...args].join(' ')}`)
  }

  try {
    return (
      execFileSync(command, args, {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...env },
        stdio: quiet ? 'pipe' : 'inherit',
        shell: process.platform === 'win32'
      }) ?? ''
    )
  } catch (error) {
    const stderr = typeof error.stderr === 'string' ? error.stderr.trim() : ''

    fail(`${[command, ...args].join(' ')} failed${stderr ? `:\n${stderr}` : ''}`)
  }
}

try {
  execFileSync('git', ['lfs', 'version'], { stdio: 'ignore' })
} catch {
  fail(
    'Git LFS is not installed. The fonts of chassis-assets are Git LFS files: https://git-lfs.com'
  )
}

// The checkout leaves the Git LFS files as pointers, whatever the Git configuration of the
// machine: the submodule holds far more of them than the build reads.
run('git', ['submodule', 'update', '--init', ASSETS_PATH], { env: { GIT_LFS_SKIP_SMUDGE: '1' } })

if (!existsSync(assetsCli)) {
  fail(`${ASSETS_PATH} has no build at the pinned commit: ${assetsCli} is missing.`)
}

// chassis-assets names the Git LFS files that a build with the same options reads
const files = run(process.execPath, [assetsCli, 'lfs', '--cwd', assetsRepo, ...ASSETS_FILES], {
  quiet: true
}).trim()

if (!files) {
  fail(`${ASSETS_PATH} names no file for the build: \`lfs ${ASSETS_FILES.join(' ')}\` is empty.`)
}

run('git', ['lfs', 'install', '--local'], { cwd: assetsRepo, quiet: true })
console.log('$ git lfs pull --include <the fonts and the logos>')
run('git', ['lfs', 'pull', '--include', files], { cwd: assetsRepo, quiet: true })

// The subsetter is a package that the build loads when `--subset` is given, so the package
// of the build is installed, without the tools of its tests. Where another install ran in
// the submodule before, pnpm removes its modules first, and would ask.
run(
  'pnpm',
  ['install', '--filter', './packages/assets', '--prod', '--config.confirmModulesPurge=false'],
  {
    cwd: assetsRepo
  }
)

const commit = run('git', ['rev-parse', '--short', 'HEAD'], { cwd: assetsRepo, quiet: true }).trim()

console.log(`Prepared ${ASSETS_PATH} at ${commit}`)
