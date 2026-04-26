import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use this app folder as tracing root so a lockfile in a parent directory (e.g. home) is not picked up.
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
