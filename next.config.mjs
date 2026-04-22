/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Force new CSS bundle hash on every build
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
