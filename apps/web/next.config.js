/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@devi-motors/shared'],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
