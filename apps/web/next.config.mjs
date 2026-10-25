/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double mounting in canvas game loops
  transpilePackages: ['@game-ai/shared-types', '@game-ai/validation'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

export default nextConfig;
