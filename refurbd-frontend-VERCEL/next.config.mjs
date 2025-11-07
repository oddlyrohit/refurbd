const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  webpack: (config) => {
    // aliases handled by tsconfig in App Router; keep webpack defaults light
    return config
  }
}
export default nextConfig
