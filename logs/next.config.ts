/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase the limit to 10MB
    },
    serverComponentsExternalPackages: ['bcrypt'],
  },
  // Keep any other existing configuration options
  webpack: (config: { externals: any[] }) => {
    config.externals = [...(config.externals || []), 'canvas', 'jsdom']
    return config
  },
}

export default nextConfig

