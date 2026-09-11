/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  experimental: {
    useLightningcss: true,
  },
};

export default nextConfig;
