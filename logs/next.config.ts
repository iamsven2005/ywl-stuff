/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase the limit to 10MB
    },
  },
  // Keep any other existing configuration options
}

export default nextConfig


