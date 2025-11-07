import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Next.js config
 * - Avoids Node CJS globals in ESM by deriving __dirname via fileURLToPath
 * - Adds explicit webpack aliases so @/ , @components/ , etc. resolve in production
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    const root = process.cwd()
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(root),
      '@components': path.resolve(root, 'components'),
      '@hooks': path.resolve(root, 'hooks'),
      '@lib': path.resolve(root, 'lib'),
      '@app': path.resolve(root, 'app'),
    }
    return config
  }
}

export default nextConfig
