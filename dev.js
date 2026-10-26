/**
 * Serves the page while it is edited, and reloads it when a file of src/ changes.
 *
 * A file is taken from src/ when it is there, and from dist/ otherwise: an edit of the page,
 * the styles or the scripts shows without a build, and vendor/ comes from the last build, for
 * the brand of that build. Every response has the headers of vercel.json, so a change that
 * the Content-Security-Policy refuses fails here as it fails on the site.
 *
 * The reload is a script of the server, loaded by a tag added to the HTML, which the policy
 * allows as a file of the site. It asks for a script that the server answers when src/
 * changes, so the page needs no connection that the policy would refuse. The port is the
 * PORT environment variable, or 4173.
 */

import { existsSync, readFileSync, statSync, watch } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, sep } from 'node:path'

const root = import.meta.dirname
const folders = [join(root, 'src'), join(root, 'dist')]
const port = Number(process.env.PORT) || 4173
// How long a request for the reload is held before it is answered with nothing and made again
const WAIT = 25_000

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

// The page asks for the reload with the version it was served at, and is reloaded when src/
// has changed since
const RELOAD = `const version = new URL(import.meta.url).searchParams.get('v')

function wait() {
  const script = document.createElement('script')
  script.src = '/__dev/wait.js?v=' + version
  script.onload = () => {
    script.remove()
    wait()
  }
  script.onerror = () => {
    script.remove()
    setTimeout(wait, 1000)
  }
  document.head.append(script)
}

wait()
`

if (!existsSync(join(root, 'dist/vendor'))) {
  console.error('Missing build: dist/vendor\nRun `pnpm build`.')
  process.exit(1)
}

// The headers of vercel.json, whose sources are read as regular expressions of the path
const headers = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).headers.map((rule) => ({
  source: new RegExp(`^${rule.source}$`),
  headers: rule.headers
}))

let version = 0
const waiting = new Set()
let timer

watch(folders[0], { recursive: true }, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    version++
    for (const res of waiting) res.end('location.reload()')
    waiting.clear()
  }, 50)
})

function find(pathname) {
  let path
  try {
    path = decodeURIComponent(pathname.endsWith('/') ? `${pathname}index.html` : pathname)
  } catch {
    return null
  }
  for (const folder of folders) {
    const file = join(folder, path)
    if (file.startsWith(folder + sep) && existsSync(file) && statSync(file).isFile()) {
      return file
    }
  }
  return null
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const { pathname } = url

  for (const rule of headers) {
    if (rule.source.test(pathname)) {
      for (const { key, value } of rule.headers) res.setHeader(key, value)
    }
  }
  res.setHeader('Cache-Control', 'no-store')

  if (pathname === '/__dev/reload.js' || pathname === '/__dev/wait.js') {
    res.setHeader('Content-Type', TYPES['.js'])
    if (pathname === '/__dev/reload.js') {
      res.end(RELOAD)
    } else if (url.searchParams.get('v') !== String(version)) {
      res.end('location.reload()')
    } else {
      waiting.add(res)
      const held = setTimeout(() => waiting.delete(res) && res.end(), WAIT)
      res.on('close', () => {
        clearTimeout(held)
        waiting.delete(res)
      })
    }
    return
  }

  const file = find(pathname)
  if (!file) {
    res.statusCode = 404
    res.setHeader('Content-Type', TYPES['.txt'])
    res.end('Not found')
    return
  }

  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
  if (extname(file) === '.html') {
    const tag = `<script type="module" src="/__dev/reload.js?v=${version}"></script>`
    res.end(readFileSync(file, 'utf8').replace('</head>', `  ${tag}\n  </head>`))
  } else {
    res.end(readFileSync(file))
  }
})
  .on('error', (error) => {
    if (error.code !== 'EADDRINUSE') throw error
    console.error(`Port ${port} is in use, by another \`pnpm dev\` perhaps.\nStop it, or set PORT.`)
    process.exit(1)
  })
  .listen(port, 'localhost', () => {
    console.log(`Serving src/ and dist/ at http://localhost:${port}`)
  })
