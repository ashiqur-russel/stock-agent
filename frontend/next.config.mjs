import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use this app folder as tracing root so a lockfile in a parent directory (e.g. home) is not picked up.
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version ?? '0.0.0',
  },
}

export default nextConfig
