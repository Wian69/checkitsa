const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure heavy client-side only libs are not bundled in Edge Worker
      config.resolve.alias['tesseract.js'] = false
    }
    return config
  }
};
export default nextConfig;
